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
