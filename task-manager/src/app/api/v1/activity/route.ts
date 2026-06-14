import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'
import { getAuth } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

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
