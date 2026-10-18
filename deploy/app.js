// Startup file for cPanel "Setup Node.js App" (LiteSpeed or Passenger) or plain `node app.js`.
// The application itself lives in ./app (a self-contained Next.js build) so that
// CloudLinux's Node.js selector can manage the top-level node_modules symlink.

const fs = require("fs");
const os = require("os");
const path = require("path");

const log = (...a) => console.error(`[broadwing ${new Date().toISOString()}]`, ...a);

// Settings: cPanel environment variables, or a settings file. Some LiteSpeed
// servers don't pass cPanel's variables to Node.js apps, so the file is the
// reliable option. It lives in the home folder, outside every website folder.
const candidates = [
  process.env.BROADWING_CONFIG,
  path.join(os.homedir(), "broadwing-accounting.env"),
  path.join(__dirname, "..", "broadwing-accounting.env"),
].filter(Boolean);
const configFile = candidates.find((f) => fs.existsSync(f));
if (configFile) {
  for (const raw of fs.readFileSync(configFile, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const key = line.slice(0, line.indexOf("=")).trim();
    let value = line.slice(line.indexOf("=") + 1).trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Shared hosting (CloudLinux LVE) caps the threads and processes per account,
// while thread pools default to the server's CPU count (often 32–64 cores),
// which fails with "pthread_create: Resource temporarily unavailable".
// Keep every pool small and fixed. Each can still be overridden.
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || "1"; // Prisma query engine
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "2"; // Node.js file/DNS pool

// Uploaded logos and receipts are kept outside ./app so updates never touch them.
process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

log(
  `starting: Node ${process.version}, ${os.cpus().length} CPUs, settings from ` +
    (configFile ? configFile : "cPanel environment variables") +
    `, DATABASE_URL ${process.env.DATABASE_URL ? "set" : "MISSING"}, APP_PASSWORD ${process.env.APP_PASSWORD ? "set" : "not set"}`,
);

if (!process.env.DATABASE_URL) {
  log(
    "DATABASE_URL is not set. Create the file " +
      path.join(os.homedir(), "broadwing-accounting.env") +
      " containing a line like:\n  DATABASE_URL=mysql://cpaneluser_dbuser:password@localhost:3306/cpaneluser_broadwing",
  );
  process.exit(1);
}

// Prisma opens (CPU count × 2 + 1) MySQL connections by default; shared MySQL
// allows only a few per user, so cap the pool unless the URL already sets it.
if (!/[?&]connection_limit=/.test(process.env.DATABASE_URL)) {
  process.env.DATABASE_URL += (process.env.DATABASE_URL.includes("?") ? "&" : "?") + "connection_limit=3";
}

require("./app/migrate.js")(path.join(__dirname, "app", "migrations"))
  .then(() => {
    log(`database ready; uploads stored in ${process.env.UPLOAD_DIR}; starting web server`);
    require("./app/server.js");
  })
  .catch((err) => {
    log("could not prepare the database:", err && err.message ? err.message : err);
    process.exit(1);
  });
