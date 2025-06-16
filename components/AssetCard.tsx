import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, TrendingUp, TrendingDown, Users } from 'lucide-react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { MarketplaceAsset } from '../store/slices/marketplaceSlice';

interface AssetCardProps {
  asset: MarketplaceAsset;
  onPress: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

const { width } = Dimensions.get('window');

export function AssetCard({ asset, onPress, variant = 'default' }: AssetCardProps) {
  const cardWidth = variant === 'compact' ? width * 0.75 : '100%';

  const renderChangeIndicator = () => {
    const isPositive = asset.change24h >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? '#10B981' : '#EF4444';

    return (
      <View style={[styles.changeBadge, { backgroundColor: `${color}20` }]}>
        <Icon color={color} size={12} />
        <Text style={[styles.changeText, { color }]}>
          {isPositive ? '+' : ''}{asset.change24h.toFixed(1)}%
        </Text>
      </View>
    );
  };

  const renderAvailabilityBar = () => {
    const percentage = ((asset.totalTokens - asset.availableTokens) / asset.totalTokens) * 100;
    
    return (
      <View style={styles.availabilityContainer}>
        <View style={styles.availabilityBar}>
          <View style={[styles.availabilityFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.availabilityText}>
          {asset.availableTokens.toLocaleString()} tokens available
        </Text>
      </View>
    );
  };

  if (variant === 'featured') {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.featuredCard, { width: cardWidth }]}>
        <LinearGradient
          colors={['rgba(30, 64, 175, 0.9)', 'rgba(59, 130, 246, 0.7)']}
          style={styles.featuredGradient}
        >
          <Image source={{ uri: asset.image }} style={styles.featuredImage} />
          
          <View style={styles.featuredContent}>
            <View style={styles.featuredHeader}>
              <Badge variant="info" size="small">{asset.type.replace('-', ' ')}</Badge>
              {asset.verified && (
                <View style={styles.verifiedBadge}>
                  <Star color="#FFFFFF" size={12} fill="#FFFFFF" />
                </View>
              )}
            </View>
            
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {asset.name}
            </Text>
            <Text style={styles.featuredLocation}>{asset.location}</Text>
            
            <View style={styles.featuredMetrics}>
              <View style={styles.featuredMetric}>
                <Text style={styles.featuredMetricLabel}>Token Price</Text>
                <Text style={styles.featuredMetricValue}>${asset.tokenPrice}</Text>
              </View>
              <View style={styles.featuredMetric}>
                <Text style={styles.featuredMetricLabel}>ROI</Text>
                <Text style={[styles.featuredMetricValue, styles.positiveMetric]}>
                  {asset.roi}%
                </Text>
              </View>
            </View>
            
            {renderChangeIndicator()}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <Card onPress={onPress} style={[styles.card, { width: cardWidth }] as any} variant="elevated">
      <View style={styles.imageContainer}>
        <Image source={{ uri: asset.image }} style={styles.image} />
        
        {asset.verified && (
          <View style={styles.verifiedBadgeOverlay}>
            <Star color="#FFFFFF" size={12} fill="#FFFFFF" />
          </View>
        )}
        
        <View style={styles.changeOverlay}>
          {renderChangeIndicator()}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Badge variant="default" size="small">
            {asset.type.replace('-', ' ').toUpperCase()}
          </Badge>
          <View style={styles.rating}>
            <Star color="#F59E0B" size={12} fill="#F59E0B" />
            <Text style={styles.ratingText}>{asset.rating}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {asset.name}
        </Text>
        <Text style={styles.location}>{asset.location}</Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Token Price</Text>
            <Text style={styles.metricValue}>${asset.tokenPrice}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>ROI</Text>
            <Text style={[styles.metricValue, styles.positiveMetric]}>
              {asset.roi}%
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Investors</Text>
            <View style={styles.investorCount}>
              <Users color="#6B7280" size={12} />
              <Text style={styles.metricValue}>{asset.investors}</Text>
            </View>
          </View>
        </View>

        {renderAvailabilityBar()}

        <TouchableOpacity style={styles.investButton}>
          <Text style={styles.investButtonText}>Invest Now</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  featuredCard: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
  },
  featuredGradient: {
    flex: 1,
    position: 'relative',
  },
  featuredImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  featuredContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  featuredLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuredMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredMetric: {
    flex: 1,
  },
  featuredMetricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  featuredMetricValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontFamily: 'Inter-Sem iBold',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 24,
  },
  location: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  positiveMetric: {
    color: '#10B981',
  },
  investorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityContainer: {
    marginBottom: 16,
  },
  availabilityBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 6,
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  availabilityText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  investButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  investButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});