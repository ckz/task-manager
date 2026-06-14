# Task Management System for AI-Agent-Orchestrated Teams

**Date:** 2026-06-14
**Status:** Draft

---

## [S1] System Overview

**Project:** Task Management System for AI-Agent-Orchestrated Teams

**Problem:** Teams using Linear for dev tasks need a complementary system for AI agent orchestration and cross-team coordination. Current tools don't expose machine-friendly APIs for AI agents (Claude Code, OpenClaw, Codex) to read/write tasks and report progress.

**Solution:** A Vercel-deployed Next.js application with:
- **Web Dashboard** for human project/task management
- **REST API** (OpenAPI-documented) for AI agent integration
- **Neon PostgreSQL** for persistent data, **Vercel KV** for sessions/cache
- **Google OAuth** for users, **API tokens** for agents

**Key Principles:**
- API-first: every UI action has an equivalent API endpoint
- Agent-friendly: clear token auth, structured responses, webhook support
- Vercel-native: optimized for serverless deployment

---

## [S2] Data Model

### Project

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Project name |
| description | text | Project description |
| status | enum | active, archived, completed |
| created_by | UUID | FK → User |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |
| metadata | JSONB | Extensible fields |

### Task

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project |
| parent_task_id | UUID | FK → Task (nullable, for subtasks) |
| title | string | Task title |
| description | text | Task description |
| status | enum | todo, in_progress, review, done, cancelled |
| priority | enum | low, medium, high, urgent |
| assigned_to_user_id | UUID | FK → User (nullable) |
| assigned_to_agent_id | UUID | FK → Agent (nullable) |
| due_date | date | Due date (nullable) |
| created_by_user_id | UUID | FK → User (nullable) |
| created_by_agent_id | UUID | FK → Agent (nullable) |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |
| metadata | JSONB | Extensible fields |

**Note:** Assignment uses explicit foreign keys rather than polymorphic relations for type safety. Exactly one of `assigned_to_user_id` or `assigned_to_agent_id` should be set (or both null for unassigned). Same pattern for `created_by_*`.

### Agent

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Agent name (e.g., 'claude-code-prod') |
| api_key_hash | string | Hashed API key |
| capabilities | JSONB | Agent capabilities |
| last_seen_at | timestamp | Last activity |
| status | enum | active, inactive |

### User

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | string | Email address |
| name | string | Display name |
| avatar_url | string | Profile image URL |
| google_id | string | Google OAuth ID |
| role | enum | admin, member, viewer |
| created_at | timestamp | Creation time |

### ActivityLog

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| entity_type | enum | project, task, agent |
| entity_id | UUID | FK → entity |
| action | enum | created, updated, deleted, status_changed |
| actor_type | enum | user, agent |
| actor_id | UUID | FK → User or Agent |
| changes | JSONB | Diff of what changed |
| created_at | timestamp | Activity time |

---

## [S3] API Design

**Base URL:** `https://your-app.vercel.app/api/v1`

**Authentication:**
- **Users:** Google OAuth → session cookie
- **Agents:** Bearer token in `Authorization` header (`Authorization: Bearer <api_token>`)

### Endpoints

#### Projects

```
GET    /api/v1/projects          # List projects
POST   /api/v1/projects          # Create project
GET    /api/v1/projects/:id      # Get project
PATCH  /api/v1/projects/:id      # Update project
DELETE /api/v1/projects/:id      # Archive project
```

#### Tasks

```
GET    /api/v1/projects/:projectId/tasks           # List tasks (filters: status, priority, assignee)
POST   /api/v1/projects/:projectId/tasks           # Create task
GET    /api/v1/tasks/:id                           # Get task (includes subtasks)
PATCH  /api/v1/tasks/:id                           # Update task
DELETE /api/v1/tasks/:id                           # Delete task
POST   /api/v1/tasks/:id/assign                    # Assign to user/agent
POST   /api/v1/tasks/:id/status                    # Update status
```

#### Agents

```
GET    /api/v1/agents            # List agents
POST   /api/v1/agents            # Register agent (returns API key once)
GET    /api/v1/agents/:id        # Get agent details
PATCH  /api/v1/agents/:id        # Update agent
DELETE /api/v1/agents/:id        # Deactivate agent
```

#### Activity

```
GET    /api/v1/activity          # Recent activity feed
GET    /api/v1/tasks/:id/activity # Activity for specific task
```

### Response Format

```json
{
  "data": { ... },
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

**OpenAPI Spec:** Auto-generated from route definitions, served at `/api/docs`

---

## [S4] Frontend Architecture

**Tech Stack:**
- Next.js 14+ App Router with Server Components
- Tailwind CSS + shadcn/ui component library
- React Query (TanStack Query) for server state
- Zustand for client state (filters, UI state)

### Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard - recent activity, assigned tasks |
| `/projects` | Project list with filters |
| `/projects/:id` | Project detail - task board/list view |
| `/projects/:id/tasks/new` | Create task form |
| `/tasks/:id` | Task detail with subtasks |
| `/agents` | Agent management |
| `/settings` | User settings, API keys |
| `/api/docs` | OpenAPI documentation (Swagger UI) |

### Key Components

- `TaskBoard` - Kanban-style board with drag-and-drop
- `TaskList` - Table view with sorting/filtering
- `TaskDetail` - Full task view with subtasks, activity
- `AgentCard` - Agent status, capabilities, activity
- `ActivityFeed` - Real-time activity stream

**Server Components:**
- Data fetching happens server-side where possible
- Client components only for interactive elements (forms, drag-drop)

---

## [S5] Authentication & Authorization

### User Authentication (Google OAuth)

- NextAuth.js with Google provider
- Session stored in Vercel KV (Redis) for serverless compatibility
- JWT for session token, server-side validation

### Agent Authentication (API Tokens)

- Agents register via `/api/v1/agents` (requires user auth)
- System generates API key (shown once, stored as bcrypt hash)
- Agents send `Authorization: Bearer <api_key>` header
- API keys can be scoped (read-only, read-write, admin)

### Authorization Model

| Role | Projects | Tasks | Agents | Settings |
|------|----------|-------|--------|----------|
| Admin | CRUD | CRUD | CRUD | CRUD |
| Member | R | CRUD | R | R |
| Viewer | R | R | R | - |

### API Key Scopes

| Scope | Permissions |
|-------|-------------|
| read | GET on all resources |
| write | POST, PATCH, DELETE on tasks |
| admin | Full access including agent management |

---

## [S6] Project Structure

```
task-manager/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration files
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── projects/       # Project pages
│   │   │   ├── tasks/          # Task pages
│   │   │   ├── agents/         # Agent pages
│   │   │   └── settings/       # Settings pages
│   │   ├── api/                # API routes
│   │   │   └── v1/             # Versioned API
│   │   │       ├── projects/   # Project endpoints
│   │   │       ├── tasks/      # Task endpoints
│   │   │       ├── agents/     # Agent endpoints
│   │   │       └── activity/   # Activity endpoints
│   │   ├── auth/               # NextAuth routes
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── tasks/              # Task-specific components
│   │   ├── projects/           # Project-specific components
│   │   └── agents/             # Agent-specific components
│   ├── lib/                    # Shared utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── api.ts              # API helpers
│   │   └── utils.ts            # General utilities
│   └── types/                  # TypeScript types
│       └── api.ts              # API response types
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── next.config.js              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json
```

---

## [S7] Deployment & Infrastructure

**Vercel Configuration:**
- Framework: Next.js
- Region: Auto (or closest to team)
- Environment: Production, Preview (PRs), Development

**Database:**
- Neon PostgreSQL (serverless, auto-scaling)
- Connection pooling via Neon's built-in pooler
- Migrations via Prisma Migrate

**Caching/Sessions:**
- Vercel KV (Redis) for:
  - Session storage (NextAuth)
  - API response caching
  - Rate limiting counters

**GitHub Integration:**
- PAT (Personal Access Token) for repo access
- GitHub Actions for CI:
  - Lint (ESLint)
  - Type check (TypeScript)
  - Test (Vitest)
  - Build verification
- Vercel auto-deploys on push to main

**Environment Variables:**

```env
DATABASE_URL=              # Neon connection string
NEXTAUTH_SECRET=           # Random secret for NextAuth
NEXTAUTH_URL=              # https://your-app.vercel.app
GOOGLE_CLIENT_ID=          # Google OAuth client ID
GOOGLE_CLIENT_SECRET=      # Google OAuth client secret
KV_REST_API_URL=           # Vercel KV URL
KV_REST_API_TOKEN=         # Vercel KV token
GITHUB_PAT=                # GitHub Personal Access Token
```

---

## [S8] MVP Scope & Phases

### Phase 1 - Foundation (Week 1-2)

- Next.js project setup with TypeScript, Tailwind, shadcn/ui
- Prisma schema + Neon database setup
- Google OAuth with NextAuth.js
- Basic project CRUD (API + UI)
- Basic task CRUD (API + UI)

### Phase 2 - Agent Integration (Week 3)

- Agent registration and API key management
- Agent API endpoints (full task CRUD)
- Activity logging for all changes
- API documentation (OpenAPI/Swagger)

### Phase 3 - Polish (Week 4)

- Task board view (Kanban)
- Filters and search
- Dashboard with activity feed
- Error handling and validation
- GitHub Actions CI/CD

### Future Phases (post-MVP)

- Webhooks for agent notifications
- Real-time updates (WebSockets/SSE)
- Linear integration (sync tasks)
- Advanced reporting/analytics
- Team management and permissions
