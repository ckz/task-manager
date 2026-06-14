import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { successResponse, errorResponse, getPagination } from '@/lib/api'
import { generateApiKey, hashApiKey } from '@/lib/agent-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const { page, limit, skip } = getPagination(request.nextUrl.searchParams)

  const [agents, total] = await Promise.all([
    db.agent.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.agent.count(),
  ])

  return successResponse(agents, { total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
  }

  const body = await request.json()
  const { name, capabilities } = body

  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Name is required')
  }

  const apiKey = generateApiKey()
  const apiKeyHash = await hashApiKey(apiKey)

  const agent = await db.agent.create({
    data: {
      name,
      apiKeyHash,
      capabilities,
    },
  })

  return successResponse({ ...agent, apiKey })
}
