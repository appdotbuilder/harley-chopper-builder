import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partCategoriesTable } from '../db/schema';
import { getPartCategories } from '../handlers/get_part_categories';

describe('getPartCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getPartCategories();
    expect(result).toEqual([]);
  });

  it('should return all part categories', async () => {
    // Create test categories
    await db.insert(partCategoriesTable)
      .values([
        { name: 'Engine', description: 'Motorcycle engines and components' },
        { name: 'Frame', description: 'Chassis and frame components' },
        { name: 'Wheels', description: 'Wheels, rims, and tire components' }
      ])
      .execute();

    const result = await getPartCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Engine');
    expect(result[0].description).toEqual('Motorcycle engines and components');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify all categories are returned
    const categoryNames = result.map(cat => cat.name);
    expect(categoryNames).toContain('Engine');
    expect(categoryNames).toContain('Frame');
    expect(categoryNames).toContain('Wheels');
  });

  it('should return categories sorted by name', async () => {
    // Create categories in non-alphabetical order
    await db.insert(partCategoriesTable)
      .values([
        { name: 'Wheels', description: 'Wheels and tires' },
        { name: 'Engine', description: 'Engine components' },
        { name: 'Frame', description: 'Frame components' },
        { name: 'Brakes', description: 'Brake systems' }
      ])
      .execute();

    const result = await getPartCategories();

    expect(result).toHaveLength(4);
    
    // Verify alphabetical ordering
    const categoryNames = result.map(cat => cat.name);
    expect(categoryNames).toEqual(['Brakes', 'Engine', 'Frame', 'Wheels']);
  });

  it('should handle single category correctly', async () => {
    // Create single test category
    await db.insert(partCategoriesTable)
      .values({ name: 'Handlebars', description: 'Steering and handlebar components' })
      .execute();

    const result = await getPartCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Handlebars');
    expect(result[0].description).toEqual('Steering and handlebar components');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return categories with proper field types', async () => {
    // Create test category
    await db.insert(partCategoriesTable)
      .values({ name: 'Exhaust', description: 'Exhaust systems and pipes' })
      .execute();

    const result = await getPartCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    
    // Verify field types
    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.description).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
  });
});