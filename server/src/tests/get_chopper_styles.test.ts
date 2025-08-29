import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chopperStylesTable } from '../db/schema';
import { getChopperStyles } from '../handlers/get_chopper_styles';

describe('getChopperStyles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no chopper styles exist', async () => {
    const result = await getChopperStyles();

    expect(result).toEqual([]);
  });

  it('should return all chopper styles', async () => {
    // Create test chopper styles
    await db.insert(chopperStylesTable).values([
      {
        name: 'Classic Bobber',
        description: 'A minimalist chopper with stripped-down aesthetics',
        image_url: 'https://example.com/bobber.jpg'
      },
      {
        name: 'West Coast Chopper',
        description: 'Long fork, extended frame chopper style',
        image_url: null
      },
      {
        name: 'Rigid Frame',
        description: 'Traditional hardtail frame with no rear suspension',
        image_url: 'https://example.com/rigid.jpg'
      }
    ]).execute();

    const result = await getChopperStyles();

    expect(result).toHaveLength(3);
    
    // Verify all fields are present and correct
    expect(result[0]).toMatchObject({
      name: 'Classic Bobber',
      description: 'A minimalist chopper with stripped-down aesthetics',
      image_url: 'https://example.com/bobber.jpg'
    });
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1]).toMatchObject({
      name: 'West Coast Chopper',
      description: 'Long fork, extended frame chopper style',
      image_url: null
    });
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    expect(result[2]).toMatchObject({
      name: 'Rigid Frame',
      description: 'Traditional hardtail frame with no rear suspension',
      image_url: 'https://example.com/rigid.jpg'
    });
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return chopper styles ordered by creation date', async () => {
    // Create test chopper styles with slight delays to ensure different timestamps
    await db.insert(chopperStylesTable).values({
      name: 'First Style',
      description: 'First created style',
      image_url: null
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(chopperStylesTable).values({
      name: 'Second Style',
      description: 'Second created style',
      image_url: null
    }).execute();

    const result = await getChopperStyles();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First Style');
    expect(result[1].name).toBe('Second Style');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle nullable image_url field correctly', async () => {
    await db.insert(chopperStylesTable).values([
      {
        name: 'Style with Image',
        description: 'Has an image URL',
        image_url: 'https://example.com/image.jpg'
      },
      {
        name: 'Style without Image',
        description: 'No image URL',
        image_url: null
      }
    ]).execute();

    const result = await getChopperStyles();

    expect(result).toHaveLength(2);
    
    const styleWithImage = result.find(style => style.name === 'Style with Image');
    const styleWithoutImage = result.find(style => style.name === 'Style without Image');

    expect(styleWithImage?.image_url).toBe('https://example.com/image.jpg');
    expect(styleWithoutImage?.image_url).toBeNull();
  });

  it('should maintain data integrity with special characters', async () => {
    const specialDescription = 'Style with "quotes", apostrophes\', and symbols: @#$%';
    
    await db.insert(chopperStylesTable).values({
      name: 'Special Characters Style',
      description: specialDescription,
      image_url: 'https://example.com/special-chars.jpg'
    }).execute();

    const result = await getChopperStyles();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe(specialDescription);
    expect(result[0].name).toBe('Special Characters Style');
  });
});