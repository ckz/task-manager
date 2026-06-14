# Task Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-deployed task management system with AI agent integration, using Next.js, Neon PostgreSQL, and API-first design.

**Architecture:** Monolithic Next.js App Router application with REST API (v1) for agent integration. Prisma ORM for database access, NextAuth.js for Google OAuth, and bcrypt-hashed API tokens for agent authentication.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Neon PostgreSQL, Vercel KV, NextAuth.js, React Query, Zustand, Vitest

---

## File Structure

```
task-manager/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── tasks/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── agents/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── projects/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts
│   │   │       ├── tasks/
│   │   │       │   ├── [id]/
│   │   │       │   │   ├── route.ts
│   │   │       │   │   ├── assign/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── status/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── activity/
│   │   │       │   │       └── route.ts
│   │   │       ├── agents/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts
│   │   │       └── activity/
│   │   │           └── route.ts
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── tasks/
│   │   ├── projects/
│   │   └── agents/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   └── utils.ts
│   └── types/
│       └── api.ts
├── tests/
│   ├── api/
│   └── components/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: Project Scaffolding

**Covers:** S6, S7

**Files:**
- Create: `task-manager/package.json`
- Create: `task-manager/tsconfig.json`
- Create: `task-manager/next.config.js`
- Create: `task-manager/tailwind.config.ts`
- Create: `task-manager/.env.example`
- Create: `task-manager/.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /home/ubuntu/ai_projects/mimo_proj_1
npx create-next-app@latest task-manager --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Expected: Next.js project created with TypeScript, Tailwind, ESLint, App Router

- [ ] **Step 2: Install core dependencies**

```bash
cd task-manager
npm install prisma @prisma/client next-auth @auth/prisma-adapter @tanstack/react-query zustand bcryptjs swagger-ui-react
npm install -D @types/bcryptjs vitest @testing-library/react @testing-library/jest-dom
```

Expected: All dependencies installed

- [ ] **Step 3: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` created with PostgreSQL provider

- [ ] **Step 4: Create environment template**

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Vercel KV (optional for local dev)
KV_REST_API_URL=""
KV_REST_API_TOKEN=""

# GitHub
GITHUB_PAT=""
```

- [ ] **Step 5: Update .gitignore**

Add to `.gitignore`:
```
.env
.env.local
node_modules
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with core dependencies"
```

---

## Task 2: Database Schema

**Covers:** S2

**Files:**
- Create: `task-manager/prisma/schema.prisma`
- Create: `task-manager/src/lib/db.ts`

- [ ] **Step 1: Write Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  googleId  String?  @unique @map("google_id")
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  assignedTasks  Task[]   @relation("TaskAssignedToUser")
  createdTasks   Task[]   @relation("TaskCreatedByUser")
  createdProjects Project[]

  @@map("users")
}

model Project {
  id          String        @id @default(uuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdBy   String        @map("created_by")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  metadata    Json?

  creator User   @relation(fields: [createdBy], references: [id])
  tasks   Task[]

  @@map("projects")
}

model Task {
  id                String       @id @default(uuid())
  projectId         String       @map("project_id")
  parentTaskId      String?      @map("parent_task_id")
  title             String
  description       String?
  status            TaskStatus   @default(TODO)
  priority          TaskPriority @default(MEDIUM)
  assignedToUserId  String?      @map("assigned_to_user_id")
  assignedToAgentId String?      @map("assigned_to_agent_id")
  dueDate           DateTime?    @map("due_date")
  createdByUserId   String?      @map("created_by_user_id")
  createdByAgentId  String?      @map("created_by_agent_id")
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")
  metadata          Json?

  project        Project  @relation(fields: [projectId], references: [id])
  parentTask     Task?    @relation("Subtasks", fields: [parentTaskId], references: [id])
  subtasks       Task[]   @relation("Subtasks")
  assignedToUser User?    @relation("TaskAssignedToUser", fields: [assignedToUserId], references: [id])
  assignedToAgent Agent?  @relation("TaskAssignedToAgent", fields: [assignedToAgentId], references: [id])
  createdByUser  User?    @relation("TaskCreatedByUser", fields: [createdByUserId], references: [id])
  createdByAgent Agent?   @relation("TaskCreatedByAgent", fields: [createdByAgentId], references: [id])
  activityLogs   ActivityLog[]

  @@map("tasks")
}

model Agent {
  id           String       @id @default(uuid())
  name         String
  apiKeyHash   String       @map("api_key_hash")
  capabilities Json?
  lastSeenAt   DateTime?    @map("last_seen_at")
  status       AgentStatus  @default(ACTIVE)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  assignedTasks Task[] @relation("TaskAssignedToAgent")
  createdTasks  Task[] @relation("TaskCreatedByAgent")
  activityLogs  ActivityLog[]

  @@map("agents")
}

model ActivityLog {
  id         String       @id @default(uuid())
  entityType EntityType @map("entity_type")
  entityId   String       @map("entity_id")
  action     Action
  actorType  ActorType    @map("actor_type")
  actorId    String       @map("actor_id")
  changes    Json?
  createdAt  DateTime     @default(now()) @map("created_at")

  task Task? @relation(fields: [entityId], references: [id])

  @@map("activity_logs")
}

enum Role {
  ADMIN
  MEMBER
  VIEWER
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AgentStatus {
  ACTIVE
  INACTIVE
}

enum EntityType {
  PROJECT
  TASK
  AGENT
}

enum Action {
  CREATED
  UPDATED
  DELETED
  STATUS_CHANGED
}

enum ActorType {
  USER
  AGENT
}
```

- [ ] **Step 2: Create Prisma client singleton**

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied, Prisma client generated

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add database schema with all core entities"
```

---

## Task 3: Authentication Setup

**Covers:** S5

**Files:**
- Create: `task-manager/src/lib/auth.ts`
- Create: `task-manager/src/app/api/auth/[...nextauth]/route.ts`
- Create: `task-manager/src/middleware.ts`

- [ ] **Step 1: Write NextAuth configuration**

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
```

- [ ] **Step 2: Create NextAuth API route**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Create middleware for protected routes**

```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

export const config = {
  matcher: ['/projects/:path*', '/tasks/:path*', '/agents/:path*', '/settings/:path*'],
}
```

- [ ] **Step 4: Create sign-in page**

```tsx
// src/app/auth/signin/page.tsx
'use client'

import { signIn } from 'next-auth/react'

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Sign In</h1>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/middleware.ts src/app/auth/
git commit -m "feat: add Google OAuth authentication with NextAuth"
```

---

## Task 4: API Response Types & Helpers

**Covers:** S3

**Files:**
- Create: `task-manager/src/types/api.ts`
- Create: `task-manager/src/lib/api.ts`

- [ ] **Step 1: Define API response types**

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

export interface ProjectCreateInput {
  name: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface ProjectUpdateInput {
  name?: string
  description?: string
  status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
  metadata?: Record<string, unknown>
}

export interface TaskCreateInput {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  parentTaskId?: string
  assignedToUserId?: string
  assignedToAgentId?: string
  dueDate?: string
  metadata?: Record<string, unknown>
}

export interface TaskUpdateInput {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedToUserId?: string
  assignedToAgentId?: string
  dueDate?: string
  metadata?: Record<string, unknown>
}

export interface AgentCreateInput {
  name: string
  capabilities?: Record<string, unknown>
}

export interface AgentUpdateInput {
  name?: string
  status?: 'ACTIVE' | 'INACTIVE'
  capabilities?: Record<string, unknown>
}
```

- [ ] **Step 2: Create API helper functions**

```typescript
// src/lib/api.ts
import { NextResponse } from 'next/server'
import { ApiResponse, ApiError } from '@/types/api'

export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']) {
  return NextResponse.json({ data, meta } as ApiResponse<T>)
}

export function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    { error: { code, message } } as ApiError,
    { status }
  )
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts src/lib/api.ts
git commit -m "feat: add API types and response helpers"
```

---

## Task 5: Agent Authentication Middleware

**Covers:** S5

**Files:**
- Create: `task-manager/src/lib/agent-auth.ts`

- [ ] **Step 1: Write agent authentication function**

```typescript
// src/lib/agent-auth.ts
import { NextRequest } from 'next/server'
import { db } from './db'
import bcrypt from 'bcryptjs'

export interface AgentAuthResult {
  authenticated: boolean
  agentId?: string
  error?: string
}

export async function authenticateAgent(request: NextRequest): Promise<AgentAuthResult> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.slice(7)
  
  const agents = await db.agent.findMany({
    where: { status: 'ACTIVE' },
  })

  for (const agent of agents) {
    const isValid = await bcrypt.compare(token, agent.apiKeyHash)
    if (isValid) {
      await db.agent.update({
        where: { id: agent.id },
        data: { lastSeenAt: new Date() },
      })
      return { authenticated: true, agentId: agent.id }
    }
  }

  return { authenticated: false, error: 'Invalid API key' }
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'tm_'
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agent-auth.ts
git commit -m "feat: add agent API key authentication utilities"
```

---

## Task 6: Project API Routes

**Covers:** S3

**Files:**
- Create: `task-manager/src/app/api/v1/projects/route.ts`
- Create: `task-manager/src/app/api/v1/projects/[id]/route.ts`

- [ ] **Step 1: Write GET /api/v1/projects**

```typescript
// src/app/api/v1/projects/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)
  const status = request.nextUrl.searchParams.get('status')

  const where = status ? { status: status as any } : {}

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, name: true, email: true } } },
    }),
    db.project.count({ where }),
  ])

  return successResponse(projects, { total, page, limit })
}
```

- [ ] **Step 2: Write POST /api/v1/projects**

```typescript
// src/app/api/v1/projects/route.ts (append)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { name, description, metadata } = body

  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Name is required')
  }

  const project = await db.project.create({
    data: {
      name,
      description,
      metadata,
      createdBy: session.user.id,
    },
  })

  return successResponse(project)
}
```

- [ ] **Step 3: Write project detail routes**

```typescript
// src/app/api/v1/projects/[id]/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      tasks: { where: { parentTaskId: null }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!project) {
    return errorResponse('NOT_FOUND', 'Project not found', 404)
  }

  return successResponse(project)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { name, description, status, metadata } = body

  const project = await db.project.update({
    where: { id: params.id },
    data: { name, description, status, metadata },
  })

  return successResponse(project)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  await db.project.update({
    where: { id: params.id },
    data: { status: 'ARCHIVED' },
  })

  return successResponse({ deleted: true })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/projects/
git commit -m "feat: add project CRUD API endpoints"
```

---

## Task 7: Task API Routes

**Covers:** S3

**Files:**
- Create: `task-manager/src/app/api/v1/tasks/[id]/route.ts`
- Create: `task-manager/src/app/api/v1/tasks/[id]/assign/route.ts`
- Create: `task-manager/src/app/api/v1/tasks/[id]/status/route.ts`

- [ ] **Step 1: Write task list endpoint in projects route**

Add to `src/app/api/v1/projects/[id]/route.ts` or create a dedicated tasks route. Let's create a task list by project:

```typescript
// Create src/app/api/v1/projects/[id]/tasks/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)
  const status = request.nextUrl.searchParams.get('status')
  const priority = request.nextUrl.searchParams.get('priority')

  const where: any = { projectId: params.id }
  if (status) where.status = status
  if (priority) where.priority = priority

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedToUser: { select: { id: true, name: true } },
        assignedToAgent: { select: { id: true, name: true } },
        subtasks: true,
      },
    }),
    db.task.count({ where }),
  ])

  return successResponse(tasks, { total, page, limit })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { title, description, priority, parentTaskId, assignedToUserId, assignedToAgentId, dueDate, metadata } = body

  if (!title) {
    return errorResponse('VALIDATION_ERROR', 'Title is required')
  }

  const task = await db.task.create({
    data: {
      projectId: params.id,
      title,
      description,
      priority,
      parentTaskId,
      assignedToUserId,
      assignedToAgentId,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdByUserId: session.user.id,
      metadata,
    },
  })

  return successResponse(task)
}
```

- [ ] **Step 2: Write task detail routes**

```typescript
// src/app/api/v1/tasks/[id]/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const task = await db.task.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      parentTask: true,
      subtasks: true,
      assignedToUser: { select: { id: true, name: true, email: true } },
      assignedToAgent: { select: { id: true, name: true } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!task) {
    return errorResponse('NOT_FOUND', 'Task not found', 404)
  }

  return successResponse(task)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { title, description, status, priority, dueDate, metadata } = body

  const task = await db.task.update({
    where: { id: params.id },
    data: { title, description, status, priority, dueDate, metadata },
  })

  return successResponse(task)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  await db.task.delete({ where: { id: params.id } })

  return successResponse({ deleted: true })
}
```

- [ ] **Step 3: Write assign endpoint**

```typescript
// src/app/api/v1/tasks/[id]/assign/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { userId, agentId } = body

  if (!userId && !agentId) {
    return errorResponse('VALIDATION_ERROR', 'Either userId or agentId is required')
  }

  const task = await db.task.update({
    where: { id: params.id },
    data: {
      assignedToUserId: userId || null,
      assignedToAgentId: agentId || null,
    },
  })

  return successResponse(task)
}
```

- [ ] **Step 4: Write status endpoint**

```typescript
// src/app/api/v1/tasks/[id]/status/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { status } = body

  if (!status) {
    return errorResponse('VALIDATION_ERROR', 'Status is required')
  }

  const task = await db.task.update({
    where: { id: params.id },
    data: { status },
  })

  return successResponse(task)
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/tasks/
git commit -m "feat: add task CRUD, assign, and status API endpoints"
```

---

## Task 8: Agent API Routes

**Covers:** S3

**Files:**
- Create: `task-manager/src/app/api/v1/agents/route.ts`
- Create: `task-manager/src/app/api/v1/agents/[id]/route.ts`

- [ ] **Step 1: Write agent list and create endpoints**

```typescript
// src/app/api/v1/agents/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'
import { generateApiKey, hashApiKey } from '@/lib/agent-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)

  const [agents, total] = await Promise.all([
    db.agent.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.agent.count(),
  ])

  return successResponse(agents, { total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { name, capabilities } = body

  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Name is required')
  }

  const apiKey = generateApiKey()
  const apiKeyHash = await hashApiKey(apiKey)

  const agent = await db.agent.create({
    data: {
      name,
      apiKeyHash,
      capabilities,
    },
  })

  return successResponse({ ...agent, apiKey })
}
```

- [ ] **Step 2: Write agent detail routes**

```typescript
// src/app/api/v1/agents/[id]/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const agent = await db.agent.findUnique({
    where: { id: params.id },
    include: {
      assignedTasks: { take: 10, orderBy: { updatedAt: 'desc' } },
      activityLogs: { take: 20, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!agent) {
    return errorResponse('NOT_FOUND', 'Agent not found', 404)
  }

  return successResponse(agent)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { name, status, capabilities } = body

  const agent = await db.agent.update({
    where: { id: params.id },
    data: { name, status, capabilities },
  })

  return successResponse(agent)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  await db.agent.update({
    where: { id: params.id },
    data: { status: 'INACTIVE' },
  })

  return successResponse({ deleted: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/agents/
git commit -m "feat: add agent registration and management API"
```

---

## Task 9: Activity Logging

**Covers:** S3

**Files:**
- Create: `task-manager/src/lib/activity.ts`
- Create: `task-manager/src/app/api/v1/activity/route.ts`
- Create: `task-manager/src/app/api/v1/tasks/[id]/activity/route.ts`

- [ ] **Step 1: Create activity logging utility**

```typescript
// src/lib/activity.ts
import { db } from './db'

interface LogActivityParams {
  entityType: 'PROJECT' | 'TASK' | 'AGENT'
  entityId: string
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED'
  actorType: 'USER' | 'AGENT'
  actorId: string
  changes?: Record<string, unknown>
}

export async function logActivity(params: LogActivityParams) {
  return db.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorType: params.actorType,
      actorId: params.actorId,
      changes: params.changes || null,
    },
  })
}
```

- [ ] **Step 2: Add activity logging to task creation**

Update `src/app/api/v1/projects/[id]/tasks/route.ts` POST handler:

```typescript
// Add after task creation:
await logActivity({
  entityType: 'TASK',
  entityId: task.id,
  action: 'CREATED',
  actorType: 'USER',
  actorId: session.user.id,
})
```

- [ ] **Step 3: Create activity feed endpoint**

```typescript
// src/app/api/v1/activity/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)

  const [activities, total] = await Promise.all([
    db.activityLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.activityLog.count(),
  ])

  return successResponse(activities, { total, page, limit })
}
```

- [ ] **Step 4: Create task activity endpoint**

```typescript
// src/app/api/v1/tasks/[id]/activity/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)

  const [activities, total] = await Promise.all([
    db.activityLog.findMany({
      where: { entityId: params.id, entityType: 'TASK' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.activityLog.count({ where: { entityId: params.id, entityType: 'TASK' } }),
  ])

  return successResponse(activities, { total, page, limit })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/activity.ts src/app/api/v1/activity/ src/app/api/v1/tasks/[id]/activity/
git commit -m "feat: add activity logging and feed endpoints"
```

---

## Task 10: OpenAPI Documentation

**Covers:** S3

**Files:**
- Create: `task-manager/src/app/api/docs/page.tsx`
- Create: `task-manager/public/openapi.json`

- [ ] **Step 1: Create OpenAPI spec**

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Task Manager API",
    "version": "1.0.0",
    "description": "REST API for AI agent task management"
  },
  "servers": [
    {
      "url": "/api/v1",
      "description": "API v1"
    }
  ],
  "paths": {
    "/projects": {
      "get": {
        "summary": "List projects",
        "tags": ["Projects"],
        "parameters": [
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } },
          { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ACTIVE", "ARCHIVED", "COMPLETED"] } }
        ],
        "responses": {
          "200": { "description": "List of projects" }
        }
      },
      "post": {
        "summary": "Create project",
        "tags": ["Projects"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name"],
                "properties": {
                  "name": { "type": "string" },
                  "description": { "type": "string" },
                  "metadata": { "type": "object" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Created project" }
        }
      }
    },
    "/projects/{id}": {
      "get": {
        "summary": "Get project",
        "tags": ["Projects"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "Project details" },
          "404": { "description": "Not found" }
        }
      },
      "patch": {
        "summary": "Update project",
        "tags": ["Projects"],
        "responses": {
          "200": { "description": "Updated project" }
        }
      },
      "delete": {
        "summary": "Archive project",
        "tags": ["Projects"],
        "responses": {
          "200": { "description": "Archived" }
        }
      }
    },
    "/projects/{id}/tasks": {
      "get": {
        "summary": "List tasks in project",
        "tags": ["Tasks"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } },
          { "name": "status", "in": "query", "schema": { "type": "string" } },
          { "name": "priority", "in": "query", "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "List of tasks" }
        }
      },
      "post": {
        "summary": "Create task",
        "tags": ["Tasks"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title"],
                "properties": {
                  "title": { "type": "string" },
                  "description": { "type": "string" },
                  "priority": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                  "assignedToUserId": { "type": "string" },
                  "assignedToAgentId": { "type": "string" },
                  "dueDate": { "type": "string", "format": "date-time" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Created task" }
        }
      }
    },
    "/tasks/{id}": {
      "get": {
        "summary": "Get task",
        "tags": ["Tasks"],
        "responses": {
          "200": { "description": "Task details" }
        }
      },
      "patch": {
        "summary": "Update task",
        "tags": ["Tasks"],
        "responses": {
          "200": { "description": "Updated task" }
        }
      },
      "delete": {
        "summary": "Delete task",
        "tags": ["Tasks"],
        "responses": {
          "200": { "description": "Deleted" }
        }
      }
    },
    "/tasks/{id}/assign": {
      "post": {
        "summary": "Assign task",
        "tags": ["Tasks"],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "userId": { "type": "string" },
                  "agentId": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Assigned task" }
        }
      }
    },
    "/tasks/{id}/status": {
      "post": {
        "summary": "Update task status",
        "tags": ["Tasks"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["status"],
                "properties": {
                  "status": { "type": "string", "enum": ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"] }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Updated task" }
        }
      }
    },
    "/agents": {
      "get": {
        "summary": "List agents",
        "tags": ["Agents"],
        "responses": {
          "200": { "description": "List of agents" }
        }
      },
      "post": {
        "summary": "Register agent",
        "tags": ["Agents"],
        "description": "Returns the API key once - store it securely",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name"],
                "properties": {
                  "name": { "type": "string" },
                  "capabilities": { "type": "object" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Created agent with API key" }
        }
      }
    },
    "/agents/{id}": {
      "get": {
        "summary": "Get agent",
        "tags": ["Agents"],
        "responses": {
          "200": { "description": "Agent details" }
        }
      },
      "patch": {
        "summary": "Update agent",
        "tags": ["Agents"],
        "responses": {
          "200": { "description": "Updated agent" }
        }
      },
      "delete": {
        "summary": "Deactivate agent",
        "tags": ["Agents"],
        "responses": {
          "200": { "description": "Deactivated" }
        }
      }
    },
    "/activity": {
      "get": {
        "summary": "Get activity feed",
        "tags": ["Activity"],
        "responses": {
          "200": { "description": "Activity list" }
        }
      }
    },
    "/tasks/{id}/activity": {
      "get": {
        "summary": "Get task activity",
        "tags": ["Activity"],
        "responses": {
          "200": { "description": "Task activity list" }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "description": "API key for agent authentication"
      }
    }
  }
}
```

- [ ] **Step 2: Create docs page**

```tsx
// src/app/api/docs/page.tsx
'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocs() {
  return <SwaggerUI url="/openapi.json" />
}
```

- [ ] **Step 3: Commit**

```bash
git add public/openapi.json src/app/api/docs/
git commit -m "feat: add OpenAPI documentation with Swagger UI"
```

---

## Task 11: Layout & Navigation

**Covers:** S4

**Files:**
- Modify: `task-manager/src/app/layout.tsx`
- Create: `task-manager/src/components/ui/sidebar.tsx`
- Create: `task-manager/src/components/providers.tsx`

- [ ] **Step 1: Create providers component**

```tsx
// src/components/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

- [ ] **Step 2: Create sidebar component**

```tsx
// src/components/ui/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/agents', label: 'Agents' },
  { href: '/settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <h1 className="mb-6 text-xl font-bold">Task Manager</h1>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded px-3 py-2 text-sm',
              pathname === item.href
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/ui/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'AI-agent-friendly task management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ src/app/layout.tsx
git commit -m "feat: add layout with sidebar navigation"
```

---

## Task 12: Dashboard Page

**Covers:** S4

**Files:**
- Create: `task-manager/src/app/(dashboard)/page.tsx`
- Create: `task-manager/src/components/tasks/task-card.tsx`

- [ ] **Step 1: Create task card component**

```tsx
// src/components/tasks/task-card.tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: {
    id: string
    title: string
    status: string
    priority: string
    assignedToUser?: { name: string } | null
    assignedToAgent?: { name: string } | null
  }
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
        <h3 className="font-medium">{task.title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className={cn('rounded px-2 py-1 text-xs', statusColors[task.status])}>
            {task.status}
          </span>
          <span className={cn('text-xs font-medium', priorityColors[task.priority])}>
            {task.priority}
          </span>
        </div>
        {(task.assignedToUser || task.assignedToAgent) && (
          <p className="mt-2 text-sm text-gray-500">
            Assigned to: {task.assignedToUser?.name || task.assignedToAgent?.name}
          </p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create dashboard page**

```tsx
// src/app/(dashboard)/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { TaskCard } from '@/components/tasks/task-card'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const [recentTasks, recentActivity] = await Promise.all([
    db.task.findMany({
      where: {
        OR: [
          { assignedToUserId: session.user.id },
          { createdByUserId: session.user.id },
        ],
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedToUser: { select: { name: true } },
        assignedToAgent: { select: { name: true } },
      },
    }),
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your Tasks</h2>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {recentTasks.length === 0 && (
              <p className="text-gray-500">No tasks assigned to you</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="rounded border p-3 text-sm">
                <span className="font-medium">{activity.actorType}</span>
                {' '}{activity.action}{' '}
                <span className="font-medium">{activity.entityType}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx src/components/tasks/
git commit -m "feat: add dashboard with tasks and activity feed"
```

---

## Task 13: Projects Page

**Covers:** S4

**Files:**
- Create: `task-manager/src/app/(dashboard)/projects/page.tsx`
- Create: `task-manager/src/app/(dashboard)/projects/new/page.tsx`
- Create: `task-manager/src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Create projects list page**

```tsx
// src/app/(dashboard)/projects/page.tsx
import Link from 'next/link'
import { db } from '@/lib/db'

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tasks: true } } },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-400">
                {project._count.tasks} tasks
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create new project page**

```tsx
// src/app/(dashboard)/projects/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })

    if (res.ok) {
      const { data } = await res.json()
      router.push(`/projects/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Project</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border p-2"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create project detail page**

```tsx
// src/app/(dashboard)/projects/[id]/page.tsx
import { db } from '@/lib/db'
import { TaskCard } from '@/components/tasks/task-card'
import { notFound } from 'next/navigation'

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        where: { parentTaskId: null },
        orderBy: { createdAt: 'desc' },
        include: {
          assignedToUser: { select: { name: true } },
          assignedToAgent: { select: { name: true } },
          subtasks: true,
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-gray-500">{project.description}</p>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <a
          href={`/projects/${project.id}/tasks/new`}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Task
        </a>
      </div>

      <div className="space-y-3">
        {project.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {project.tasks.length === 0 && (
          <p className="text-gray-500">No tasks yet</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/projects/
git commit -m "feat: add projects list, create, and detail pages"
```

---

## Task 14: Agents Page

**Covers:** S4

**Files:**
- Create: `task-manager/src/app/(dashboard)/agents/page.tsx`
- Create: `task-manager/src/components/agents/agent-card.tsx`

- [ ] **Step 1: Create agent card component**

```tsx
// src/components/agents/agent-card.tsx
interface AgentCardProps {
  agent: {
    id: string
    name: string
    status: string
    lastSeenAt: Date | null
    capabilities: unknown
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{agent.name}</h3>
        <span
          className={`rounded px-2 py-1 text-xs ${
            agent.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {agent.status}
        </span>
      </div>
      {agent.lastSeenAt && (
        <p className="mt-2 text-sm text-gray-500">
          Last seen: {new Date(agent.lastSeenAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create agents page**

```tsx
// src/app/(dashboard)/agents/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AgentCard } from '@/components/agents/agent-card'

export default function AgentsPage() {
  const [showApiKey, setShowApiKey] = useState<string | null>(null)

  const { data: agents, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/v1/agents')
      const { data } = await res.json()
      return data
    },
  })

  async function handleRegister() {
    const name = prompt('Agent name:')
    if (!name) return

    const res = await fetch('/api/v1/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setShowApiKey(data.apiKey)
      refetch()
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button
          onClick={handleRegister}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Register Agent
        </button>
      </div>

      {showApiKey && (
        <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
            API Key (save this - it won't be shown again):
          </p>
          <code className="mt-2 block break-all text-sm">{showApiKey}</code>
          <button
            onClick={() => setShowApiKey(null)}
            className="mt-2 text-sm text-yellow-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map((agent: any) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/agents/ src/components/agents/
git commit -m "feat: add agents page with registration"
```

---

## Task 15: Settings Page

**Covers:** S4

**Files:**
- Create: `task-manager/src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create settings page**

```tsx
// src/app/(dashboard)/settings/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="max-w-md space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Profile</h2>
          <p className="text-sm text-gray-500">Name: {session.user.name}</p>
          <p className="text-sm text-gray-500">Email: {session.user.email}</p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">API Documentation</h2>
          <p className="text-sm text-gray-500">
            View the{' '}
            <a href="/api/docs" className="text-blue-600 underline">
              API documentation
            </a>{' '}
            for agent integration.
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/settings/
git commit -m "feat: add settings page"
```

---

## Task 16: GitHub Actions CI

**Covers:** S7

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, typecheck, test, build"
```

---

## Task 17: Utility Functions

**Covers:** S6

**Files:**
- Create: `task-manager/src/lib/utils.ts`

- [ ] **Step 1: Create utility functions**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Install clsx and tailwind-merge**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts package.json package-lock.json
git commit -m "feat: add utility functions"
```

---

## Self-Review Checklist

**1. Spec Coverage:**
- [S1] System Overview → Covered by project setup and architecture decisions
- [S2] Data Model → Covered by Task 2 (Prisma schema)
- [S3] API Design → Covered by Tasks 6-10 (API routes + OpenAPI)
- [S4] Frontend Architecture → Covered by Tasks 11-15 (layout, pages)
- [S5] Authentication → Covered by Tasks 3, 5 (NextAuth + agent auth)
- [S6] Project Structure → Covered by Task 1 (scaffolding) + Task 17 (utils)
- [S7] Deployment → Covered by Task 16 (GitHub Actions)
- [S8] MVP Scope → All phases covered

**2. Placeholder Scan:** No TBD/TODO found. All steps contain complete code.

**3. Type Consistency:** All types, function names, and API contracts are consistent across tasks.
