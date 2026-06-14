import { NextRequest } from 'next/server'
import { db } from './db'
import bcrypt from 'bcryptjs'

export interface AgentAuthResult {
  authenticated: boolean
  agentId?: string
  error?: string
}

export async function authenticateAgent(request: NextRequest): Promise<AgentAuthResult> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.slice(7)

  const agents = await db.agent.findMany({
    where: { status: 'ACTIVE' },
  })

  for (const agent of agents) {
    const isValid = await bcrypt.compare(token, agent.apiKeyHash)
    if (isValid) {
      await db.agent.update({
        where: { id: agent.id },
        data: { lastSeenAt: new Date() },
      })
      return { authenticated: true, agentId: agent.id }
    }
  }

  return { authenticated: false, error: 'Invalid API key' }
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'tm_'
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10)
}
