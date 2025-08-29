import { db } from '../db';
import { buildGuideStepsTable } from '../db/schema';
import { type CreateBuildGuideStepInput, type BuildGuideStep } from '../schema';

export const createBuildGuideStep = async (input: CreateBuildGuideStepInput): Promise<BuildGuideStep> => {
  try {
    // Insert build guide step record
    const result = await db.insert(buildGuideStepsTable)
      .values({
        step_number: input.step_number,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        image_url: input.image_url,
        video_url: input.video_url,
        estimated_time_minutes: input.estimated_time_minutes,
        difficulty_level: input.difficulty_level,
        required_tools: input.required_tools
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Build guide step creation failed:', error);
    throw error;
  }
};