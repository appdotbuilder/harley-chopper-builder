import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type GetEducationalContentInput, type EducationalContent } from '../schema';
import { eq } from 'drizzle-orm';

export const getEducationalContent = async (input: GetEducationalContentInput): Promise<EducationalContent[]> => {
  try {
    // Build base query
    const baseQuery = db.select().from(educationalContentTable);

    // Apply content type filter if provided and execute
    const results = input.content_type
      ? await baseQuery.where(eq(educationalContentTable.content_type, input.content_type)).execute()
      : await baseQuery.execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Educational content retrieval failed:', error);
    throw error;
  }
};