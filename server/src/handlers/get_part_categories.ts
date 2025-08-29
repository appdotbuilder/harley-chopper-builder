import { db } from '../db';
import { partCategoriesTable } from '../db/schema';
import { type PartCategory } from '../schema';

export const getPartCategories = async (): Promise<PartCategory[]> => {
  try {
    // Fetch all part categories ordered by name
    const results = await db.select()
      .from(partCategoriesTable)
      .orderBy(partCategoriesTable.name)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch part categories:', error);
    throw error;
  }
};