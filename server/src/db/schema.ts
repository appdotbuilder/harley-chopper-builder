import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const difficultyLevelEnum = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced']);
export const contentTypeEnum = pgEnum('content_type', ['history', 'style_guide', 'part_info', 'general']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Chopper styles table
export const chopperStylesTable = pgTable('chopper_styles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Part categories table
export const partCategoriesTable = pgTable('part_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Parts table
export const partsTable = pgTable('parts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category_id: integer('category_id').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  image_url: text('image_url'),
  specifications: text('specifications'), // JSON string
  compatibility: text('compatibility'), // JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Build guide steps table
export const buildGuideStepsTable = pgTable('build_guide_steps', {
  id: serial('id').primaryKey(),
  step_number: integer('step_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions').notNull(),
  image_url: text('image_url'),
  video_url: text('video_url'),
  estimated_time_minutes: integer('estimated_time_minutes'),
  difficulty_level: difficultyLevelEnum('difficulty_level').notNull(),
  required_tools: text('required_tools'), // JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User builds table (saved builds)
export const userBuildsTable = pgTable('user_builds', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  chopper_style_id: integer('chopper_style_id'),
  is_public: boolean('is_public').default(false).notNull(),
  build_data: text('build_data').notNull(), // JSON string
  progress_step: integer('progress_step').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Build parts table (many-to-many between builds and parts)
export const buildPartsTable = pgTable('build_parts', {
  id: serial('id').primaryKey(),
  build_id: integer('build_id').notNull(),
  part_id: integer('part_id').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Educational content table
export const educationalContentTable = pgTable('educational_content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  content_type: contentTypeEnum('content_type').notNull(),
  image_url: text('image_url'),
  video_url: text('video_url'),
  tags: text('tags'), // JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  builds: many(userBuildsTable),
}));

export const chopperStylesRelations = relations(chopperStylesTable, ({ many }) => ({
  builds: many(userBuildsTable),
}));

export const partCategoriesRelations = relations(partCategoriesTable, ({ many }) => ({
  parts: many(partsTable),
}));

export const partsRelations = relations(partsTable, ({ one, many }) => ({
  category: one(partCategoriesTable, {
    fields: [partsTable.category_id],
    references: [partCategoriesTable.id],
  }),
  buildParts: many(buildPartsTable),
}));

export const userBuildsRelations = relations(userBuildsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [userBuildsTable.user_id],
    references: [usersTable.id],
  }),
  chopperStyle: one(chopperStylesTable, {
    fields: [userBuildsTable.chopper_style_id],
    references: [chopperStylesTable.id],
  }),
  buildParts: many(buildPartsTable),
}));

export const buildPartsRelations = relations(buildPartsTable, ({ one }) => ({
  build: one(userBuildsTable, {
    fields: [buildPartsTable.build_id],
    references: [userBuildsTable.id],
  }),
  part: one(partsTable, {
    fields: [buildPartsTable.part_id],
    references: [partsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  chopperStyles: chopperStylesTable,
  partCategories: partCategoriesTable,
  parts: partsTable,
  buildGuideSteps: buildGuideStepsTable,
  userBuilds: userBuildsTable,
  buildParts: buildPartsTable,
  educationalContent: educationalContentTable,
};