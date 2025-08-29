import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Chopper style schema
export const chopperStyleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ChopperStyle = z.infer<typeof chopperStyleSchema>;

// Part category schema
export const partCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  created_at: z.coerce.date()
});

export type PartCategory = z.infer<typeof partCategorySchema>;

// Part schema
export const partSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  category_id: z.number(),
  price: z.number(),
  image_url: z.string().nullable(),
  specifications: z.string().nullable(), // JSON string of specs
  compatibility: z.string().nullable(), // JSON string of compatible models/styles
  created_at: z.coerce.date()
});

export type Part = z.infer<typeof partSchema>;

// Build guide step schema
export const buildGuideStepSchema = z.object({
  id: z.number(),
  step_number: z.number().int(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  image_url: z.string().nullable(),
  video_url: z.string().nullable(),
  estimated_time_minutes: z.number().int().nullable(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  required_tools: z.string().nullable(), // JSON string of tool names
  created_at: z.coerce.date()
});

export type BuildGuideStep = z.infer<typeof buildGuideStepSchema>;

// User build schema (saved builds)
export const userBuildSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  chopper_style_id: z.number().nullable(),
  is_public: z.boolean(),
  build_data: z.string(), // JSON string of selected parts and configuration
  progress_step: z.number().int(), // Current step in build process
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserBuild = z.infer<typeof userBuildSchema>;

// Build part (many-to-many relationship between builds and parts)
export const buildPartSchema = z.object({
  id: z.number(),
  build_id: z.number(),
  part_id: z.number(),
  quantity: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type BuildPart = z.infer<typeof buildPartSchema>;

// Educational content schema
export const educationalContentSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  content_type: z.enum(['history', 'style_guide', 'part_info', 'general']),
  image_url: z.string().nullable(),
  video_url: z.string().nullable(),
  tags: z.string().nullable(), // JSON string of tags
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type EducationalContent = z.infer<typeof educationalContentSchema>;

// Input schemas for creating entities

export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createChopperStyleInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  image_url: z.string().nullable()
});

export type CreateChopperStyleInput = z.infer<typeof createChopperStyleInputSchema>;

export const createPartCategoryInputSchema = z.object({
  name: z.string(),
  description: z.string()
});

export type CreatePartCategoryInput = z.infer<typeof createPartCategoryInputSchema>;

export const createPartInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  category_id: z.number(),
  price: z.number().positive(),
  image_url: z.string().nullable(),
  specifications: z.string().nullable(),
  compatibility: z.string().nullable()
});

export type CreatePartInput = z.infer<typeof createPartInputSchema>;

export const createBuildGuideStepInputSchema = z.object({
  step_number: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  image_url: z.string().nullable(),
  video_url: z.string().nullable(),
  estimated_time_minutes: z.number().int().positive().nullable(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  required_tools: z.string().nullable()
});

export type CreateBuildGuideStepInput = z.infer<typeof createBuildGuideStepInputSchema>;

export const createUserBuildInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  chopper_style_id: z.number().nullable(),
  is_public: z.boolean().default(false),
  build_data: z.string(), // JSON string
  progress_step: z.number().int().nonnegative().default(0)
});

export type CreateUserBuildInput = z.infer<typeof createUserBuildInputSchema>;

export const createBuildPartInputSchema = z.object({
  build_id: z.number(),
  part_id: z.number(),
  quantity: z.number().int().positive(),
  notes: z.string().nullable()
});

export type CreateBuildPartInput = z.infer<typeof createBuildPartInputSchema>;

export const createEducationalContentInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  content_type: z.enum(['history', 'style_guide', 'part_info', 'general']),
  image_url: z.string().nullable(),
  video_url: z.string().nullable(),
  tags: z.string().nullable()
});

export type CreateEducationalContentInput = z.infer<typeof createEducationalContentInputSchema>;

// Update schemas (all fields optional except ID)

export const updateUserBuildInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  chopper_style_id: z.number().nullable().optional(),
  is_public: z.boolean().optional(),
  build_data: z.string().optional(),
  progress_step: z.number().int().nonnegative().optional()
});

export type UpdateUserBuildInput = z.infer<typeof updateUserBuildInputSchema>;

// Query parameter schemas

export const getPartsByCategoryInputSchema = z.object({
  category_id: z.number()
});

export type GetPartsByCategoryInput = z.infer<typeof getPartsByCategoryInputSchema>;

export const getUserBuildsInputSchema = z.object({
  user_id: z.number()
});

export type GetUserBuildsInput = z.infer<typeof getUserBuildsInputSchema>;

export const getPublicBuildsInputSchema = z.object({
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0)
});

export type GetPublicBuildsInput = z.infer<typeof getPublicBuildsInputSchema>;

export const getBuildDetailsInputSchema = z.object({
  build_id: z.number()
});

export type GetBuildDetailsInput = z.infer<typeof getBuildDetailsInputSchema>;

export const getEducationalContentInputSchema = z.object({
  content_type: z.enum(['history', 'style_guide', 'part_info', 'general']).optional()
});

export type GetEducationalContentInput = z.infer<typeof getEducationalContentInputSchema>;