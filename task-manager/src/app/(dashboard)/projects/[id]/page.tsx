import { db } from '@/lib/db'
import { TaskCard } from '@/components/tasks/task-card'
import { notFound } from 'next/navigation'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: {
      tasks: {
        where: { parentTaskId: null },
        orderBy: { createdAt: 'desc' },
        include: {
          assignedToUser: { select: { name: true } },
          assignedToAgent: { select: { name: true } },
          subtasks: true,
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-gray-500">{project.description}</p>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <a
          href={`/projects/${project.id}/tasks/new`}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Task
        </a>
      </div>

      <div className="space-y-3">
        {project.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {project.tasks.length === 0 && (
          <p className="text-gray-500">No tasks yet</p>
        )}
      </div>
    </div>
  )
}
