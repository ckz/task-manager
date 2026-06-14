import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { TaskCard } from '@/components/tasks/task-card'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const [recentTasks, recentActivity] = await Promise.all([
    db.task.findMany({
      where: {
        OR: [
          { assignedToUserId: session.user.id },
          { createdByUserId: session.user.id },
        ],
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedToUser: { select: { name: true } },
        assignedToAgent: { select: { name: true } },
      },
    }),
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your Tasks</h2>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {recentTasks.length === 0 && (
              <p className="text-gray-500">No tasks assigned to you</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="rounded border p-3 text-sm">
                <span className="font-medium">{activity.actorType}</span>
                {' '}{activity.action}{' '}
                <span className="font-medium">{activity.entityType}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
