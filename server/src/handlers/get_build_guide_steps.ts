import { db } from '../db';
import { buildGuideStepsTable } from '../db/schema';
import { type BuildGuideStep } from '../schema';
import { asc } from 'drizzle-orm';

export const getBuildGuideSteps = async (): Promise<BuildGuideStep[]> => {
  try {
    // Fetch all build guide steps ordered by step_number
    const results = await db.select()
      .from(buildGuideStepsTable)
      .orderBy(asc(buildGuideStepsTable.step_number))
      .execute();

    // Convert numeric fields and return
    return results.map(step => ({
      ...step,
      // No numeric conversions needed - all fields are already proper types
      // step_number and estimated_time_minutes are integers (no conversion needed)
      // All other fields are text, enum, or timestamp types
    }));
  } catch (error) {
    console.error('Fetching build guide steps failed:', error);
    throw error;
  }
};