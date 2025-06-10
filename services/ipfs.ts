import { ENV } from '../constants';
import * as FileSystem from 'expo-file-system';

export interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    asset_type: string;
    estimated_value: number;
    documents: string[];
    location?: string;
    owner: string;
  };
}

class IPFSService {
  private apiKey: string;
  private secretKey: string;
  private gatewayUrl: string;

  constructor() {
    this.apiKey = ENV.PINATA_API_KEY;
    this.secretKey = ENV.PINATA_SECRET_KEY;
    this.gatewayUrl = ENV.IPFS_GATEWAY_URL;
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(fileUri: string, fileName: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg', // Adjust based on file type
        name: fileName,
      } as any);

      const pinataMetadata = JSON.stringify({
        name: fileName,
      });
      formData.append('pinataMetadata', pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', pinataOptions);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: IPFSMetadata): Promise<string> {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name}_metadata`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get IPFS URL from hash
   */
  getIPFSUrl(hash: string): string {
    return `${this.gatewayUrl}/${hash}`;
  }

  /**
   * Upload multiple images and return their IPFS hashes
   */
  async uploadImages(imageUris: string[]): Promise<string[]> {
    const uploadPromises = imageUris.map((uri, index) => 
      this.uploadFile(uri, `image_${index}_${Date.now()}.jpg`)
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Upload documents and return their IPFS hashes
   */
  async uploadDocuments(documentUris: string[]): Promise<string[]> {
    const uploadPromises = documentUris.map((uri, index) => {
      const fileName = `document_${index}_${Date.now()}.pdf`;
      return this.uploadFile(uri, fileName);
    });
    
    return Promise.all(uploadPromises);
  }

  /**
   * Create and upload complete asset metadata
   */
  async createAssetMetadata(assetData: {
    name: string;
    description: string;
    assetType: string;
    estimatedValue: number;
    imageUris: string[];
    documentUris: string[];
    owner: string;
    location?: string;
  }): Promise<string> {
    try {
      // Upload images first
      const imageHashes = await this.uploadImages(assetData.imageUris);
      
      // Upload documents
      const documentHashes = await this.uploadDocuments(assetData.documentUris);

      // Create metadata object
      const metadata: IPFSMetadata = {
        name: assetData.name,
        description: assetData.description,
        image: imageHashes[0] ? this.getIPFSUrl(imageHashes[0]) : '',
        attributes: [
          {
            trait_type: 'Asset Type',
            value: assetData.assetType,
          },
          {
            trait_type: 'Estimated Value',
            value: assetData.estimatedValue,
          },
          {
            trait_type: 'Images Count',
            value: imageHashes.length,
          },
          {
            trait_type: 'Documents Count',
            value: documentHashes.length,
          },
        ],
        properties: {
          asset_type: assetData.assetType,
          estimated_value: assetData.estimatedValue,
          documents: documentHashes.map(hash => this.getIPFSUrl(hash)),
          location: assetData.location,
          owner: assetData.owner,
        },
      };

      // Add location attribute if provided
      if (assetData.location) {
        metadata.attributes.push({
          trait_type: 'Location',
          value: assetData.location,
        });
      }

      // Upload metadata
      const metadataHash = await this.uploadMetadata(metadata);
      return metadataHash;
    } catch (error) {
      console.error('Error creating asset metadata:', error);
      throw error;
    }
  }

  /**
   * Fetch metadata from IPFS
   */
  async fetchMetadata(hash: string): Promise<IPFSMetadata> {
    try {
      const response = await fetch(this.getIPFSUrl(hash));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching metadata from IPFS:', error);
      throw error;
    }
  }
}

export const ipfsService = new IPFSService();
