import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { buildGuideStepsTable } from '../db/schema';
import { getBuildGuideSteps } from '../handlers/get_build_guide_steps';

describe('getBuildGuideSteps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no steps exist', async () => {
    const result = await getBuildGuideSteps();
    
    expect(result).toEqual([]);
  });

  it('should fetch build guide steps ordered by step_number', async () => {
    // Create test data in non-sequential order to test ordering
    await db.insert(buildGuideStepsTable).values([
      {
        step_number: 3,
        title: 'Install Engine',
        description: 'Mount the engine to the frame',
        instructions: 'Use engine mount bolts to secure the engine',
        difficulty_level: 'intermediate',
        estimated_time_minutes: 120
      },
      {
        step_number: 1,
        title: 'Prepare Frame',
        description: 'Clean and inspect the chopper frame',
        instructions: 'Remove any rust and check for cracks',
        difficulty_level: 'beginner',
        estimated_time_minutes: 60
      },
      {
        step_number: 2,
        title: 'Install Wheels',
        description: 'Mount front and rear wheels',
        instructions: 'Ensure proper torque specifications',
        difficulty_level: 'beginner',
        estimated_time_minutes: 45
      }
    ]).execute();

    const result = await getBuildGuideSteps();

    expect(result).toHaveLength(3);
    
    // Verify ordering by step_number
    expect(result[0].step_number).toEqual(1);
    expect(result[0].title).toEqual('Prepare Frame');
    expect(result[1].step_number).toEqual(2);
    expect(result[1].title).toEqual('Install Wheels');
    expect(result[2].step_number).toEqual(3);
    expect(result[2].title).toEqual('Install Engine');
  });

  it('should return complete step data with all fields', async () => {
    await db.insert(buildGuideStepsTable).values({
      step_number: 1,
      title: 'Test Step',
      description: 'A comprehensive test step',
      instructions: 'Follow these detailed instructions',
      image_url: 'https://example.com/step1.jpg',
      video_url: 'https://example.com/step1.mp4',
      estimated_time_minutes: 90,
      difficulty_level: 'advanced',
      required_tools: '["wrench", "screwdriver", "torque wrench"]'
    }).execute();

    const result = await getBuildGuideSteps();

    expect(result).toHaveLength(1);
    
    const step = result[0];
    expect(step.id).toBeDefined();
    expect(step.step_number).toEqual(1);
    expect(step.title).toEqual('Test Step');
    expect(step.description).toEqual('A comprehensive test step');
    expect(step.instructions).toEqual('Follow these detailed instructions');
    expect(step.image_url).toEqual('https://example.com/step1.jpg');
    expect(step.video_url).toEqual('https://example.com/step1.mp4');
    expect(step.estimated_time_minutes).toEqual(90);
    expect(step.difficulty_level).toEqual('advanced');
    expect(step.required_tools).toEqual('["wrench", "screwdriver", "torque wrench"]');
    expect(step.created_at).toBeInstanceOf(Date);
  });

  it('should handle steps with nullable fields', async () => {
    await db.insert(buildGuideStepsTable).values({
      step_number: 1,
      title: 'Minimal Step',
      description: 'A step with minimal data',
      instructions: 'Basic instructions only',
      difficulty_level: 'beginner',
      // Leaving nullable fields undefined
      image_url: null,
      video_url: null,
      estimated_time_minutes: null,
      required_tools: null
    }).execute();

    const result = await getBuildGuideSteps();

    expect(result).toHaveLength(1);
    
    const step = result[0];
    expect(step.step_number).toEqual(1);
    expect(step.title).toEqual('Minimal Step');
    expect(step.image_url).toBeNull();
    expect(step.video_url).toBeNull();
    expect(step.estimated_time_minutes).toBeNull();
    expect(step.required_tools).toBeNull();
  });

  it('should handle multiple difficulty levels correctly', async () => {
    await db.insert(buildGuideStepsTable).values([
      {
        step_number: 1,
        title: 'Beginner Step',
        description: 'Easy step',
        instructions: 'Simple instructions',
        difficulty_level: 'beginner'
      },
      {
        step_number: 2,
        title: 'Intermediate Step',
        description: 'Medium step',
        instructions: 'Moderate instructions',
        difficulty_level: 'intermediate'
      },
      {
        step_number: 3,
        title: 'Advanced Step',
        description: 'Hard step',
        instructions: 'Complex instructions',
        difficulty_level: 'advanced'
      }
    ]).execute();

    const result = await getBuildGuideSteps();

    expect(result).toHaveLength(3);
    expect(result[0].difficulty_level).toEqual('beginner');
    expect(result[1].difficulty_level).toEqual('intermediate');
    expect(result[2].difficulty_level).toEqual('advanced');
  });

  it('should handle large step numbers correctly', async () => {
    await db.insert(buildGuideStepsTable).values([
      {
        step_number: 10,
        title: 'Step Ten',
        description: 'Tenth step',
        instructions: 'Instructions for step 10',
        difficulty_level: 'beginner'
      },
      {
        step_number: 5,
        title: 'Step Five',
        description: 'Fifth step',
        instructions: 'Instructions for step 5',
        difficulty_level: 'beginner'
      },
      {
        step_number: 15,
        title: 'Step Fifteen',
        description: 'Fifteenth step',
        instructions: 'Instructions for step 15',
        difficulty_level: 'beginner'
      }
    ]).execute();

    const result = await getBuildGuideSteps();

    expect(result).toHaveLength(3);
    // Should be ordered by step_number
    expect(result[0].step_number).toEqual(5);
    expect(result[1].step_number).toEqual(10);
    expect(result[2].step_number).toEqual(15);
  });
});