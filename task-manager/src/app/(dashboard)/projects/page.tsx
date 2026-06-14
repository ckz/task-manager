import Link from 'next/link'
import { db } from '@/lib/db'

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tasks: true } } },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-400">
                {project._count.tasks} tasks
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
