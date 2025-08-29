import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userBuildsTable, chopperStylesTable } from '../db/schema';
import { type UpdateUserBuildInput } from '../schema';
import { updateUserBuild } from '../handlers/update_user_build';
import { eq } from 'drizzle-orm';

describe('updateUserBuild', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a user build with all fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const styleResult = await db.insert(chopperStylesTable)
      .values({
        name: 'Classic Chopper',
        description: 'A classic chopper style'
      })
      .returning()
      .execute();

    // Create initial build
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Original Build',
        description: 'Original description',
        chopper_style_id: null,
        is_public: false,
        build_data: '{"parts": []}',
        progress_step: 0
      })
      .returning()
      .execute();

    const updateInput: UpdateUserBuildInput = {
      id: buildResult[0].id,
      name: 'Updated Build Name',
      description: 'Updated description',
      chopper_style_id: styleResult[0].id,
      is_public: true,
      build_data: '{"parts": [{"id": 1, "quantity": 2}]}',
      progress_step: 5
    };

    const result = await updateUserBuild(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(buildResult[0].id);
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.name).toEqual('Updated Build Name');
    expect(result.description).toEqual('Updated description');
    expect(result.chopper_style_id).toEqual(styleResult[0].id);
    expect(result.is_public).toEqual(true);
    expect(result.build_data).toEqual('{"parts": [{"id": 1, "quantity": 2}]}');
    expect(result.progress_step).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create initial build
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Original Build',
        description: 'Original description',
        chopper_style_id: null,
        is_public: false,
        build_data: '{"parts": []}',
        progress_step: 0
      })
      .returning()
      .execute();

    // Update only name and progress_step
    const updateInput: UpdateUserBuildInput = {
      id: buildResult[0].id,
      name: 'Partially Updated Build',
      progress_step: 3
    };

    const result = await updateUserBuild(updateInput);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Partially Updated Build');
    expect(result.progress_step).toEqual(3);
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.is_public).toEqual(false); // Unchanged
    expect(result.build_data).toEqual('{"parts": []}'); // Unchanged
    expect(result.chopper_style_id).toBeNull(); // Unchanged
  });

  it('should handle null values in updates', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const styleResult = await db.insert(chopperStylesTable)
      .values({
        name: 'Classic Chopper',
        description: 'A classic chopper style'
      })
      .returning()
      .execute();

    // Create initial build with some values
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Original Build',
        description: 'Original description',
        chopper_style_id: styleResult[0].id,
        is_public: true,
        build_data: '{"parts": []}',
        progress_step: 5
      })
      .returning()
      .execute();

    // Update with null values
    const updateInput: UpdateUserBuildInput = {
      id: buildResult[0].id,
      description: null,
      chopper_style_id: null
    };

    const result = await updateUserBuild(updateInput);

    // Verify null values were set
    expect(result.description).toBeNull();
    expect(result.chopper_style_id).toBeNull();
    expect(result.name).toEqual('Original Build'); // Unchanged
    expect(result.is_public).toEqual(true); // Unchanged
    expect(result.progress_step).toEqual(5); // Unchanged
  });

  it('should persist changes to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create initial build
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Original Build',
        description: 'Original description',
        is_public: false,
        build_data: '{"parts": []}',
        progress_step: 0
      })
      .returning()
      .execute();

    const updateInput: UpdateUserBuildInput = {
      id: buildResult[0].id,
      name: 'Database Updated Build',
      is_public: true,
      progress_step: 10
    };

    await updateUserBuild(updateInput);

    // Verify changes are persisted in database
    const builds = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, buildResult[0].id))
      .execute();

    expect(builds).toHaveLength(1);
    expect(builds[0].name).toEqual('Database Updated Build');
    expect(builds[0].is_public).toEqual(true);
    expect(builds[0].progress_step).toEqual(10);
    expect(builds[0].description).toEqual('Original description'); // Unchanged
  });

  it('should throw error when build does not exist', async () => {
    const updateInput: UpdateUserBuildInput = {
      id: 99999,
      name: 'Non-existent Build'
    };

    expect(updateUserBuild(updateInput)).rejects.toThrow(/build with id 99999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create initial build
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Original Build',
        description: 'Original description',
        is_public: false,
        build_data: '{"parts": []}',
        progress_step: 0
      })
      .returning()
      .execute();

    const originalUpdatedAt = buildResult[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserBuildInput = {
      id: buildResult[0].id,
      name: 'Updated Build'
    };

    const result = await updateUserBuild(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should handle progress step boundaries correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create initial build
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Original Build',
        is_public: false,
        build_data: '{"parts": []}',
        progress_step: 5
      })
      .returning()
      .execute();

    // Test setting progress to 0
    const updateInput: UpdateUserBuildInput = {
      id: buildResult[0].id,
      progress_step: 0
    };

    const result = await updateUserBuild(updateInput);

    expect(result.progress_step).toEqual(0);

    // Test setting high progress value
    const updateInput2: UpdateUserBuildInput = {
      id: buildResult[0].id,
      progress_step: 100
    };

    const result2 = await updateUserBuild(updateInput2);

    expect(result2.progress_step).toEqual(100);
  });
});