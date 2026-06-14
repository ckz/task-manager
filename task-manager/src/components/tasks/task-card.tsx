import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: {
    id: string
    title: string
    status: string
    priority: string
    assignedToUser?: { name: string } | null
    assignedToAgent?: { name: string } | null
  }
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
        <h3 className="font-medium">{task.title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className={cn('rounded px-2 py-1 text-xs', statusColors[task.status])}>
            {task.status}
          </span>
          <span className={cn('text-xs font-medium', priorityColors[task.priority])}>
            {task.priority}
          </span>
        </div>
        {(task.assignedToUser || task.assignedToAgent) && (
          <p className="mt-2 text-sm text-gray-500">
            Assigned to: {task.assignedToUser?.name || task.assignedToAgent?.name}
          </p>
        )}
      </div>
    </Link>
  )
}
