import { db } from '../db';
import { partCategoriesTable } from '../db/schema';
import { type CreatePartCategoryInput, type PartCategory } from '../schema';

export const createPartCategory = async (input: CreatePartCategoryInput): Promise<PartCategory> => {
  try {
    // Insert part category record
    const result = await db.insert(partCategoriesTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    const partCategory = result[0];
    return partCategory;
  } catch (error) {
    console.error('Part category creation failed:', error);
    throw error;
  }
};