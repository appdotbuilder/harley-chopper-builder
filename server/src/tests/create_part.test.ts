import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partsTable, partCategoriesTable } from '../db/schema';
import { type CreatePartInput } from '../schema';
import { createPart } from '../handlers/create_part';
import { eq } from 'drizzle-orm';

describe('createPart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCategoryId: number;

  beforeEach(async () => {
    // Create a test category first since parts need a valid category_id
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    
    testCategoryId = categoryResult[0].id;
  });

  const testInput: CreatePartInput = {
    name: 'Test Part',
    description: 'A motorcycle part for testing',
    category_id: 0, // Will be set in each test
    price: 99.99,
    image_url: 'https://example.com/part.jpg',
    specifications: '{"material": "steel", "weight": "2kg"}',
    compatibility: '{"models": ["Harley Davidson", "Indian"]}'
  };

  it('should create a part', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createPart(input);

    // Basic field validation
    expect(result.name).toEqual('Test Part');
    expect(result.description).toEqual(input.description);
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.price).toEqual(99.99);
    expect(typeof result.price).toEqual('number');
    expect(result.image_url).toEqual(input.image_url);
    expect(result.specifications).toEqual(input.specifications);
    expect(result.compatibility).toEqual(input.compatibility);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save part to database', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createPart(input);

    // Query using proper drizzle syntax
    const parts = await db.select()
      .from(partsTable)
      .where(eq(partsTable.id, result.id))
      .execute();

    expect(parts).toHaveLength(1);
    expect(parts[0].name).toEqual('Test Part');
    expect(parts[0].description).toEqual(input.description);
    expect(parts[0].category_id).toEqual(testCategoryId);
    expect(parseFloat(parts[0].price)).toEqual(99.99);
    expect(parts[0].image_url).toEqual(input.image_url);
    expect(parts[0].specifications).toEqual(input.specifications);
    expect(parts[0].compatibility).toEqual(input.compatibility);
    expect(parts[0].created_at).toBeInstanceOf(Date);
  });

  it('should create part with null optional fields', async () => {
    const input: CreatePartInput = {
      name: 'Minimal Part',
      description: 'A part with minimal info',
      category_id: testCategoryId,
      price: 25.50,
      image_url: null,
      specifications: null,
      compatibility: null
    };

    const result = await createPart(input);

    expect(result.name).toEqual('Minimal Part');
    expect(result.price).toEqual(25.50);
    expect(typeof result.price).toEqual('number');
    expect(result.image_url).toBeNull();
    expect(result.specifications).toBeNull();
    expect(result.compatibility).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should create multiple parts with different prices', async () => {
    const inputs = [
      { ...testInput, category_id: testCategoryId, name: 'Part 1', price: 10.99 },
      { ...testInput, category_id: testCategoryId, name: 'Part 2', price: 150.00 },
      { ...testInput, category_id: testCategoryId, name: 'Part 3', price: 1200.99 }
    ];

    const results = await Promise.all(inputs.map(input => createPart(input)));

    expect(results).toHaveLength(3);
    expect(results[0].price).toEqual(10.99);
    expect(results[1].price).toEqual(150.00);
    expect(results[2].price).toEqual(1200.99);
    
    // Verify all are numbers
    results.forEach(result => {
      expect(typeof result.price).toEqual('number');
    });
  });

  it('should reject part creation with non-existent category', async () => {
    const input = { ...testInput, category_id: 99999 };

    await expect(createPart(input)).rejects.toThrow(/category.*does not exist/i);
  });

  it('should create part with JSON specifications and compatibility', async () => {
    const input = {
      ...testInput,
      category_id: testCategoryId,
      specifications: '{"material": "aluminum", "weight": "1.5kg", "dimensions": "10x5x3cm"}',
      compatibility: '{"models": ["Honda", "Yamaha", "Kawasaki"], "years": [2020, 2021, 2022]}'
    };

    const result = await createPart(input);

    expect(result.specifications).toEqual(input.specifications);
    expect(result.compatibility).toEqual(input.compatibility);
    
    // Verify the JSON strings are valid
    expect(() => JSON.parse(result.specifications!)).not.toThrow();
    expect(() => JSON.parse(result.compatibility!)).not.toThrow();
    
    const specs = JSON.parse(result.specifications!);
    const compat = JSON.parse(result.compatibility!);
    
    expect(specs.material).toEqual('aluminum');
    expect(compat.models).toContain('Honda');
    expect(compat.years).toContain(2020);
  });
});