import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { buildGuideStepsTable } from '../db/schema';
import { type CreateBuildGuideStepInput } from '../schema';
import { createBuildGuideStep } from '../handlers/create_build_guide_step';
import { eq } from 'drizzle-orm';

// Comprehensive test input with all fields
const testInput: CreateBuildGuideStepInput = {
  step_number: 1,
  title: 'Frame Assembly',
  description: 'Assembling the main frame of the chopper',
  instructions: 'Connect the front and rear frame sections using the provided bolts. Ensure proper alignment and torque specifications.',
  image_url: 'https://example.com/frame-assembly.jpg',
  video_url: 'https://example.com/frame-assembly-video.mp4',
  estimated_time_minutes: 120,
  difficulty_level: 'intermediate',
  required_tools: '["wrench_set", "torque_wrench", "allen_keys"]'
};

// Minimal test input
const minimalInput: CreateBuildGuideStepInput = {
  step_number: 2,
  title: 'Basic Step',
  description: 'A basic step description',
  instructions: 'Basic instructions',
  image_url: null,
  video_url: null,
  estimated_time_minutes: null,
  difficulty_level: 'beginner',
  required_tools: null
};

describe('createBuildGuideStep', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a build guide step with all fields', async () => {
    const result = await createBuildGuideStep(testInput);

    // Verify all fields are correctly set
    expect(result.step_number).toEqual(1);
    expect(result.title).toEqual('Frame Assembly');
    expect(result.description).toEqual('Assembling the main frame of the chopper');
    expect(result.instructions).toEqual('Connect the front and rear frame sections using the provided bolts. Ensure proper alignment and torque specifications.');
    expect(result.image_url).toEqual('https://example.com/frame-assembly.jpg');
    expect(result.video_url).toEqual('https://example.com/frame-assembly-video.mp4');
    expect(result.estimated_time_minutes).toEqual(120);
    expect(result.difficulty_level).toEqual('intermediate');
    expect(result.required_tools).toEqual('["wrench_set", "torque_wrench", "allen_keys"]');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a build guide step with minimal required fields', async () => {
    const result = await createBuildGuideStep(minimalInput);

    // Verify required fields
    expect(result.step_number).toEqual(2);
    expect(result.title).toEqual('Basic Step');
    expect(result.description).toEqual('A basic step description');
    expect(result.instructions).toEqual('Basic instructions');
    expect(result.difficulty_level).toEqual('beginner');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify nullable fields are null
    expect(result.image_url).toBeNull();
    expect(result.video_url).toBeNull();
    expect(result.estimated_time_minutes).toBeNull();
    expect(result.required_tools).toBeNull();
  });

  it('should save build guide step to database', async () => {
    const result = await createBuildGuideStep(testInput);

    // Query from database to verify persistence
    const steps = await db.select()
      .from(buildGuideStepsTable)
      .where(eq(buildGuideStepsTable.id, result.id))
      .execute();

    expect(steps).toHaveLength(1);
    const savedStep = steps[0];
    
    expect(savedStep.step_number).toEqual(1);
    expect(savedStep.title).toEqual('Frame Assembly');
    expect(savedStep.description).toEqual('Assembling the main frame of the chopper');
    expect(savedStep.instructions).toEqual(testInput.instructions);
    expect(savedStep.difficulty_level).toEqual('intermediate');
    expect(savedStep.image_url).toEqual('https://example.com/frame-assembly.jpg');
    expect(savedStep.video_url).toEqual('https://example.com/frame-assembly-video.mp4');
    expect(savedStep.estimated_time_minutes).toEqual(120);
    expect(savedStep.required_tools).toEqual('["wrench_set", "torque_wrench", "allen_keys"]');
    expect(savedStep.created_at).toBeInstanceOf(Date);
  });

  it('should handle different difficulty levels correctly', async () => {
    const beginnerInput: CreateBuildGuideStepInput = {
      ...minimalInput,
      step_number: 3,
      difficulty_level: 'beginner'
    };

    const advancedInput: CreateBuildGuideStepInput = {
      ...minimalInput,
      step_number: 4,
      difficulty_level: 'advanced'
    };

    const beginnerResult = await createBuildGuideStep(beginnerInput);
    const advancedResult = await createBuildGuideStep(advancedInput);

    expect(beginnerResult.difficulty_level).toEqual('beginner');
    expect(advancedResult.difficulty_level).toEqual('advanced');

    // Verify in database
    const steps = await db.select()
      .from(buildGuideStepsTable)
      .execute();

    expect(steps).toHaveLength(2);
    const difficultyLevels = steps.map(step => step.difficulty_level).sort();
    expect(difficultyLevels).toEqual(['advanced', 'beginner']);
  });

  it('should handle JSON string fields properly', async () => {
    const inputWithJson: CreateBuildGuideStepInput = {
      step_number: 5,
      title: 'Engine Installation',
      description: 'Installing the engine assembly',
      instructions: 'Mount engine to frame using engine mounts',
      image_url: null,
      video_url: null,
      estimated_time_minutes: 240,
      difficulty_level: 'advanced',
      required_tools: '["engine_hoist", "socket_set", "torque_wrench", "safety_glasses"]'
    };

    const result = await createBuildGuideStep(inputWithJson);
    
    expect(result.required_tools).toEqual('["engine_hoist", "socket_set", "torque_wrench", "safety_glasses"]');

    // Verify the JSON string is stored correctly in the database
    const steps = await db.select()
      .from(buildGuideStepsTable)
      .where(eq(buildGuideStepsTable.id, result.id))
      .execute();

    expect(steps[0].required_tools).toEqual('["engine_hoist", "socket_set", "torque_wrench", "safety_glasses"]');
  });
});