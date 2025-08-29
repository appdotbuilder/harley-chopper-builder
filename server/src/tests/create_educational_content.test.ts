import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput } from '../schema';
import { createEducationalContent } from '../handlers/create_educational_content';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateEducationalContentInput = {
  title: 'Harley Davidson Chopper History',
  content: 'A comprehensive guide to the evolution of Harley Davidson chopper motorcycles and their cultural impact.',
  content_type: 'history',
  image_url: 'https://example.com/chopper-history.jpg',
  video_url: 'https://youtube.com/watch?v=example',
  tags: '["chopper", "harley", "history", "motorcycle"]'
};

// Minimal test input
const minimalInput: CreateEducationalContentInput = {
  title: 'Basic Chopper Guide',
  content: 'Simple introduction to choppers.',
  content_type: 'general',
  image_url: null,
  video_url: null,
  tags: null
};

describe('createEducationalContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create educational content with all fields', async () => {
    const result = await createEducationalContent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Harley Davidson Chopper History');
    expect(result.content).toEqual(testInput.content);
    expect(result.content_type).toEqual('history');
    expect(result.image_url).toEqual('https://example.com/chopper-history.jpg');
    expect(result.video_url).toEqual('https://youtube.com/watch?v=example');
    expect(result.tags).toEqual('["chopper", "harley", "history", "motorcycle"]');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create educational content with minimal fields', async () => {
    const result = await createEducationalContent(minimalInput);

    expect(result.title).toEqual('Basic Chopper Guide');
    expect(result.content).toEqual('Simple introduction to choppers.');
    expect(result.content_type).toEqual('general');
    expect(result.image_url).toBeNull();
    expect(result.video_url).toBeNull();
    expect(result.tags).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save educational content to database', async () => {
    const result = await createEducationalContent(testInput);

    // Query database to verify content was saved
    const contents = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, result.id))
      .execute();

    expect(contents).toHaveLength(1);
    expect(contents[0].title).toEqual('Harley Davidson Chopper History');
    expect(contents[0].content).toEqual(testInput.content);
    expect(contents[0].content_type).toEqual('history');
    expect(contents[0].image_url).toEqual('https://example.com/chopper-history.jpg');
    expect(contents[0].video_url).toEqual('https://youtube.com/watch?v=example');
    expect(contents[0].tags).toEqual('["chopper", "harley", "history", "motorcycle"]');
    expect(contents[0].created_at).toBeInstanceOf(Date);
    expect(contents[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create content with different content types', async () => {
    const styleGuideInput: CreateEducationalContentInput = {
      title: 'Chopper Style Guide',
      content: 'Guide to different chopper styles and their characteristics.',
      content_type: 'style_guide',
      image_url: null,
      video_url: null,
      tags: null
    };

    const partInfoInput: CreateEducationalContentInput = {
      title: 'Engine Parts Overview',
      content: 'Detailed information about Harley engine components.',
      content_type: 'part_info',
      image_url: null,
      video_url: null,
      tags: null
    };

    const styleResult = await createEducationalContent(styleGuideInput);
    const partResult = await createEducationalContent(partInfoInput);

    expect(styleResult.content_type).toEqual('style_guide');
    expect(partResult.content_type).toEqual('part_info');

    // Verify both were saved to database
    const allContents = await db.select()
      .from(educationalContentTable)
      .execute();

    expect(allContents).toHaveLength(2);
    const contentTypes = allContents.map(c => c.content_type).sort();
    expect(contentTypes).toEqual(['part_info', 'style_guide']);
  });

  it('should handle JSON tags correctly', async () => {
    const complexTagsInput: CreateEducationalContentInput = {
      title: 'Advanced Chopper Building',
      content: 'Advanced techniques for building custom choppers.',
      content_type: 'general',
      image_url: null,
      video_url: null,
      tags: '["advanced", "custom", "chopper", "building", "techniques", "harley-davidson"]'
    };

    const result = await createEducationalContent(complexTagsInput);

    expect(result.tags).toEqual('["advanced", "custom", "chopper", "building", "techniques", "harley-davidson"]');

    // Verify tags are stored correctly in database
    const content = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, result.id))
      .execute();

    expect(content[0].tags).toEqual('["advanced", "custom", "chopper", "building", "techniques", "harley-davidson"]');
  });
});