import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userBuildsTable, usersTable, chopperStylesTable } from '../db/schema';
import { type CreateUserBuildInput } from '../schema';
import { createUserBuild } from '../handlers/create_user_build';
import { eq } from 'drizzle-orm';

describe('createUserBuild', () => {
  let testUserId: number;
  let testChopperStyleId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test chopper style
    const chopperStyleResult = await db.insert(chopperStylesTable)
      .values({
        name: 'Test Chopper Style',
        description: 'A test chopper style'
      })
      .returning()
      .execute();
    testChopperStyleId = chopperStyleResult[0].id;
  });

  afterEach(resetDB);

  it('should create a user build with all fields', async () => {
    const testInput: CreateUserBuildInput = {
      user_id: testUserId,
      name: 'My Custom Chopper',
      description: 'A detailed description of my build',
      chopper_style_id: testChopperStyleId,
      is_public: true,
      build_data: '{"parts": [{"id": 1, "quantity": 2}], "config": {"color": "black"}}',
      progress_step: 5
    };

    const result = await createUserBuild(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('My Custom Chopper');
    expect(result.description).toEqual('A detailed description of my build');
    expect(result.chopper_style_id).toEqual(testChopperStyleId);
    expect(result.is_public).toEqual(true);
    expect(result.build_data).toEqual('{"parts": [{"id": 1, "quantity": 2}], "config": {"color": "black"}}');
    expect(result.progress_step).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user build with minimal fields', async () => {
    const testInput: CreateUserBuildInput = {
      user_id: testUserId,
      name: 'Simple Build',
      description: null,
      chopper_style_id: null,
      is_public: false,
      build_data: '{}',
      progress_step: 0
    };

    const result = await createUserBuild(testInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Simple Build');
    expect(result.description).toBeNull();
    expect(result.chopper_style_id).toBeNull();
    expect(result.is_public).toEqual(false);
    expect(result.build_data).toEqual('{}');
    expect(result.progress_step).toEqual(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user build to database', async () => {
    const testInput: CreateUserBuildInput = {
      user_id: testUserId,
      name: 'Database Test Build',
      description: 'Testing database persistence',
      chopper_style_id: testChopperStyleId,
      is_public: true,
      build_data: '{"test": "data"}',
      progress_step: 3
    };

    const result = await createUserBuild(testInput);

    // Query database to verify the build was saved
    const builds = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, result.id))
      .execute();

    expect(builds).toHaveLength(1);
    expect(builds[0].name).toEqual('Database Test Build');
    expect(builds[0].description).toEqual('Testing database persistence');
    expect(builds[0].user_id).toEqual(testUserId);
    expect(builds[0].chopper_style_id).toEqual(testChopperStyleId);
    expect(builds[0].is_public).toEqual(true);
    expect(builds[0].build_data).toEqual('{"test": "data"}');
    expect(builds[0].progress_step).toEqual(3);
    expect(builds[0].created_at).toBeInstanceOf(Date);
    expect(builds[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateUserBuildInput = {
      user_id: 99999, // Non-existent user ID
      name: 'Invalid Build',
      description: null,
      chopper_style_id: null,
      is_public: false,
      build_data: '{}',
      progress_step: 0
    };

    await expect(createUserBuild(testInput)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error when chopper style does not exist', async () => {
    const testInput: CreateUserBuildInput = {
      user_id: testUserId,
      name: 'Invalid Style Build',
      description: null,
      chopper_style_id: 99999, // Non-existent chopper style ID
      is_public: false,
      build_data: '{}',
      progress_step: 0
    };

    await expect(createUserBuild(testInput)).rejects.toThrow(/chopper style with id 99999 not found/i);
  });

  it('should handle complex build data JSON', async () => {
    const complexBuildData = JSON.stringify({
      parts: [
        { id: 1, name: 'Engine', quantity: 1, price: 1500.00 },
        { id: 2, name: 'Frame', quantity: 1, price: 800.00 }
      ],
      configuration: {
        color: 'matte black',
        style: 'bobber',
        customizations: ['chrome exhaust', 'leather seat']
      },
      totalCost: 2300.00
    });

    const testInput: CreateUserBuildInput = {
      user_id: testUserId,
      name: 'Complex Build',
      description: 'Build with complex JSON data',
      chopper_style_id: testChopperStyleId,
      is_public: false,
      build_data: complexBuildData,
      progress_step: 10
    };

    const result = await createUserBuild(testInput);

    expect(result.build_data).toEqual(complexBuildData);
    expect(result.name).toEqual('Complex Build');
    expect(result.progress_step).toEqual(10);

    // Verify data persisted correctly in database
    const builds = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, result.id))
      .execute();

    expect(builds[0].build_data).toEqual(complexBuildData);
  });
});