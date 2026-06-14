import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { getAuth } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params

  const task = await db.task.findUnique({
    where: { id },
    include: {
      project: true,
      parentTask: true,
      subtasks: true,
      assignedToUser: { select: { id: true, name: true, email: true } },
      assignedToAgent: { select: { id: true, name: true } },
    },
  })

  if (!task) return errorResponse('NOT_FOUND', 'Task not found', 404)

  const activityLogs = await db.activityLog.findMany({
    where: { entityId: id, entityType: 'TASK' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return successResponse({ ...task, activityLogs })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params
  const body = await request.json()
  const { title, description, status, priority, dueDate, metadata } = body

  const task = await db.task.update({
    where: { id },
    data: { title, description, status, priority, dueDate, metadata },
  })

  return successResponse(task)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params
  await db.task.delete({ where: { id } })

  return successResponse({ deleted: true })
}
