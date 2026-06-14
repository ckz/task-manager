import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { id: projectId } = await params
  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)
  const status = request.nextUrl.searchParams.get('status')
  const priority = request.nextUrl.searchParams.get('priority')

  const where: Record<string, unknown> = { projectId }
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { id: projectId } = await params
  const body = await request.json()
  const { title, description, priority, parentTaskId, assignedToUserId, assignedToAgentId, dueDate, metadata } = body

  if (!title) {
    return errorResponse('VALIDATION_ERROR', 'Title is required')
  }

  const task = await db.task.create({
    data: {
      projectId,
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
