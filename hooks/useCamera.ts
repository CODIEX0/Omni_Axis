import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Platform } from 'react-native';

export interface CameraHook {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  takePicture: () => Promise<string | null>;
  cameraRef: React.RefObject<CameraView | null>;
  isLoading: boolean;
  error: string | null;
}

export function useCamera(): CameraHook {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const hasPermission = permission?.granted || false;

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setError('Camera not available on web platform');
      return false;
    }

    try {
      const result = await requestPermission();
      return result.granted;
    } catch (err) {
      setError('Failed to request camera permission');
      return false;
    }
  };

  const takePicture = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      setError('Camera not available on web platform');
      return null;
    }

    if (!hasPermission) {
      setError('Camera permission not granted');
      return null;
    }

    if (!cameraRef.current) {
      setError('Camera not ready');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      return photo?.uri || null;
    } catch (err) {
      setError('Failed to take picture');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasPermission,
    requestPermission: requestCameraPermission,
    takePicture,
    cameraRef,
    isLoading,
    error,
  };
}