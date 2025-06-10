import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Trash2, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Plant } from "@shared/schema";
import { useState, useRef } from "react";

export default function PlantLibrary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: plants = [],
    isLoading,
    error,
  } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/plants");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: "Success",
        description: "All plants deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete plants",
        variant: "destructive",
      });
    },
  });

  const deletePlantMutation = useMutation({
    mutationFn: async (plantId: number) => {
      const response = await apiRequest("DELETE", `/api/plants/${plantId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: "Success",
        description: "Plant deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete plant",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAll = () => {
    if (window.confirm("Delete all identified plants?")) {
      deleteAllMutation.mutate();
    }
  };

  const handlePlantClick = (plantId: number) => {
    console.log("Clicking plant with ID:", plantId);
    setLocation(`/plant/${plantId}`);
  };

  const handleDeletePlant = (plantId: number, plantName: string) => {
    if (window.confirm(`Delete ${plantName}?`)) {
      deletePlantMutation.mutate(plantId);
    }
  };

  // Swipe handling
  const [swipeStates, setSwipeStates] = useState<Record<number, { startX: number; currentX: number; isDeleting: boolean }>>({});

  const handleTouchStart = (e: React.TouchEvent, plantId: number) => {
    const touch = e.touches[0];
    setSwipeStates(prev => ({
      ...prev,
      [plantId]: { startX: touch.clientX, currentX: 0, isDeleting: false }
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, plantId: number) => {
    const touch = e.touches[0];
    const state = swipeStates[plantId];
    if (!state) return;

    const currentX = touch.clientX - state.startX;
    setSwipeStates(prev => ({
      ...prev,
      [plantId]: { ...state, currentX }
    }));
  };

  const handleTouchEnd = (plantId: number, plantName: string) => {
    const state = swipeStates[plantId];
    if (!state) return;

    // If swiped left more than 100px, delete the plant
    if (state.currentX < -100) {
      handleDeletePlant(plantId, plantName);
    }

    // Reset swipe state
    setSwipeStates(prev => {
      const newState = { ...prev };
      delete newState[plantId];
      return newState;
    });
  };

  if (error) {
    return (
      <div className="bg-forest-green min-h-screen min-h-[100dvh] flex items-center justify-center px-4">
        <div className="text-white-pastel text-center">
          <h2 className="text-xl font-medium mb-2">Unable to load plants</h2>
          <p className="text-sm opacity-70">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-forest-green flex flex-col min-h-screen min-h-[100dvh]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-12">
        <h1 className="text-white-pastel text-2xl font-light">All Plants</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeleteAll}
          disabled={deleteAllMutation.isPending || plants.length === 0}
          className="text-white-pastel hover:bg-dark-green"
        >
          {deleteAllMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Plant List Container */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white-pastel" />
          </div>
        ) : plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white-pastel text-center">
            <Camera className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No plants identified yet</h3>
            <p className="text-sm opacity-70 mb-4">
              Start by taking a photo of a plant to identify it
            </p>
          </div>
        ) : (
          plants.map((plant) => {
            const swipeState = swipeStates[plant.id] || { currentX: 0 };
            const translateX = Math.min(0, swipeState.currentX);
            const showDeleteIcon = swipeState.currentX < -50;
            
            return (
              <div
                key={plant.id}
                className="relative overflow-hidden rounded-xl"
              >
                {/* Delete background */}
                <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                
                {/* Plant item */}
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    if (!swipeState.currentX) {
                      handlePlantClick(plant.id);
                    }
                  }}
                  onTouchStart={(e) => handleTouchStart(e, plant.id)}
                  onTouchMove={(e) => handleTouchMove(e, plant.id)}
                  onTouchEnd={() => handleTouchEnd(plant.id, plant.commonName)}
                  className="bg-dark-green rounded-xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-opacity-80 transition-all relative"
                  style={{
                    transform: `translateX(${translateX}px)`,
                    transition: swipeState.currentX === 0 ? 'transform 0.3s ease-out' : 'none'
                  }}
                >
                  <img
                    src={plant.imageUrl}
                    alt={plant.commonName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-white-pastel font-medium">
                      {plant.scientificName}
                    </h3>
                    <p className="text-white-pastel opacity-70 text-sm">
                      {plant.commonName}
                    </p>
                  </div>
                  <div className="text-white-pastel text-sm bg-forest-green px-2 py-1 rounded-md">
                    {plant.identificationCount}x
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-forest-green to-transparent">
        <Button
          onClick={() => setLocation("/camera")}
          className="w-full py-4 text-lg font-semibold shadow-lg"
          style={{
            backgroundColor: 'var(--white-pastel)',
            color: 'var(--forest-green)',
          }}
        >
          <Camera className="mr-2 h-5 w-5" />
          Identify New Plant
        </Button>
      </div>
    </div>
  );
}
