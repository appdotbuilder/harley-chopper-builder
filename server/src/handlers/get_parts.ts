import { db } from '../db';
import { partsTable } from '../db/schema';
import { type Part } from '../schema';

export const getParts = async (): Promise<Part[]> => {
  try {
    // Fetch all parts from the database
    const results = await db.select()
      .from(partsTable)
      .execute();

    // Convert numeric price field back to number for return
    return results.map(part => ({
      ...part,
      price: parseFloat(part.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch parts:', error);
    throw error;
  }
};