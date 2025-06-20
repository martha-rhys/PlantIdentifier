import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCamera } from "@/hooks/useCamera";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CameraScreen() {
  const [, setLocation] = useLocation();
  const [aromaLevel, setAromaLevel] = useState([5]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isPermissionGranted, error: cameraError } = useCamera(videoRef);
  const { getCurrentLocation } = useGeolocation();

  const identifyPlantMutation = useMutation({
    mutationFn: async (data: { imageData: string; locationData: any }) => {
      console.log("Attempting to identify plant with image data length:", data.imageData.length);
      const response = await apiRequest("POST", "/api/plants/identify", {
        imageData: data.imageData,
        aromaLevel: aromaLevel[0],
        latitude: data.locationData.latitude,
        longitude: data.locationData.longitude,
        locationName: data.locationData.locationName,
      });
      return response.json();
    },
    onSuccess: (plant) => {
      console.log("Plant identified successfully:", plant);
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      setLocation(`/plant/${plant.id}?from=camera`);
    },
    onError: (error) => {
      console.error("Plant identification error:", error);
      toast({
        title: "Error",
        description: `Failed to identify plant: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Use higher resolution while maintaining reasonable file size
    const maxWidth = 1200;
    const maxHeight = 1200;
    
    let { videoWidth, videoHeight } = video;
    
    if (videoWidth > maxWidth || videoHeight > maxHeight) {
      const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      videoWidth *= ratio;
      videoHeight *= ratio;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    context.drawImage(video, 0, 0, videoWidth, videoHeight);

    // Use higher quality compression for better detail
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    
    // Get current location
    const locationData = await getCurrentLocation();
    
    identifyPlantMutation.mutate({ imageData, locationData });
  };

  return (
    <div className="bg-forest-green flex flex-col h-screen max-h-[100dvh]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-12 relative z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/library")}
          className="text-white-pastel hover:bg-dark-green"
        >
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-white-pastel text-lg font-medium">Identify Plant</h1>
        <div className="w-10"></div>
      </div>

      {/* Camera Viewfinder */}
      <div className="flex-1 relative mx-4 mb-4 bg-black rounded-xl overflow-hidden">
        {cameraError ? (
          <div className="w-full h-full flex items-center justify-center text-white-pastel text-center p-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Camera access required</h3>
              <p className="text-sm opacity-70">
                Please allow camera access to identify plants
              </p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <div className="camera-viewfinder absolute inset-0 pointer-events-none"></div>

            {/* Capture Button */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={capturePhoto}
                disabled={!isPermissionGranted || identifyPlantMutation.isPending}
                className="w-16 h-16 rounded-full border-4 p-0 hover:scale-105 transition-transform"
                style={{
                  backgroundColor: 'var(--white-pastel)',
                  borderColor: 'var(--white-pastel)',
                }}
              >
                {identifyPlantMutation.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin text-forest-green" />
                ) : (
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: 'var(--white-pastel)' }}
                  ></div>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Loading Overlay */}
        {identifyPlantMutation.isPending && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-forest-green" />
              <div className="text-center">
                <h3 className="text-forest-green text-lg font-semibold mb-2">
                  Identifying Plant...
                </h3>
                <p className="text-gray-600 text-sm">
                  Please wait while we analyze your photo
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aroma Scale */}
      <div className="absolute bottom-6 right-6 flex flex-col items-center space-y-2 bg-dark-green rounded-xl p-3">
        <span className="text-white-pastel text-xs font-medium">Aroma</span>
        <div className="flex flex-col items-center space-y-1 h-32">
          <span className="text-white-pastel text-xs">10</span>
          <div className="flex-1 flex items-center">
            <Slider
              value={aromaLevel}
              onValueChange={setAromaLevel}
              max={10}
              min={0}
              step={1}
              orientation="vertical"
              className="h-20 w-4"
            />
          </div>
          <span className="text-white-pastel text-xs">0</span>
        </div>
        <span className="text-white-pastel text-xs font-medium">
          {aromaLevel[0]}
        </span>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
