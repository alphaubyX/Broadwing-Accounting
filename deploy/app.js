// Startup file for cPanel "Setup Node.js App" (Phusion Passenger) or plain `node app.js`.
// The application itself lives in ./app (a self-contained Next.js build) so that
// CloudLinux's Node.js selector can manage the top-level node_modules symlink.

const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Shared hosting (CloudLinux LVE) caps the threads and processes per account,
// while thread pools default to the server's CPU count (often 32–64 cores),
// which fails with "pthread_create: Resource temporarily unavailable".
// Keep every pool small and fixed. Each can still be overridden in cPanel.
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || "1"; // Prisma query engine
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "2"; // Node.js file/DNS pool

// Uploaded logos and receipts are kept outside ./app so updates never touch them.
process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

if (!process.env.DATABASE_URL) {
  console.error(
    "[broadwing] DATABASE_URL is not set. Add it in cPanel → Setup Node.js App → Environment variables, e.g.\n" +
      "  mysql://cpaneluser_dbuser:password@localhost:3306/cpaneluser_broadwing",
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
    console.log(`[broadwing] starting; uploads stored in ${process.env.UPLOAD_DIR}`);
    require("./app/server.js");
  })
  .catch((err) => {
    console.error("[broadwing] could not prepare the database:", err);
    process.exit(1);
  });
