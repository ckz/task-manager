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

  const project = await db.project.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      tasks: { where: { parentTaskId: null }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!project) return errorResponse('NOT_FOUND', 'Project not found', 404)

  return successResponse(project)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params
  const body = await request.json()
  const { name, description, status, metadata } = body

  const project = await db.project.update({
    where: { id },
    data: { name, description, status, metadata },
  })

  return successResponse(project)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(request)
  if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required', 401)

  const { id } = await params

  await db.project.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  return successResponse({ deleted: true })
}
