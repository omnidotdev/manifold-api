// src/lib/cargo/yank.ts
import { and, eq } from "drizzle-orm";

import { requireCargoWrite } from "lib/cargo/auth";
import { cargoError } from "lib/cargo/errors";
import { dbPool } from "lib/db";
import { cargoMetadataTable } from "lib/db/schema";
import logAuditEvent from "lib/logging/logAuditEvent";

/**
 * Handle yank/unyank operations.
 */
export const yankHandler = async (
  crateName: string,
  version: string,
  yanked: boolean,
  request: Request,
  set: { status?: number },
) => {
  // Authenticate
  try {
    await requireCargoWrite(request.headers.get("Authorization"));
  } catch (e: unknown) {
    set.status = 403;
    return cargoError((e as Error).message);
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

  return { ok: true };
};
