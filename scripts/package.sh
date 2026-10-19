#!/usr/bin/env bash
# Builds the upload-ready package for cPanel / shared PHP hosting:
#   dist/broadwing-accounting.tar.gz and dist/broadwing-accounting.zip
# Contains everything needed (vendor/ included); no Composer, Node.js or
# terminal is needed on the server.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build:css >/dev/null
npm run vendor:js >/dev/null

OUT=dist/broadwing-accounting
rm -rf dist
mkdir -p "$OUT"
tar --exclude='./.git' --exclude='./node_modules' --exclude='./dist' --exclude='./vendor' \
    --exclude='./tests' --exclude='./docs' --exclude='./.env' --exclude='./storage' \
    --exclude='./bootstrap/cache/*.php' --exclude='./.phpunit.result.cache' --exclude='./.phpunit.cache' \
    -cf - . | tar -xf - -C "$OUT"

# Production dependencies only, compatible with PHP 8.3+.
(cd "$OUT" && COMPOSER_ALLOW_SUPERUSER=1 composer install --prefer-dist --no-dev --optimize-autoloader --no-interaction --no-progress --quiet)

# Composer may fall back to git clones; ship plain files only.
find "$OUT/vendor" -type d -name .git -prune -exec rm -rf {} +
# ...and without the test suites, samples and docs that git clones include.
find "$OUT/vendor" -mindepth 3 -maxdepth 3 -type d \( -name tests -o -name Tests -o -name docs -o -name samples -o -name .github -o -name examples \) -prune -exec rm -rf {} +

# Writable folders Laravel needs (empty).
for d in storage/app/private storage/app/public storage/framework/cache/data storage/framework/sessions \
         storage/framework/views storage/logs bootstrap/cache; do
  mkdir -p "$OUT/$d"
done
printf '*\n!.gitignore\n' > "$OUT/storage/app/private/.gitignore"

# Serve from public/ when the domain points at the app folder itself.
cp deploy/root.htaccess "$OUT/.htaccess"

# Development-only files.
rm -rf "$OUT/scripts" "$OUT/deploy" "$OUT/package.json" "$OUT/package-lock.json" "$OUT/tailwind.config.js" \
       "$OUT/phpunit.xml" "$OUT/resources/css" "$OUT/.editorconfig" "$OUT/.gitattributes" "$OUT/CLAUDE.md"

(cd dist && tar -czf broadwing-accounting.tar.gz broadwing-accounting \
         && python3 -c "
import os, zipfile
with zipfile.ZipFile('broadwing-accounting.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('broadwing-accounting'):
        for f in files:
            z.write(os.path.join(root, f))
        for d in dirs:
            p = os.path.join(root, d)
            if not os.listdir(p):
                z.write(p + '/', p + '/')
")
echo "Created dist/broadwing-accounting.tar.gz ($(du -h dist/broadwing-accounting.tar.gz | cut -f1))"
echo "Created dist/broadwing-accounting.zip ($(du -h dist/broadwing-accounting.zip | cut -f1))"
