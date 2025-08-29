import { db } from '../db';
import { userBuildsTable } from '../db/schema';
import { type GetUserBuildsInput, type UserBuild } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserBuilds(input: GetUserBuildsInput): Promise<UserBuild[]> {
  try {
    // Query user builds for the specific user
    const results = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.user_id, input.user_id))
      .execute();

    // No numeric conversions needed - all fields are already correct types
    // progress_step is integer, is_public is boolean, others are text/timestamp
    return results;
  } catch (error) {
    console.error('Failed to fetch user builds:', error);
    throw error;
  }
}