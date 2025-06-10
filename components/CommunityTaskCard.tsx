import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { DollarSign, Clock, MapPin, Star, Users, CircleCheck as CheckCircle, Target, Search, Award, Briefcase } from 'lucide-react-native';
import type { Task } from '../store/slices/communitySlice';

interface CommunityTaskCardProps {
  task: Task;
  onPress: () => void;
  onApply: () => void;
}

export function CommunityTaskCard({ task, onPress, onApply }: CommunityTaskCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'verification': return CheckCircle;
      case 'data-labeling': return Target;
      case 'outreach': return Users;
      case 'research': return Search;
      case 'content': return Award;
      default: return Briefcase;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'verification': return '#10B981';
      case 'data-labeling': return '#3B82F6';
      case 'outreach': return '#8B5CF6';
      case 'research': return '#F59E0B';
      case 'content': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const CategoryIcon = getCategoryIcon(task.category);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(task.category) }]}>
            <CategoryIcon color="#FFFFFF" size={16} />
          </View>
          <Text style={styles.categoryText}>
            {task.category.replace('-', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty) }]}>
          <Text style={styles.difficultyText}>{task.difficulty.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {task.title}
      </Text>
      
      <Text style={styles.description} numberOfLines={3}>
        {task.description}
      </Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <DollarSign color="#10B981" size={16} />
          <Text style={styles.rewardText}>
            {task.reward} {task.currency}
          </Text>
        </View>
        
        <View style={styles.metaItem}>
          <Clock color="#6B7280" size={16} />
          <Text style={styles.metaText}>{task.estimatedTime}</Text>
        </View>
        
        {task.location && (
          <View style={styles.metaItem}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.metaText}>{task.location}</Text>
          </View>
        )}
      </View>

      <View style={styles.skillsContainer}>
        {task.requiredSkills.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
        {task.requiredSkills.length > 3 && (
          <Text style={styles.moreSkills}>+{task.requiredSkills.length - 3}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.posterInfo}>
          <Image source={{ uri: task.poster.avatar }} style={styles.posterAvatar} />
          <View style={styles.posterDetails}>
            <Text style={styles.posterName}>{task.poster.name}</Text>
            <View style={styles.ratingContainer}>
              <Star color="#F59E0B" size={12} fill="#F59E0B" />
              <Text style={styles.ratingText}>{task.poster.rating}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Text style={styles.applicantsText}>
            {task.applicants} applicants
          </Text>
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {task.isStaked && (
        <View style={styles.stakedIndicator}>
          <CheckCircle color="#10B981" size={12} />
          <Text style={styles.stakedText}>Escrow Secured</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  moreSkills: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  posterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  posterDetails: {
    gap: 2,
  },
  posterName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  actionContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  applicantsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  applyButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  stakedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stakedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
});