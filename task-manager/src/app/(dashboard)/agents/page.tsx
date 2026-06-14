'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AgentCard } from '@/components/agents/agent-card'

export default function AgentsPage() {
  const [showApiKey, setShowApiKey] = useState<string | null>(null)

  const { data: agents, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/v1/agents')
      const { data } = await res.json()
      return data
    },
  })

  async function handleRegister() {
    const name = prompt('Agent name:')
    if (!name) return

    const res = await fetch('/api/v1/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setShowApiKey(data.apiKey)
      refetch()
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button
          onClick={handleRegister}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Register Agent
        </button>
      </div>

      {showApiKey && (
        <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
            API Key (save this - it won't be shown again):
          </p>
          <code className="mt-2 block break-all text-sm">{showApiKey}</code>
          <button
            onClick={() => setShowApiKey(null)}
            className="mt-2 text-sm text-yellow-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map((agent: any) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
