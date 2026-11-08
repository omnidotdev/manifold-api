/**
 * @file PEP 503 (HTML) and PEP 691 (JSON) Simple index handlers.
 */

import { and, eq } from "drizzle-orm";

import { dbPool } from "lib/db";
import {
  artifactTable,
  namespaceTable,
  pypiMetadataTable,
  repositoryTable,
} from "lib/db/schema";
import { normalizeProjectName } from "lib/pypi/normalize";

const JSON_CONTENT_TYPE = "application/vnd.pypi.simple.v1+json";
const HTML_CONTENT_TYPE = "application/vnd.pypi.simple.v1+html";

/** Whether the client prefers the PEP 691 JSON representation */
const wantsJson = (accept: string | null): boolean =>
  !!accept && accept.includes("application/vnd.pypi.simple.v1+json");

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface FileEntry {
  filename: string;
  url: string;
  sha256: string;
  requiresPython: string | null;
  yanked: boolean;
}

const renderProjectListHtml = (names: string[]): string =>
  `<!DOCTYPE html>\n<html>\n  <head>\n    <meta name="pypi:repository-version" content="1.0">\n    <title>Simple index</title>\n  </head>\n  <body>\n${names
    .map((n) => `    <a href="${escapeHtml(n)}/">${escapeHtml(n)}</a>`)
    .join("\n")}\n  </body>\n</html>\n`;

const renderFileListHtml = (name: string, files: FileEntry[]): string =>
  `<!DOCTYPE html>\n<html>\n  <head>\n    <meta name="pypi:repository-version" content="1.0">\n    <title>Links for ${escapeHtml(
    name,
  )}</title>\n  </head>\n  <body>\n    <h1>Links for ${escapeHtml(name)}</h1>\n${files
    .map((f) => {
      const attrs = [
        f.requiresPython
          ? `data-requires-python="${escapeHtml(f.requiresPython)}"`
          : "",
        f.yanked ? "data-yanked" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const space = attrs ? ` ${attrs}` : "";
      return `    <a href="${escapeHtml(f.url)}#sha256=${f.sha256}"${space}>${escapeHtml(
        f.filename,
      )}</a><br>`;
    })
    .join("\n")}\n  </body>\n</html>\n`;

/** `GET /pypi/:namespace/simple/` — list every project in the namespace. */
export const simpleRootHandler = async (
  namespace: string,
  accept: string | null,
) => {
  const [ns] = await dbPool
    .select({ id: namespaceTable.id })
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace))
    .limit(1);

  const repos = ns
    ? await dbPool
        .select({ name: repositoryTable.name })
        .from(repositoryTable)
        .where(
          and(
            eq(repositoryTable.namespaceId, ns.id),
            eq(repositoryTable.artifactType, "pypi"),
          ),
        )
    : [];

  const names = repos.map((r) => r.name).sort();

  if (wantsJson(accept)) {
    return new Response(
      JSON.stringify({
        meta: { "api-version": "1.0" },
        projects: names.map((name) => ({ name })),
      }),
      { headers: { "Content-Type": JSON_CONTENT_TYPE } },
    );
  }

  return new Response(renderProjectListHtml(names), {
    headers: { "Content-Type": HTML_CONTENT_TYPE },
  });
};

/** `GET /pypi/:namespace/simple/:project/` — list the files for a project. */
export const simpleProjectHandler = async (
  namespace: string,
  project: string,
  baseUrl: string,
  accept: string | null,
  set: { status?: number },
) => {
  const name = normalizeProjectName(project);

  const [ns] = await dbPool
    .select({ id: namespaceTable.id })
    .from(namespaceTable)
    .where(eq(namespaceTable.name, namespace))
    .limit(1);

  if (!ns) {
    set.status = 404;
    return "namespace not found";
  }

  const [repo] = await dbPool
    .select({ id: repositoryTable.id })
    .from(repositoryTable)
    .where(
      and(
        eq(repositoryTable.namespaceId, ns.id),
        eq(repositoryTable.name, name),
      ),
    )
    .limit(1);

  if (!repo) {
    set.status = 404;
    return "project not found";
  }

  const rows = await dbPool
    .select({ meta: pypiMetadataTable })
    .from(pypiMetadataTable)
    .innerJoin(
      artifactTable,
      eq(pypiMetadataTable.artifactId, artifactTable.id),
    )
    .where(eq(artifactTable.repositoryId, repo.id));

  const files: FileEntry[] = rows
    .map((r) => ({
      filename: r.meta.filename,
      url: `${baseUrl}/pypi/${namespace}/files/${name}/${r.meta.filename}`,
      sha256: r.meta.sha256,
      requiresPython: r.meta.requiresPython,
      yanked: r.meta.yanked,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));

  if (wantsJson(accept)) {
    return new Response(
      JSON.stringify({
        meta: { "api-version": "1.0" },
        name,
        files: files.map((f) => ({
          filename: f.filename,
          url: f.url,
          hashes: { sha256: f.sha256 },
          "requires-python": f.requiresPython ?? undefined,
          yanked: f.yanked,
        })),
      }),
      { headers: { "Content-Type": JSON_CONTENT_TYPE } },
    );
  }

  return new Response(renderFileListHtml(name, files), {
    headers: { "Content-Type": HTML_CONTENT_TYPE },
  });
};
