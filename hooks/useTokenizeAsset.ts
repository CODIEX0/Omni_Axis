import { useState } from 'react';
import { 
  useContract, 
  useContractWrite, 
  useContractRead,
  Web3Button,
} from '@thirdweb-dev/react-native';
import { CONTRACTS } from '../constants';
import { ipfsService } from '../services/ipfs';
import { supabase, Asset } from '../services/supabase';
import { useAuth } from './useAuth';
import { useWalletConnection } from './useWallet';

export interface TokenizeAssetData {
  title: string;
  description: string;
  assetType: string;
  estimatedValue: number;
  imageUris: string[];
  documentUris: string[];
  location?: string;
}

export interface TokenizationStatus {
  step: 'idle' | 'uploading' | 'minting' | 'saving' | 'completed' | 'error';
  message: string;
  progress: number;
  error?: string;
}

export const useTokenizeAsset = () => {
  const { user } = useAuth();
  const { address, isConnected } = useWalletConnection();
  
  // Get contract instances
  const { contract: assetTokenContract } = useContract(CONTRACTS.ASSET_TOKEN);
  const { contract: marketplaceContract } = useContract(CONTRACTS.MARKETPLACE);

  // Contract functions
  const { mutateAsync: mintNFT } = useContractWrite(assetTokenContract || undefined, 'mintTo');
  const { mutateAsync: listOnMarketplace } = useContractWrite(marketplaceContract || undefined, 'createListing');

  const [tokenizationStatus, setTokenizationStatus] = useState<TokenizationStatus>({
    step: 'idle',
    message: '',
    progress: 0,
  });

  // Tokenize asset function
  const tokenizeAsset = async (assetData: TokenizeAssetData): Promise<{ success: boolean; tokenId?: string; error?: string }> => {
    if (!user || !address || !isConnected) {
      return { success: false, error: 'User not authenticated or wallet not connected' };
    }

    try {
      // Step 1: Upload to IPFS
      setTokenizationStatus({
        step: 'uploading',
        message: 'Uploading asset data to IPFS...',
        progress: 20,
      });

      const metadataHash = await ipfsService.createAssetMetadata({
        name: assetData.title,
        description: assetData.description,
        assetType: assetData.assetType,
        estimatedValue: assetData.estimatedValue,
        imageUris: assetData.imageUris,
        documentUris: assetData.documentUris,
        owner: address,
        location: assetData.location,
      });

      const metadataUri = ipfsService.getIPFSUrl(metadataHash);

      // Step 2: Mint NFT
      setTokenizationStatus({
        step: 'minting',
        message: 'Minting NFT on blockchain...',
        progress: 60,
      });

      const mintResult = await mintNFT({
        args: [address, metadataUri] as any,
      });

      // Extract token ID from transaction receipt
      const tokenId = (mintResult.receipt as any).events?.find(
        (event: any) => event.event === 'Transfer'
      )?.args?.tokenId?.toString();

      if (!tokenId) {
        throw new Error('Failed to get token ID from mint transaction');
      }

      // Step 3: Save to database
      setTokenizationStatus({
        step: 'saving',
        message: 'Saving asset to database...',
        progress: 80,
      });

      const { error: dbError } = await supabase
        .from('assets')
        .insert({
          owner_id: user.id,
          title: assetData.title,
          description: assetData.description,
          asset_type: assetData.assetType,
          estimated_value: assetData.estimatedValue,
          token_id: tokenId,
          contract_address: CONTRACTS.ASSET_TOKEN,
          metadata_uri: metadataUri,
          image_urls: assetData.imageUris,
          document_urls: assetData.documentUris,
          status: 'tokenized',
          is_listed: false,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the entire process for DB errors
      }

      // Step 4: Completed
      setTokenizationStatus({
        step: 'completed',
        message: 'Asset successfully tokenized!',
        progress: 100,
      });

      return { success: true, tokenId };

    } catch (error) {
      console.error('Tokenization error:', error);
      
      setTokenizationStatus({
        step: 'error',
        message: 'Failed to tokenize asset',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // List asset on marketplace
  const listAssetOnMarketplace = async (
    tokenId: string,
    price: string,
    currency: string = 'NATIVE'
  ): Promise<{ success: boolean; listingId?: string; error?: string }> => {
    if (!user || !address || !isConnected) {
      return { success: false, error: 'User not authenticated or wallet not connected' };
    }

    try {
      // Create listing on marketplace contract
      const listingResult = await listOnMarketplace({
        args: [
          {
            assetContract: CONTRACTS.ASSET_TOKEN,
            tokenId: tokenId,
            quantity: 1,
            currency: currency === 'NATIVE' ? '0x0000000000000000000000000000000000001010' : currency,
            pricePerToken: price,
            startTimestamp: Math.floor(Date.now() / 1000),
            endTimestamp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
            reserved: false,
          }
        ] as any,
      });

      // Extract listing ID from transaction receipt
      const listingId = (listingResult.receipt as any).events?.find(
        (event: any) => event.event === 'NewListing'
      )?.args?.listingId?.toString();

      // Update asset in database
      await supabase
        .from('assets')
        .update({
          is_listed: true,
          listing_price: parseFloat(price),
        })
        .eq('token_id', tokenId)
        .eq('owner_id', user.id);

      return { success: true, listingId };

    } catch (error) {
      console.error('Listing error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Buy asset from marketplace
  const buyAsset = async (
    listingId: string,
    price: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !address || !isConnected) {
      return { success: false, error: 'User not authenticated or wallet not connected' };
    }

    try {
      // Buy from marketplace contract
      const buyResult = await (marketplaceContract as any)?.call('buyFromListing', [
        listingId,
        address,
        1,
        '0x0000000000000000000000000000000000001010', // MATIC
        price,
      ]);

      // Record transaction in database
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          asset_id: '', // You'd need to get this from the listing
          transaction_type: 'buy',
          amount: parseFloat(price),
          currency: 'MATIC',
          transaction_hash: buyResult.receipt.transactionHash,
          status: 'confirmed',
        });

      return { success: true };

    } catch (error) {
      console.error('Buy error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Get user's assets
  const getUserAssets = async (): Promise<Asset[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user assets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user assets:', error);
      return [];
    }
  };

  // Get all listed assets (marketplace)
  const getMarketplaceAssets = async (): Promise<Asset[]> => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_listed', true)
        .eq('status', 'tokenized')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching marketplace assets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching marketplace assets:', error);
      return [];
    }
  };

  // Reset tokenization status
  const resetStatus = () => {
    setTokenizationStatus({
      step: 'idle',
      message: '',
      progress: 0,
    });
  };

  return {
    tokenizeAsset,
    listAssetOnMarketplace,
    buyAsset,
    getUserAssets,
    getMarketplaceAssets,
    tokenizationStatus,
    resetStatus,
    assetTokenContract,
    marketplaceContract,
  };
};
