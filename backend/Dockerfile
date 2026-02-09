# NestJS Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS backend-production
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate
COPY --from=backend-builder /app/dist ./dist
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
