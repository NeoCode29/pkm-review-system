# Testing Guide
## PKM Review Application

> **Purpose**: Comprehensive guide to testing backend and frontend code. Follow these patterns to maintain high code quality.

---

## 🎯 Testing Philosophy

**Goals**:
- Catch bugs before production
- Enable confident refactoring
- Document expected behavior
- Maintain code quality

**Target Coverage**: 70%+ overall, 90%+ for critical paths

---

## 📊 Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /    \     - Happy paths
     /      \    - Critical user flows
    /--------\
   /          \  Integration Tests (30%)
  /            \ - API endpoints
 /              \- Database operations
/________________\
                  Unit Tests (60%)
                  - Services, utilities
                  - Business logic
```

---

## 🔧 Backend Testing (NestJS)

### Setup

**Install Dependencies**:
```bash
cd backend
npm install --save-dev @nestjs/testing jest ts-jest @types/jest supertest
```

**Jest Configuration** (`backend/jest.config.js`):
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

---

### Unit Tests

**Service Testing Pattern**:
```typescript
// teams/teams.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

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
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            teamMember: {
              create: jest.fn(),
              count: jest.fn(),
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
    it('should create a team successfully', async () => {
      const mockTeam = {
        id: BigInt(1),
        namaTeam: 'Test Team',
        judulProposal: 'Test Proposal',
        jenisPkmId: BigInt(1),
        createdAt: new Date(),
      };

      const createDto = {
        namaTeam: 'Test Team',
        judulProposal: 'Test Proposal',
        jenisPkmId: '1',
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return callback(prisma);
      });

      jest.spyOn(prisma.team, 'create').mockResolvedValue(mockTeam as any);
      jest.spyOn(prisma.teamMember, 'create').mockResolvedValue({} as any);

      const result = await service.create('user123', createDto);

      expect(result).toEqual(mockTeam);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should enforce team membership limit', async () => {
      jest.spyOn(prisma.teamMember, 'count').mockResolvedValue(2);

      await expect(
        service.create('user123', {} as any)
      ).rejects.toThrow('Cannot join more than 2 teams');
    });
  });
});
```

**Testing Business Rules**:
```typescript
describe('Business Rules', () => {
  describe('Team Size Validation', () => {
    it('should reject team with less than 3 members', async () => {
      const team = { teamMembers: [1, 2] }; // Only 2 members
      
      await expect(
        service.validateTeamSize(team)
      ).rejects.toThrow('Team must have 3-5 members');
    });

    it('should accept team with 3-5 members', async () => {
      const team = { teamMembers: [1, 2, 3] }; // 3 members
      
      await expect(
        service.validateTeamSize(team)
      ).resolves.not.toThrow();
    });
  });
});
```

---

### Integration Tests (E2E)

**Controller/API Testing**:
```typescript
// test/teams.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Teams (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
    
    // Get auth token for tests
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
  });

  describe('/teams (POST)', () => {
    it('should create a team', () => {
      return request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          namaTeam: 'Test Team',
          judulProposal: 'Test Proposal Title',
          jenisPkmId: '1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.namaTeam).toBe('Test Team');
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .post('/teams')
        .send({
          namaTeam: 'Test Team',
          judulProposal: 'Test Proposal',
          jenisPkmId: '1',
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          namaTeam: 'AB', // Too short
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('namaTeam');
        });
    });
  });
});
```

---

## 🎨 Frontend Testing (Next.js)

### Setup

**Install Dependencies**:
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

**Jest Configuration** (`frontend/jest.config.js`):
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

**Setup File** (`frontend/jest.setup.js`):
```javascript
import '@testing-library/jest-dom';
```

---

### Component Testing

**Basic Component Test**:
```typescript
// components/features/teams/TeamCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamCard } from './TeamCard';

describe('TeamCard', () => {
  const mockTeam = {
    id: '1',
    namaTeam: 'Test Team',
    judulProposal: 'Test Proposal',
    memberCount: 5,
  };

  it('renders team information', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('Test Proposal')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();
    
    render(<TeamCard team={mockTeam} onEdit={handleEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(handleEdit).toHaveBeenCalledWith(mockTeam);
  });
});
```

**Testing Hooks**:
```typescript
// hooks/useTeams.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeams } from './useTeams';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTeams', () => {
  it('fetches teams successfully', async () => {
    const { result } = renderHook(() => useTeams(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toBeDefined();
  });
});
```

---

## 📋 Testing Checklist

### Before Writing Code
- [ ] Understand requirements
- [ ] Identify edge cases
- [ ] Plan test cases

### While Writing Tests
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Test validation
- [ ] Mock external dependencies
- [ ] Use descriptive test names

### After Writing Tests
- [ ] All tests pass
- [ ] Coverage meets target
- [ ] Tests are readable
- [ ] No flaky tests

---

## 💡 Best Practices

### ✅ DO

**Write Descriptive Test Names**:
```typescript
// ✅ Good
it('should reject team creation when user already has 2 teams', () => {})

// ❌ Bad
it('test team creation', () => {})
```

**Test One Thing Per Test**:
```typescript
// ✅ Good
it('should validate team name length', () => {})
it('should validate team name uniqueness', () => {})

// ❌ Bad
it('should validate team name', () => {
  // Tests both length AND uniqueness
})
```

**Use Arrange-Act-Assert Pattern**:
```typescript
it('should create team', async () => {
  // Arrange
  const dto = { namaTeam: 'Test' };
  
  // Act
  const result = await service.create(dto);
  
  // Assert
  expect(result).toBeDefined();
});
```

### ❌ DON'T

- Don't test implementation details
- Don't write tests that depend on other tests
- Don't mock everything (test real behavior)
- Don't ignore failing tests
- Don't skip edge cases

---

## 🚀 Running Tests

### Backend
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

### Frontend
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 📈 Coverage Reports

**View Coverage**:
```bash
# Backend
cd backend && npm run test:cov
# Open coverage/lcov-report/index.html

# Frontend
cd frontend && npm run test:coverage
# Open coverage/lcov-report/index.html
```

**Coverage Goals by File Type**:
- Critical business logic: 90%+
- Services: 80%+
- Controllers: 70%+
- Utilities: 80%+
- Components: 70%+

---

## 🐛 Debugging Tests

### Failed Test Debugging
```typescript
it('should create team', async () => {
  // Add console.log to debug
  console.log('Input:', dto);
  
  const result = await service.create(dto);
  
  console.log('Result:', result);
  expect(result).toBeDefined();
});
```

### Run Single Test
```bash
# Backend
npm test -- teams.service.spec.ts

# Frontend
npm test -- TeamCard.test.tsx
```

---

**Remember: Good tests are an investment, not a cost!** 🎯
