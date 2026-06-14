import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'
import { ProjectStatus } from '@/generated/prisma/enums'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)
  const status = request.nextUrl.searchParams.get('status')

  const where = status ? { status: status as ProjectStatus } : {}

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, name: true, email: true } } },
    }),
    db.project.count({ where }),
  ])

  return successResponse(projects, { total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { name, description, metadata } = body

  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Name is required')
  }

  const project = await db.project.create({
    data: {
      name,
      description,
      metadata,
      createdBy: session.user.id,
    },
  })

  return successResponse(project)
}
