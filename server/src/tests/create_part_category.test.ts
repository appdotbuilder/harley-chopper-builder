import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partCategoriesTable } from '../db/schema';
import { type CreatePartCategoryInput } from '../schema';
import { createPartCategory } from '../handlers/create_part_category';
import { eq } from 'drizzle-orm';

// Test input for part category
const testInput: CreatePartCategoryInput = {
  name: 'Engine Components',
  description: 'Parts related to motorcycle engines including pistons, cylinders, and valves'
};

describe('createPartCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a part category', async () => {
    const result = await createPartCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Engine Components');
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save part category to database', async () => {
    const result = await createPartCategory(testInput);

    // Query database to verify the category was saved
    const categories = await db.select()
      .from(partCategoriesTable)
      .where(eq(partCategoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Engine Components');
    expect(categories[0].description).toEqual(testInput.description);
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple part categories with unique IDs', async () => {
    const secondInput: CreatePartCategoryInput = {
      name: 'Body Parts',
      description: 'Motorcycle body components like fairings, fenders, and tanks'
    };

    const firstCategory = await createPartCategory(testInput);
    const secondCategory = await createPartCategory(secondInput);

    expect(firstCategory.id).not.toEqual(secondCategory.id);
    expect(firstCategory.name).toEqual('Engine Components');
    expect(secondCategory.name).toEqual('Body Parts');

    // Verify both are saved in database
    const allCategories = await db.select()
      .from(partCategoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    const categoryNames = allCategories.map(cat => cat.name);
    expect(categoryNames).toContain('Engine Components');
    expect(categoryNames).toContain('Body Parts');
  });

  it('should handle special characters in category data', async () => {
    const specialInput: CreatePartCategoryInput = {
      name: 'Electrical & Electronics',
      description: 'Components like batteries, ECUs, and wiring harnesses - essential for modern bikes'
    };

    const result = await createPartCategory(specialInput);

    expect(result.name).toEqual('Electrical & Electronics');
    expect(result.description).toContain('ECUs');
    expect(result.name).toContain('&');
    expect(result.description).toContain('-');

    // Verify in database
    const savedCategory = await db.select()
      .from(partCategoriesTable)
      .where(eq(partCategoriesTable.id, result.id))
      .execute();

    expect(savedCategory[0].name).toEqual('Electrical & Electronics');
    expect(savedCategory[0].description).toContain('essential for modern bikes');
  });
});