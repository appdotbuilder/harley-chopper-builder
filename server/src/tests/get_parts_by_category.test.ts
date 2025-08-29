import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partCategoriesTable, partsTable } from '../db/schema';
import { type GetPartsByCategoryInput } from '../schema';
import { getPartsByCategory } from '../handlers/get_parts_by_category';

describe('getPartsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return parts for a valid category', async () => {
    // Create a test category
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Engine Parts',
        description: 'Various engine components'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test parts in the category
    await db.insert(partsTable)
      .values([
        {
          name: 'V-Twin Engine',
          description: 'High performance V-Twin engine',
          category_id: categoryId,
          price: '2500.99',
          specifications: '{"cylinders": 2, "displacement": "1200cc"}',
          compatibility: '["cruiser", "touring"]'
        },
        {
          name: 'Air Filter',
          description: 'High flow air filter',
          category_id: categoryId,
          price: '89.50',
          image_url: 'http://example.com/filter.jpg',
          specifications: '{"material": "cotton", "flow_rate": "high"}',
          compatibility: '["universal"]'
        }
      ])
      .execute();

    const input: GetPartsByCategoryInput = {
      category_id: categoryId
    };

    const result = await getPartsByCategory(input);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first part
    const vtwinEngine = result.find(p => p.name === 'V-Twin Engine');
    expect(vtwinEngine).toBeDefined();
    expect(vtwinEngine!.description).toEqual('High performance V-Twin engine');
    expect(vtwinEngine!.category_id).toEqual(categoryId);
    expect(vtwinEngine!.price).toEqual(2500.99);
    expect(typeof vtwinEngine!.price).toBe('number');
    expect(vtwinEngine!.specifications).toEqual('{"cylinders": 2, "displacement": "1200cc"}');
    expect(vtwinEngine!.compatibility).toEqual('["cruiser", "touring"]');
    expect(vtwinEngine!.image_url).toBeNull();
    expect(vtwinEngine!.id).toBeDefined();
    expect(vtwinEngine!.created_at).toBeInstanceOf(Date);

    // Check second part
    const airFilter = result.find(p => p.name === 'Air Filter');
    expect(airFilter).toBeDefined();
    expect(airFilter!.description).toEqual('High flow air filter');
    expect(airFilter!.category_id).toEqual(categoryId);
    expect(airFilter!.price).toEqual(89.50);
    expect(typeof airFilter!.price).toBe('number');
    expect(airFilter!.image_url).toEqual('http://example.com/filter.jpg');
    expect(airFilter!.specifications).toEqual('{"material": "cotton", "flow_rate": "high"}');
    expect(airFilter!.compatibility).toEqual('["universal"]');
  });

  it('should return empty array for category with no parts', async () => {
    // Create a category but no parts
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Empty Category',
        description: 'A category with no parts'
      })
      .returning()
      .execute();

    const input: GetPartsByCategoryInput = {
      category_id: categoryResult[0].id
    };

    const result = await getPartsByCategory(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent category', async () => {
    const input: GetPartsByCategoryInput = {
      category_id: 99999
    };

    const result = await getPartsByCategory(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle multiple parts with different prices correctly', async () => {
    // Create a test category
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Exhaust Parts',
        description: 'Exhaust system components'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create parts with different price formats
    await db.insert(partsTable)
      .values([
        {
          name: 'Basic Muffler',
          description: 'Standard muffler',
          category_id: categoryId,
          price: '150.00'
        },
        {
          name: 'Performance Exhaust',
          description: 'High performance exhaust system',
          category_id: categoryId,
          price: '899.99'
        },
        {
          name: 'Exhaust Tip',
          description: 'Chrome exhaust tip',
          category_id: categoryId,
          price: '25.50'
        }
      ])
      .execute();

    const input: GetPartsByCategoryInput = {
      category_id: categoryId
    };

    const result = await getPartsByCategory(input);

    expect(result).toHaveLength(3);

    // Verify all prices are correctly converted to numbers
    result.forEach(part => {
      expect(typeof part.price).toBe('number');
    });

    // Verify specific price values
    const basicMuffler = result.find(p => p.name === 'Basic Muffler');
    const performanceExhaust = result.find(p => p.name === 'Performance Exhaust');
    const exhaustTip = result.find(p => p.name === 'Exhaust Tip');

    expect(basicMuffler!.price).toEqual(150.00);
    expect(performanceExhaust!.price).toEqual(899.99);
    expect(exhaustTip!.price).toEqual(25.50);
  });

  it('should not return parts from other categories', async () => {
    // Create two categories
    const category1Result = await db.insert(partCategoriesTable)
      .values({
        name: 'Engine Parts',
        description: 'Engine components'
      })
      .returning()
      .execute();

    const category2Result = await db.insert(partCategoriesTable)
      .values({
        name: 'Body Parts',
        description: 'Body components'
      })
      .returning()
      .execute();

    const category1Id = category1Result[0].id;
    const category2Id = category2Result[0].id;

    // Create parts in both categories
    await db.insert(partsTable)
      .values([
        {
          name: 'Engine Block',
          description: 'Main engine block',
          category_id: category1Id,
          price: '1500.00'
        },
        {
          name: 'Fuel Tank',
          description: 'Custom fuel tank',
          category_id: category2Id,
          price: '400.00'
        }
      ])
      .execute();

    // Query only category 1
    const input: GetPartsByCategoryInput = {
      category_id: category1Id
    };

    const result = await getPartsByCategory(input);

    // Should only return parts from category 1
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Engine Block');
    expect(result[0].category_id).toEqual(category1Id);
  });
});