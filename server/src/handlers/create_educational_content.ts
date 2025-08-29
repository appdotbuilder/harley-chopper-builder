import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput, type EducationalContent } from '../schema';

export const createEducationalContent = async (input: CreateEducationalContentInput): Promise<EducationalContent> => {
  try {
    // Insert educational content record
    const result = await db.insert(educationalContentTable)
      .values({
        title: input.title,
        content: input.content,
        content_type: input.content_type,
        image_url: input.image_url,
        video_url: input.video_url,
        tags: input.tags
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Educational content creation failed:', error);
    throw error;
  }
};