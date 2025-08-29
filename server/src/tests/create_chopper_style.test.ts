import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chopperStylesTable } from '../db/schema';
import { type CreateChopperStyleInput } from '../schema';
import { createChopperStyle } from '../handlers/create_chopper_style';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateChopperStyleInput = {
  name: 'Bobber',
  description: 'A minimalist motorcycle style with a stripped-down appearance, low seat height, and classic aesthetic.',
  image_url: 'https://example.com/bobber.jpg'
};

// Test input with nullable image_url
const testInputNoImage: CreateChopperStyleInput = {
  name: 'Cafe Racer',
  description: 'A sport motorcycle style optimized for speed and handling with a distinctive racing crouch riding position.',
  image_url: null
};

describe('createChopperStyle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chopper style with all fields', async () => {
    const result = await createChopperStyle(testInput);

    // Basic field validation
    expect(result.name).toEqual('Bobber');
    expect(result.description).toEqual(testInput.description);
    expect(result.image_url).toEqual('https://example.com/bobber.jpg');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a chopper style with null image_url', async () => {
    const result = await createChopperStyle(testInputNoImage);

    // Validate fields including null image_url
    expect(result.name).toEqual('Cafe Racer');
    expect(result.description).toEqual(testInputNoImage.description);
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chopper style to database', async () => {
    const result = await createChopperStyle(testInput);

    // Query database to verify record was saved
    const styles = await db.select()
      .from(chopperStylesTable)
      .where(eq(chopperStylesTable.id, result.id))
      .execute();

    expect(styles).toHaveLength(1);
    expect(styles[0].name).toEqual('Bobber');
    expect(styles[0].description).toEqual(testInput.description);
    expect(styles[0].image_url).toEqual('https://example.com/bobber.jpg');
    expect(styles[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple chopper styles with different names', async () => {
    // Create first style
    const result1 = await createChopperStyle(testInput);
    
    // Create second style
    const result2 = await createChopperStyle(testInputNoImage);

    // Verify both were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Bobber');
    expect(result2.name).toEqual('Cafe Racer');

    // Verify both are in database
    const allStyles = await db.select()
      .from(chopperStylesTable)
      .execute();

    expect(allStyles).toHaveLength(2);
    
    const names = allStyles.map(style => style.name).sort();
    expect(names).toEqual(['Bobber', 'Cafe Racer']);
  });

  it('should handle long descriptions', async () => {
    const longDescriptionInput: CreateChopperStyleInput = {
      name: 'Custom Chopper',
      description: 'A highly customized motorcycle with extended front forks, raked frame geometry, and unique styling elements that reflect the builder\'s personal aesthetic vision and engineering preferences.',
      image_url: null
    };

    const result = await createChopperStyle(longDescriptionInput);

    expect(result.name).toEqual('Custom Chopper');
    expect(result.description).toEqual(longDescriptionInput.description);
    expect(result.description.length).toBeGreaterThan(100);
  });
});