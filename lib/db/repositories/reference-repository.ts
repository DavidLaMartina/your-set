import { getDb } from '@/lib/db/client';
import { newId } from '@/lib/db/id';
import { mapImplementRow, mapManufacturerRow, mapMuscleRow } from '@/lib/db/map-row';
import type { ImplementRow, ManufacturerRow, MuscleRow } from '@/lib/db/row-types';
import type { Implement, Manufacturer, Muscle } from '@/types/domain';

export async function listImplements(): Promise<Implement[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ImplementRow>(
    'SELECT * FROM implements ORDER BY sort_order ASC, name ASC',
  );
  return rows.map(mapImplementRow);
}

export async function listMuscles(): Promise<Muscle[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MuscleRow>(
    'SELECT * FROM muscles ORDER BY sort_order ASC, name ASC',
  );
  return rows.map(mapMuscleRow);
}

export async function listManufacturers(): Promise<Manufacturer[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ManufacturerRow>(
    'SELECT * FROM manufacturers ORDER BY name ASC',
  );
  return rows.map(mapManufacturerRow);
}

export async function getManufacturerById(id: string): Promise<Manufacturer | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ManufacturerRow>(
    'SELECT * FROM manufacturers WHERE id = ?',
    id,
  );
  return row ? mapManufacturerRow(row) : null;
}

/** Find an existing manufacturer by name (case-insensitive) or create one. */
export async function ensureManufacturer(name: string): Promise<Manufacturer> {
  const trimmed = name.trim();
  const db = await getDb();
  const existing = await db.getFirstAsync<ManufacturerRow>(
    'SELECT * FROM manufacturers WHERE name = ? COLLATE NOCASE',
    trimmed,
  );
  if (existing) return mapManufacturerRow(existing);

  const id = newId();
  await db.runAsync('INSERT INTO manufacturers (id, name) VALUES (?, ?)', id, trimmed);
  return { id, name: trimmed };
}
