-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = lower("email")
WHERE "email" IS NOT NULL AND btrim("email") <> '';

UPDATE "User"
SET "username" = NULLIF(
  regexp_replace(
    lower(regexp_replace(btrim("name"), '[^[:alnum:][:space:]]', '', 'g')),
    '[[:space:]]+',
    '.',
    'g'
  ),
  ''
)
WHERE "username" IS NULL;

UPDATE "User"
SET "username" = 'user'
WHERE "username" IS NULL OR char_length("username") < 3;

WITH ranked AS (
  SELECT
    "id",
    "username",
    row_number() OVER (PARTITION BY "username" ORDER BY "createdAt", "id") AS n
  FROM "User"
)
UPDATE "User" AS u
SET "username" = left(r."username", 64 - char_length(r.n::text)) || r.n::text
FROM ranked AS r
WHERE u."id" = r."id" AND r.n > 1;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
