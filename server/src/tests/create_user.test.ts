import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'testuser@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with valid input', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('testuser@example.com');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('testuser@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create users with unique usernames', async () => {
    const firstUser = await createUser(testInput);
    
    const secondUserInput: CreateUserInput = {
      username: 'seconduser',
      email: 'seconduser@example.com'
    };
    
    const secondUser = await createUser(secondUserInput);

    // Verify both users exist and have different IDs
    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.username).toEqual('testuser');
    expect(secondUser.username).toEqual('seconduser');

    // Verify both users are in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should reject duplicate usernames', async () => {
    await createUser(testInput);

    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com'
    };

    // Should throw error due to unique constraint violation
    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should reject duplicate emails', async () => {
    await createUser(testInput);

    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser',
      email: 'testuser@example.com' // Same email
    };

    // Should throw error due to unique constraint violation
    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle users with minimum username length', async () => {
    const minUsernameInput: CreateUserInput = {
      username: 'abc', // Minimum 3 characters
      email: 'abc@example.com'
    };

    const result = await createUser(minUsernameInput);
    
    expect(result.username).toEqual('abc');
    expect(result.email).toEqual('abc@example.com');
    expect(result.id).toBeDefined();
  });

  it('should handle various email formats', async () => {
    const emailVariants = [
      { username: 'user1', email: 'user+tag@domain.co.uk' },
      { username: 'user2', email: 'user.name@sub.domain.com' },
      { username: 'user3', email: 'u@d.co' }
    ];

    for (const variant of emailVariants) {
      const result = await createUser(variant);
      expect(result.email).toEqual(variant.email);
      expect(result.username).toEqual(variant.username);
    }

    // Verify all users were created
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(emailVariants.length);
  });
});