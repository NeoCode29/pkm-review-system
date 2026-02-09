# NestJS Backend Best Practices Guide

> **For**: PKM Review Application
> **Last Updated**: 2026-02-09
> **Framework**: NestJS + Prisma + PostgreSQL

---

## Table of Contents
1. [Architecture Principles](#architecture-principles)
2. [API Design Patterns](#api-design-patterns)
3. [Database & Prisma Best Practices](#database--prisma-best-practices)
4. [DTOs & Validation](#dtos--validation)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)
7. [Testing Strategies](#testing-strategies)
8. [Code Organization](#code-organization)
9. [Performance Optimization](#performance-optimization)
10. [Documentation Standards](#documentation-standards)

---

## Architecture Principles

### 1. Modular Design
Setiap feature harus memiliki module sendiri dengan struktur yang konsisten.

**✅ Good Structure**
```
src/teams/
├── dto/
│   ├── create-team.dto.ts
│   ├── update-team.dto.ts
│   └── team-response.dto.ts
├── entities/
│   └── team.entity.ts
├── teams.controller.ts
├── teams.service.ts
├── teams.module.ts
└── tests/
    ├── teams.controller.spec.ts
    └── teams.service.spec.ts
```

**❌ Bad Structure**
```
src/
├── teams-controller.ts
├── teams-service.ts
├── team-dto.ts
└── team-stuff.ts
```

### 2. Dependency Injection
Gunakan NestJS DI system secara konsisten.

**✅ Good Pattern**
```typescript
@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ProposalsService))
    private readonly proposalsService: ProposalsService,
  ) {}
}
```

**❌ Bad Pattern**
```typescript
export class TeamsService {
  private prisma = new PrismaService(); // ❌ Manual instantiation
}
```

### 3. Single Responsibility Principle
Setiap service harus fokus pada satu domain logic.

**✅ Good Separation**
```typescript
// teams.service.ts - Team CRUD
export class TeamsService {
  async create(dto: CreateTeamDto) { ... }
  async findAll() { ... }
}

// team-members.service.ts - Team membership logic
export class TeamMembersService {
  async addMember(teamId: number, mahasiswaId: number) { ... }
  async removeMember(memberId: number) { ... }
}
```

**❌ Bad: God Service**
```typescript
// teams.service.ts
export class TeamsService {
  async create() { ... }
  async addMember() { ... }
  async uploadProposal() { ... }
  async assignReviewer() { ... } // ❌ Too many responsibilities
}
```

---

## API Design Patterns

### 1. RESTful Conventions
Ikuti REST conventions secara konsisten.

| Method | Endpoint | Purpose | Response Status |
|--------|----------|---------|-----------------|
| GET | `/teams` | List all teams | 200 OK |
| GET | `/teams/:id` | Get single team | 200 OK / 404 Not Found |
| POST | `/teams` | Create team | 201 Created |
| PUT/PATCH | `/teams/:id` | Update team | 200 OK / 404 Not Found |
| DELETE | `/teams/:id` | Delete team | 204 No Content / 404 Not Found |

### 2. Nested Resources
Untuk relasi parent-child, gunakan nested routes.

**✅ Good**
```typescript
@Controller('teams')
export class TeamsController {
  // /teams/:teamId/members
  @Post(':teamId/members')
  async addMember(@Param('teamId') teamId: string, @Body() dto: AddMemberDto) {
    return this.teamsService.addMember(+teamId, dto);
  }
  
  // /teams/:teamId/join-requests
  @Get(':teamId/join-requests')
  async getJoinRequests(@Param('teamId') teamId: string) {
    return this.joinRequestsService.findByTeam(+teamId);
  }
}
```

### 3. Query Parameters untuk Filtering & Pagination
```typescript
@Get()
async findAll(
  @Query('status') status?: string,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('jenisPkmId') jenisPkmId?: string,
) {
  return this.teamsService.findAll({
    status,
    jenisPkmId: jenisPkmId ? +jenisPkmId : undefined,
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

### 4. Response Format Standardization
Gunakan format response yang konsisten.

**✅ Success Response**
```typescript
{
  "message": "Team created successfully",
  "data": {
    "id": 1,
    "name": "PKM Innovators",
    "jenisPkmId": 2,
    "openToJoin": true
  }
}
```

**✅ Error Response**
```typescript
{
  "statusCode": 400,
  "message": "Mahasiswa sudah terdaftar di tim lain",
  "error": "Bad Request",
  "timestamp": "2026-02-09T13:45:00.000Z",
  "path": "/api/teams"
}
```

**✅ Paginated Response**
```typescript
{
  "data": [...],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## Database & Prisma Best Practices

### 1. Use Transactions for Multi-Step Operations
```typescript
async createTeam(dto: CreateTeamDto, creatorId: number) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Create team
    const team = await tx.team.create({
      data: {
        name: dto.name,
        jenisPkmId: dto.jenisPkmId,
      },
    });
    
    // 2. Add creator as ketua
    await tx.teamMember.create({
      data: {
        teamId: team.id,
        mahasiswaId: creatorId,
        role: 'ketua',
      },
    });
    
    // 3. Create 2 proposals
    await tx.proposal.createMany({
      data: [
        { teamId: team.id, type: 'original', status: 'draft' },
        { teamId: team.id, type: 'revised', status: 'draft' },
      ],
    });
    
    return team;
  });
}
```

### 2. Optimize Queries dengan `include` dan `select`
**✅ Only fetch needed data**
```typescript
// Good: Only fetch what you need
const team = await this.prisma.team.findUnique({
  where: { id: teamId },
  select: {
    id: true,
    name: true,
    jenisPkmId: true,
    teamMembers: {
      select: {
        id: true,
        role: true,
        mahasiswa: {
          select: {
            nama: true,
            nim: true,
          },
        },
      },
    },
  },
});
```

**❌ Bad: Fetch everything**
```typescript
const team = await this.prisma.team.findUnique({
  where: { id: teamId },
  include: {
    teamMembers: {
      include: {
        mahasiswa: true, // ❌ Fetches all mahasiswa fields
      },
    },
    proposals: true, // ❌ Might not be needed
    jenisPkm: true,
  },
});
```

### 3. Database Constraints & Validations
Enforce business rules at database level when possible.

**In Prisma Schema**
```prisma
model Team {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(100)
  jenisPkmId  Int
  openToJoin  Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  // Indexes untuk performance
  @@index([jenisPkmId])
  @@index([openToJoin, status])
}

model TeamMember {
  id          Int      @id @default(autoincrement())
  teamId      Int
  mahasiswaId Int?
  role        String   @db.VarChar(20)
  
  // Unique constraint: one role per team
  @@unique([teamId, role])
  @@index([mahasiswaId])
}
```

### 4. Handle Soft Deletes dengan Status
```typescript
// Jangan hard delete jika ada relasi penting
async deleteTeam(id: number) {
  return this.prisma.team.update({
    where: { id },
    data: { 
      status: 'deleted',
      deletedAt: new Date(),
    },
  });
}

// Query harus exclude deleted
async findAll() {
  return this.prisma.team.findMany({
    where: { 
      status: { not: 'deleted' } // ✅ Always exclude deleted
    },
  });
}
```

### 5. Use Centralized Prisma Service
```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  
  // Helper untuk get setting values
  async getSettingValue(fieldName: string): Promise<string> {
    const setting = await this.systemSettings.findUnique({
      where: { fieldName },
    });
    return setting?.fieldValue || 'false';
  }
}
```

---

## DTOs & Validation

### 1. Use class-validator untuk Input Validation
```typescript
// dto/create-team.dto.ts
import { IsString, IsInt, IsBoolean, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'Team name', example: 'PKM Innovators' })
  @IsString()
  @MinLength(3, { message: 'Team name must be at least 3 characters' })
  @MaxLength(100, { message: 'Team name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ description: 'ID jenis PKM', example: 2 })
  @IsInt()
  jenisPkmId: number;

  @ApiProperty({ description: 'Open to join', default: false })
  @IsBoolean()
  @IsOptional()
  openToJoin?: boolean = false;
}
```

### 2. Separate DTOs untuk Request dan Response
```typescript
// Request DTO
export class CreateTeamDto {
  name: string;
  jenisPkmId: number;
}

// Response DTO
export class TeamResponseDto {
  id: number;
  name: string;
  jenisPkmId: number;
  jenisPkm: {
    id: number;
    nama: string;
  };
  memberCount: number;
  createdAt: Date;
}
```

### 3. Use Transform Decorators
```typescript
import { Transform } from 'class-transformer';

export class UpdateTeamDto {
  @IsString()
  @Transform(({ value }) => value?.trim()) // ✅ Auto trim whitespace
  name?: string;

  @IsInt()
  @Transform(({ value }) => parseInt(value)) // ✅ Auto convert to number
  jenisPkmId?: number;
}
```

### 4. Custom Validation Decorators
```typescript
// validators/is-nim.validator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsNIM(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNIM',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^\d{10}$/.test(value);
        },
        defaultMessage() {
          return 'NIM must be 10 digits';
        },
      },
    });
  };
}

// Usage
export class CreateMahasiswaDto {
  @IsNIM()
  nim: string;
}
```

---

## Error Handling

### 1. Use NestJS Built-in Exceptions
```typescript
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

async findTeam(id: number) {
  const team = await this.prisma.team.findUnique({ where: { id } });
  
  if (!team) {
    throw new NotFoundException(`Team with ID ${id} not found`);
  }
  
  return team;
}

async createTeam(dto: CreateTeamDto, mahasiswaId: number) {
  // Check one team per mahasiswa
  const existing = await this.prisma.teamMember.findFirst({
    where: { 
      mahasiswaId,
      team: { status: 'active' },
    },
  });
  
  if (existing) {
    throw new ConflictException('Mahasiswa sudah terdaftar di tim lain');
  }
  
  // Check toggle
  const uploadEnabled = await this.prisma.getSettingValue('uploadProposalEnabled');
  if (uploadEnabled !== 'true') {
    throw new ForbiddenException('Upload proposal sedang ditutup');
  }
  
  // Proceed...
}
```

### 2. Global Exception Filter
```typescript
// filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof exceptionResponse === 'object' 
        ? exceptionResponse 
        : { message: exceptionResponse }),
    });
  }
}

// main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

### 3. Custom Business Logic Exceptions
```typescript
// exceptions/business.exception.ts
export class BusinessRuleException extends BadRequestException {
  constructor(rule: string, details?: any) {
    super({
      message: 'Business rule violation',
      rule,
      details,
    });
  }
}

// Usage
async uploadProposal(teamId: number) {
  const team = await this.prisma.team.findUnique({
    where: { id: teamId },
    include: { teamMembers: true },
  });
  
  if (team.teamMembers.length < 3) {
    throw new BusinessRuleException('MIN_TEAM_MEMBERS', {
      current: team.teamMembers.length,
      required: 3,
    });
  }
}
```

### 4. Prisma Error Handling
```typescript
import { Prisma } from '@prisma/client';

async create(dto: CreateDto) {
  try {
    return await this.prisma.team.create({ data: dto });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Team with this ${error.meta.target} already exists`,
        );
      }
      // Foreign key constraint violation
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid reference ID');
      }
    }
    throw error;
  }
}
```

---

## Security Best Practices

### 1. JWT Authentication
```typescript
// auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        mahasiswa: true,
        reviewer: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

### 2. Role-Based Access Control (RBAC)
```typescript
// guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Post('reviewers')
  @Roles('admin')
  async createReviewer(@Body() dto: CreateReviewerDto) {
    return this.reviewersService.create(dto);
  }
}
```

### 3. Resource Ownership Validation
```typescript
// guards/team-ownership.guard.ts
@Injectable()
export class TeamOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const teamId = +request.params.teamId;

    // Check if user is member of the team
    const member = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        mahasiswaId: user.mahasiswaId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this team');
    }

    request.teamMember = member; // Attach to request for later use
    return true;
  }
}
```

### 4. Input Sanitization
```typescript
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateProposalDto {
  @Transform(({ value }) => sanitizeHtml(value, {
    allowedTags: [], // Strip all HTML
    allowedAttributes: {},
  }))
  judul: string;
}
```

### 5. Rate Limiting
```typescript
// main.ts
import { rateLimit } from 'express-rate-limit';

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
```

### 6. Environment Variables Security
```typescript
// .env (NEVER commit this file)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-strong-secret-key"
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."

// .env.example (commit this for reference)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
```

---

## Testing Strategies

### 1. Unit Tests - Service Layer
```typescript
// teams.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: {
            team: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            teamMember: {
              findFirst: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should throw ConflictException if mahasiswa already in a team', async () => {
      // Arrange
      jest.spyOn(prisma.teamMember, 'findFirst').mockResolvedValue({
        id: 1,
        teamId: 1,
        mahasiswaId: 1,
        role: 'ketua',
      } as any);

      const dto = { name: 'Test Team', jenisPkmId: 1 };

      // Act & Assert
      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
    });

    it('should create team with 2 proposals', async () => {
      // Arrange
      jest.spyOn(prisma.teamMember, 'findFirst').mockResolvedValue(null);
      
      const mockTeam = { id: 1, name: 'Test Team', jenisPkmId: 1 };
      jest.spyOn(prisma, '$transaction').mockResolvedValue(mockTeam as any);

      // Act
      const result = await service.create({ name: 'Test Team', jenisPkmId: 1 }, 1);

      // Assert
      expect(result).toEqual(mockTeam);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
```

### 2. Integration Tests - API Endpoints
```typescript
// teams.controller.spec.ts (Integration)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('TeamsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /teams', () => {
    it('should create a new team', () => {
      return request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'PKM Test Team',
          jenisPkmId: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe('PKM Test Team');
        });
    });

    it('should return 400 if name is too short', () => {
      return request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'AB',
          jenisPkmId: 1,
        })
        .expect(400);
    });
  });
});
```

### 3. Database Tests with Test Containers (Optional)
```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('TeamsService (Database)', () => {
  let container: StartedTestContainer;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new GenericContainer('postgres:15')
      .withExposedPorts(5432)
      .withEnv('POSTGRES_PASSWORD', 'test')
      .withEnv('POSTGRES_DB', 'testdb')
      .start();

    // Connect Prisma
    process.env.DATABASE_URL = `postgresql://postgres:test@localhost:${container.getMappedPort(5432)}/testdb`;
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  it('should actually create team in database', async () => {
    const team = await prisma.team.create({
      data: { name: 'Real Team', jenisPkmId: 1 },
    });

    expect(team.id).toBeDefined();
  });
});
```

### 4. Test Coverage Requirements
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

---

## Code Organization

### 1. Module Structure Template
```typescript
// teams/teams.module.ts
import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamMembersController } from './team-members.controller';
import { TeamMembersService } from './team-members.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [
    PrismaModule,
    ProposalsModule, // If dependent on ProposalsService
  ],
  controllers: [TeamsController, TeamMembersController],
  providers: [TeamsService, TeamMembersService],
  exports: [TeamsService], // Export if used by other modules
})
export class TeamsModule {}
```

### 2. Controller Best Practices
```typescript
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiTags('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles('mahasiswa')
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created', type: TeamResponseDto })
  @ApiResponse({ status: 409, description: 'Already in a team' })
  async create(
    @Req() req,
    @Body() createTeamDto: CreateTeamDto,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsService.create(createTeamDto, req.user.mahasiswaId);
    return this.mapToResponse(team);
  }

  @Get()
  @Roles('mahasiswa', 'admin')
  @ApiOperation({ summary: 'Get all teams' })
  async findAll(
    @Query() query: FilterTeamsDto,
  ): Promise<PaginatedResponse<TeamResponseDto>> {
    return this.teamsService.findAll(query);
  }

  private mapToResponse(team: any): TeamResponseDto {
    return {
      id: team.id,
      name: team.name,
      jenisPkmId: team.jenisPkmId,
      memberCount: team.teamMembers?.length || 0,
      createdAt: team.createdAt,
    };
  }
}
```

### 3. Service Best Practices
```typescript
@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger = new Logger(TeamsService.name),
  ) {}

  async create(dto: CreateTeamDto, mahasiswaId: number) {
    this.logger.log(`Creating team: ${dto.name} by mahasiswa: ${mahasiswaId}`);

    // 1. Validation
    await this.validateOneTeamPerMahasiswa(mahasiswaId);

    // 2. Business logic
    const team = await this.createTeamWithProposals(dto, mahasiswaId);

    this.logger.log(`Team created successfully: ${team.id}`);
    return team;
  }

  private async validateOneTeamPerMahasiswa(mahasiswaId: number) {
    const existing = await this.prisma.teamMember.findFirst({
      where: { mahasiswaId, team: { status: 'active' } },
    });

    if (existing) {
      throw new ConflictException('Mahasiswa sudah terdaftar di tim lain');
    }
  }

  private async createTeamWithProposals(dto: CreateTeamDto, mahasiswaId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Transaction logic here
    });
  }
}
```

### 4. Shared Utilities and Helpers
```typescript
// shared/utils/pagination.util.ts
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
```

---

## Performance Optimization

### 1. Database Query Optimization
```typescript
// ❌ Bad: N+1 Query Problem
async getTeamsWithMembers() {
  const teams = await this.prisma.team.findMany();
  
  for (const team of teams) {
    team.members = await this.prisma.teamMember.findMany({
      where: { teamId: team.id },
    });
  }
  
  return teams;
}

// ✅ Good: Use include to fetch in one query
async getTeamsWithMembers() {
  return this.prisma.team.findMany({
    include: {
      teamMembers: {
        include: {
          mahasiswa: {
            select: { nama: true, nim: true },
          },
        },
      },
    },
  });
}
```

### 2. Caching dengan NestJS Cache Manager
```typescript
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class JenisPkmService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  async findAll() {
    const cacheKey = 'jenis-pkm-all';
    
    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const data = await this.prisma.jenisPkm.findMany();

    // Store in cache for 1 hour
    await this.cacheManager.set(cacheKey, data, 3600);

    return data;
  }

  async update(id: number, dto: UpdateJenisPkmDto) {
    const updated = await this.prisma.jenisPkm.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache
    await this.cacheManager.del('jenis-pkm-all');

    return updated;
  }
}
```

### 3. Lazy Loading untuk File Besar
```typescript
@Get(':id/download')
async downloadProposal(@Param('id') id: string, @Res() res: Response) {
  const proposal = await this.prisma.proposal.findUnique({
    where: { id: +id },
    select: { fileUrl: true, fileName: true },
  });

  if (!proposal?.fileUrl) {
    throw new NotFoundException('File not found');
  }

  // Stream file instead of loading into memory
  const stream = createReadStream(proposal.fileUrl);
  
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${proposal.fileName}"`,
  });

  stream.pipe(res);
}
```

### 4. Bulk Operations
```typescript
// ❌ Bad: Multiple individual queries
async assignReviewers(assignments: Assignment[]) {
  for (const assignment of assignments) {
    await this.prisma.reviewerAssignment.create({ data: assignment });
  }
}

// ✅ Good: Single bulk query
async assignReviewers(assignments: Assignment[]) {
  return this.prisma.reviewerAssignment.createMany({
    data: assignments,
  });
}
```

---

## Documentation Standards

### 1. Swagger/OpenAPI Documentation
```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('PKM Review API')
  .setDescription('API for PKM Review Application')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('teams', 'Team management endpoints')
  .addTag('proposals', 'Proposal management endpoints')
  .addTag('reviews', 'Review process endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### 2. Code Comments
```typescript
/**
 * Creates a new team with automatic proposal generation
 * 
 * Business Rules:
 * - One mahasiswa can only be in one active team
 * - Auto-creates 2 proposals (original & revised)
 * - Creator becomes 'ketua' by default
 * 
 * @param dto - Team creation data
 * @param mahasiswaId - ID of the creating mahasiswa
 * @returns Created team with proposals
 * @throws ConflictException if mahasiswa already in a team
 */
async create(dto: CreateTeamDto, mahasiswaId: number): Promise<Team> {
  // Implementation
}
```

### 3. README per Module
```markdown
# Teams Module

## Overview
Manages team creation, membership, and join requests for PKM proposals.

## Features
- Create/update/delete teams
- Manage team members (add/remove/change roles)
- Browse open teams
- Handle join requests

## Business Rules
1. One mahasiswa can only be in one active team
2. Teams must have 3-5 members
3. Each team gets 2 proposals (original & revised)
4. Teams with <3 members auto-delete

## API Endpoints
See Swagger docs at `/api/docs#/teams`

## Dependencies
- `ProposalsModule` - for auto-creating proposals
- `PrismaModule` - for database access
```

### 4. Changelog
```markdown
# Changelog

## [1.0.0] - 2026-02-09

### Added
- Initial team creation functionality
- Join request system
- Browse open teams feature

### Changed
- Updated team validation to enforce 3-5 members

### Fixed
- Fixed duplicate team member issue

### Security
- Added ownership validation for team updates
```

---

## Quick Reference Checklist

### Before Writing Code
- [ ] Review PRD and business rules
- [ ] Define DTOs with validation
- [ ] Plan database transactions
- [ ] Consider authorization requirements

### While Writing Code
- [ ] Use dependency injection
- [ ] Add proper error handling
- [ ] Implement logging
- [ ] Use transactions for multi-step ops
- [ ] Add Swagger documentation
- [ ] Validate business rules

### After Writing Code
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update Swagger docs
- [ ] Add code comments for complex logic
- [ ] Run linter and formatter
- [ ] Test with Postman/Thunder Client
- [ ] Update module README if needed

### Before Commit
- [ ] All tests passing
- [ ] Code coverage >= 70%
- [ ] No console.log statements
- [ ] Proper error messages
- [ ] Environment variables documented

---

## Additional Resources

### Recommended VS Code Extensions
- Prisma
- ESLint
- Prettier
- Thunder Client (API testing)
- GitLens

### Useful Commands
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Run tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

### Documentation Links
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [class-validator](https://github.com/typestack/class-validator)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)

---

**Remember**: Consistency is key! Follow these patterns throughout the entire codebase.
