import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Plant } from "@shared/schema";

export default function PlantDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: plant,
    isLoading,
    error,
  } = useQuery<Plant>({
    queryKey: ["/api/plants", id],
    enabled: !!id,
  });

  const updateCountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/plants/${id}/count`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plants", id] });
      setLocation("/library");
      toast({
        title: "Success",
        description: "Plant saved to your library",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save plant",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateCountMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="bg-light-pastel-green min-h-screen min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dark-green" />
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="bg-light-pastel-green min-h-screen min-h-[100dvh] flex items-center justify-center px-4">
        <div className="text-dark-green text-center">
          <h2 className="text-xl font-medium mb-2">Plant not found</h2>
          <p className="text-sm opacity-70 mb-4">
            The plant you're looking for doesn't exist
          </p>
          <Button onClick={() => setLocation("/library")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-pastel-green flex flex-col min-h-screen min-h-[100dvh]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/camera")}
          className="text-dark-green hover:bg-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-dark-green text-lg font-medium">Plant Details</h1>
        <Button
          onClick={handleSave}
          disabled={updateCountMutation.isPending}
          className="bg-forest-green text-white-pastel px-4 py-2 font-medium hover:bg-dark-green"
        >
          {updateCountMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {/* Plant Photo */}
      <div className="px-4 mb-6">
        {plant.imageUrl ? (
          <img
            src={plant.imageUrl}
            alt={plant.commonName}
            className="w-full h-64 object-cover rounded-xl shadow-lg"
            onError={(e) => {
              console.error("Failed to load plant image:", plant.imageUrl?.substring(0, 100) + "...");
            }}
            onLoad={() => {
              console.log("Plant image loaded successfully");
            }}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center text-gray-500">
            <span>No photo available</span>
          </div>
        )}
      </div>

      {/* AI Analysis Results */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-dark-green text-xl font-semibold mb-2">
              {plant.scientificName}
            </h2>
            <p className="text-gray-600 font-medium">{plant.commonName}</p>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-dark-green font-semibold mb-1">Family</h3>
              <p className="text-gray-700">{plant.family}</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">Origin</h3>
              <p className="text-gray-700">{plant.origin}</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">Care Level</h3>
              <p className="text-gray-700">{plant.careLevel}</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">
                Light Requirements
              </h3>
              <p className="text-gray-700">{plant.lightRequirements}</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">Watering</h3>
              <p className="text-gray-700">{plant.watering}</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">
                Special Features
              </h3>
              <p className="text-gray-700">{plant.specialFeatures}</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">
                Aroma Level
              </h3>
              <p className="text-gray-700">{plant.aromaLevel}/10</p>
            </div>

            <div>
              <h3 className="text-dark-green font-semibold mb-1">
                Confidence Level
              </h3>
              <div className="flex items-center space-x-2">
                <Progress value={plant.confidence} className="flex-1" />
                <span className="text-dark-green font-medium text-sm">
                  {plant.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
