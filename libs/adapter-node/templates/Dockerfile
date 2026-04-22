FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -r build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["node", "apps/shell/dist/server.js"]
