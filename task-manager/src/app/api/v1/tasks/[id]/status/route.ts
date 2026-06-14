import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!status) {
    return errorResponse('VALIDATION_ERROR', 'Status is required')
  }

  const task = await db.task.update({
    where: { id },
    data: { status },
  })

  return successResponse(task)
}
