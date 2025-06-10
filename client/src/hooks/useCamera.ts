import { useEffect, useState, RefObject } from "react";

interface UseCameraReturn {
  isPermissionGranted: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export function useCamera(videoRef: RefObject<HTMLVideoElement>): UseCameraReturn {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setStream(mediaStream);
        setIsPermissionGranted(true);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        
        console.error("Camera access denied:", err);
        setError("Camera access denied");
        setIsPermissionGranted(false);
      }
    }

    initializeCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { isPermissionGranted, error, stream };
}
