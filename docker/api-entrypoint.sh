#!/bin/sh
# Applies any outstanding migrations before the API starts accepting traffic, so a
# deploy of a newer image cannot serve requests against an older schema.
set -e

echo "SPIMS: applying database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "SPIMS: SEED_ON_START is set — loading the demo dataset."
  echo "SPIMS: WARNING — demo accounts use published passwords. Do not use on a live deployment."
  npm run prisma:seed
fi

exec "$@"
