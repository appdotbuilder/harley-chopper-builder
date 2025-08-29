import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';

// Import types with correct relative path (3 levels up from components/)
import type { UserBuild } from '../../../server/src/schema';

interface UserBuildsProps {
  userId: number;
}

interface BuildData {
  style?: { id: number; name: string };
  parts: { [key: string]: { id: number; name: string; price: number } };
  totalPrice: number;
}

export function UserBuilds({ userId }: UserBuildsProps) {
  const [userBuilds, setUserBuilds] = useState<UserBuild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState<UserBuild | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const loadUserBuilds = useCallback(async () => {
    setIsLoading(true);
    try {
      const builds = await trpc.getUserBuilds.query({ user_id: userId });
      setUserBuilds(builds);
    } catch (error) {
      console.error('Failed to load user builds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserBuilds();
  }, [loadUserBuilds]);

  const parseBuildData = (buildDataString: string): BuildData | null => {
    try {
      return JSON.parse(buildDataString);
    } catch (error) {
      console.error('Failed to parse build data:', error);
      return null;
    }
  };

  const handleViewDetails = (build: UserBuild) => {
    setSelectedBuild(build);
    setShowDetailsDialog(true);
  };

  const getProgressPercentage = (progressStep: number, totalSteps: number = 10) => {
    return Math.min((progressStep / totalSteps) * 100, 100);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            💾 My Builds
          </h2>
          <p className="text-xl text-gray-300">
            Your saved chopper configurations and build progress
          </p>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your builds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          💾 My Builds
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          Your saved chopper configurations and build progress
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            📊 {userBuilds.length} Total Builds
          </Badge>
          <Badge variant="outline" className="border-green-500 text-green-400">
            🌟 {userBuilds.filter((build: UserBuild) => build.is_public).length} Public
          </Badge>
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            🔒 {userBuilds.filter((build: UserBuild) => !build.is_public).length} Private
          </Badge>
        </div>
      </div>

      {userBuilds.length === 0 ? (
        <Card className="bg-black/40 border-orange-500/20">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-4">
              No builds yet!
            </h3>
            <p className="text-gray-500 mb-6">
              Start creating your dream chopper in the Configurator tab
            </p>
            <Button variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white">
              🎨 Go to Configurator
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userBuilds.map((build: UserBuild) => {
            const buildData = parseBuildData(build.build_data);
            const partsCount = buildData ? Object.keys(buildData.parts).length : 0;
            const progressPercentage = getProgressPercentage(build.progress_step);

            return (
              <Card key={build.id} className="bg-black/40 border-orange-500/20 hover:border-orange-400 transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white text-lg">{build.name}</CardTitle>
                    <div className="flex gap-2">
                      {build.is_public && (
                        <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                          🌟 Public
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-gray-500 text-gray-400 text-xs">
                        Step {build.progress_step}
                      </Badge>
                    </div>
                  </div>
                  {build.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{build.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Build Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-800/50 rounded">
                      <div className="font-bold text-orange-400">{partsCount}</div>
                      <div className="text-gray-400">Parts</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/50 rounded">
                      <div className="font-bold text-green-400">
                        ${buildData?.totalPrice?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-gray-400">Total</div>
                    </div>
                  </div>

                  {/* Style Info */}
                  {buildData?.style && (
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Style:</div>
                      <div className="font-medium text-white">{buildData.style.name}</div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Build Progress</span>
                      <span className="text-orange-400">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Created: {formatDate(build.created_at)}</span>
                    <span>Updated: {formatDate(build.updated_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(build)}
                      className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                    >
                      👁️ Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                    >
                      ⚡ Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Build Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-900 border-orange-500/20 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-400 text-xl">
              {selectedBuild?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBuild && (
            <div className="space-y-6">
              {/* Build Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-gray-600">
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {getProgressPercentage(selectedBuild.progress_step).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-400">Progress</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-gray-600">
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-400">
                      {parseBuildData(selectedBuild.build_data) ? Object.keys(parseBuildData(selectedBuild.build_data)!.parts).length : 0}
                    </div>
                    <div className="text-sm text-gray-400">Parts</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-gray-600">
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-green-400">
                      ${parseBuildData(selectedBuild.build_data)?.totalPrice?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-400">Total Cost</div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {selectedBuild.description && (
                <Card className="bg-black/40 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">📝 Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{selectedBuild.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Build Configuration */}
              {(() => {
                const buildData = parseBuildData(selectedBuild.build_data);
                if (!buildData) return null;

                return (
                  <>
                    {/* Style */}
                    {buildData.style && (
                      <Card className="bg-black/40 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">🏍️ Chopper Style</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="font-medium text-orange-400">{buildData.style.name}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Parts List */}
                    {Object.keys(buildData.parts).length > 0 && (
                      <Card className="bg-black/40 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">🔧 Selected Parts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.values(buildData.parts).map((part: { id: number; name: string; price: number }, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                                <div>
                                  <div className="font-medium text-white">{part.name}</div>
                                </div>
                                <div className="text-green-400 font-medium">${part.price}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}

              {/* Build Info */}
              <Card className="bg-black/40 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">ℹ️ Build Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white ml-2">{formatDate(selectedBuild.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="text-white ml-2">{formatDate(selectedBuild.updated_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Visibility:</span>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 ${selectedBuild.is_public ? 'border-green-500 text-green-400' : 'border-gray-500 text-gray-400'}`}
                      >
                        {selectedBuild.is_public ? '🌟 Public' : '🔒 Private'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Step:</span>
                      <span className="text-orange-400 ml-2">{selectedBuild.progress_step}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}