# Deploying Broadwing Accounting on FastComet (cPanel)

Broadwing Accounting is a PHP (Laravel) + MySQL app that installs like any PHP website.

1. Upload one file and extract it.
2. Open the site.
3. Answer the installer's questions.

There's no Node.js, Composer, terminal or build step on the server.

These steps use the example subdomain `accounting.broadwing.one`, whose web folder is
`/home/markhorc/broadwing-accounting`. Replace `markhorc` with your cPanel user name.

---

## Step 0: Remove the old Node.js attempt (only if you tried it before)

1. cPanel → **Setup Node.js App** → open the `accounting.broadwing.one` app → **Destroy**.
   This stops LiteSpeed from sending the subdomain to Node.js.
2. **File Manager** → `/home/markhorc/broadwing-accounting` → delete `app`, `app.js`,
   `package.json`, `stderr.log` and `.htaccess`. Keep `.well-known` and `cgi-bin`.
3. Delete `/home/markhorc/broadwing-accounting.env`. It held the database password and isn't used any more.
4. If the database already has tables from the old attempt, empty it:
   **phpMyAdmin** → select the database → *Check all* → *Drop*.
   Or create a new, empty database in Step 2 instead.

## Step 1: PHP 8.3 or newer for the subdomain

The app needs **PHP 8.3+**. If the site still runs on an older version, it shows a page saying so instead of the app.

FastComet's **PHP Selector** changes the version for the whole account unless "site isolation" is enabled,
and your other sites may need PHP 7.4. Choose one option:

- **Recommended:** ask FastComet support:
  > Please set PHP 8.3 (or newer) for the domain **accounting.broadwing.one** only, and keep my other domains on their current PHP version.
  > Please make sure these extensions are enabled for it: pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, fileinfo, zip, gd, dom, iconv, simplexml, xmlreader, xmlwriter, zlib.
- If cPanel shows **MultiPHP Manager**, tick only `accounting.broadwing.one` and choose PHP 8.3.

## Step 2: MySQL database (3 minutes)

cPanel → **MySQL Database Wizard**: create a database and a user, then give the user **ALL PRIVILEGES**.
Write down the full names, which include your prefix (e.g. `markhorc_accounting`), and the password.
You can reuse the database from the Node.js attempt once it's empty (Step 0).

## Step 3: Upload (3 minutes)

1. **File Manager** → go to your **home folder** `/home/markhorc` (not inside `broadwing-accounting`).
2. **Upload** `broadwing-accounting.tar.gz`.
3. Right-click it → **Extract** → extract to `/home/markhorc`.
   The files land in `/home/markhorc/broadwing-accounting`. Allow overwriting if asked.
4. Delete the `.tar.gz`.

The package includes an `.htaccess` that serves the app from its `public` folder and blocks web access
to everything else (code, settings, uploaded receipts). You don't need to change the document root.

## Step 4: Install (2 minutes)

1. Open **https://accounting.broadwing.one** (http:// is fine if SSL isn't set up yet).
2. The **installer** checks the server: PHP version, extensions and writable folders. If anything is red, fix it first (Step 1).
3. Enter the database name, user and password (host `localhost`, port `3306`), and choose the **app password**.
4. Click **Install**. The tables are created, the installer locks itself, and the **business setup** opens.

Do this right after uploading: until the installer has run, anyone who opens the address would see it.

## Step 5: HTTPS (2 minutes)

cPanel → **SSL/TLS Status** → tick `accounting.broadwing.one` → **Run AutoSSL**.

---

## Updating to a new version

1. Upload the new `broadwing-accounting.tar.gz` to `/home/markhorc` and **Extract** it, overwriting the old files.
2. Open the site. Any database changes are applied automatically on the first page load.

These are never in the package, so updates don't touch them:
- `.env` (your settings)
- `storage/` (receipts, logos, logs)
- the database

## Backups

- **Database:** phpMyAdmin → your database → **Export**, or cPanel → **Backup**.
- **Files:** download `broadwing-accounting/.env` and `broadwing-accounting/storage/app/private` (receipts and logos).

## Troubleshooting

| What you see | What to do |
| --- | --- |
| "Broadwing Accounting needs PHP 8.3 or newer" | The domain still runs an older PHP. See Step 1. |
| "Composer detected issues in your platform … extension" | A PHP extension is missing. Enable it in **Select PHP Version → Extensions**, or ask support. |
| A red item in the installer's server check | Fix it, then reload the page. "Writable" items: File Manager → right-click the folder → **Change Permissions** → 755 (folders) / 644 (files). |
| "Could not connect to MySQL" in the installer | Check the full database and user names (with prefix), the password, and that the user has ALL PRIVILEGES on the database. |
| "500 Server Error" | Open `broadwing-accounting/storage/logs/` in File Manager; the newest `laravel-….log` file says why. Send the last lines to your developer. |
| Forgot the app password | File Manager → edit `broadwing-accounting/.env` → clear the `APP_PASSWORD_HASH=` value → save. The app is then open without a password; set a new one under **Settings → Password**. *(Until it's set, anyone with the address can get in.)* |
