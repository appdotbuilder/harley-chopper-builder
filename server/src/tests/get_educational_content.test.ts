import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type GetEducationalContentInput, type CreateEducationalContentInput } from '../schema';
import { getEducationalContent } from '../handlers/get_educational_content';
import { eq } from 'drizzle-orm';

// Test data
const testContent: CreateEducationalContentInput[] = [
  {
    title: 'History of Harley Davidson Choppers',
    content: 'Choppers emerged in the 1960s as a way to customize motorcycles...',
    content_type: 'history',
    image_url: 'https://example.com/history.jpg',
    video_url: null,
    tags: '["harley", "1960s", "customization"]'
  },
  {
    title: 'Bobber vs Chopper: Style Guide',
    content: 'Understanding the key differences between bobber and chopper styles...',
    content_type: 'style_guide',
    image_url: null,
    video_url: 'https://example.com/styles.mp4',
    tags: '["bobber", "chopper", "comparison"]'
  },
  {
    title: 'Engine Specifications Guide',
    content: 'Complete guide to Harley engine specs and compatibility...',
    content_type: 'part_info',
    image_url: 'https://example.com/engine.jpg',
    video_url: null,
    tags: '["engine", "specs", "compatibility"]'
  },
  {
    title: 'Motorcycle Safety Tips',
    content: 'Essential safety guidelines for motorcycle enthusiasts...',
    content_type: 'general',
    image_url: null,
    video_url: null,
    tags: '["safety", "tips", "general"]'
  }
];

describe('getEducationalContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test content
  const createTestContent = async () => {
    const results = [];
    for (const content of testContent) {
      const result = await db.insert(educationalContentTable)
        .values(content)
        .returning()
        .execute();
      results.push(result[0]);
    }
    return results;
  };

  it('should return all educational content when no filter is provided', async () => {
    // Create test content
    await createTestContent();

    const input: GetEducationalContentInput = {};
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(4);
    
    // Verify all content types are present
    const contentTypes = result.map(item => item.content_type);
    expect(contentTypes).toContain('history');
    expect(contentTypes).toContain('style_guide');
    expect(contentTypes).toContain('part_info');
    expect(contentTypes).toContain('general');

    // Verify structure of first result
    const firstItem = result[0];
    expect(firstItem.id).toBeDefined();
    expect(firstItem.title).toBeDefined();
    expect(firstItem.content).toBeDefined();
    expect(firstItem.content_type).toBeDefined();
    expect(firstItem.created_at).toBeInstanceOf(Date);
    expect(firstItem.updated_at).toBeInstanceOf(Date);
  });

  it('should filter by history content type', async () => {
    await createTestContent();

    const input: GetEducationalContentInput = {
      content_type: 'history'
    };
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].content_type).toEqual('history');
    expect(result[0].title).toEqual('History of Harley Davidson Choppers');
    expect(result[0].image_url).toEqual('https://example.com/history.jpg');
    expect(result[0].tags).toEqual('["harley", "1960s", "customization"]');
  });

  it('should filter by style_guide content type', async () => {
    await createTestContent();

    const input: GetEducationalContentInput = {
      content_type: 'style_guide'
    };
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].content_type).toEqual('style_guide');
    expect(result[0].title).toEqual('Bobber vs Chopper: Style Guide');
    expect(result[0].video_url).toEqual('https://example.com/styles.mp4');
    expect(result[0].image_url).toBeNull();
  });

  it('should filter by part_info content type', async () => {
    await createTestContent();

    const input: GetEducationalContentInput = {
      content_type: 'part_info'
    };
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].content_type).toEqual('part_info');
    expect(result[0].title).toEqual('Engine Specifications Guide');
    expect(result[0].content).toContain('engine specs');
  });

  it('should filter by general content type', async () => {
    await createTestContent();

    const input: GetEducationalContentInput = {
      content_type: 'general'
    };
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].content_type).toEqual('general');
    expect(result[0].title).toEqual('Motorcycle Safety Tips');
    expect(result[0].video_url).toBeNull();
    expect(result[0].image_url).toBeNull();
  });

  it('should return empty array when no content matches filter', async () => {
    // Create only history content
    await db.insert(educationalContentTable)
      .values({
        title: 'Test History',
        content: 'Test content',
        content_type: 'history',
        image_url: null,
        video_url: null,
        tags: null
      })
      .execute();

    const input: GetEducationalContentInput = {
      content_type: 'style_guide'
    };
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no content exists', async () => {
    const input: GetEducationalContentInput = {};
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(0);
  });

  it('should handle null optional fields correctly', async () => {
    await db.insert(educationalContentTable)
      .values({
        title: 'Minimal Content',
        content: 'Basic content with minimal fields',
        content_type: 'general',
        image_url: null,
        video_url: null,
        tags: null
      })
      .execute();

    const input: GetEducationalContentInput = {};
    const result = await getEducationalContent(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Content');
    expect(result[0].image_url).toBeNull();
    expect(result[0].video_url).toBeNull();
    expect(result[0].tags).toBeNull();
  });

  it('should save content to database correctly', async () => {
    const createdContent = await createTestContent();
    
    // Verify content was saved correctly
    const savedContent = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, createdContent[0].id))
      .execute();

    expect(savedContent).toHaveLength(1);
    expect(savedContent[0].title).toEqual('History of Harley Davidson Choppers');
    expect(savedContent[0].content_type).toEqual('history');
    expect(savedContent[0].created_at).toBeInstanceOf(Date);
    expect(savedContent[0].updated_at).toBeInstanceOf(Date);
  });
});