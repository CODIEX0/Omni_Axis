import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, MapPin, Clock, DollarSign, Star, Users, TrendingUp, Award, Briefcase, CircleCheck as CheckCircle, Plus, Target, Coins, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useTypedSelector } from '../../hooks/useTypedSelector';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'data-labeling' | 'verification' | 'outreach' | 'research' | 'content';
  reward: number;
  currency: 'USDC' | 'OAX';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  location?: string;
  requiredSkills: string[];
  poster: {
    name: string;
    rating: number;
    avatar: string;
  };
  applicants: number;
  deadline: string;
  status: 'open' | 'in-progress' | 'completed';
  isStaked: boolean;
}

interface UserStats {
  totalEarnings: number;
  completedTasks: number;
  reputation: number;
  currentStake: number;
  yieldEarned: number;
  rank: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Verify Local Real Estate Property',
    description: 'Visit and photograph a residential property in downtown area. Verify address, condition, and surrounding amenities.',
    category: 'verification',
    reward: 25,
    currency: 'USDC',
    difficulty: 'easy',
    estimatedTime: '2-3 hours',
    location: 'New York, NY',
    requiredSkills: ['Photography', 'Local Knowledge'],
    poster: {
      name: 'PropertyCorp',
      rating: 4.8,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 3,
    deadline: '2024-01-20',
    status: 'open',
    isStaked: true
  },
  {
    id: '2',
    title: 'Label Art Collection Images',
    description: 'Categorize and tag 500 artwork images by style, period, and medium. Requires art history knowledge.',
    category: 'data-labeling',
    reward: 50,
    currency: 'OAX',
    difficulty: 'medium',
    estimatedTime: '4-6 hours',
    requiredSkills: ['Art History', 'Data Entry'],
    poster: {
      name: 'ArtDAO',
      rating: 4.9,
      avatar: 'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 8,
    deadline: '2024-01-25',
    status: 'open',
    isStaked: true
  },
  {
    id: '3',
    title: 'Community Outreach Survey',
    description: 'Conduct interviews with 20 local residents about financial inclusion and digital asset awareness.',
    category: 'outreach',
    reward: 75,
    currency: 'USDC',
    difficulty: 'medium',
    estimatedTime: '1-2 days',
    location: 'Lagos, Nigeria',
    requiredSkills: ['Communication', 'Local Language'],
    poster: {
      name: 'FinInclusion',
      rating: 4.7,
      avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 5,
    deadline: '2024-01-30',
    status: 'open',
    isStaked: true
  },
  {
    id: '4',
    title: 'Commodity Price Research',
    description: 'Research and compile current market prices for gold, silver, and agricultural products in your region.',
    category: 'research',
    reward: 40,
    currency: 'OAX',
    difficulty: 'easy',
    estimatedTime: '3-4 hours',
    requiredSkills: ['Research', 'Market Analysis'],
    poster: {
      name: 'CommodityTracker',
      rating: 4.6,
      avatar: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 12,
    deadline: '2024-01-22',
    status: 'open',
    isStaked: true
  }
];

const mockUserStats: UserStats = {
  totalEarnings: 1250.50,
  completedTasks: 23,
  reputation: 4.7,
  currentStake: 500,
  yieldEarned: 45.30,
  rank: 'Gold'
};

export default function CommunityScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useTypedSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard' | 'staking'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [userStats, setUserStats] = useState<UserStats>(mockUserStats);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: 'All Tasks', icon: Briefcase, color: '#6B7280' },
    { id: 'verification', name: 'Verification', icon: CheckCircle, color: '#10B981' },
    { id: 'data-labeling', name: 'Data Labeling', icon: Target, color: '#3B82F6' },
    { id: 'outreach', name: 'Outreach', icon: Users, color: '#8B5CF6' },
    { id: 'research', name: 'Research', icon: Search, color: '#F59E0B' },
    { id: 'content', name: 'Content', icon: Award, color: '#EF4444' },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Bronze': return '#CD7F32';
      case 'Silver': return '#C0C0C0';
      case 'Gold': return '#FFD700';
      case 'Platinum': return '#E5E4E2';
      default: return '#6B7280';
    }
  };

  const renderTaskCard = (task: Task) => (
    <TouchableOpacity key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskCategory}>
          <Text style={styles.taskCategoryText}>{task.category.replace('-', ' ').toUpperCase()}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty) }]}>
          <Text style={styles.difficultyText}>{task.difficulty.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>

      <View style={styles.taskMeta}>
        <View style={styles.taskMetaItem}>
          <DollarSign color="#10B981" size={16} />
          <Text style={styles.taskReward}>{task.reward} {task.currency}</Text>
        </View>
        <View style={styles.taskMetaItem}>
          <Clock color="#6B7280" size={16} />
          <Text style={styles.taskTime}>{task.estimatedTime}</Text>
        </View>
        {task.location && (
          <View style={styles.taskMetaItem}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.taskLocation}>{task.location}</Text>
          </View>
        )}
      </View>

      <View style={styles.taskSkills}>
        {task.requiredSkills.slice(0, 2).map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
        {task.requiredSkills.length > 2 && (
          <Text style={styles.moreSkills}>+{task.requiredSkills.length - 2} more</Text>
        )}
      </View>

      <View style={styles.taskFooter}>
        <View style={styles.posterInfo}>
          <Image source={{ uri: task.poster.avatar }} style={styles.posterAvatar} />
          <View>
            <Text style={styles.posterName}>{task.poster.name}</Text>
            <View style={styles.posterRating}>
              <Star color="#F59E0B" size={12} fill="#F59E0B" />
              <Text style={styles.ratingText}>{task.poster.rating}</Text>
            </View>
          </View>
        </View>
        <View style={styles.taskStats}>
          <Text style={styles.applicantsText}>{task.applicants} applicants</Text>
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTasksTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#6B7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color="#6B7280" size={20} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && styles.categoryItemActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <category.icon 
              color={selectedCategory === category.id ? '#FFFFFF' : category.color} 
              size={16} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.map(renderTaskCard)}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );

  const renderDashboardTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* User Stats Card */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.statsCard}
      >
        <View style={styles.statsHeader}>
          <View>
            <Text style={styles.statsTitle}>Your Performance</Text>
            <View style={styles.rankBadge}>
              <Award color="#FFFFFF" size={16} />
              <Text style={[styles.rankText, { color: getRankColor(userStats.rank) }]}>
                {userStats.rank} Member
              </Text>
            </View>
          </View>
          <View style={styles.reputationScore}>
            <Star color="#F59E0B" size={20} fill="#F59E0B" />
            <Text style={styles.reputationText}>{userStats.reputation}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${userStats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.completedTasks}</Text>
            <Text style={styles.statLabel}>Tasks Completed</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' }]}>
              <Plus color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.quickActionText}>Post Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F6' }]}>
              <Search color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.quickActionText}>Find Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF6' }]}>
              <TrendingUp color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
              <Coins color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.quickActionText}>Stake Tokens</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
              <CheckCircle color="#FFFFFF" size={16} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Task Completed</Text>
              <Text style={styles.activityDescription}>Verified property in Manhattan</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <Text style={styles.activityAmount}>+$25</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#3B82F6' }]}>
              <Coins color="#FFFFFF" size={16} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Yield Earned</Text>
              <Text style={styles.activityDescription}>Staking rewards distributed</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
            <Text style={styles.activityAmount}>+$12.50</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#8B5CF6' }]}>
              <Star color="#FFFFFF" size={16} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Rating Received</Text>
              <Text style={styles.activityDescription}>5-star rating from ArtDAO</Text>
              <Text style={styles.activityTime}>3 days ago</Text>
            </View>
            <Text style={styles.activityAmount}>+Rep</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStakingTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Staking Overview */}
      <LinearGradient
        colors={['#8B5CF6', '#A855F7']}
        style={styles.stakingCard}
      >
        <View style={styles.stakingHeader}>
          <Shield color="#FFFFFF" size={24} />
          <Text style={styles.stakingTitle}>Token Staking</Text>
        </View>
        <Text style={styles.stakingSubtitle}>
          Stake OAX tokens to earn a share of platform fees
        </Text>

        <View style={styles.stakingStats}>
          <View style={styles.stakingStat}>
            <Text style={styles.stakingStatValue}>{userStats.currentStake} OAX</Text>
            <Text style={styles.stakingStatLabel}>Currently Staked</Text>
          </View>
          <View style={styles.stakingStat}>
            <Text style={styles.stakingStatValue}>${userStats.yieldEarned}</Text>
            <Text style={styles.stakingStatLabel}>Yield Earned</Text>
          </View>
        </View>

        <View style={styles.stakingActions}>
          <TouchableOpacity style={styles.stakeButton}>
            <Text style={styles.stakeButtonText}>Stake More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.unstakeButton}>
            <Text style={styles.unstakeButtonText}>Unstake</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Yield Pools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yield Pools</Text>
        
        <View style={styles.poolCard}>
          <View style={styles.poolHeader}>
            <Text style={styles.poolName}>Community Tasks Pool</Text>
            <View style={styles.poolApy}>
              <Text style={styles.apyText}>12.5% APY</Text>
            </View>
          </View>
          <Text style={styles.poolDescription}>
            Earn rewards from task completion fees and platform revenue
          </Text>
          <View style={styles.poolStats}>
            <View style={styles.poolStat}>
              <Text style={styles.poolStatLabel}>Total Staked</Text>
              <Text style={styles.poolStatValue}>1.2M OAX</Text>
            </View>
            <View style={styles.poolStat}>
              <Text style={styles.poolStatLabel}>Your Share</Text>
              <Text style={styles.poolStatValue}>0.04%</Text>
            </View>
          </View>
        </View>

        <View style={styles.poolCard}>
          <View style={styles.poolHeader}>
            <Text style={styles.poolName}>Asset Verification Pool</Text>
            <View style={styles.poolApy}>
              <Text style={styles.apyText}>8.7% APY</Text>
            </View>
          </View>
          <Text style={styles.poolDescription}>
            Earn from asset tokenization and verification services
          </Text>
          <View style={styles.poolStats}>
            <View style={styles.poolStat}>
              <Text style={styles.poolStatLabel}>Total Staked</Text>
              <Text style={styles.poolStatValue}>850K OAX</Text>
            </View>
            <View style={styles.poolStat}>
              <Text style={styles.poolStatLabel}>Your Share</Text>
              <Text style={styles.poolStatValue}>0.06%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Staking Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staking Benefits</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <CheckCircle color="#10B981" size={20} />
            <Text style={styles.benefitText}>Earn passive income from platform fees</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle color="#10B981" size={20} />
            <Text style={styles.benefitText}>Access to premium tasks and higher rewards</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle color="#10B981" size={20} />
            <Text style={styles.benefitText}>Governance voting rights on platform decisions</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle color="#10B981" size={20} />
            <Text style={styles.benefitText}>Reduced fees on all platform services</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>
          Earn through micro-tasks and staking
        </Text>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tasks' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tasks')}
          >
            <Briefcase color={activeTab === 'tasks' ? '#1E40AF' : 'rgba(255, 255, 255, 0.7)'} size={16} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'tasks' && styles.tabButtonTextActive
            ]}>
              Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'dashboard' && styles.tabButtonActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <TrendingUp color={activeTab === 'dashboard' ? '#1E40AF' : 'rgba(255, 255, 255, 0.7)'} size={16} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'dashboard' && styles.tabButtonTextActive
            ]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'staking' && styles.tabButtonActive]}
            onPress={() => setActiveTab('staking')}
          >
            <Coins color={activeTab === 'staking' ? '#1E40AF' : 'rgba(255, 255, 255, 0.7)'} size={16} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'staking' && styles.tabButtonTextActive
            ]}>
              Staking
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Content */}
      {activeTab === 'tasks' && renderTasksTab()}
      {activeTab === 'dashboard' && renderDashboardTab()}
      {activeTab === 'staking' && renderStakingTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabButtonTextActive: {
    color: '#1E40AF',
  },
  tabContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  categoryItemActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCategory: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskCategoryText: {
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
  taskTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskReward: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  taskTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  taskLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  taskSkills: {
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
  taskFooter: {
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
  posterName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  posterRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  taskStats: {
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
  bottomPadding: {
    height: 20,
  },
  statsCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  rankText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  reputationScore: {
    alignItems: 'center',
    gap: 4,
  },
  reputationText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
  },
  activityList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  activityAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  stakingCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  stakingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stakingTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  stakingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  stakingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stakingStat: {
    flex: 1,
  },
  stakingStatValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stakingStatLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  stakingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  stakeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stakeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  unstakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  unstakeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  poolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  poolName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  poolApy: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  apyText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#166534',
  },
  poolDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poolStat: {
    flex: 1,
  },
  poolStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  poolStatValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  benefitsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
});