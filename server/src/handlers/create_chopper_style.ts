import { db } from '../db';
import { chopperStylesTable } from '../db/schema';
import { type CreateChopperStyleInput, type ChopperStyle } from '../schema';

export const createChopperStyle = async (input: CreateChopperStyleInput): Promise<ChopperStyle> => {
  try {
    // Insert chopper style record
    const result = await db.insert(chopperStylesTable)
      .values({
        name: input.name,
        description: input.description,
        image_url: input.image_url
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chopper style creation failed:', error);
    throw error;
  }
};