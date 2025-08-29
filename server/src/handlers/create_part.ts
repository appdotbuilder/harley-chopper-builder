import { db } from '../db';
import { partsTable, partCategoriesTable } from '../db/schema';
import { type CreatePartInput, type Part } from '../schema';
import { eq } from 'drizzle-orm';

export const createPart = async (input: CreatePartInput): Promise<Part> => {
  try {
    // Verify that the category exists before creating the part
    const categoryExists = await db.select()
      .from(partCategoriesTable)
      .where(eq(partCategoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Part category with id ${input.category_id} does not exist`);
    }

    // Insert part record
    const result = await db.insert(partsTable)
      .values({
        name: input.name,
        description: input.description,
        category_id: input.category_id,
        price: input.price.toString(), // Convert number to string for numeric column
        image_url: input.image_url,
        specifications: input.specifications,
        compatibility: input.compatibility
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const part = result[0];
    return {
      ...part,
      price: parseFloat(part.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Part creation failed:', error);
    throw error;
  }
};