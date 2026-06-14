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

  const agent = await db.agent.findUnique({ where: { id } })
  if (!agent) return errorResponse('NOT_FOUND', 'Agent not found', 404)

  const assignedTasks = await db.task.findMany({
    where: { assignedToAgentId: id },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  })

  const activityLogs = await db.activityLog.findMany({
    where: { entityId: id, entityType: 'AGENT' },
    take: 20,
    orderBy: { createdAt: 'desc' },
  })

  return successResponse({ ...agent, assignedTasks, activityLogs })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params
  const body = await request.json()
  const { name, status, capabilities } = body

  const agent = await db.agent.update({
    where: { id },
    data: { name, status, capabilities },
  })

  return successResponse(agent)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params

  await db.agent.update({
    where: { id },
    data: { status: 'INACTIVE' },
  })

  return successResponse({ deleted: true })
}
