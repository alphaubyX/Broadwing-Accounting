// Startup file for cPanel "Setup Node.js App" (Phusion Passenger) or plain `node app.js`.
// The application itself lives in ./app (a self-contained Next.js build) so that
// CloudLinux's Node.js selector can manage the top-level node_modules symlink.

const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Uploaded logos and receipts are kept outside ./app so updates never touch them.
process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

if (!process.env.DATABASE_URL) {
  console.error(
    "[broadwing] DATABASE_URL is not set. Add it in cPanel → Setup Node.js App → Environment variables, e.g.\n" +
      "  mysql://cpaneluser_dbuser:password@localhost:3306/cpaneluser_broadwing",
  );
  process.exit(1);
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
