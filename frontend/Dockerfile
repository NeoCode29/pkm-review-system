# Next.js Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Build args for NEXT_PUBLIC_* vars (baked in at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS frontend-production
WORKDIR /app
ENV NODE_ENV production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
