import { db } from '../db';
import { userBuildsTable } from '../db/schema';
import { type UpdateUserBuildInput, type UserBuild } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserBuild = async (input: UpdateUserBuildInput): Promise<UserBuild> => {
  try {
    // First, verify the build exists
    const existingBuild = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, input.id))
      .execute();

    if (existingBuild.length === 0) {
      throw new Error(`Build with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are defined
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    if (input.description !== undefined) {
      updateData['description'] = input.description;
    }
    if (input.chopper_style_id !== undefined) {
      updateData['chopper_style_id'] = input.chopper_style_id;
    }
    if (input.is_public !== undefined) {
      updateData['is_public'] = input.is_public;
    }
    if (input.build_data !== undefined) {
      updateData['build_data'] = input.build_data;
    }
    if (input.progress_step !== undefined) {
      updateData['progress_step'] = input.progress_step;
    }

    // Update the build record
    const result = await db.update(userBuildsTable)
      .set(updateData)
      .where(eq(userBuildsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User build update failed:', error);
    throw error;
  }
};