import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { id } = await params

  const task = await db.task.findUnique({
    where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { id } = await params
  await db.task.delete({ where: { id } })

  return successResponse({ deleted: true })
}
