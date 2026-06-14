import { Prisma } from '@/generated/prisma/client'
import { db } from './db'

interface LogActivityParams {
  entityType: 'PROJECT' | 'TASK' | 'AGENT'
  entityId: string
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED'
  actorType: 'USER' | 'AGENT'
  actorId: string
  changes?: Prisma.InputJsonValue
}

export async function logActivity(params: LogActivityParams) {
  return db.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorType: params.actorType,
      actorId: params.actorId,
      changes: params.changes ?? undefined,
    },
  })
}
