import { z } from "zod";

export const MAX_INT_ID = 2_147_483_647;
export const positiveIdSchema = z.number().int().positive().max(MAX_INT_ID);

export function parsePositiveIntId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_INT_ID ? id : null;
}