import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partsTable, partCategoriesTable } from '../db/schema';
import { getParts } from '../handlers/get_parts';

describe('getParts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no parts exist', async () => {
    const result = await getParts();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch all parts from database', async () => {
    // Create prerequisite category first
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Engines',
        description: 'Engine components'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Insert test parts
    await db.insert(partsTable)
      .values([
        {
          name: 'V-Twin Engine',
          description: 'Classic Harley V-Twin',
          category_id: categoryId,
          price: '2500.99',
          image_url: 'http://example.com/engine.jpg',
          specifications: '{"displacement": "1200cc", "power": "67hp"}',
          compatibility: '["Sportster", "Dyna"]'
        },
        {
          name: 'Chrome Exhaust',
          description: 'High-performance exhaust system',
          category_id: categoryId,
          price: '899.50',
          image_url: null,
          specifications: '{"material": "stainless steel"}',
          compatibility: null
        },
        {
          name: 'Custom Handlebars',
          description: 'Ape hanger handlebars',
          category_id: categoryId,
          price: '199.99',
          image_url: 'http://example.com/bars.jpg',
          specifications: null,
          compatibility: '["all models"]'
        }
      ])
      .execute();

    const result = await getParts();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Check first part details
    const vTwinEngine = result.find(p => p.name === 'V-Twin Engine');
    expect(vTwinEngine).toBeDefined();
    expect(vTwinEngine!.name).toEqual('V-Twin Engine');
    expect(vTwinEngine!.description).toEqual('Classic Harley V-Twin');
    expect(vTwinEngine!.category_id).toEqual(categoryId);
    expect(vTwinEngine!.price).toEqual(2500.99);
    expect(typeof vTwinEngine!.price).toBe('number');
    expect(vTwinEngine!.image_url).toEqual('http://example.com/engine.jpg');
    expect(vTwinEngine!.specifications).toEqual('{"displacement": "1200cc", "power": "67hp"}');
    expect(vTwinEngine!.compatibility).toEqual('["Sportster", "Dyna"]');
    expect(vTwinEngine!.id).toBeDefined();
    expect(vTwinEngine!.created_at).toBeInstanceOf(Date);

    // Check second part with null values
    const chromeExhaust = result.find(p => p.name === 'Chrome Exhaust');
    expect(chromeExhaust).toBeDefined();
    expect(chromeExhaust!.price).toEqual(899.50);
    expect(typeof chromeExhaust!.price).toBe('number');
    expect(chromeExhaust!.image_url).toBeNull();
    expect(chromeExhaust!.compatibility).toBeNull();

    // Check third part
    const customBars = result.find(p => p.name === 'Custom Handlebars');
    expect(customBars).toBeDefined();
    expect(customBars!.price).toEqual(199.99);
    expect(typeof customBars!.price).toBe('number');
    expect(customBars!.specifications).toBeNull();
  });

  it('should handle parts with different price values correctly', async () => {
    // Create category
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Insert parts with various price formats
    await db.insert(partsTable)
      .values([
        {
          name: 'Expensive Part',
          description: 'High-end component',
          category_id: categoryResult[0].id,
          price: '9999.99',
          image_url: null,
          specifications: null,
          compatibility: null
        },
        {
          name: 'Budget Part',
          description: 'Affordable component',
          category_id: categoryResult[0].id,
          price: '19.99',
          image_url: null,
          specifications: null,
          compatibility: null
        },
        {
          name: 'Zero Cost Part',
          description: 'Free component',
          category_id: categoryResult[0].id,
          price: '0.00',
          image_url: null,
          specifications: null,
          compatibility: null
        }
      ])
      .execute();

    const result = await getParts();

    expect(result).toHaveLength(3);
    
    const expensivePart = result.find(p => p.name === 'Expensive Part');
    expect(expensivePart!.price).toEqual(9999.99);
    expect(typeof expensivePart!.price).toBe('number');

    const budgetPart = result.find(p => p.name === 'Budget Part');
    expect(budgetPart!.price).toEqual(19.99);
    expect(typeof budgetPart!.price).toBe('number');

    const freePart = result.find(p => p.name === 'Zero Cost Part');
    expect(freePart!.price).toEqual(0);
    expect(typeof freePart!.price).toBe('number');
  });

  it('should return parts in database insertion order', async () => {
    // Create category
    const categoryResult = await db.insert(partCategoriesTable)
      .values({
        name: 'Ordered Parts',
        description: 'Test ordering'
      })
      .returning()
      .execute();

    // Insert parts in specific order
    await db.insert(partsTable)
      .values([
        {
          name: 'First Part',
          description: 'First inserted',
          category_id: categoryResult[0].id,
          price: '100.00',
          image_url: null,
          specifications: null,
          compatibility: null
        },
        {
          name: 'Second Part',
          description: 'Second inserted',
          category_id: categoryResult[0].id,
          price: '200.00',
          image_url: null,
          specifications: null,
          compatibility: null
        },
        {
          name: 'Third Part',
          description: 'Third inserted',
          category_id: categoryResult[0].id,
          price: '300.00',
          image_url: null,
          specifications: null,
          compatibility: null
        }
      ])
      .execute();

    const result = await getParts();

    expect(result).toHaveLength(3);
    // Parts should maintain insertion order (by ID)
    expect(result[0].name).toEqual('First Part');
    expect(result[1].name).toEqual('Second Part');
    expect(result[2].name).toEqual('Third Part');
  });
});