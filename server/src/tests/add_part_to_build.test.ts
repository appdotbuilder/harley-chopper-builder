import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { buildPartsTable, userBuildsTable, partsTable, usersTable, partCategoriesTable } from '../db/schema';
import { type CreateBuildPartInput } from '../schema';
import { addPartToBuild } from '../handlers/add_part_to_build';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'testuser',
  email: 'test@example.com'
};

const testCategory = {
  name: 'Test Category',
  description: 'A category for testing'
};

const testPart = {
  name: 'Test Part',
  description: 'A part for testing',
  price: 99.99,
  image_url: null,
  specifications: null,
  compatibility: null
};

const testBuild = {
  name: 'Test Build',
  description: 'A build for testing',
  chopper_style_id: null,
  is_public: false,
  build_data: '{}',
  progress_step: 0
};

const testBuildPartInput: CreateBuildPartInput = {
  build_id: 0, // Will be set after creating test build
  part_id: 0, // Will be set after creating test part
  quantity: 2,
  notes: 'Test installation notes'
};

describe('addPartToBuild', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a part to a build', async () => {
    // Create prerequisites: user, category, part, and build
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [category] = await db.insert(partCategoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [part] = await db.insert(partsTable)
      .values({
        ...testPart,
        category_id: category.id,
        price: testPart.price.toString()
      })
      .returning()
      .execute();

    const [build] = await db.insert(userBuildsTable)
      .values({
        ...testBuild,
        user_id: user.id
      })
      .returning()
      .execute();

    // Create input with actual IDs
    const input: CreateBuildPartInput = {
      ...testBuildPartInput,
      build_id: build.id,
      part_id: part.id
    };

    const result = await addPartToBuild(input);

    // Verify result structure
    expect(result.id).toBeDefined();
    expect(result.build_id).toEqual(build.id);
    expect(result.part_id).toEqual(part.id);
    expect(result.quantity).toEqual(2);
    expect(result.notes).toEqual('Test installation notes');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save build part to database', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [category] = await db.insert(partCategoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [part] = await db.insert(partsTable)
      .values({
        ...testPart,
        category_id: category.id,
        price: testPart.price.toString()
      })
      .returning()
      .execute();

    const [build] = await db.insert(userBuildsTable)
      .values({
        ...testBuild,
        user_id: user.id
      })
      .returning()
      .execute();

    const input: CreateBuildPartInput = {
      ...testBuildPartInput,
      build_id: build.id,
      part_id: part.id
    };

    const result = await addPartToBuild(input);

    // Query database to verify the record was saved
    const buildParts = await db.select()
      .from(buildPartsTable)
      .where(eq(buildPartsTable.id, result.id))
      .execute();

    expect(buildParts).toHaveLength(1);
    expect(buildParts[0].build_id).toEqual(build.id);
    expect(buildParts[0].part_id).toEqual(part.id);
    expect(buildParts[0].quantity).toEqual(2);
    expect(buildParts[0].notes).toEqual('Test installation notes');
    expect(buildParts[0].created_at).toBeInstanceOf(Date);
  });

  it('should add part without notes', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [category] = await db.insert(partCategoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [part] = await db.insert(partsTable)
      .values({
        ...testPart,
        category_id: category.id,
        price: testPart.price.toString()
      })
      .returning()
      .execute();

    const [build] = await db.insert(userBuildsTable)
      .values({
        ...testBuild,
        user_id: user.id
      })
      .returning()
      .execute();

    const input: CreateBuildPartInput = {
      build_id: build.id,
      part_id: part.id,
      quantity: 1,
      notes: null
    };

    const result = await addPartToBuild(input);

    expect(result.notes).toBeNull();
    expect(result.quantity).toEqual(1);
  });

  it('should throw error when build does not exist', async () => {
    // Create only user, category and part (no build)
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [category] = await db.insert(partCategoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [part] = await db.insert(partsTable)
      .values({
        ...testPart,
        category_id: category.id,
        price: testPart.price.toString()
      })
      .returning()
      .execute();

    const input: CreateBuildPartInput = {
      build_id: 99999, // Non-existent build ID
      part_id: part.id,
      quantity: 1,
      notes: null
    };

    await expect(addPartToBuild(input)).rejects.toThrow(/build with id 99999 not found/i);
  });

  it('should throw error when part does not exist', async () => {
    // Create user and build (no part)
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [build] = await db.insert(userBuildsTable)
      .values({
        ...testBuild,
        user_id: user.id
      })
      .returning()
      .execute();

    const input: CreateBuildPartInput = {
      build_id: build.id,
      part_id: 99999, // Non-existent part ID
      quantity: 1,
      notes: null
    };

    await expect(addPartToBuild(input)).rejects.toThrow(/part with id 99999 not found/i);
  });

  it('should handle multiple parts added to same build', async () => {
    // Create prerequisites
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [category] = await db.insert(partCategoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create two different parts
    const [part1] = await db.insert(partsTable)
      .values({
        ...testPart,
        name: 'Test Part 1',
        category_id: category.id,
        price: testPart.price.toString()
      })
      .returning()
      .execute();

    const [part2] = await db.insert(partsTable)
      .values({
        ...testPart,
        name: 'Test Part 2',
        category_id: category.id,
        price: (testPart.price * 2).toString()
      })
      .returning()
      .execute();

    const [build] = await db.insert(userBuildsTable)
      .values({
        ...testBuild,
        user_id: user.id
      })
      .returning()
      .execute();

    // Add first part
    const result1 = await addPartToBuild({
      build_id: build.id,
      part_id: part1.id,
      quantity: 1,
      notes: 'First part notes'
    });

    // Add second part
    const result2 = await addPartToBuild({
      build_id: build.id,
      part_id: part2.id,
      quantity: 3,
      notes: 'Second part notes'
    });

    // Verify both parts were added
    const allBuildParts = await db.select()
      .from(buildPartsTable)
      .where(eq(buildPartsTable.build_id, build.id))
      .execute();

    expect(allBuildParts).toHaveLength(2);
    
    const part1Entry = allBuildParts.find(bp => bp.part_id === part1.id);
    const part2Entry = allBuildParts.find(bp => bp.part_id === part2.id);
    
    expect(part1Entry).toBeDefined();
    expect(part1Entry?.quantity).toEqual(1);
    expect(part1Entry?.notes).toEqual('First part notes');
    
    expect(part2Entry).toBeDefined();
    expect(part2Entry?.quantity).toEqual(3);
    expect(part2Entry?.notes).toEqual('Second part notes');
  });
});