import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';

// Import types with correct relative path (3 levels up from components/)
import type { ChopperStyle, PartCategory, EducationalContent as EducationalContentType } from '../../../server/src/schema';

interface EducationalContentProps {
  chopperStyles: ChopperStyle[];
  partCategories: PartCategory[];
}

export function EducationalContent({ chopperStyles, partCategories }: EducationalContentProps) {
  const [educationalContent, setEducationalContent] = useState<EducationalContentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<'history' | 'style_guide' | 'part_info' | 'general'>('history');

  const loadEducationalContent = useCallback(async (contentType?: typeof selectedContentType) => {
    setIsLoading(true);
    try {
      const content = await trpc.getEducationalContent.query({ 
        content_type: contentType 
      });
      setEducationalContent(content);
    } catch (error) {
      console.error('Failed to load educational content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEducationalContent(selectedContentType);
  }, [selectedContentType, loadEducationalContent]);

  const handleContentTypeChange = (type: string) => {
    setSelectedContentType(type as typeof selectedContentType);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🏍️ Master the Art of Chopper Building
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Dive deep into the rich history, iconic styles, and essential knowledge needed to build your dream Harley Chopper
        </p>
      </div>

      {/* Content Navigation */}
      <Tabs value={selectedContentType} onValueChange={handleContentTypeChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-orange-500/20">
          <TabsTrigger value="history" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            📜 History
          </TabsTrigger>
          <TabsTrigger value="style_guide" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            🎨 Style Guide
          </TabsTrigger>
          <TabsTrigger value="part_info" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            🔧 Parts Info
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            📖 General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <div className="grid gap-6">
            <Card className="bg-black/40 border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  📜 The Legacy of Harley Choppers
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p className="mb-4">
                  The chopper movement began in the 1960s when riders started "chopping" their motorcycles, 
                  removing unnecessary parts to create lighter, faster, and more personalized machines. 
                  Harley-Davidson motorcycles became the canvas of choice for this rebellious art form.
                </p>
                <p className="mb-4">
                  From the iconic bikes in "Easy Rider" to the custom creations of legendary builders like 
                  Indian Larry and Jesse James, choppers represent freedom, individuality, and the American spirit.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-bold text-orange-400 mb-2">📅 Key Timeline</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• 1960s: Birth of the chopper movement</li>
                      <li>• 1969: "Easy Rider" popularizes choppers</li>
                      <li>• 1970s-80s: Underground custom culture grows</li>
                      <li>• 1990s-2000s: TV shows bring choppers mainstream</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-bold text-orange-400 mb-2">🏆 Legendary Builders</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Indian Larry - Artistic innovator</li>
                      <li>• Jesse James - West Coast Choppers</li>
                      <li>• Paul Teutul Sr. - Orange County Choppers</li>
                      <li>• Arlen Ness - The King of Choppers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Educational Content */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading historical content...</p>
              </div>
            ) : (
              educationalContent.map((content: EducationalContentType) => (
                <Card key={content.id} className="bg-black/40 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-400">{content.title}</CardTitle>
                    {content.tags && (
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(content.tags).map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-orange-500/50 text-orange-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 whitespace-pre-wrap">{content.content}</p>
                    {content.image_url && (
                      <img 
                        src={content.image_url} 
                        alt={content.title}
                        className="mt-4 rounded-lg max-w-full h-auto"
                      />
                    )}
                    {content.video_url && (
                      <div className="mt-4">
                        <Button asChild variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white">
                          <a href={content.video_url} target="_blank" rel="noopener noreferrer">
                            🎥 Watch Video
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="style_guide" className="mt-6">
          <div className="grid gap-6">
            <Card className="bg-black/40 border-orange-500/20 mb-6">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  🎨 Chopper Styles Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p className="mb-4">
                  Each chopper style tells a unique story. Understanding these styles helps you choose 
                  the right direction for your build and appreciate the craftsmanship behind each design.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chopperStyles.map((style: ChopperStyle) => (
                <Card key={style.id} className="bg-black/40 border-orange-500/20 hover:border-orange-400 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-orange-400 text-lg">{style.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">{style.description}</p>
                    {style.image_url && (
                      <img 
                        src={style.image_url} 
                        alt={style.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <Badge variant="outline" className="border-orange-500/50 text-orange-300 text-xs">
                      Est. {style.created_at.getFullYear()}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="part_info" className="mt-6">
          <div className="grid gap-6">
            <Card className="bg-black/40 border-orange-500/20 mb-6">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  🔧 Essential Parts & Components
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <p className="mb-4">
                  Understanding each component is crucial for building a safe, reliable, and stunning chopper. 
                  Each part serves both functional and aesthetic purposes.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partCategories.map((category: PartCategory) => (
                <Card key={category.id} className="bg-black/40 border-orange-500/20 hover:border-orange-400 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-orange-400 text-lg flex items-center gap-2">
                      🔩 {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">{category.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="border-orange-500/50 text-orange-300 text-xs">
                        Category
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Est. {category.created_at.getFullYear()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <div className="grid gap-6">
            {/* General educational content will be loaded here */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading content...</p>
              </div>
            ) : educationalContent.length === 0 ? (
              <Card className="bg-black/40 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-orange-400">📖 General Knowledge</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    This section contains general information about chopper building, maintenance, 
                    safety guidelines, and other essential knowledge for enthusiasts.
                  </p>
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="font-bold text-orange-400 mb-2">🛡️ Safety First</h4>
                      <p className="text-sm text-gray-300">
                        Always wear proper safety gear, work in well-ventilated areas, 
                        and follow manufacturer guidelines when building your chopper.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="font-bold text-orange-400 mb-2">⚖️ Legal Requirements</h4>
                      <p className="text-sm text-gray-300">
                        Check local laws and regulations regarding custom motorcycles, 
                        registration requirements, and safety inspections.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              educationalContent.map((content: EducationalContentType) => (
                <Card key={content.id} className="bg-black/40 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-400">{content.title}</CardTitle>
                    {content.tags && (
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(content.tags).map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-orange-500/50 text-orange-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 whitespace-pre-wrap">{content.content}</p>
                    {content.image_url && (
                      <img 
                        src={content.image_url} 
                        alt={content.title}
                        className="mt-4 rounded-lg max-w-full h-auto"
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}