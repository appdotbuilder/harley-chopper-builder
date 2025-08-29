import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userBuildsTable, chopperStylesTable } from '../db/schema';
import { type GetBuildDetailsInput } from '../schema';
import { getBuildDetails } from '../handlers/get_build_details';

describe('getBuildDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return build details when build exists', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test chopper style
    const styleResult = await db.insert(chopperStylesTable)
      .values({
        name: 'Test Style',
        description: 'A test chopper style',
        image_url: 'http://example.com/style.jpg'
      })
      .returning()
      .execute();

    const styleId = styleResult[0].id;

    // Create test build
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userId,
        name: 'Test Build',
        description: 'A test build description',
        chopper_style_id: styleId,
        is_public: true,
        build_data: '{"frame": "custom", "engine": "v-twin"}',
        progress_step: 5
      })
      .returning()
      .execute();

    const buildId = buildResult[0].id;

    // Test the handler
    const input: GetBuildDetailsInput = {
      build_id: buildId
    };

    const result = await getBuildDetails(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(buildId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.name).toEqual('Test Build');
    expect(result!.description).toEqual('A test build description');
    expect(result!.chopper_style_id).toEqual(styleId);
    expect(result!.is_public).toEqual(true);
    expect(result!.build_data).toEqual('{"frame": "custom", "engine": "v-twin"}');
    expect(result!.progress_step).toEqual(5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when build does not exist', async () => {
    const input: GetBuildDetailsInput = {
      build_id: 999
    };

    const result = await getBuildDetails(input);

    expect(result).toBeNull();
  });

  it('should handle builds with minimal data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create build with minimal required fields (no optional fields)
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userId,
        name: 'Minimal Build',
        description: null, // nullable field
        chopper_style_id: null, // nullable field
        is_public: false, // default value
        build_data: '{}',
        progress_step: 0 // default value
      })
      .returning()
      .execute();

    const buildId = buildResult[0].id;

    // Test the handler
    const input: GetBuildDetailsInput = {
      build_id: buildId
    };

    const result = await getBuildDetails(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(buildId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.name).toEqual('Minimal Build');
    expect(result!.description).toBeNull();
    expect(result!.chopper_style_id).toBeNull();
    expect(result!.is_public).toEqual(false);
    expect(result!.build_data).toEqual('{}');
    expect(result!.progress_step).toEqual(0);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle builds with complex build data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'complexuser',
        email: 'complex@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const complexBuildData = JSON.stringify({
      frame: {
        type: 'hardtail',
        material: 'steel',
        color: 'black'
      },
      engine: {
        type: 'v-twin',
        displacement: '1200cc',
        brand: 'custom'
      },
      wheels: {
        front: '21inch',
        rear: '16inch',
        style: 'spoked'
      },
      parts: [
        { id: 1, name: 'Custom Handlebars', quantity: 1 },
        { id: 2, name: 'Leather Seat', quantity: 1 }
      ]
    });

    // Create build with complex build data
    const buildResult = await db.insert(userBuildsTable)
      .values({
        user_id: userId,
        name: 'Complex Build',
        description: 'A build with complex configuration',
        chopper_style_id: null,
        is_public: true,
        build_data: complexBuildData,
        progress_step: 10
      })
      .returning()
      .execute();

    const buildId = buildResult[0].id;

    // Test the handler
    const input: GetBuildDetailsInput = {
      build_id: buildId
    };

    const result = await getBuildDetails(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(buildId);
    expect(result!.name).toEqual('Complex Build');
    expect(result!.build_data).toEqual(complexBuildData);
    expect(result!.progress_step).toEqual(10);

    // Verify the build data can be parsed as JSON
    const parsedData = JSON.parse(result!.build_data);
    expect(parsedData.frame.type).toEqual('hardtail');
    expect(parsedData.engine.displacement).toEqual('1200cc');
    expect(parsedData.parts).toHaveLength(2);
    expect(parsedData.parts[0].name).toEqual('Custom Handlebars');
  });
});