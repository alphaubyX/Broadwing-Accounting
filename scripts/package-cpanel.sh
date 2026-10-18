#!/usr/bin/env bash
# Builds a ready-to-upload ZIP for cPanel Node.js hosting (e.g. FastComet).
# Output: dist/broadwing-accounting.zip and dist/broadwing-accounting.tar.gz
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf .next dist
npx prisma generate
npm run build

OUT=dist/broadwing-accounting
mkdir -p "$OUT/app"
cp -a .next/standalone/. "$OUT/app/"
cp -a .next/static "$OUT/app/.next/static"
[ -d public ] && cp -a public "$OUT/app/public"
# Generated Prisma client incl. the WebAssembly query compiler, and the
# MariaDB/MySQL driver adapter used by migrate.js (not always picked up by tracing).
mkdir -p "$OUT/app/node_modules/.prisma/client"
cp -a node_modules/.prisma/client/. "$OUT/app/node_modules/.prisma/client/"
for pkg in @prisma/adapter-mariadb @prisma/driver-adapter-utils @prisma/debug mariadb denque iconv-lite lru-cache safer-buffer @types/geojson; do
  if [ -d "node_modules/$pkg" ] && [ ! -d "$OUT/app/node_modules/$pkg" ]; then
    mkdir -p "$OUT/app/node_modules/$(dirname "$pkg")"
    cp -a "node_modules/$pkg" "$OUT/app/node_modules/$pkg"
  fi
done
# No native engines are needed any more.
rm -f "$OUT"/app/node_modules/.prisma/client/libquery_engine-*
cp -a prisma/migrations "$OUT/app/migrations"
cp deploy/migrate.js "$OUT/app/migrate.js"
cp deploy/app.js "$OUT/app.js"
cp deploy/package.json "$OUT/package.json"
cp deploy/broadwing-accounting.env.example "$OUT/broadwing-accounting.env.example"
# Not needed at runtime: image optimisation (unused) and the TypeScript compiler.
rm -rf "$OUT/app/node_modules/@img" "$OUT/app/node_modules/sharp" "$OUT/app/node_modules/typescript"
# Never ship local secrets or uploads.
rm -rf "$OUT/app/.env" "$OUT"/app/.env.* "$OUT/app/uploads"

(cd dist && rm -f broadwing-accounting.zip && python3 -c "
import os, zipfile
with zipfile.ZipFile('broadwing-accounting.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('broadwing-accounting'):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, p)
")
(cd dist && tar -czf broadwing-accounting.tar.gz broadwing-accounting)
echo "Created dist/broadwing-accounting.zip ($(du -h dist/broadwing-accounting.zip | cut -f1))"
echo "Created dist/broadwing-accounting.tar.gz ($(du -h dist/broadwing-accounting.tar.gz | cut -f1))"
