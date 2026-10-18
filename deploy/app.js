// Startup file for cPanel "Setup Node.js App" (LiteSpeed or Passenger) or plain `node app.js`.
// The application itself lives in ./app (a self-contained Next.js build) so that
// CloudLinux's Node.js selector can manage the top-level node_modules symlink.

const fs = require("fs");
const os = require("os");
const path = require("path");

const log = (...a) => console.error(`[broadwing ${new Date().toISOString()} pid ${process.pid}]`, ...a);

// Explain every way the process can end, so stderr.log always says why.
process.on("uncaughtException", (e) => {
  log("crashed:", (e && e.stack) || e);
  process.exit(1);
});
process.on("unhandledRejection", (e) => log("unhandled error:", (e && e.stack) || e));
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(signal, () => {
    log(`stopped by the server (${signal})`);
    process.exit(0);
  });
}

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
// Shared hosting caps threads per account; keep Node's worker pool small.
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "2";

// Uploaded logos and receipts are kept outside ./app so updates never touch them.
process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

log(
  `starting: Node ${process.version}, settings from ` +
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

// Start the web server straight away: LiteSpeed/Passenger restart apps that
// don't start listening within a few seconds. Database tables are created or
// updated alongside it; /api/health reports when the database is reachable.
require("./app/server.js");
log(`web server starting; uploads stored in ${process.env.UPLOAD_DIR}`);

require("./app/migrate.js")(path.join(__dirname, "app", "migrations"))
  .then(() => log("database ready"))
  .catch((err) => log("could not prepare the database:", (err && err.message) || err));
