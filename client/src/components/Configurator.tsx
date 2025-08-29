import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';

// Import types with correct relative path (3 levels up from components/)
import type { ChopperStyle, PartCategory, Part, CreateUserBuildInput } from '../../../server/src/schema';

interface ConfiguratorProps {
  chopperStyles: ChopperStyle[];
  partCategories: PartCategory[];
  currentUser: { id: number; name: string };
}



export function Configurator({ chopperStyles, partCategories, currentUser }: ConfiguratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<ChopperStyle | null>(null);
  const [selectedParts, setSelectedParts] = useState<{ [categoryId: number]: Part }>({});
  const [availableParts, setAvailableParts] = useState<{ [categoryId: number]: Part[] }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Save build form state
  const [buildName, setBuildName] = useState('');
  const [buildDescription, setBuildDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const loadPartsForCategory = useCallback(async (categoryId: number) => {
    try {
      const parts = await trpc.getPartsByCategory.query({ category_id: categoryId });
      setAvailableParts((prev: { [key: number]: Part[] }) => ({
        ...prev,
        [categoryId]: parts
      }));
    } catch (error) {
      console.error(`Failed to load parts for category ${categoryId}:`, error);
    }
  }, []);

  // Load parts for all categories
  useEffect(() => {
    partCategories.forEach((category: PartCategory) => {
      loadPartsForCategory(category.id);
    });
  }, [partCategories, loadPartsForCategory]);

  const handleStyleSelect = (style: ChopperStyle) => {
    setSelectedStyle(style);
    // Reset parts when style changes
    setSelectedParts({});
  };

  const handlePartSelect = (categoryId: number, part: Part) => {
    setSelectedParts((prev: { [key: number]: Part }) => ({
      ...prev,
      [categoryId]: part
    }));
  };

  const removePart = (categoryId: number) => {
    setSelectedParts((prev: { [key: number]: Part }) => {
      const newParts = { ...prev };
      delete newParts[categoryId];
      return newParts;
    });
  };

  const calculateTotalPrice = () => {
    return Object.values(selectedParts).reduce((total: number, part: Part) => total + part.price, 0);
  };

  const handleSaveBuild = async () => {
    if (!buildName.trim()) {
      alert('Please enter a build name');
      return;
    }

    setIsSaving(true);
    try {
      const buildData = {
        style: selectedStyle,
        parts: selectedParts,
        totalPrice: calculateTotalPrice()
      };

      const input: CreateUserBuildInput = {
        user_id: currentUser.id,
        name: buildName,
        description: buildDescription || null,
        chopper_style_id: selectedStyle?.id || null,
        is_public: isPublic,
        build_data: JSON.stringify(buildData),
        progress_step: 0
      };

      await trpc.createUserBuild.mutate(input);
      
      // Reset form
      setBuildName('');
      setBuildDescription('');
      setIsPublic(false);
      setShowSaveDialog(false);
      
      alert('Build saved successfully! 🎉');
    } catch (error) {
      console.error('Failed to save build:', error);
      alert('Failed to save build. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPrice = calculateTotalPrice();
  const selectedPartsCount = Object.keys(selectedParts).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🎨 Chopper Configurator
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          Design and visualize your dream Harley Chopper
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Style Selection */}
        <div className="lg:col-span-1">
          <Card className="bg-black/40 border-orange-500/20 mb-6">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                🏍️ Choose Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {chopperStyles.map((style: ChopperStyle) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleSelect(style)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStyle?.id === style.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium mb-1">{style.name}</div>
                  <div className="text-sm opacity-80">{style.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Part Categories */}
          <Card className="bg-black/40 border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                🔧 Select Parts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partCategories.map((category: PartCategory) => (
                <div key={category.id} className="space-y-2">
                  <Label className="text-white font-medium">{category.name}</Label>
                  <Select 
                    value={selectedParts[category.id]?.id.toString() || ''}
                    onValueChange={(value: string) => {
                      const partId = parseInt(value);
                      const part = availableParts[category.id]?.find((p: Part) => p.id === partId);
                      if (part) {
                        handlePartSelect(category.id, part);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder={`Choose ${category.name}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {availableParts[category.id]?.map((part: Part) => (
                        <SelectItem key={part.id} value={part.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{part.name}</span>
                            <span className="text-green-400 ml-2">${part.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-2">
          <Card className="bg-black/40 border-orange-500/20 mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  👁️ Build Preview
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    💰 Total: ${totalPrice.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    🔧 {selectedPartsCount} parts selected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedStyle ? (
                <div className="space-y-6">
                  {/* Style Preview */}
                  <div className="text-center p-6 bg-gray-800/50 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {selectedStyle.name} Style
                    </h3>
                    {selectedStyle.image_url ? (
                      <img 
                        src={selectedStyle.image_url} 
                        alt={selectedStyle.name}
                        className="max-w-full h-64 object-contain mx-auto rounded-lg mb-4"
                      />
                    ) : (
                      <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg mb-4">
                        <div className="text-6xl">🏍️</div>
                      </div>
                    )}
                    <p className="text-gray-300 text-sm">{selectedStyle.description}</p>
                  </div>

                  {/* Selected Parts List */}
                  {selectedPartsCount > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white">Selected Components:</h4>
                      {Object.values(selectedParts).map((part: Part) => (
                        <div key={part.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-white">{part.name}</div>
                            <div className="text-sm text-gray-400">{part.description}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-green-400 font-medium">${part.price}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const categoryId = Object.entries(selectedParts).find(([, p]) => p.id === part.id)?.[0];
                                if (categoryId) removePart(parseInt(categoryId));
                              }}
                              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save Build Button */}
                  {(selectedStyle || selectedPartsCount > 0) && (
                    <div className="flex justify-center pt-4">
                      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                            💾 Save Build Configuration
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-orange-500/20">
                          <DialogHeader>
                            <DialogTitle className="text-orange-400">Save Your Build</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="buildName" className="text-white">Build Name *</Label>
                              <Input
                                id="buildName"
                                value={buildName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuildName(e.target.value)}
                                placeholder="My Awesome Chopper"
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div>
                              <Label htmlFor="buildDescription" className="text-white">Description</Label>
                              <Textarea
                                id="buildDescription"
                                value={buildDescription}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBuildDescription(e.target.value)}
                                placeholder="Describe your build..."
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="isPublic"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                              />
                              <Label htmlFor="isPublic" className="text-white">
                                Make this build public (share with community)
                              </Label>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={handleSaveBuild}
                                disabled={isSaving}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                {isSaving ? 'Saving...' : '💾 Save Build'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowSaveDialog(false)}
                                className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏍️</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Choose a Style to Get Started
                  </h3>
                  <p className="text-gray-500">
                    Select a chopper style from the left panel to begin configuring your build
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Build Summary */}
          {(selectedStyle || selectedPartsCount > 0) && (
            <Card className="bg-black/40 border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-400">📊 Build Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">{selectedStyle ? 1 : 0}</div>
                    <div className="text-sm text-gray-400">Style Selected</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{selectedPartsCount}</div>
                    <div className="text-sm text-gray-400">Parts Selected</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">${totalPrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">Total Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}