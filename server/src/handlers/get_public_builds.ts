import { db } from '../db';
import { userBuildsTable } from '../db/schema';
import { type GetPublicBuildsInput, type UserBuild } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPublicBuilds(input: GetPublicBuildsInput): Promise<UserBuild[]> {
  try {
    // Query public builds with pagination, ordered by most recent first
    const results = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.is_public, true))
      .orderBy(desc(userBuildsTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Return the results directly since no numeric columns need conversion
    return results;
  } catch (error) {
    console.error('Failed to fetch public builds:', error);
    throw error;
  }
}