import { beforeEach, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";

import { uploadSessionTable } from "lib/db/schema";
import { cleanupExpiredSessions } from "lib/jobs";
import { initSession, sessionExists } from "lib/oci/chunkStore";
import { namespaceFactory, repositoryFactory } from "test/factories";

// Set PG* env vars so the lazy pool connects to the test container
const connUrl = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
process.env.PGHOST = connUrl.hostname;
process.env.PGPORT = connUrl.port;
process.env.PGDATABASE = connUrl.pathname.slice(1);
process.env.PGUSER = connUrl.username;
process.env.PGPASSWORD = connUrl.password;

/**
 * Get the test database from global preload context.
 */
const getDb = () => {
	if (!globalThis.__TEST_DATABASE__) {
		throw new Error(
			"Test database not initialized. Ensure preload.ts is configured in bunfig.toml",
		);
	}
	return globalThis.__TEST_DATABASE__.db;
};

describe("cleanupExpiredSessions", () => {
	beforeEach(async () => {
		const db = getDb();
		await db.execute(
			sql`TRUNCATE TABLE upload_session, artifact, tag, repository, namespace CASCADE`,
		);
	});

	test("removes expired sessions and their chunk files", async () => {
		const db = getDb();

		// Arrange: create namespace + repository
		const ns = await namespaceFactory.create(db, { name: "library" });
		const repo = await repositoryFactory.create(db, {
			namespaceId: ns.id,
			name: "cleanup-test",
			isPublic: true,
		});

		// Insert an expired session (1 hour in the past)
		const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
		const [session] = await db
			.insert(uploadSessionTable)
			.values({
				repositoryId: repo.id,
				expiresAt: pastDate,
			})
			.returning();

		// Create chunk file on disk
		await initSession(session.id);
		expect(await sessionExists(session.id)).toBe(true);

		// Act
		const count = await cleanupExpiredSessions();

		// Assert: session row is deleted
		expect(count).toBe(1);
		const remaining = await db
			.select()
			.from(uploadSessionTable)
			.where(eq(uploadSessionTable.id, session.id));
		expect(remaining).toHaveLength(0);

		// Assert: chunk file is cleaned up
		expect(await sessionExists(session.id)).toBe(false);
	});

	test("does not remove active sessions", async () => {
		const db = getDb();

		// Arrange: create namespace + repository
		const ns = await namespaceFactory.create(db, { name: "library" });
		const repo = await repositoryFactory.create(db, {
			namespaceId: ns.id,
			name: "active-test",
			isPublic: true,
		});

		// Insert an active session (24 hours in the future)
		const futureDate = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		).toISOString();
		const [session] = await db
			.insert(uploadSessionTable)
			.values({
				repositoryId: repo.id,
				expiresAt: futureDate,
			})
			.returning();

		// Create chunk file on disk
		await initSession(session.id);

		// Act
		const count = await cleanupExpiredSessions();

		// Assert: session row still exists
		expect(count).toBe(0);
		const remaining = await db
			.select()
			.from(uploadSessionTable)
			.where(eq(uploadSessionTable.id, session.id));
		expect(remaining).toHaveLength(1);

		// Assert: chunk file still exists
		expect(await sessionExists(session.id)).toBe(true);
	});

	test("handles mixed expired and active sessions", async () => {
		const db = getDb();

		// Arrange
		const ns = await namespaceFactory.create(db, { name: "library" });
		const repo = await repositoryFactory.create(db, {
			namespaceId: ns.id,
			name: "mixed-test",
			isPublic: true,
		});

		const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
		const futureDate = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		).toISOString();

		const [expired] = await db
			.insert(uploadSessionTable)
			.values({
				repositoryId: repo.id,
				expiresAt: pastDate,
			})
			.returning();

		const [active] = await db
			.insert(uploadSessionTable)
			.values({
				repositoryId: repo.id,
				expiresAt: futureDate,
			})
			.returning();

		await initSession(expired.id);
		await initSession(active.id);

		// Act
		const count = await cleanupExpiredSessions();

		// Assert: only expired session removed
		expect(count).toBe(1);

		const remainingExpired = await db
			.select()
			.from(uploadSessionTable)
			.where(eq(uploadSessionTable.id, expired.id));
		expect(remainingExpired).toHaveLength(0);
		expect(await sessionExists(expired.id)).toBe(false);

		const remainingActive = await db
			.select()
			.from(uploadSessionTable)
			.where(eq(uploadSessionTable.id, active.id));
		expect(remainingActive).toHaveLength(1);
		expect(await sessionExists(active.id)).toBe(true);
	});
});
