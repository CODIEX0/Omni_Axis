import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface DocumentPickerResult {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface DocumentPickerHook {
  pickDocument: (types?: string[]) => Promise<DocumentPickerResult | null>;
  pickMultipleDocuments: (types?: string[]) => Promise<DocumentPickerResult[]>;
  isLoading: boolean;
  error: string | null;
}

export function useDocumentPicker(): DocumentPickerHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickDocument = async (types: string[] = ['*/*']): Promise<DocumentPickerResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: types,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
      };
    } catch (err) {
      setError('Failed to pick document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickMultipleDocuments = async (types: string[] = ['*/*']): Promise<DocumentPickerResult[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: types,
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        return [];
      }

      return result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
      }));
    } catch (err) {
      setError('Failed to pick documents');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pickDocument,
    pickMultipleDocuments,
    isLoading,
    error,
  };
}