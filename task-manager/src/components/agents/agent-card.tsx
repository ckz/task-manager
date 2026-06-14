interface AgentCardProps {
  agent: {
    id: string
    name: string
    status: string
    lastSeenAt: Date | null
    capabilities: unknown
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{agent.name}</h3>
        <span
          className={`rounded px-2 py-1 text-xs ${
            agent.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {agent.status}
        </span>
      </div>
      {agent.lastSeenAt && (
        <p className="mt-2 text-sm text-gray-500">
          Last seen: {new Date(agent.lastSeenAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
