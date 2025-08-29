import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Import types with correct relative path (3 levels up from components/)
import type { BuildGuideStep } from '../../../server/src/schema';

interface BuildGuideProps {
  steps: BuildGuideStep[];
}

export function BuildGuide({ steps }: BuildGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const sortedSteps = steps.sort((a: BuildGuideStep, b: BuildGuideStep) => a.step_number - b.step_number);
  const totalSteps = sortedSteps.length;
  const progressPercentage = (completedSteps.size / totalSteps) * 100;

  const handleStepComplete = (stepId: number) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
  };

  const handleStepUncomplete = (stepId: number) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.delete(stepId);
    setCompletedSteps(newCompleted);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  if (sortedSteps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            🔧 Chopper Build Guide
          </h2>
          <p className="text-xl text-gray-300">
            Step-by-step instructions for building your dream Harley Chopper
          </p>
        </div>
        
        <Card className="bg-black/40 border-orange-500/20">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 mb-4">Build guide steps are being prepared...</p>
            <p className="text-sm text-gray-500">Check back soon for detailed assembly instructions!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepData = sortedSteps[currentStep];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🔧 Chopper Build Guide
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          Follow these step-by-step instructions to build your dream Harley Chopper
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-orange-400 font-medium">
              {completedSteps.size} of {totalSteps} steps
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Step Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-black/40 border-orange-500/20 sticky top-24">
            <CardHeader>
              <CardTitle className="text-orange-400 text-lg">📋 Steps Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedSteps.map((step: BuildGuideStep, index: number) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === currentStep 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Step {step.step_number}</span>
                    {completedSteps.has(step.id) && <span className="text-green-400">✓</span>}
                  </div>
                  <div className="text-sm opacity-80 truncate">{step.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">
                      {getDifficultyEmoji(step.difficulty_level)} {step.difficulty_level}
                    </span>
                    {step.estimated_time_minutes && (
                      <span className="text-xs">⏱️ {step.estimated_time_minutes}m</span>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Current Step Details */}
        <div className="lg:col-span-3">
          <Card className="bg-black/40 border-orange-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="border-orange-500 text-orange-400">
                      Step {currentStepData.step_number} of {totalSteps}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`border-gray-500 text-white ${getDifficultyColor(currentStepData.difficulty_level)}`}
                    >
                      {getDifficultyEmoji(currentStepData.difficulty_level)} {currentStepData.difficulty_level}
                    </Badge>
                    {currentStepData.estimated_time_minutes && (
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        ⏱️ {currentStepData.estimated_time_minutes} minutes
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl text-orange-400">{currentStepData.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {completedSteps.has(currentStepData.id) ? (
                    <Button 
                      onClick={() => handleStepUncomplete(currentStepData.id)}
                      variant="outline"
                      className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                    >
                      ✓ Completed
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleStepComplete(currentStepData.id)}
                      variant="outline"
                      className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">📝 Overview</h3>
                <p className="text-gray-300">{currentStepData.description}</p>
              </div>

              <Separator className="bg-gray-600" />

              {/* Step Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">🔧 Instructions</h3>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentStepData.instructions}
                </div>
              </div>

              {/* Required Tools */}
              {currentStepData.required_tools && (
                <>
                  <Separator className="bg-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">🛠️ Required Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(currentStepData.required_tools).map((tool: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-blue-500/50 text-blue-300">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Visual Content */}
              {(currentStepData.image_url || currentStepData.video_url) && (
                <>
                  <Separator className="bg-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">📸 Visual Guide</h3>
                    <div className="space-y-4">
                      {currentStepData.image_url && (
                        <img 
                          src={currentStepData.image_url} 
                          alt={currentStepData.title}
                          className="w-full rounded-lg max-h-96 object-cover"
                        />
                      )}
                      {currentStepData.video_url && (
                        <Button asChild variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                          <a href={currentStepData.video_url} target="_blank" rel="noopener noreferrer">
                            🎥 Watch Video Tutorial
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Navigation */}
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center pt-4">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white disabled:opacity-50"
                >
                  ← Previous Step
                </Button>

                <div className="text-center text-gray-400">
                  <div className="text-sm">
                    Step {currentStep + 1} of {totalSteps}
                  </div>
                  {currentStepData.estimated_time_minutes && (
                    <div className="text-xs">
                      Estimated time: {currentStepData.estimated_time_minutes} minutes
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                  disabled={currentStep === totalSteps - 1}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white disabled:opacity-50"
                >
                  Next Step →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}