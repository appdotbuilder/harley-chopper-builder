import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { EducationalContent } from './components/EducationalContent';
import { BuildGuide } from './components/BuildGuide';
import { Configurator } from './components/Configurator';
import { UserBuilds } from './components/UserBuilds';
import { PublicBuilds } from './components/PublicBuilds';
import './App.css';

// Import types
import type { ChopperStyle, PartCategory, BuildGuideStep } from '../../server/src/schema';

function App() {
  const [chopperStyles, setChopperStyles] = useState<ChopperStyle[]>([]);
  const [partCategories, setPartCategories] = useState<PartCategory[]>([]);
  const [buildSteps, setBuildSteps] = useState<BuildGuideStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('education');
  
  // Current user (in a real app, this would come from authentication)
  const currentUser = { id: 1, name: 'Chopper Enthusiast' };

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stylesResult, categoriesResult, stepsResult] = await Promise.all([
        trpc.getChopperStyles.query(),
        trpc.getPartCategories.query(),
        trpc.getBuildGuideSteps.query()
      ]);
      
      setChopperStyles(stylesResult);
      setPartCategories(categoriesResult);
      setBuildSteps(stepsResult);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Chopper Workshop...</h2>
          <p className="text-gray-300">Preparing your build experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-orange-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                🏍️
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Harley Chopper Workshop
                </h1>
                <p className="text-gray-400 text-sm">Build Your Dream Machine</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-orange-500 text-orange-400">
                👤 {currentUser.name}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-black/30 border border-orange-500/20">
            <TabsTrigger value="education" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              📚 Learn
            </TabsTrigger>
            <TabsTrigger value="guide" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              🔧 Build Guide
            </TabsTrigger>
            <TabsTrigger value="configurator" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              🎨 Configurator
            </TabsTrigger>
            <TabsTrigger value="my-builds" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              💾 My Builds
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              🌟 Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="education" className="mt-6">
            <EducationalContent 
              chopperStyles={chopperStyles}
              partCategories={partCategories}
            />
          </TabsContent>

          <TabsContent value="guide" className="mt-6">
            <BuildGuide steps={buildSteps} />
          </TabsContent>

          <TabsContent value="configurator" className="mt-6">
            <Configurator 
              chopperStyles={chopperStyles}
              partCategories={partCategories}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="my-builds" className="mt-6">
            <UserBuilds userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <PublicBuilds />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-orange-500/20 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              Built with passion for Harley Chopper enthusiasts 🏍️
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Learn, Build, Share - The Ultimate Chopper Experience
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;