# Deploying Broadwing Accounting on FastComet (cPanel)

This guide puts the app live on a subdomain such as `accounts.yourdomain.com`,
using cPanel's **Setup Node.js App** and your existing **MySQL** service.
Nothing has to be built or installed on the server: you upload a ready-made package.

You will need:

- `broadwing-accounting.tar.gz` (or `.zip`): the ready-to-upload package. Create it with
  `npm run package:cpanel` (both appear in `dist/`), or use the one you were sent.
- About 20 minutes and access to cPanel.

---

## Step 1: Check Node.js (1 minute)

cPanel → **Software → Setup Node.js App** → **Create Application**. Open the
**Node.js version** list and check that **20.x or newer** is offered (22 is
ideal). Close the form without saving.

> If the newest version is below 20, ask FastComet support: *"Please enable
> Node.js 20 or 22 for Setup Node.js App on my account."*

## Step 2: Create the subdomain (2 minutes)

cPanel → **Domains** → **Create A New Domain** (or **Subdomains** on older cPanel).

- Domain: `accounts.yourdomain.com`
- Leave the document root as suggested. The app does not live there.

## Step 3: Create the MySQL database (3 minutes)

cPanel → **Databases → MySQL Database Wizard**

1. **Database name:** `broadwing` → becomes `cpuser_broadwing` (cPanel adds your account prefix).
2. **User:** `bwapp` → becomes `cpuser_bwapp`. Use the password generator, and
   **copy the password somewhere safe**.
3. **Privileges:** tick **ALL PRIVILEGES** → **Make Changes**.

Your connection string (the *database URL*) is:

```
mysql://cpuser_bwapp:PASSWORD@localhost:3306/cpuser_broadwing
```

Replace `cpuser_` with your real prefix and `PASSWORD` with the password.

> **Passwords with symbols:** inside the URL, replace these characters:
> `@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`, `?` → `%3F`, `&` → `%26`, `%` → `%25`.
> The easiest option is a long password with only letters and numbers.

## Step 4: Upload the app (5 minutes)

cPanel → **Files → File Manager**

1. Open your **home folder** (`/home/cpuser`). This is **not** `public_html`.
2. **Upload** `broadwing-accounting.tar.gz` (or the `.zip`).
3. Right-click the file → **Extract** → extract into `/home/cpuser`.
4. You now have `/home/cpuser/broadwing-accounting/` containing `app.js`, `package.json` and an `app/` folder.
5. Delete the uploaded `.tar.gz` / `.zip` file.

## Step 5: Create the Node.js application (5 minutes)

cPanel → **Setup Node.js App** → **Create Application**

| Field | Value |
| --- | --- |
| Node.js version | **22.x** (or 20.x) |
| Application mode | **Production** |
| Application root | `broadwing-accounting` |
| Application URL | `accounts.yourdomain.com` (leave the path empty) |
| Application startup file | `app.js` |

Under **Environment variables**, click **Add Variable** for each:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the connection string from Step 3 |
| `APP_PASSWORD` | a password to protect the app (anyone opening the site must enter it) |
| `APP_USERNAME` | *(optional)* user name for the sign-in prompt, default `admin` |

Click **Create**, then **Restart**.

> **Do not** click "Run NPM Install". Everything the app needs is already in the `app/` folder.

On first start the app creates its database tables automatically.

## Step 6: Turn on HTTPS (2 minutes)

cPanel → **Security → SSL/TLS Status** → tick `accounts.yourdomain.com` → **Run AutoSSL**.
The password is sent with every request, so **always use https://**.

## Step 7: Open the app

1. Visit `https://accounts.yourdomain.com/api/health`.
   You should see `{"ok":true,"database":"connected"}`.
2. Visit `https://accounts.yourdomain.com`, sign in with `admin` (or your
   `APP_USERNAME`) and your `APP_PASSWORD`.
3. The **setup wizard** opens. Enter your business details, and you're running.

---

## Updating to a new version

1. **Setup Node.js App** → your app → **Stop App**.
2. File Manager → `/home/cpuser/broadwing-accounting` → delete the **`app`** folder only.
3. Upload the new `.tar.gz` (or `.zip`) to `/home/cpuser` and **Extract** it (allow overwriting `app.js` and `package.json`).
4. **Start App** (or **Restart**). Any database updates are applied automatically on start.

Your data is safe during updates. It lives in the MySQL database and in
`/home/cpuser/broadwing-accounting/uploads` (logos and receipts), and neither is
part of the package.

## Backups

- **Database:** cPanel → **phpMyAdmin** → select `cpuser_broadwing` → **Export**.
  Or use cPanel → **Backup** → *Download a MySQL Database Backup*.
- **Receipts and logos:** download the `broadwing-accounting/uploads` folder.

## Troubleshooting

The app writes its log to **`/home/cpuser/broadwing-accounting/stderr.log`**
(open it in File Manager). Common messages:

| What you see | Fix |
| --- | --- |
| `DATABASE_URL is not set` | Add the variable in Setup Node.js App and click **Restart**. |
| `Access denied for user` / `/api/health` shows `unreachable` | Check the user, password and prefix in `DATABASE_URL`, and that the user has ALL PRIVILEGES on the database. Encode symbols in the password (Step 3). |
| `Prisma … could not locate the Query Engine` / `libssl` errors | Send the log line to support. The server needs another engine build. |
| `SyntaxError` or `Unexpected token` at start | The Node.js version is too old. Choose 20 or 22 and restart. |
| `pthread_create: Resource temporarily unavailable` | The account's thread/process limit was hit. Use the latest `app.js` (it keeps thread pools small), then in **Setup Node.js App** click **Stop App**, wait 30 seconds and **Start App** so old processes are cleared. If it persists, ask FastComet support to raise the account's process (NPROC) limit. |
| *Incomplete response received from application* / 503 | Usually a start-up error. Check `stderr.log`, then **Restart**. |
| Sign-in prompt keeps reappearing | Check `APP_USERNAME` / `APP_PASSWORD` for typos, and restart after changing them. |
| Site shows a cPanel default page | The Application URL must be the subdomain, with the Application root `broadwing-accounting`. |
