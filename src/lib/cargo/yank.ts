// src/lib/cargo/yank.ts
import { and, eq } from "drizzle-orm";

import { requireCargoWrite } from "lib/cargo/auth";
import { cargoError } from "lib/cargo/errors";
import { dbPool } from "lib/db";
import { events } from "lib/providers";
import {
  cargoMetadataTable,
  namespaceTable,
  repositoryTable,
} from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";

/**
 * Handle yank/unyank operations.
 */
export const yankHandler = async (
  namespace: string,
  crateName: string,
  version: string,
  yanked: boolean,
  request: Request,
  set: { status?: number },
) => {
  // Authenticate
  let auth: Awaited<ReturnType<typeof requireCargoWrite>>;
  try {
    auth = await requireCargoWrite(request.headers.get("Authorization"));
  } catch (e: unknown) {
    set.status = 403;
    return cargoError((e as Error).message);
  }

  // Verify token namespace matches URL namespace
  const [ns] = await dbPool
    .select()
    .from(namespaceTable)
    .where(eq(namespaceTable.id, auth.namespaceId))
    .limit(1);

  if (!ns || ns.name !== namespace) {
    set.status = 403;
    return cargoError("token not authorized for this namespace");
  }

  // Verify crate belongs to this namespace
  const [repo] = await dbPool
    .select()
    .from(repositoryTable)
    .where(
      and(
        eq(repositoryTable.namespaceId, ns.id),
        eq(repositoryTable.name, crateName),
      ),
    )
    .limit(1);

  if (!repo) {
    set.status = 404;
    return cargoError(`crate not found: ${crateName}`);
  }

  // Find the cargo metadata row
  const [row] = await dbPool
    .select()
    .from(cargoMetadataTable)
    .where(
      and(
        eq(cargoMetadataTable.name, crateName),
        eq(cargoMetadataTable.vers, version),
      ),
    )
    .limit(1);

  if (!row) {
    set.status = 404;
    return cargoError(`crate not found: ${crateName}@${version}`);
  }

  // Update yanked status
  await dbPool
    .update(cargoMetadataTable)
    .set({ yanked, updatedAt: new Date().toISOString() })
    .where(eq(cargoMetadataTable.id, row.id));

  logAuditEvent(
    {},
    {
      action: yanked ? "cargo.yank" : "cargo.unyank",
      resource: "crate",
      resourceId: `${crateName}@${version}`,
      details: { crate: crateName, version },
    },
  );

  try {
    await events.emit({
      type: yanked
        ? "manifold.artifact.yanked"
        : "manifold.artifact.unyanked",
      data: { crateName, version },
      organizationId: "system",
      subject: crateName,
    });
  } catch {
    // Event emission is best-effort; do not fail the yank
  }

  return { ok: true };
};
