#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gisu-security"

cd "$ROOT"
git pull

cd "$ROOT/server"
NODE_ENV=development npm ci --include=dev
npx --no-install prisma generate
npx --no-install prisma migrate deploy

cd "$ROOT/client"
npm ci
npm run build

systemctl restart gisu-security-api
sleep 2

if systemctl is-active --quiet gisu-security-api; then
  echo "Deploy OK: gisu-security-api is running"
  systemctl status gisu-security-api --no-pager
else
  echo "Deploy failed: gisu-security-api is not running"
  journalctl -u gisu-security-api -n 40 --no-pager
  exit 1
fi