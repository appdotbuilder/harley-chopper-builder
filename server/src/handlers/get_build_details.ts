import { db } from '../db';
import { userBuildsTable } from '../db/schema';
import { type GetBuildDetailsInput, type UserBuild } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBuildDetails(input: GetBuildDetailsInput): Promise<UserBuild | null> {
  try {
    // Query the build details
    const results = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, input.build_id))
      .execute();

    // Return null if build not found
    if (results.length === 0) {
      return null;
    }

    const build = results[0];

    // Return the build with proper type conversions
    return {
      ...build,
      created_at: build.created_at,
      updated_at: build.updated_at
    };
  } catch (error) {
    console.error('Build details fetch failed:', error);
    throw error;
  }
}