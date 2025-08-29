import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';

// Import types with correct relative path (3 levels up from components/)
import type { UserBuild } from '../../../server/src/schema';

interface BuildData {
  style?: { id: number; name: string };
  parts: { [key: string]: { id: number; name: string; price: number } };
  totalPrice: number;
}

export function PublicBuilds() {
  const [publicBuilds, setPublicBuilds] = useState<UserBuild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState<UserBuild | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const BUILDS_PER_PAGE = 12;

  const loadPublicBuilds = useCallback(async (page = 0, reset = false) => {
    if (!reset && !hasMore) return;
    
    setIsLoading(true);
    try {
      const builds = await trpc.getPublicBuilds.query({ 
        limit: BUILDS_PER_PAGE,
        offset: page * BUILDS_PER_PAGE
      });
      
      if (reset) {
        setPublicBuilds(builds);
      } else {
        setPublicBuilds((prev: UserBuild[]) => [...prev, ...builds]);
      }
      
      setHasMore(builds.length === BUILDS_PER_PAGE);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load public builds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore]);

  useEffect(() => {
    loadPublicBuilds(0, true);
  }, [loadPublicBuilds]);

  const loadMoreBuilds = () => {
    if (!isLoading && hasMore) {
      loadPublicBuilds(currentPage + 1);
    }
  };

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter builds based on search term
  const filteredBuilds = publicBuilds.filter((build: UserBuild) =>
    build.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (build.description && build.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🌟 Community Builds
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          Discover and get inspired by builds shared by the chopper community
        </p>
        <div className="max-w-md mx-auto">
          <Input
            placeholder="🔍 Search builds..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 mb-6">
        <Badge variant="outline" className="border-blue-500 text-blue-400">
          📊 {publicBuilds.length} Builds Loaded
        </Badge>
        <Badge variant="outline" className="border-green-500 text-green-400">
          👀 {filteredBuilds.length} Showing
        </Badge>
        {searchTerm && (
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            🔍 Filtered: "{searchTerm}"
          </Badge>
        )}
      </div>

      {isLoading && publicBuilds.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading community builds...</p>
        </div>
      ) : filteredBuilds.length === 0 ? (
        <Card className="bg-black/40 border-orange-500/20">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-4">
              {searchTerm ? 'No builds match your search' : 'No public builds yet!'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or check back later' 
                : 'Be the first to share your amazing chopper build with the community!'
              }
            </p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                variant="outline" 
                className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Builds Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBuilds.map((build: UserBuild) => {
              const buildData = parseBuildData(build.build_data);
              const partsCount = buildData ? Object.keys(buildData.parts).length : 0;

              return (
                <Card key={build.id} className="bg-black/40 border-orange-500/20 hover:border-orange-400 transition-all duration-200 hover:shadow-lg hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-white text-lg line-clamp-1">{build.name}</CardTitle>
                    {build.description && (
                      <p className="text-gray-400 text-sm line-clamp-2">{build.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Build Preview */}
                    {buildData?.style && (
                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Style:</div>
                        <div className="font-medium text-orange-400">{buildData.style.name}</div>
                      </div>
                    )}

                    {/* Build Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <div className="font-bold text-blue-400">{partsCount}</div>
                        <div className="text-gray-400">Parts</div>
                      </div>
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <div className="font-bold text-green-400">
                          ${buildData?.totalPrice?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-gray-400">Total</div>
                      </div>
                    </div>

                    {/* Build Progress */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Progress:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((build.progress_step / 10) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-orange-400 text-xs">
                          {Math.min(Math.round((build.progress_step / 10) * 100), 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-3">
                      Shared on {formatDate(build.created_at)}
                    </div>

                    {/* View Details Button */}
                    <Button 
                      size="sm" 
                      onClick={() => handleViewDetails(build)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      👁️ View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && !searchTerm && (
            <div className="text-center pt-6">
              <Button 
                onClick={loadMoreBuilds}
                disabled={isLoading}
                variant="outline"
                className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Load More Builds'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Build Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-900 border-orange-500/20 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-400 text-xl">
              🌟 {selectedBuild?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBuild && (
            <div className="space-y-6">
              {/* Build Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-gray-600">
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-400">
                      {Math.min(Math.round((selectedBuild.progress_step / 10) * 100), 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Progress</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-gray-600">
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-400">
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
                    <CardTitle className="text-white text-lg">📝 Builder's Notes</CardTitle>
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
                          <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
                            <div className="font-medium text-orange-400 text-lg">{buildData.style.name}</div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Parts List */}
                    {Object.keys(buildData.parts).length > 0 && (
                      <Card className="bg-black/40 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">🔧 Parts Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.values(buildData.parts).map((part: { id: number; name: string; price: number }, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                                <div className="font-medium text-white">{part.name}</div>
                                <div className="text-green-400 font-bold">${part.price}</div>
                              </div>
                            ))}
                            <div className="border-t border-gray-600 pt-3 mt-4">
                              <div className="flex justify-between items-center text-lg font-bold">
                                <span className="text-white">Total Cost:</span>
                                <span className="text-green-400">${buildData.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}

              {/* Build Timeline */}
              <Card className="bg-black/40 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">📅 Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">First Shared:</span>
                      <div className="text-white font-medium">{formatDate(selectedBuild.created_at)}</div>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">Last Updated:</span>
                      <div className="text-white font-medium">{formatDate(selectedBuild.updated_at)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inspiration Actions */}
              <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
                <CardContent className="text-center p-6">
                  <h3 className="text-lg font-bold text-white mb-2">💡 Inspired by this build?</h3>
                  <p className="text-gray-300 mb-4">Use this as a starting point for your own custom chopper!</p>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    🎨 Open in Configurator
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}