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

  const agent = await db.agent.findUnique({
    where: { id },
    include: {
      assignedTasks: { take: 10, orderBy: { updatedAt: 'desc' } },
    },
  })

  if (!agent) {
    return errorResponse('NOT_FOUND', 'Agent not found', 404)
  }

  const activityLogs = await db.activityLog.findMany({
    where: { entityType: 'AGENT', entityId: id },
    take: 20,
    orderBy: { createdAt: 'desc' },
  })

  return successResponse({ ...agent, activityLogs })
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { id } = await params

  await db.agent.update({
    where: { id },
    data: { status: 'INACTIVE' },
  })

  return successResponse({ deleted: true })
}
