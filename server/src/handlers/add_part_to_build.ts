import { db } from '../db';
import { buildPartsTable, userBuildsTable, partsTable } from '../db/schema';
import { type CreateBuildPartInput, type BuildPart } from '../schema';
import { eq } from 'drizzle-orm';

export const addPartToBuild = async (input: CreateBuildPartInput): Promise<BuildPart> => {
  try {
    // Verify that the build exists
    const buildExists = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, input.build_id))
      .execute();

    if (buildExists.length === 0) {
      throw new Error(`Build with id ${input.build_id} not found`);
    }

    // Verify that the part exists
    const partExists = await db.select()
      .from(partsTable)
      .where(eq(partsTable.id, input.part_id))
      .execute();

    if (partExists.length === 0) {
      throw new Error(`Part with id ${input.part_id} not found`);
    }

    // Insert build part record
    const result = await db.insert(buildPartsTable)
      .values({
        build_id: input.build_id,
        part_id: input.part_id,
        quantity: input.quantity,
        notes: input.notes
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Adding part to build failed:', error);
    throw error;
  }
};