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

  const { id: taskId } = await params
  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)

  const [activities, total] = await Promise.all([
    db.activityLog.findMany({
      where: { entityId: taskId, entityType: 'TASK' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.activityLog.count({ where: { entityId: taskId, entityType: 'TASK' } }),
  ])

  return successResponse(activities, { total, page, limit })
}
