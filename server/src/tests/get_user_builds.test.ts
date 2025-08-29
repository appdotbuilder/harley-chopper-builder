import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userBuildsTable, chopperStylesTable } from '../db/schema';
import { type GetUserBuildsInput } from '../schema';
import { getUserBuilds } from '../handlers/get_user_builds';
import { eq } from 'drizzle-orm';

describe('getUserBuilds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return builds for specific user', async () => {
    // Create test users
    const [user1] = await db.insert(usersTable)
      .values({
        username: 'testuser1',
        email: 'test1@example.com'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();

    // Create test chopper style
    const [chopperStyle] = await db.insert(chopperStylesTable)
      .values({
        name: 'Bobber',
        description: 'Classic bobber style'
      })
      .returning()
      .execute();

    // Create builds for user1
    const user1Builds = [
      {
        user_id: user1.id,
        name: 'My First Bobber',
        description: 'A simple bobber build',
        chopper_style_id: chopperStyle.id,
        is_public: true,
        build_data: '{"engine": "sportster", "wheels": "spokes"}',
        progress_step: 3
      },
      {
        user_id: user1.id,
        name: 'Custom Chopper',
        description: null,
        chopper_style_id: null,
        is_public: false,
        build_data: '{"engine": "big_twin", "forks": "springer"}',
        progress_step: 1
      }
    ];

    // Create build for user2 (should not be returned)
    const user2Build = {
      user_id: user2.id,
      name: 'User2 Build',
      description: 'Should not appear in user1 results',
      chopper_style_id: chopperStyle.id,
      is_public: true,
      build_data: '{"engine": "evo"}',
      progress_step: 0
    };

    // Insert all builds
    await db.insert(userBuildsTable)
      .values([...user1Builds, user2Build])
      .execute();

    const input: GetUserBuildsInput = {
      user_id: user1.id
    };

    const result = await getUserBuilds(input);

    // Should return only user1's builds
    expect(result).toHaveLength(2);
    
    // Verify all returned builds belong to user1
    result.forEach(build => {
      expect(build.user_id).toBe(user1.id);
    });

    // Check specific builds
    const firstBuild = result.find(b => b.name === 'My First Bobber');
    expect(firstBuild).toBeDefined();
    expect(firstBuild!.description).toBe('A simple bobber build');
    expect(firstBuild!.chopper_style_id).toBe(chopperStyle.id);
    expect(firstBuild!.is_public).toBe(true);
    expect(firstBuild!.build_data).toBe('{"engine": "sportster", "wheels": "spokes"}');
    expect(firstBuild!.progress_step).toBe(3);
    expect(firstBuild!.created_at).toBeInstanceOf(Date);
    expect(firstBuild!.updated_at).toBeInstanceOf(Date);

    const secondBuild = result.find(b => b.name === 'Custom Chopper');
    expect(secondBuild).toBeDefined();
    expect(secondBuild!.description).toBeNull();
    expect(secondBuild!.chopper_style_id).toBeNull();
    expect(secondBuild!.is_public).toBe(false);
    expect(secondBuild!.build_data).toBe('{"engine": "big_twin", "forks": "springer"}');
    expect(secondBuild!.progress_step).toBe(1);
  });

  it('should return empty array for user with no builds', async () => {
    // Create user with no builds
    const [user] = await db.insert(usersTable)
      .values({
        username: 'userwithnobuild',
        email: 'nobilds@example.com'
      })
      .returning()
      .execute();

    const input: GetUserBuildsInput = {
      user_id: user.id
    };

    const result = await getUserBuilds(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserBuildsInput = {
      user_id: 99999 // Non-existent user ID
    };

    const result = await getUserBuilds(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle builds with various progress steps', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'progressuser',
        email: 'progress@example.com'
      })
      .returning()
      .execute();

    // Create builds with different progress steps
    const builds = [
      {
        user_id: user.id,
        name: 'Build at Step 0',
        build_data: '{}',
        progress_step: 0
      },
      {
        user_id: user.id,
        name: 'Build at Step 5',
        build_data: '{}',
        progress_step: 5
      },
      {
        user_id: user.id,
        name: 'Build at Step 10',
        build_data: '{}',
        progress_step: 10
      }
    ];

    await db.insert(userBuildsTable)
      .values(builds)
      .execute();

    const input: GetUserBuildsInput = {
      user_id: user.id
    };

    const result = await getUserBuilds(input);

    expect(result).toHaveLength(3);
    
    // Verify progress steps are maintained correctly
    const step0Build = result.find(b => b.name === 'Build at Step 0');
    const step5Build = result.find(b => b.name === 'Build at Step 5');
    const step10Build = result.find(b => b.name === 'Build at Step 10');

    expect(step0Build!.progress_step).toBe(0);
    expect(step5Build!.progress_step).toBe(5);
    expect(step10Build!.progress_step).toBe(10);
  });

  it('should handle builds with mixed public/private status', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'mixeduser',
        email: 'mixed@example.com'
      })
      .returning()
      .execute();

    // Create builds with mixed public status
    const builds = [
      {
        user_id: user.id,
        name: 'Public Build',
        build_data: '{}',
        is_public: true
      },
      {
        user_id: user.id,
        name: 'Private Build',
        build_data: '{}',
        is_public: false
      }
    ];

    await db.insert(userBuildsTable)
      .values(builds)
      .execute();

    const input: GetUserBuildsInput = {
      user_id: user.id
    };

    const result = await getUserBuilds(input);

    expect(result).toHaveLength(2);
    
    const publicBuild = result.find(b => b.name === 'Public Build');
    const privateBuild = result.find(b => b.name === 'Private Build');

    expect(publicBuild!.is_public).toBe(true);
    expect(privateBuild!.is_public).toBe(false);
  });

  it('should save builds to database correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'dbuser',
        email: 'db@example.com'
      })
      .returning()
      .execute();

    // Create test build
    const [insertedBuild] = await db.insert(userBuildsTable)
      .values({
        user_id: user.id,
        name: 'Database Test Build',
        description: 'Testing database persistence',
        build_data: '{"test": "data"}',
        progress_step: 2,
        is_public: true
      })
      .returning()
      .execute();

    const input: GetUserBuildsInput = {
      user_id: user.id
    };

    const result = await getUserBuilds(input);

    expect(result).toHaveLength(1);

    // Verify data matches what was inserted
    const retrievedBuild = result[0];
    expect(retrievedBuild.id).toBe(insertedBuild.id);
    expect(retrievedBuild.user_id).toBe(user.id);
    expect(retrievedBuild.name).toBe('Database Test Build');
    expect(retrievedBuild.description).toBe('Testing database persistence');
    expect(retrievedBuild.build_data).toBe('{"test": "data"}');
    expect(retrievedBuild.progress_step).toBe(2);
    expect(retrievedBuild.is_public).toBe(true);
    expect(retrievedBuild.created_at).toBeInstanceOf(Date);
    expect(retrievedBuild.updated_at).toBeInstanceOf(Date);

    // Verify data consistency in database
    const dbBuilds = await db.select()
      .from(userBuildsTable)
      .where(eq(userBuildsTable.id, insertedBuild.id))
      .execute();

    expect(dbBuilds).toHaveLength(1);
    expect(dbBuilds[0].name).toBe('Database Test Build');
    expect(dbBuilds[0].user_id).toBe(user.id);
  });
});