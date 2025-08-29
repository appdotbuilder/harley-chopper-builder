import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userBuildsTable, chopperStylesTable } from '../db/schema';
import { type GetPublicBuildsInput } from '../schema';
import { getPublicBuilds } from '../handlers/get_public_builds';

describe('getPublicBuilds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only public builds', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create public and private builds with delays to ensure proper ordering
    await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Public Build 1',
        description: 'A public chopper build',
        is_public: true,
        build_data: JSON.stringify({ parts: ['engine', 'frame'] }),
        progress_step: 1
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Private Build',
        description: 'A private chopper build',
        is_public: false,
        build_data: JSON.stringify({ parts: ['engine'] }),
        progress_step: 0
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Public Build 2',
        description: 'Another public chopper build',
        is_public: true,
        build_data: JSON.stringify({ parts: ['wheels', 'handlebars'] }),
        progress_step: 2
      })
      .execute();

    const input: GetPublicBuildsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getPublicBuilds(input);

    // Should only return public builds
    expect(result).toHaveLength(2);
    expect(result.every(build => build.is_public === true)).toBe(true);
    expect(result.map(build => build.name)).toEqual(['Public Build 2', 'Public Build 1']);
  });

  it('should respect pagination parameters', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create multiple public builds
    const builds = Array.from({ length: 5 }, (_, i) => ({
      user_id: user[0].id,
      name: `Public Build ${i + 1}`,
      description: `Description for build ${i + 1}`,
      is_public: true,
      build_data: JSON.stringify({ parts: [`part${i + 1}`] }),
      progress_step: i
    }));

    await db.insert(userBuildsTable)
      .values(builds)
      .execute();

    // Test limit
    const limitedResult = await getPublicBuilds({
      limit: 3,
      offset: 0
    });

    expect(limitedResult).toHaveLength(3);

    // Test offset
    const offsetResult = await getPublicBuilds({
      limit: 2,
      offset: 2
    });

    expect(offsetResult).toHaveLength(2);
    
    // Should not overlap with first page
    const firstPageIds = limitedResult.slice(0, 2).map(build => build.id);
    const offsetIds = offsetResult.map(build => build.id);
    expect(firstPageIds.some(id => offsetIds.includes(id))).toBe(false);
  });

  it('should return builds ordered by most recent first', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create builds with slight delays to ensure different timestamps
    const build1 = await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'First Build',
        description: 'Created first',
        is_public: true,
        build_data: JSON.stringify({ parts: ['part1'] }),
        progress_step: 0
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const build2 = await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Second Build',
        description: 'Created second',
        is_public: true,
        build_data: JSON.stringify({ parts: ['part2'] }),
        progress_step: 0
      })
      .returning()
      .execute();

    const result = await getPublicBuilds({
      limit: 20,
      offset: 0
    });

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].name).toBe('Second Build');
    expect(result[1].name).toBe('First Build');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return builds with chopper style references', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create chopper style
    const style = await db.insert(chopperStylesTable)
      .values({
        name: 'Bobber',
        description: 'Low-slung classic style',
        image_url: 'https://example.com/bobber.jpg'
      })
      .returning()
      .execute();

    // Create build with and without chopper style
    await db.insert(userBuildsTable)
      .values([
        {
          user_id: user[0].id,
          name: 'Styled Build',
          description: 'Build with chopper style',
          chopper_style_id: style[0].id,
          is_public: true,
          build_data: JSON.stringify({ parts: ['engine', 'frame'] }),
          progress_step: 1
        },
        {
          user_id: user[0].id,
          name: 'Unstyled Build',
          description: 'Build without chopper style',
          chopper_style_id: null,
          is_public: true,
          build_data: JSON.stringify({ parts: ['engine'] }),
          progress_step: 0
        }
      ])
      .execute();

    const result = await getPublicBuilds({
      limit: 20,
      offset: 0
    });

    expect(result).toHaveLength(2);
    
    // Find the styled build
    const styledBuild = result.find(build => build.name === 'Styled Build');
    const unstyledBuild = result.find(build => build.name === 'Unstyled Build');
    
    expect(styledBuild).toBeDefined();
    expect(styledBuild!.chopper_style_id).toBe(style[0].id);
    
    expect(unstyledBuild).toBeDefined();
    expect(unstyledBuild!.chopper_style_id).toBeNull();
  });

  it('should return empty array when no public builds exist', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create only private builds
    await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Private Build',
        description: 'A private build',
        is_public: false,
        build_data: JSON.stringify({ parts: ['engine'] }),
        progress_step: 0
      })
      .execute();

    const result = await getPublicBuilds({
      limit: 20,
      offset: 0
    });

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle default pagination values', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create public build
    await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Test Build',
        description: 'Test description',
        is_public: true,
        build_data: JSON.stringify({ parts: ['engine'] }),
        progress_step: 0
      })
      .execute();

    // The input should have defaults applied by Zod parsing
    const input: GetPublicBuildsInput = {
      limit: 20,  // Default from Zod
      offset: 0   // Default from Zod
    };

    const result = await getPublicBuilds(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Build');
  });

  it('should return builds with all required fields', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create comprehensive build
    await db.insert(userBuildsTable)
      .values({
        user_id: user[0].id,
        name: 'Complete Build',
        description: 'A complete build with all fields',
        chopper_style_id: null,
        is_public: true,
        build_data: JSON.stringify({ 
          parts: ['engine', 'frame', 'wheels'], 
          config: { color: 'black' } 
        }),
        progress_step: 3
      })
      .execute();

    const result = await getPublicBuilds({
      limit: 20,
      offset: 0
    });

    expect(result).toHaveLength(1);
    const build = result[0];
    
    // Verify all fields are present and have correct types
    expect(typeof build.id).toBe('number');
    expect(typeof build.user_id).toBe('number');
    expect(typeof build.name).toBe('string');
    expect(build.description).toBe('A complete build with all fields');
    expect(build.chopper_style_id).toBeNull();
    expect(build.is_public).toBe(true);
    expect(typeof build.build_data).toBe('string');
    expect(build.progress_step).toBe(3);
    expect(build.created_at).toBeInstanceOf(Date);
    expect(build.updated_at).toBeInstanceOf(Date);
    
    // Verify build_data can be parsed as JSON
    const parsedBuildData = JSON.parse(build.build_data);
    expect(parsedBuildData.parts).toEqual(['engine', 'frame', 'wheels']);
    expect(parsedBuildData.config.color).toBe('black');
  });
});