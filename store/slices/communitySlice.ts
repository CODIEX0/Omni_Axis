import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
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
    id: string;
    name: string;
    rating: number;
    avatar: string;
  };
  applicants: number;
  maxApplicants?: number;
  deadline: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  isStaked: boolean;
  escrowAmount: number;
  createdAt: string;
}

export interface TaskApplication {
  id: string;
  taskId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  appliedAt: string;
  proofOfWork?: string;
  rating?: number;
  feedback?: string;
}

export interface UserCommunityStats {
  totalEarnings: number;
  completedTasks: number;
  reputation: number;
  currentStake: number;
  yieldEarned: number;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  successRate: number;
  averageRating: number;
}

export interface StakingPool {
  id: string;
  name: string;
  description: string;
  apy: number;
  totalStaked: number;
  userStaked: number;
  userShare: number;
  minStake: number;
  lockPeriod: number; // in days
  rewards: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface CommunityState {
  tasks: Task[];
  filteredTasks: Task[];
  userApplications: TaskApplication[];
  userStats: UserCommunityStats;
  stakingPools: StakingPool[];
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: CommunityState = {
  tasks: [],
  filteredTasks: [],
  userApplications: [],
  userStats: {
    totalEarnings: 0,
    completedTasks: 0,
    reputation: 0,
    currentStake: 0,
    yieldEarned: 0,
    rank: 'Bronze',
    successRate: 0,
    averageRating: 0,
  },
  stakingPools: [],
  searchQuery: '',
  selectedCategory: 'all',
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Verify Local Real Estate Property',
    description: 'Visit and photograph a residential property in downtown area. Verify address, condition, and surrounding amenities. Must include GPS coordinates and timestamp.',
    category: 'verification',
    reward: 25,
    currency: 'USDC',
    difficulty: 'easy',
    estimatedTime: '2-3 hours',
    location: 'New York, NY',
    requiredSkills: ['Photography', 'Local Knowledge', 'GPS Navigation'],
    poster: {
      id: 'poster1',
      name: 'PropertyCorp',
      rating: 4.8,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 3,
    maxApplicants: 5,
    deadline: '2024-01-20T23:59:59Z',
    status: 'open',
    isStaked: true,
    escrowAmount: 25,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Label Art Collection Images',
    description: 'Categorize and tag 500 artwork images by style, period, and medium. Requires knowledge of art history and attention to detail.',
    category: 'data-labeling',
    reward: 50,
    currency: 'OAX',
    difficulty: 'medium',
    estimatedTime: '4-6 hours',
    requiredSkills: ['Art History', 'Data Entry', 'Attention to Detail'],
    poster: {
      id: 'poster2',
      name: 'ArtDAO',
      rating: 4.9,
      avatar: 'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 8,
    maxApplicants: 10,
    deadline: '2024-01-25T23:59:59Z',
    status: 'open',
    isStaked: true,
    escrowAmount: 50,
    createdAt: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: 'Community Financial Inclusion Survey',
    description: 'Conduct interviews with 20 local residents about financial inclusion and digital asset awareness. Survey must be completed in local language.',
    category: 'outreach',
    reward: 75,
    currency: 'USDC',
    difficulty: 'medium',
    estimatedTime: '1-2 days',
    location: 'Lagos, Nigeria',
    requiredSkills: ['Communication', 'Local Language', 'Survey Research'],
    poster: {
      id: 'poster3',
      name: 'FinInclusion',
      rating: 4.7,
      avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    applicants: 5,
    maxApplicants: 8,
    deadline: '2024-01-30T23:59:59Z',
    status: 'open',
    isStaked: true,
    escrowAmount: 75,
    createdAt: '2024-01-13T09:15:00Z'
  }
];

const mockStakingPools: StakingPool[] = [
  {
    id: 'pool1',
    name: 'Community Tasks Pool',
    description: 'Earn rewards from task completion fees and platform revenue',
    apy: 12.5,
    totalStaked: 1200000,
    userStaked: 500,
    userShare: 0.04,
    minStake: 100,
    lockPeriod: 0,
    rewards: {
      daily: 1.2,
      weekly: 8.4,
      monthly: 36.0
    }
  },
  {
    id: 'pool2',
    name: 'Asset Verification Pool',
    description: 'Earn from asset tokenization and verification services',
    apy: 8.7,
    totalStaked: 850000,
    userStaked: 0,
    userShare: 0,
    minStake: 250,
    lockPeriod: 30,
    rewards: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  }
];

// Async thunks
export const fetchCommunityTasks = createAsyncThunk(
  'community/fetchTasks',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockTasks;
  }
);

export const applyForTask = createAsyncThunk(
  'community/applyForTask',
  async ({ taskId, userId }: { taskId: string; userId: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const application: TaskApplication = {
      id: Date.now().toString(),
      taskId,
      userId,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    return application;
  }
);

export const submitTaskProof = createAsyncThunk(
  'community/submitTaskProof',
  async ({ 
    applicationId, 
    proofOfWork 
  }: { 
    applicationId: string; 
    proofOfWork: string; 
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { applicationId, proofOfWork };
  }
);

export const stakeTokens = createAsyncThunk(
  'community/stakeTokens',
  async ({ 
    poolId, 
    amount 
  }: { 
    poolId: string; 
    amount: number; 
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { poolId, amount };
  }
);

export const unstakeTokens = createAsyncThunk(
  'community/unstakeTokens',
  async ({ 
    poolId, 
    amount 
  }: { 
    poolId: string; 
    amount: number; 
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { poolId, amount };
  }
);

export const fetchUserCommunityStats = createAsyncThunk(
  'community/fetchUserStats',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const stats: UserCommunityStats = {
      totalEarnings: 1250.50,
      completedTasks: 23,
      reputation: 4.7,
      currentStake: 500,
      yieldEarned: 45.30,
      rank: 'Gold',
      successRate: 95.7,
      averageRating: 4.8,
    };

    return stats;
  }
);

export const fetchStakingPools = createAsyncThunk(
  'community/fetchStakingPools',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockStakingPools;
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredTasks = applyFilters(state.tasks, action.payload, state.selectedCategory);
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
      state.filteredTasks = applyFilters(state.tasks, state.searchQuery, action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    updateTaskApplicants: (state, action: PayloadAction<{ taskId: string; increment: number }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.applicants += action.payload.increment;
      }
      state.filteredTasks = applyFilters(state.tasks, state.searchQuery, state.selectedCategory);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchCommunityTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommunityTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
        state.filteredTasks = applyFilters(action.payload, state.searchQuery, state.selectedCategory);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchCommunityTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      // Apply for Task
      .addCase(applyForTask.fulfilled, (state, action) => {
        state.userApplications.push(action.payload);
        // Update task applicant count
        const task = state.tasks.find(t => t.id === action.payload.taskId);
        if (task) {
          task.applicants += 1;
        }
        state.filteredTasks = applyFilters(state.tasks, state.searchQuery, state.selectedCategory);
      })
      // Submit Task Proof
      .addCase(submitTaskProof.fulfilled, (state, action) => {
        const application = state.userApplications.find(a => a.id === action.payload.applicationId);
        if (application) {
          application.proofOfWork = action.payload.proofOfWork;
          application.status = 'completed';
        }
      })
      // Fetch User Stats
      .addCase(fetchUserCommunityStats.fulfilled, (state, action) => {
        state.userStats = action.payload;
      })
      // Fetch Staking Pools
      .addCase(fetchStakingPools.fulfilled, (state, action) => {
        state.stakingPools = action.payload;
      })
      // Stake Tokens
      .addCase(stakeTokens.fulfilled, (state, action) => {
        const pool = state.stakingPools.find(p => p.id === action.payload.poolId);
        if (pool) {
          pool.userStaked += action.payload.amount;
          pool.totalStaked += action.payload.amount;
          pool.userShare = (pool.userStaked / pool.totalStaked) * 100;
        }
        state.userStats.currentStake += action.payload.amount;
      })
      // Unstake Tokens
      .addCase(unstakeTokens.fulfilled, (state, action) => {
        const pool = state.stakingPools.find(p => p.id === action.payload.poolId);
        if (pool) {
          pool.userStaked = Math.max(0, pool.userStaked - action.payload.amount);
          pool.totalStaked = Math.max(0, pool.totalStaked - action.payload.amount);
          pool.userShare = pool.totalStaked > 0 ? (pool.userStaked / pool.totalStaked) * 100 : 0;
        }
        state.userStats.currentStake = Math.max(0, state.userStats.currentStake - action.payload.amount);
      });
  },
});

// Helper function to apply filters
function applyFilters(
  tasks: Task[], 
  searchQuery: string, 
  selectedCategory: string
): Task[] {
  let filtered = [...tasks];

  // Apply search query
  if (searchQuery) {
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.requiredSkills.some(skill => 
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }

  // Apply category filter
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(task => task.category === selectedCategory);
  }

  // Sort by reward amount (highest first)
  filtered.sort((a, b) => b.reward - a.reward);

  return filtered;
}

export const { 
  setSearchQuery, 
  setSelectedCategory, 
  clearError, 
  updateTaskApplicants 
} = communitySlice.actions;

export default communitySlice.reducer;