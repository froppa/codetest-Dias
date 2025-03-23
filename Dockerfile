FROM node:20-alpine AS build

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY tsconfig.json .
COPY src .

COPY prisma .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
COPY .env .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
