# API image. Build from the repository root:
#   docker build -f apps/api/Dockerfile .
# Postgres and Redis stay in Docker Compose. Run `vp` from the root so library
# builds resolve the catalog TypeScript, not the TypeScript 6 pin in this package.
FROM node:24.22.1-bookworm-slim

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/studio/package.json apps/studio/package.json
COPY libs/shared-types/package.json libs/shared-types/package.json
COPY libs/ui/package.json libs/ui/package.json
COPY libs/slide-generator/package.json libs/slide-generator/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec vp run api#build

ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
