FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

# npm install специально: patch добавляет web-push, а lock обновится внутри image.
RUN npm install

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build


FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm install --omit=dev \
  && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
