import { db } from '../db';
import { partsTable } from '../db/schema';
import { type GetPartsByCategoryInput, type Part } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPartsByCategory(input: GetPartsByCategoryInput): Promise<Part[]> {
  try {
    // Query parts filtered by category
    const results = await db.select()
      .from(partsTable)
      .where(eq(partsTable.category_id, input.category_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(part => ({
      ...part,
      price: parseFloat(part.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get parts by category failed:', error);
    throw error;
  }
}