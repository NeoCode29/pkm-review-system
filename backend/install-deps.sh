# Install Prisma and other dependencies
cd backend
npm install --save @prisma/client
npm install --save-dev prisma

# Install NestJS packages
npm install --save @nestjs/config @nestjs/swagger @nestjs/platform-express
npm install --save class-validator class-transformer

# Install Supabase client
npm install --save @supabase/supabase-js

# Install Passport for authentication
npm install --save @nestjs/passport @nestjs/jwt passport passport-jwt
npm install --save-dev @types/passport-jwt

# Generate Prisma Client
npx prisma generate
