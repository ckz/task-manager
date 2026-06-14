import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { authenticateAgent } from './agent-auth'

export type AuthResult = { type: 'user'; id: string } | { type: 'agent'; id: string }

export async function getAuth(request: NextRequest): Promise<AuthResult | null> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) return { type: 'user', id: session.user.id }
  const agent = await authenticateAgent(request)
  if (agent.authenticated) return { type: 'agent', id: agent.agentId! }
  return null
}
