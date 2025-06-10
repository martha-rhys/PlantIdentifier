import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams, useSearch } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Plant } from "@shared/schema";

export default function PlantDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const searchParams = useSearch();
  
  // Check if user came from camera (after taking photo) or from library
  const fromCamera = searchParams.includes('from=camera');

  const {
    data: plantData,
    isLoading,
    error,
  } = useQuery<Plant>({
    queryKey: ["/api/plants", id],
    enabled: !!id,
  });

  const plant = Array.isArray(plantData) ? plantData[0] : plantData;

  const handleOk = () => {
    setLocation("/library");
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
        {fromCamera ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/camera")}
            className="text-dark-green hover:bg-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        ) : (
          <div className="w-10"></div>
        )}
        <h1 className="text-dark-green text-lg font-medium">Plant Details</h1>
        <Button
          onClick={handleOk}
          className="bg-forest-green text-white-pastel px-4 py-2 font-medium hover:bg-dark-green"
        >
          OK
        </Button>
      </div>

      {/* Plant Photo */}
      <div className="px-4 mb-6">
        <img
          src={plant.imageUrl}
          alt={plant.commonName}
          className="w-full h-64 object-cover rounded-xl shadow-lg"
        />
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
