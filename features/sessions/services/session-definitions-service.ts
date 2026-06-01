import { getDb } from '@/lib/db/client';
import * as SessionRepo from '@/lib/db/repositories/session-repository';
import type { Session } from '@/types/domain';

export type SessionDefinitionsTabData = {
  active: Session[];
  retired: Session[];
};

export async function loadSessionDefinitionsTab(): Promise<SessionDefinitionsTabData> {
  const [active, retired] = await Promise.all([
    SessionRepo.listSessionsByStatus('active'),
    SessionRepo.listSessionsByStatus('retired'),
  ]);
  return { active, retired };
}

export async function createSessionDefinition(name: string): Promise<Session> {
  const sortOrder = await SessionRepo.getNextRotationSortOrder();
  return SessionRepo.createSession({ name, rotationSortOrder: sortOrder });
}

export async function retireSessionDefinition(sessionId: string): Promise<Session | null> {
  return SessionRepo.updateSession(sessionId, { status: 'retired' });
}

export async function reactivateSessionDefinition(sessionId: string): Promise<Session | null> {
  const sortOrder = await SessionRepo.getNextRotationSortOrder();
  return SessionRepo.updateSession(sessionId, { status: 'active', rotationSortOrder: sortOrder });
}

export async function loadSessionDefinition(sessionId: string): Promise<{
  session: Session;
  plannedCount: number;
  instanceCount: number;
} | null> {
  const session = await SessionRepo.getSessionById(sessionId);
  if (!session) return null;

  const db = await getDb();
  const plannedRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_exercises WHERE session_id = ?',
    sessionId,
  );
  const instanceRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_instances WHERE session_id = ?',
    sessionId,
  );

  return {
    session,
    plannedCount: plannedRow?.count ?? 0,
    instanceCount: instanceRow?.count ?? 0,
  };
}

export async function deleteSessionDefinition(sessionId: string): Promise<void> {
  await SessionRepo.deleteSession(sessionId);
}

export async function getSessionDefinitionDeleteSummary(sessionId: string): Promise<{
  name: string;
  instanceCount: number;
  plannedCount: number;
} | null> {
  const session = await SessionRepo.getSessionById(sessionId);
  if (!session) return null;

  const db = await getDb();
  const instanceRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_instances WHERE session_id = ?',
    sessionId,
  );
  const plannedRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_exercises WHERE session_id = ?',
    sessionId,
  );

  return {
    name: session.name,
    instanceCount: instanceRow?.count ?? 0,
    plannedCount: plannedRow?.count ?? 0,
  };
}
