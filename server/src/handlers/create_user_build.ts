import { db } from '../db';
import { userBuildsTable, usersTable, chopperStylesTable } from '../db/schema';
import { type CreateUserBuildInput, type UserBuild } from '../schema';
import { eq } from 'drizzle-orm';

export const createUserBuild = async (input: CreateUserBuildInput): Promise<UserBuild> => {
  try {
    // Validate that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Validate that the chopper style exists (if provided)
    if (input.chopper_style_id !== null && input.chopper_style_id !== undefined) {
      const chopperStyle = await db.select()
        .from(chopperStylesTable)
        .where(eq(chopperStylesTable.id, input.chopper_style_id))
        .limit(1)
        .execute();

      if (chopperStyle.length === 0) {
        throw new Error(`Chopper style with id ${input.chopper_style_id} not found`);
      }
    }

    // Insert user build record
    const result = await db.insert(userBuildsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        description: input.description,
        chopper_style_id: input.chopper_style_id,
        is_public: input.is_public,
        build_data: input.build_data,
        progress_step: input.progress_step
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User build creation failed:', error);
    throw error;
  }
};