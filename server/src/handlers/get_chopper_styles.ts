import { db } from '../db';
import { chopperStylesTable } from '../db/schema';
import { type ChopperStyle } from '../schema';

export const getChopperStyles = async (): Promise<ChopperStyle[]> => {
  try {
    const results = await db.select()
      .from(chopperStylesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch chopper styles:', error);
    throw error;
  }
};