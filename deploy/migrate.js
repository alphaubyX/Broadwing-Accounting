// Applies prisma/migrations/*/migration.sql on startup, so a host without
// terminal access (cPanel) can still create and update the database tables.
// Uses Prisma's own _prisma_migrations table and checksums, so it stays
// compatible with `prisma migrate deploy` / `prisma migrate status`.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

/** Same parsing as src/lib/db-config.ts. */
function poolConfig(url) {
  const u = new URL(url);
  const socket = u.searchParams.get("socket");
  return {
    host: u.hostname || "localhost",
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")),
    connectionLimit: 1,
    connectTimeout: 10000,
    allowPublicKeyRetrieval: true,
    ...(socket ? { socketPath: socket } : {}),
  };
}

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`checksum\` VARCHAR(64) NOT NULL,
  \`finished_at\` DATETIME(3) NULL,
  \`migration_name\` VARCHAR(255) NOT NULL,
  \`logs\` TEXT NULL,
  \`rolled_back_at\` DATETIME(3) NULL,
  \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

/** Split a Prisma-generated migration into single statements (MySQL runs one per call). */
function statements(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = async function migrate(migrationsDir) {
  const db = new PrismaClient({ adapter: new PrismaMariaDb(poolConfig(process.env.DATABASE_URL)) });
  try {
    await db.$executeRawUnsafe(CREATE_TABLE);
    const rows = await db.$queryRawUnsafe("SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations");
    const failed = rows.filter((r) => !r.finished_at && !r.rolled_back_at);
    if (failed.length) {
      throw new Error(
        `A previous database update did not finish (${failed.map((r) => r.migration_name).join(", ")}). ` +
          "Restore the database from a backup or ask for help before restarting.",
      );
    }
    const done = new Set(rows.filter((r) => r.finished_at).map((r) => r.migration_name));
    const names = fs
      .readdirSync(migrationsDir)
      .filter((n) => fs.existsSync(path.join(migrationsDir, n, "migration.sql")))
      .sort();

    for (const name of names) {
      if (done.has(name)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8");
      const id = crypto.randomUUID();
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");
      await db.$executeRawUnsafe(
        "INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count) VALUES (?, ?, ?, NOW(3), 0)",
        id,
        checksum,
        name,
      );
      console.log(`[broadwing] applying database update ${name}…`);
      try {
        for (const statement of statements(sql)) await db.$executeRawUnsafe(statement);
      } catch (e) {
        await db.$executeRawUnsafe("UPDATE _prisma_migrations SET logs = ? WHERE id = ?", String(e && e.message), id);
        throw e;
      }
      await db.$executeRawUnsafe("UPDATE _prisma_migrations SET finished_at = NOW(3), applied_steps_count = 1 WHERE id = ?", id);
    }
    console.log(`[broadwing] database is up to date (${names.length} migration${names.length === 1 ? "" : "s"}).`);
  } finally {
    await db.$disconnect();
  }
};
