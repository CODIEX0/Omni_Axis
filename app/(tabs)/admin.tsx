import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  Switch,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users,
  Building,
  Shield,
  TrendingUp,
  Filter,
  Search,
  Check,
  X,
  Eye,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  Zap,
  DollarSign,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Crown,
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity,
  Download,
  Upload,
  Bell,
  RefreshCw,
  Database,
  Trash2,
  Edit3,
  Copy,
  Save,
  Mail,
  Phone,
  MapPin,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { Asset } from '../../services/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  totalAssets: number;
  pendingAssets: number;
  totalVolume: number;
  monthlyGrowth: number;
  totalComplaints: number;
  pendingComplaints: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  revenueThisMonth: number;
  complianceScore: number;
  newUsersThisMonth: number;
  averageSessionTime: number;
  supportTickets: number;
  systemUptime: number;
}

interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  data: any[];
  filename: string;
  columns?: string[];
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  action: (selectedItems: string[]) => Promise<void>;
}

interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: 'user' | 'asset' | 'kyc' | 'complaint' | 'subscription' | 'system';
  target_id: string;
  details: Record<string, any>;
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

interface PendingAsset extends Asset {
  user_id: string;
  user_email: string;
  submitted_at: string;
  risk_level?: 'low' | 'medium' | 'high';
}

interface PendingKyc {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  submitted_at: string;
  document_count: number;
  status: 'pending' | 'approved' | 'rejected';
  risk_score?: number;
  verification_notes?: string;
}

interface Complaint {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'compliance' | 'fraud' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  resolution?: string;
  response_time?: number;
  satisfaction_rating?: number;
}

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_type: 'basic' | 'premium' | 'enterprise' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial';
  start_date: string;
  end_date: string;
  amount: number;
  currency: string;
  auto_renew: boolean;
  payment_method: string;
  usage_stats: {
    transactions: number;
    api_calls: number;
    storage_used: number;
  };
  next_billing_date?: string;
  trial_ends_at?: string;
}

interface UserManagement {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator' | 'premium_user';
  kyc_status: 'pending' | 'approved' | 'rejected';
  account_status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  created_at: string;
  last_login: string;
  total_investments: number;
  risk_score: number;
  compliance_flags: string[];
  subscription_tier: string;
  login_count: number;
  two_factor_enabled: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  geographic_location: string;
  ip_address: string;
  device_info: string;
}

interface AnalyticsData {
  userGrowth: { month: string; users: number; revenue: number; retention: number }[];
  assetPerformance: { category: string; volume: number; growth: number; count: number }[];
  complianceMetrics: { 
    metric: string; 
    score: number; 
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
  }[];
  revenueMetrics: { 
    period: string; 
    revenue: number; 
    subscriptions: number; 
    fees: number;
    profit_margin: number;
  }[];
  platformMetrics: {
    daily_active_users: number;
    monthly_active_users: number;
    average_session_time: number;
    bounce_rate: number;
    api_response_time: number;
    error_rate: number;
  };
}

interface RegulatoryCompliance {
  id: string;
  regulation_type: 'AML' | 'KYC' | 'GDPR' | 'SEC' | 'FATCA' | 'MiFID' | 'other';
  compliance_status: 'compliant' | 'warning' | 'non_compliant';
  last_audit_date: string;
  next_audit_date: string;
  findings: string[];
  action_items: {
    item: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    due_date: string;
    assigned_to: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  documentation_links: string[];
}

type AdminTab = 'overview' | 'assets' | 'kyc' | 'users' | 'complaints' | 'subscriptions' | 'analytics' | 'compliance';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [pendingKyc, setPendingKyc] = useState<PendingKyc[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [compliance, setCompliance] = useState<RegulatoryCompliance[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enhanced features state
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  
  // Modal states
  const [selectedAsset, setSelectedAsset] = useState<PendingAsset | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<PendingKyc | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  // Filter states
  const [assetFilter, setAssetFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      return;
    }
    
    loadDashboardData();
    setupRealtimeUpdates();
    checkConnectionStatus();
  }, [user]);

  // Enhanced functionality methods
  const setupRealtimeUpdates = useCallback(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const mockNotifications: NotificationData[] = [
        {
          id: Date.now().toString(),
          type: 'info',
          title: 'New Asset Submission',
          message: 'A new asset has been submitted for review',
          timestamp: new Date().toISOString(),
          read: false,
          action: {
            label: 'Review',
            onPress: () => setActiveTab('assets'),
          },
        },
      ];
      
      if (Math.random() > 0.8) {
        setNotifications(prev => [...mockNotifications, ...prev.slice(0, 9)]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = useCallback(() => {
    // Simulate connection monitoring
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        setConnectionStatus(error ? 'offline' : 'online');
        if (!error) {
          setLastSync(new Date());
        }
      } catch (error) {
        setConnectionStatus('offline');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const logAdminAction = useCallback(async (
    action: string,
    targetType: AdminAuditLog['target_type'],
    targetId: string,
    details: Record<string, any> = {}
  ) => {
    try {
      const auditLog: AdminAuditLog = {
        id: Date.now().toString(),
        admin_id: user?.id || '',
        admin_email: user?.email || '',
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.1', // In production, get actual IP
        user_agent: Platform.OS,
      };

      setAuditLogs(prev => [auditLog, ...prev.slice(0, 99)]); // Keep last 100 logs
      
      // In production, save to database
      // await supabase.from('admin_audit_logs').insert(auditLog);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }, [user]);

  const exportData = useCallback(async (options: ExportOptions) => {
    try {
      setExportLoading(true);
      
      let exportContent = '';
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${options.filename}_${timestamp}`;

      if (options.format === 'csv') {
        // Convert data to CSV
        const headers = options.columns || Object.keys(options.data[0] || {});
        const csvHeaders = headers.join(',');
        const csvData = options.data.map(item => 
          headers.map(header => {
            const value = item[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        ).join('\n');
        exportContent = `${csvHeaders}\n${csvData}`;
      } else if (options.format === 'json') {
        exportContent = JSON.stringify(options.data, null, 2);
      }

      // Use Share API for export
      await Share.share({
        message: exportContent,
        title: `Export: ${filename}`,
      });

      await logAdminAction('export_data', 'system', filename, {
        format: options.format,
        recordCount: options.data.length,
      });
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'success',
        title: 'Export Complete',
        message: `Successfully exported ${options.data.length} records`,
        timestamp: new Date().toISOString(),
        read: false,
      }, ...prev]);
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }, [logAdminAction]);

  const performBulkAction = useCallback(async (action: BulkAction) => {
    try {
      const selectedItemsArray = Array.from(selectedItems);
      if (selectedItemsArray.length === 0) {
        Alert.alert('No Items Selected', 'Please select items to perform bulk action.');
        return;
      }

      Alert.alert(
        'Confirm Bulk Action',
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedItemsArray.length} items?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: async () => {
              await action.action(selectedItemsArray);
              setSelectedItems(new Set());
              setBulkActionMode(false);
              
              await logAdminAction('bulk_action', 'system', action.id, {
                actionType: action.label,
                itemCount: selectedItemsArray.length,
                selectedItems: selectedItemsArray,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Bulk action error:', error);
      Alert.alert('Action Failed', 'Unable to perform bulk action. Please try again.');
    }
  }, [selectedItems, logAdminAction]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadPendingAssets(),
        loadPendingKyc(),
        loadComplaints(),
        loadSubscriptions(),
        loadUsers(),
        loadAnalytics(),
        loadCompliance(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', thirtyDaysAgo.toISOString());

      // Get pending KYC count
      const { count: pendingKyc } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_status', 'pending');

      // Get total assets
      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });

      // Get pending assets
      const { count: pendingAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Mock data for demo purposes - in production, these would come from actual database queries
      const totalVolume = Math.floor(Math.random() * 10000000) + 1000000;
      const monthlyGrowth = Math.random() * 50 + 10;
      const totalComplaints = Math.floor(Math.random() * 100) + 20;
      const pendingComplaints = Math.floor(Math.random() * 20) + 5;
      const totalSubscriptions = Math.floor(Math.random() * 500) + 100;
      const activeSubscriptions = Math.floor(totalSubscriptions * 0.8);
      const revenueThisMonth = Math.floor(Math.random() * 500000) + 100000;
      const complianceScore = Math.floor(Math.random() * 20) + 80;
      const newUsersThisMonth = Math.floor(Math.random() * 200) + 50;
      const averageSessionTime = Math.floor(Math.random() * 30) + 10;
      const supportTickets = Math.floor(Math.random() * 50) + 10;
      const systemUptime = 99.5 + Math.random() * 0.5;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        pendingKyc: pendingKyc || 0,
        totalAssets: totalAssets || 0,
        pendingAssets: pendingAssets || 0,
        totalVolume,
        monthlyGrowth,
        totalComplaints,
        pendingComplaints,
        totalSubscriptions,
        activeSubscriptions,
        revenueThisMonth,
        complianceScore,
        newUsersThisMonth,
        averageSessionTime,
        supportTickets,
        systemUptime,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

    const loadPendingAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          profiles!inner(email)
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending assets:', error);
        return;
      }

      const transformedAssets = data.map(asset => ({
        ...asset,
        user_email: asset.profiles.email,
        submitted_at: asset.created_at,
        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      }));

      setPendingAssets(transformedAssets);
    } catch (error) {
      console.error('Error loading pending assets:', error);
    }
  };

  const loadPendingKyc = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('kyc_status', 'pending')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading pending KYC:', error);
        return;
      }

      const transformedKyc = data.map(profile => ({
        id: profile.id,
        user_id: profile.id,
        user_email: profile.email,
        user_name: profile.full_name || 'Unknown',
        submitted_at: profile.updated_at,
        document_count: Math.floor(Math.random() * 5) + 3,
        status: profile.kyc_status,
        risk_score: Math.floor(Math.random() * 100),
        verification_notes: 'Documents submitted for review',
      }));

      setPendingKyc(transformedKyc);
    } catch (error) {
      console.error('Error loading pending KYC:', error);
    }
  };

  const loadComplaints = async () => {
    try {
      // Mock data - in production, this would come from a complaints table
      const mockComplaints: Complaint[] = [
        {
          id: '1',
          user_id: 'user1',
          user_email: 'user1@example.com',
          user_name: 'John Doe',
          subject: 'Transaction failed',
          description: 'My transaction was charged but failed to process',
          category: 'technical',
          priority: 'high',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned_to: 'admin',
          response_time: 2,
          satisfaction_rating: 4,
        },
        {
          id: '2',
          user_id: 'user2',
          user_email: 'user2@example.com',
          user_name: 'Jane Smith',
          subject: 'Account suspended incorrectly',
          description: 'My account was suspended without explanation',
          category: 'account',
          priority: 'critical',
          status: 'in_progress',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          assigned_to: 'support',
          response_time: 1,
        },
      ];
      
      setComplaints(mockComplaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      // Mock data - in production, this would come from a subscriptions table
      const mockSubscriptions: Subscription[] = [
        {
          id: 'sub1',
          user_id: 'user1',
          user_email: 'premium@example.com',
          user_name: 'Premium User',
          plan_type: 'premium',
          status: 'active',
          start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
          end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
          amount: 99.99,
          currency: 'USD',
          auto_renew: true,
          payment_method: 'Credit Card',
          usage_stats: {
            transactions: 45,
            api_calls: 1250,
            storage_used: 2.5,
          },
          next_billing_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        },
        {
          id: 'sub2',
          user_id: 'user2',
          user_email: 'enterprise@example.com',
          user_name: 'Enterprise Corp',
          plan_type: 'enterprise',
          status: 'active',
          start_date: new Date(Date.now() - 86400000 * 90).toISOString(),
          end_date: new Date(Date.now() + 86400000 * 275).toISOString(),
          amount: 499.99,
          currency: 'USD',
          auto_renew: true,
          payment_method: 'Bank Transfer',
          usage_stats: {
            transactions: 250,
            api_calls: 15000,
            storage_used: 50.0,
          },
          next_billing_date: new Date(Date.now() + 86400000 * 275).toISOString(),
        },
      ];
      
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      const transformedUsers: UserManagement[] = data.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'Unknown',
        role: profile.role || 'user',
        kyc_status: profile.kyc_status || 'pending',
        account_status: 'active',
        created_at: profile.created_at,
        last_login: profile.last_login || new Date().toISOString(),
        total_investments: Math.floor(Math.random() * 100000),
        risk_score: Math.floor(Math.random() * 100),
        compliance_flags: [],
        subscription_tier: 'basic',
        login_count: Math.floor(Math.random() * 100),
        two_factor_enabled: Math.random() > 0.5,
        email_verified: true,
        phone_verified: Math.random() > 0.3,
        geographic_location: 'US',
        ip_address: '192.168.1.1',
        device_info: 'Mobile',
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Mock analytics data - in production, this would be calculated from actual data
      const mockAnalytics: AnalyticsData = {
        userGrowth: [
          { month: 'Jan', users: 1200, revenue: 45000, retention: 85 },
          { month: 'Feb', users: 1350, revenue: 52000, retention: 87 },
          { month: 'Mar', users: 1500, revenue: 58000, retention: 89 },
          { month: 'Apr', users: 1680, revenue: 65000, retention: 91 },
          { month: 'May', users: 1850, revenue: 72000, retention: 88 },
          { month: 'Jun', users: 2100, revenue: 81000, retention: 90 },
        ],
        assetPerformance: [
          { category: 'Real Estate', volume: 2500000, growth: 15.2, count: 45 },
          { category: 'Commodities', volume: 1800000, growth: 8.7, count: 32 },
          { category: 'Art & Collectibles', volume: 950000, growth: 22.1, count: 18 },
          { category: 'Private Equity', volume: 3200000, growth: 12.5, count: 12 },
        ],
        complianceMetrics: [
          { metric: 'KYC Completion Rate', score: 94, status: 'good', trend: 'up' },
          { metric: 'AML Screening', score: 98, status: 'good', trend: 'stable' },
          { metric: 'Document Verification', score: 89, status: 'warning', trend: 'down' },
          { metric: 'Fraud Detection', score: 96, status: 'good', trend: 'up' },
        ],
        revenueMetrics: [
          { period: 'Q1 2024', revenue: 155000, subscriptions: 85, fees: 45000, profit_margin: 32 },
          { period: 'Q2 2024', revenue: 180000, subscriptions: 102, fees: 52000, profit_margin: 35 },
          { period: 'Q3 2024', revenue: 210000, subscriptions: 125, fees: 68000, profit_margin: 38 },
          { period: 'Q4 2024', revenue: 245000, subscriptions: 148, fees: 75000, profit_margin: 41 },
        ],
        platformMetrics: {
          daily_active_users: 850,
          monthly_active_users: 12500,
          average_session_time: 24.5,
          bounce_rate: 12.3,
          api_response_time: 0.85,
          error_rate: 0.02,
        },
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadCompliance = async () => {
    try {
      // Mock compliance data - in production, this would come from compliance monitoring
      const mockCompliance: RegulatoryCompliance[] = [
        {
          id: 'comp1',
          regulation_type: 'AML',
          compliance_status: 'compliant',
          last_audit_date: new Date(Date.now() - 86400000 * 90).toISOString(),
          next_audit_date: new Date(Date.now() + 86400000 * 90).toISOString(),
          findings: ['All transaction monitoring systems operational', 'Suspicious activity reports up to date'],
          action_items: [
            {
              item: 'Update customer risk scoring model',
              priority: 'medium',
              due_date: new Date(Date.now() + 86400000 * 30).toISOString(),
              assigned_to: 'compliance_team',
              status: 'in_progress',
            },
          ],
          documentation_links: ['/docs/aml-policy', '/docs/transaction-monitoring'],
        },
        {
          id: 'comp2',
          regulation_type: 'GDPR',
          compliance_status: 'warning',
          last_audit_date: new Date(Date.now() - 86400000 * 120).toISOString(),
          next_audit_date: new Date(Date.now() + 86400000 * 60).toISOString(),
          findings: ['Data retention policies need updating', 'Cookie consent mechanism requires improvements'],
          action_items: [
            {
              item: 'Update privacy policy documentation',
              priority: 'high',
              due_date: new Date(Date.now() + 86400000 * 14).toISOString(),
              assigned_to: 'legal_team',
              status: 'pending',
            },
            {
              item: 'Implement enhanced cookie consent',
              priority: 'medium',
              due_date: new Date(Date.now() + 86400000 * 21).toISOString(),
              assigned_to: 'dev_team',
              status: 'pending',
            },
          ],
          documentation_links: ['/docs/gdpr-policy', '/docs/data-processing'],
        },
      ];
      
      setCompliance(mockCompliance);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Enhanced action handlers
  const handleApproveAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ 
          verification_status: 'approved',
          verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId);

      if (error) {
        console.error('Error approving asset:', error);
        Alert.alert('Error', 'Failed to approve asset');
        return;
      }

      Alert.alert('Success', 'Asset approved successfully');
      setShowAssetModal(false);
      loadPendingAssets();
      loadStats();
    } catch (error) {
      console.error('Error approving asset:', error);
      Alert.alert('Error', 'Failed to approve asset');
    }
  };

  const handleRejectAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ 
          verification_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId);

      if (error) {
        console.error('Error rejecting asset:', error);
        Alert.alert('Error', 'Failed to reject asset');
        return;
      }

      Alert.alert('Success', 'Asset rejected successfully');
      setShowAssetModal(false);
      loadPendingAssets();
      loadStats();
    } catch (error) {
      console.error('Error rejecting asset:', error);
      Alert.alert('Error', 'Failed to reject asset');
    }
  };

  const handleApproveKyc = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error approving KYC:', error);
        Alert.alert('Error', 'Failed to approve KYC');
        return;
      }

      Alert.alert('Success', 'KYC approved successfully');
      setShowKycModal(false);
      loadPendingKyc();
      loadStats();
    } catch (error) {
      console.error('Error approving KYC:', error);
      Alert.alert('Error', 'Failed to approve KYC');
    }
  };

  const handleRejectKyc = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error rejecting KYC:', error);
        Alert.alert('Error', 'Failed to reject KYC');
        return;
      }

      Alert.alert('Success', 'KYC rejected successfully');
      setShowKycModal(false);
      loadPendingKyc();
      loadStats();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      Alert.alert('Error', 'Failed to reject KYC');
    }
  };

  // New action handlers
  const handleComplaintStatusUpdate = async (complaintId: string, status: Complaint['status']) => {
    try {
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === complaintId ? { ...complaint, status, updated_at: new Date().toISOString() } : complaint
      );
      setComplaints(updatedComplaints);
      Alert.alert('Success', `Complaint ${status} successfully`);
      setShowComplaintModal(false);
    } catch (error) {
      console.error('Error updating complaint:', error);
      Alert.alert('Error', 'Failed to update complaint');
    }
  };

  const handleSubscriptionAction = async (subscriptionId: string, action: 'suspend' | 'cancel' | 'reactivate') => {
    try {
      const updatedSubscriptions = subscriptions.map(sub =>
        sub.id === subscriptionId
          ? {
              ...sub,
              status: action === 'suspend' ? 'suspended' : action === 'cancel' ? 'cancelled' : 'active'
            }
          : sub
      );
      setSubscriptions(updatedSubscriptions);
      Alert.alert('Success', `Subscription ${action}d successfully`);
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  const handleUserStatusUpdate = async (userId: string, status: UserManagement['account_status']) => {
    try {
      // In production, this would update the database
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, account_status: status } : user
      );
      setUsers(updatedUsers);
      Alert.alert('Success', `User account ${status} successfully`);
      setShowUserModal(false);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleRoleUpdate = async (userId: string, role: UserManagement['role']) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) {
        console.error('Error updating role:', error);
        Alert.alert('Error', 'Failed to update user role');
        return;
      }

      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, role } : user
      );
      setUsers(updatedUsers);
      Alert.alert('Success', 'User role updated successfully');
      setShowUserModal(false);
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Primary Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
            <Users color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{stats?.totalUsers.toLocaleString() || '0'}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statSubLabel}>+{stats?.newUsersThisMonth || 0} this month</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
            <Clock color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{stats?.pendingKyc || '0'}</Text>
          <Text style={styles.statLabel}>Pending KYC</Text>
          <Text style={styles.statSubLabel}>Needs review</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
            <Building color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{stats?.totalAssets || '0'}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
          <Text style={styles.statSubLabel}>{stats?.pendingAssets || 0} pending</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#EF4444' }]}>
            <MessageSquare color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{stats?.pendingComplaints || '0'}</Text>
          <Text style={styles.statLabel}>Open Tickets</Text>
          <Text style={styles.statSubLabel}>Avg: {stats?.averageSessionTime || 0}min response</Text>
        </Card>
      </View>

      {/* Revenue & Platform Stats */}
      <View style={styles.revenueSection}>
        <Card style={styles.revenueCard}>
          <Text style={styles.revenueTitle}>Monthly Revenue</Text>
          <Text style={styles.revenueValue}>${stats?.revenueThisMonth.toLocaleString() || '0'}</Text>
          <View style={styles.revenueChange}>
            <TrendingUp color="#10B981" size={16} />
            <Text style={styles.revenueChangeText}>
              +{stats?.monthlyGrowth.toFixed(1) || '0'}% from last month
            </Text>
          </View>
        </Card>

        <Card style={styles.revenueCard}>
          <Text style={styles.revenueTitle}>Platform Volume</Text>
          <Text style={styles.revenueValue}>${stats?.totalVolume.toLocaleString() || '0'}</Text>
          <View style={styles.revenueChange}>
            <Activity color="#3B82F6" size={16} />
            <Text style={[styles.revenueChangeText, { color: '#3B82F6' }]}>
              {stats?.activeUsers || 0} active users
            </Text>
          </View>
        </Card>
      </View>

      {/* System Health */}
      <Card style={styles.systemCard}>
        <Text style={styles.cardTitle}>System Health</Text>
        <View style={styles.systemMetrics}>
          <View style={styles.systemMetric}>
            <View style={styles.systemMetricHeader}>
              <Text style={styles.systemMetricLabel}>Uptime</Text>
              <Text style={styles.systemMetricValue}>{stats?.systemUptime.toFixed(2) || '99.9'}%</Text>
            </View>
            <View style={[styles.systemMetricBar, { backgroundColor: '#10B981' }]} />
          </View>
          
          <View style={styles.systemMetric}>
            <View style={styles.systemMetricHeader}>
              <Text style={styles.systemMetricLabel}>Compliance Score</Text>
              <Text style={styles.systemMetricValue}>{stats?.complianceScore || 85}%</Text>
            </View>
            <View style={[styles.systemMetricBar, { backgroundColor: stats?.complianceScore && stats.complianceScore > 80 ? '#10B981' : '#F59E0B' }]} />
          </View>
          
          <View style={styles.systemMetric}>
            <View style={styles.systemMetricHeader}>
              <Text style={styles.systemMetricLabel}>Active Subscriptions</Text>
              <Text style={styles.systemMetricValue}>{stats?.activeSubscriptions || 0}</Text>
            </View>
            <View style={[styles.systemMetricBar, { backgroundColor: '#3B82F6' }]} />
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('assets')}
          >
            <Building color={COLORS.PRIMARY} size={24} />
            <Text style={styles.quickActionText}>Review Assets</Text>
            {stats?.pendingAssets ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingAssets}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('kyc')}
          >
            <Shield color={COLORS.PRIMARY} size={24} />
            <Text style={styles.quickActionText}>Review KYC</Text>
            {stats?.pendingKyc ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingKyc}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('complaints')}
          >
            <MessageSquare color={COLORS.PRIMARY} size={24} />
            <Text style={styles.quickActionText}>Handle Complaints</Text>
            {stats?.pendingComplaints ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingComplaints}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('subscriptions')}
          >
            <CreditCard color={COLORS.PRIMARY} size={24} />
            <Text style={styles.quickActionText}>Manage Subscriptions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('users')}
          >
            <Users color={COLORS.PRIMARY} size={24} />
            <Text style={styles.quickActionText}>User Management</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('analytics')}
          >
            <BarChart3 color={COLORS.PRIMARY} size={24} />
            <Text style={styles.quickActionText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );

  const renderAssetsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={pendingAssets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.assetCard}>
            <TouchableOpacity
              style={styles.assetContent}
              onPress={() => {
                setSelectedAsset(item);
                setShowAssetModal(true);
              }}
            >
              <View style={styles.assetHeader}>
                <Text style={styles.assetTitle}>{item.title}</Text>
                <Text style={styles.assetDate}>
                  {new Date(item.submitted_at).toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={styles.assetUser}>By: {item.user_email}</Text>
              <Text style={styles.assetType}>{item.asset_type}</Text>
              <Text style={styles.assetValue}>
                ${item.estimated_value.toLocaleString()}
              </Text>

              <View style={styles.assetActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveAsset(item.id)}
                >
                  <Check color="#FFFFFF" size={16} />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectAsset(item.id)}
                >
                  <X color="#FFFFFF" size={16} />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Building color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Pending Assets</Text>
            <Text style={styles.emptyStateText}>All assets have been reviewed</Text>
          </View>
        }
      />
    </View>
  );

  const renderKycTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={pendingKyc}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.kycCard}>
            <TouchableOpacity
              style={styles.kycContent}
              onPress={() => {
                setSelectedKyc(item);
                setShowKycModal(true);
              }}
            >
              <View style={styles.kycHeader}>
                <Text style={styles.kycName}>{item.user_name}</Text>
                <View style={styles.kycRiskBadge}>
                  <Text style={styles.kycRiskText}>
                    Risk: {item.risk_score || 0}%
                  </Text>
                </View>
              </View>
              
              <Text style={styles.kycEmail}>{item.user_email}</Text>
              <Text style={styles.kycDocuments}>
                {item.document_count} documents • {new Date(item.submitted_at).toLocaleDateString()}
              </Text>
              
              {item.verification_notes && (
                <Text style={styles.kycNotes}>{item.verification_notes}</Text>
              )}

              <View style={styles.kycActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveKyc(item.user_id)}
                >
                  <Check color="#FFFFFF" size={16} />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectKyc(item.user_id)}
                >
                  <X color="#FFFFFF" size={16} />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Shield color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Pending KYC</Text>
            <Text style={styles.emptyStateText}>All KYC submissions have been reviewed</Text>
          </View>
        }
      />
    </View>
  );

  const renderComplaintsTab = () => (
    <View style={styles.tabContent}>
      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, complaintFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setComplaintFilter('all')}
          >
            <Text style={[styles.filterButtonText, complaintFilter === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, complaintFilter === 'open' && styles.filterButtonActive]}
            onPress={() => setComplaintFilter('open')}
          >
            <Text style={[styles.filterButtonText, complaintFilter === 'open' && styles.filterButtonTextActive]}>
              Open
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, complaintFilter === 'critical' && styles.filterButtonActive]}
            onPress={() => setComplaintFilter('critical')}
          >
            <Text style={[styles.filterButtonText, complaintFilter === 'critical' && styles.filterButtonTextActive]}>
              Critical
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={complaints.filter(complaint => 
          complaintFilter === 'all' || 
          complaint.status === complaintFilter ||
          complaint.priority === complaintFilter
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.complaintCard}>
            <TouchableOpacity
              style={styles.complaintContent}
              onPress={() => {
                setSelectedComplaint(item);
                setShowComplaintModal(true);
              }}
            >
              <View style={styles.complaintHeader}>
                <Text style={styles.complaintSubject}>{item.subject}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.complaintUser}>From: {item.user_name} ({item.user_email})</Text>
              <Text style={styles.complaintDescription} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.complaintFooter}>
                <Text style={styles.complaintDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              
              {item.response_time && (
                <Text style={styles.responseTime}>
                  Response time: {item.response_time}h
                </Text>
              )}
            </TouchableOpacity>
          </Card>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageSquare color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Complaints</Text>
            <Text style={styles.emptyStateText}>All complaints have been resolved</Text>
          </View>
        }
      />
    </View>
  );

  const renderSubscriptionsTab = () => (
    <View style={styles.tabContent}>
      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, subscriptionFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSubscriptionFilter('all')}
          >
            <Text style={[styles.filterButtonText, subscriptionFilter === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, subscriptionFilter === 'active' && styles.filterButtonActive]}
            onPress={() => setSubscriptionFilter('active')}
          >
            <Text style={[styles.filterButtonText, subscriptionFilter === 'active' && styles.filterButtonTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, subscriptionFilter === 'trial' && styles.filterButtonActive]}
            onPress={() => setSubscriptionFilter('trial')}
          >
            <Text style={[styles.filterButtonText, subscriptionFilter === 'trial' && styles.filterButtonTextActive]}>
              Trial
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={subscriptions.filter(sub => 
          subscriptionFilter === 'all' || sub.status === subscriptionFilter
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.subscriptionCard}>
            <TouchableOpacity
              style={styles.subscriptionContent}
              onPress={() => {
                setSelectedSubscription(item);
                setShowSubscriptionModal(true);
              }}
            >
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionUser}>{item.user_name}</Text>
                <View style={[styles.planBadge, { backgroundColor: getPlanColor(item.plan_type) }]}>
                  <Crown color="#FFFFFF" size={14} />
                  <Text style={styles.planText}>{item.plan_type.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.subscriptionEmail}>{item.user_email}</Text>
              
              <View style={styles.subscriptionDetails}>
                <Text style={styles.subscriptionAmount}>
                  ${item.amount}/{item.plan_type === 'enterprise' ? 'year' : 'month'}
                </Text>
                <Text style={styles.subscriptionPayment}>{item.payment_method}</Text>
              </View>
              
              <View style={styles.subscriptionUsage}>
                <Text style={styles.usageLabel}>Usage:</Text>
                <Text style={styles.usageText}>
                  {item.usage_stats.transactions} transactions • {item.usage_stats.api_calls} API calls
                </Text>
              </View>
              
              <View style={styles.subscriptionFooter}>
                <Text style={styles.subscriptionDate}>
                  Expires: {new Date(item.end_date).toLocaleDateString()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getSubscriptionStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CreditCard color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Subscriptions</Text>
            <Text style={styles.emptyStateText}>No subscription data available</Text>
          </View>
        }
      />
    </View>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={COLORS.TEXT_SECONDARY} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.TEXT_SECONDARY}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, userFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setUserFilter('all')}
          >
            <Text style={[styles.filterButtonText, userFilter === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, userFilter === 'admin' && styles.filterButtonActive]}
            onPress={() => setUserFilter('admin')}
          >
            <Text style={[styles.filterButtonText, userFilter === 'admin' && styles.filterButtonTextActive]}>
              Admins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, userFilter === 'suspended' && styles.filterButtonActive]}
            onPress={() => setUserFilter('suspended')}
          >
            <Text style={[styles.filterButtonText, userFilter === 'suspended' && styles.filterButtonTextActive]}>
              Suspended
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={users.filter(user => {
          const matchesSearch = !searchQuery || 
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesFilter = userFilter === 'all' || 
            user.role === userFilter || 
            user.account_status === userFilter;
          
          return matchesSearch && matchesFilter;
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.userCard}>
            <TouchableOpacity
              style={styles.userContent}
              onPress={() => {
                setSelectedUser(item);
                setShowUserModal(true);
              }}
            >
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                  <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.userEmail}>{item.email}</Text>
              
              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <Text style={styles.userStatLabel}>Investments</Text>
                  <Text style={styles.userStatValue}>${item.total_investments.toLocaleString()}</Text>
                </View>
                <View style={styles.userStat}>
                  <Text style={styles.userStatLabel}>Risk Score</Text>
                  <Text style={[styles.userStatValue, { color: item.risk_score > 70 ? '#EF4444' : '#10B981' }]}>
                    {item.risk_score}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.userFooter}>
                <View style={styles.userSecurityBadges}>
                  {item.two_factor_enabled && (
                    <View style={styles.securityBadge}>
                      <Lock color="#10B981" size={12} />
                    </View>
                  )}
                  {item.email_verified && (
                    <View style={styles.securityBadge}>
                      <CheckCircle color="#10B981" size={12} />
                    </View>
                  )}
                </View>
                <Text style={styles.userLastLogin}>
                  Last login: {new Date(item.last_login).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: getAccountStatusColor(item.account_status) }]}>
                <Text style={styles.statusText}>{item.account_status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Users Found</Text>
            <Text style={styles.emptyStateText}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Platform Metrics */}
      <Card style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Platform Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analytics?.platformMetrics.daily_active_users.toLocaleString() || '0'}</Text>
            <Text style={styles.metricLabel}>Daily Active Users</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analytics?.platformMetrics.monthly_active_users.toLocaleString() || '0'}</Text>
            <Text style={styles.metricLabel}>Monthly Active Users</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analytics?.platformMetrics.average_session_time.toFixed(1) || '0'}min</Text>
            <Text style={styles.metricLabel}>Avg Session Time</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analytics?.platformMetrics.api_response_time.toFixed(2) || '0'}s</Text>
            <Text style={styles.metricLabel}>API Response Time</Text>
          </View>
        </View>
      </Card>

      {/* Revenue Analytics */}
      <Card style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Revenue Trends</Text>
        <View style={styles.revenueChart}>
          {analytics?.revenueMetrics.map((item, index) => (
            <View key={index} style={styles.revenueItem}>
              <Text style={styles.revenueItemPeriod}>{item.period}</Text>
              <Text style={styles.revenueItemValue}>${item.revenue.toLocaleString()}</Text>
              <Text style={styles.revenueItemMargin}>Margin: {item.profit_margin}%</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Asset Performance */}
      <Card style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Asset Categories</Text>
        <View style={styles.assetChart}>
          {analytics?.assetPerformance.map((item, index) => (
            <View key={index} style={styles.assetItem}>
              <View style={styles.assetItemHeader}>
                <Text style={styles.assetItemCategory}>{item.category}</Text>
                <Text style={[styles.assetItemGrowth, { color: item.growth > 0 ? '#10B981' : '#EF4444' }]}>
                  {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.assetItemVolume}>${item.volume.toLocaleString()}</Text>
              <Text style={styles.assetItemCount}>{item.count} assets</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Compliance Metrics */}
      <Card style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Compliance Status</Text>
        <View style={styles.complianceMetrics}>
          {analytics?.complianceMetrics.map((item, index) => (
            <View key={index} style={styles.complianceItem}>
              <View style={styles.complianceItemHeader}>
                <Text style={styles.complianceItemMetric}>{item.metric}</Text>
                <View style={styles.complianceTrend}>
                  {item.trend === 'up' ? (
                    <ArrowUp color="#10B981" size={16} />
                  ) : item.trend === 'down' ? (
                    <ArrowDown color="#EF4444" size={16} />
                  ) : (
                    <Activity color="#F59E0B" size={16} />
                  )}
                </View>
              </View>
              <View style={styles.complianceScore}>
                <Text style={[styles.complianceScoreText, { color: getComplianceColor(item.status) }]}>
                  {item.score}%
                </Text>
                <View style={[styles.complianceBar, { backgroundColor: getComplianceColor(item.status) }]} />
              </View>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );

  const renderComplianceTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={compliance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.complianceCard}>
            <View style={styles.complianceCardContent}>
              <View style={styles.complianceCardHeader}>
                <Text style={styles.complianceRegulation}>{item.regulation_type}</Text>
                <View style={[styles.complianceStatusBadge, { backgroundColor: getComplianceStatusColor(item.compliance_status) }]}>
                  <Text style={styles.complianceStatusText}>{item.compliance_status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.complianceAuditInfo}>
                <Text style={styles.complianceAuditLabel}>Last Audit:</Text>
                <Text style={styles.complianceAuditDate}>{new Date(item.last_audit_date).toLocaleDateString()}</Text>
              </View>
              
              <View style={styles.complianceAuditInfo}>
                <Text style={styles.complianceAuditLabel}>Next Audit:</Text>
                <Text style={styles.complianceAuditDate}>{new Date(item.next_audit_date).toLocaleDateString()}</Text>
              </View>
              
              <Text style={styles.complianceFindings}>
                {item.findings.length} findings • {item.action_items.length} action items
              </Text>
              
              {item.action_items.filter(action => action.status === 'pending').length > 0 && (
                <View style={styles.complianceActions}>
                  <Text style={styles.complianceActionsTitle}>Pending Actions:</Text>
                  {item.action_items
                    .filter(action => action.status === 'pending')
                    .slice(0, 2)
                    .map((action, index) => (
                      <Text key={index} style={styles.complianceActionItem}>
                        • {action.item} (Due: {new Date(action.due_date).toLocaleDateString()})
                      </Text>
                    ))}
                </View>
              )}
            </View>
          </Card>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Compliance Data</Text>
            <Text style={styles.emptyStateText}>Compliance monitoring data will appear here</Text>
          </View>
        }
      />
    </View>
  );

  // Helper functions for colors and status
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#EF4444';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return '#8B5CF6';
      case 'premium': return '#F59E0B';
      case 'pro': return '#3B82F6';
      case 'basic': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'trial': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'expired': return '#6B7280';
      case 'suspended': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#EF4444';
      case 'moderator': return '#F59E0B';
      case 'premium_user': return '#8B5CF6';
      case 'user': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'suspended': return '#F59E0B';
      case 'banned': return '#EF4444';
      case 'pending_verification': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'non_compliant': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <AlertCircle color={COLORS.TEXT_SECONDARY} size={64} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You do not have permission to access the admin dashboard.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading admin dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage platform operations</Text>
      </View>

      {/* Enhanced Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabNavigation}
        contentContainerStyle={styles.tabNavigationContent}
      >
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'assets', label: 'Assets', icon: Building },
          { key: 'kyc', label: 'KYC', icon: Shield },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'complaints', label: 'Complaints', icon: MessageSquare },
          { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
          { key: 'compliance', label: 'Compliance', icon: FileText },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key as AdminTab)}
          >
            <tab.icon 
              color={activeTab === tab.key ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} 
              size={18} 
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.tabButtonTextActive
            ]}>
              {tab.label}
            </Text>
            {/* Badge for pending items */}
            {tab.key === 'assets' && stats?.pendingAssets ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.pendingAssets}</Text>
              </View>
            ) : null}
            {tab.key === 'kyc' && stats?.pendingKyc ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.pendingKyc}</Text>
              </View>
            ) : null}
            {tab.key === 'complaints' && stats?.pendingComplaints ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.pendingComplaints}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'assets' && renderAssetsTab()}
      {activeTab === 'kyc' && renderKycTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'complaints' && renderComplaintsTab()}
      {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'compliance' && renderComplianceTab()}

      {/* Enhanced Modals */}
      {renderAssetModal()}
      {renderKycModal()}
      {renderComplaintModal()}
      {renderSubscriptionModal()}
      {renderUserModal()}
    </SafeAreaView>
  );

  // Enhanced Modal Components
  function renderAssetModal() {
    return (
      <Modal
        visible={showAssetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssetModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Asset Review</Text>
            <TouchableOpacity onPress={() => setShowAssetModal(false)}>
              <X color={COLORS.TEXT_SECONDARY} size={24} />
            </TouchableOpacity>
          </View>
          
          {selectedAsset && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.assetDetailTitle}>{selectedAsset.title}</Text>
              <Text style={styles.assetDetailDescription}>
                {selectedAsset.description}
              </Text>
              
              <View style={styles.detailSection}>
                <View style={styles.assetDetailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedAsset.asset_type}</Text>
                </View>
                
                <View style={styles.assetDetailRow}>
                  <Text style={styles.detailLabel}>Value:</Text>
                  <Text style={styles.detailValue}>
                    ${selectedAsset.estimated_value.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.assetDetailRow}>
                  <Text style={styles.detailLabel}>Risk Level:</Text>
                  <View style={[styles.riskBadge, { backgroundColor: getPriorityColor(selectedAsset.risk_level || 'low') }]}>
                    <Text style={styles.riskBadgeText}>{selectedAsset.risk_level?.toUpperCase() || 'LOW'}</Text>
                  </View>
                </View>
                
                <View style={styles.assetDetailRow}>
                  <Text style={styles.detailLabel}>Submitted by:</Text>
                  <Text style={styles.detailValue}>{selectedAsset.user_email}</Text>
                </View>
                
                <View style={styles.assetDetailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAsset.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  title="Approve Asset"
                  onPress={() => handleApproveAsset(selectedAsset.id)}
                  style={[styles.modalButton, styles.approveButtonModal]}
                />
                <Button
                  title="Reject Asset"
                  onPress={() => handleRejectAsset(selectedAsset.id)}
                  variant="outline"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  }

  function renderKycModal() {
    return (
      <Modal
        visible={showKycModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowKycModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>KYC Review</Text>
            <TouchableOpacity onPress={() => setShowKycModal(false)}>
              <X color={COLORS.TEXT_SECONDARY} size={24} />
            </TouchableOpacity>
          </View>
          
          {selectedKyc && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.kycDetailName}>{selectedKyc.user_name}</Text>
              <Text style={styles.kycDetailEmail}>{selectedKyc.user_email}</Text>
              
              <View style={styles.detailSection}>
                <View style={styles.kycDetailRow}>
                  <Text style={styles.detailLabel}>Documents:</Text>
                  <Text style={styles.detailValue}>{selectedKyc.document_count} files</Text>
                </View>
                
                <View style={styles.kycDetailRow}>
                  <Text style={styles.detailLabel}>Risk Score:</Text>
                  <Text style={[styles.detailValue, { 
                    color: (selectedKyc.risk_score || 0) > 70 ? '#EF4444' : '#10B981' 
                  }]}>
                    {selectedKyc.risk_score || 0}%
                  </Text>
                </View>
                
                <View style={styles.kycDetailRow}>
                  <Text style={styles.detailLabel}>Submitted:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedKyc.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {selectedKyc.verification_notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Verification Notes:</Text>
                  <Text style={styles.notesText}>{selectedKyc.verification_notes}</Text>
                </View>
              )}
              
              <View style={styles.modalActions}>
                <Button
                  title="Approve KYC"
                  onPress={() => handleApproveKyc(selectedKyc.user_id)}
                  style={[styles.modalButton, styles.approveButtonModal]}
                />
                <Button
                  title="Reject KYC"
                  onPress={() => handleRejectKyc(selectedKyc.user_id)}
                  variant="outline"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  }

  function renderComplaintModal() {
    return (
      <Modal
        visible={showComplaintModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComplaintModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complaint Details</Text>
            <TouchableOpacity onPress={() => setShowComplaintModal(false)}>
              <X color={COLORS.TEXT_SECONDARY} size={24} />
            </TouchableOpacity>
          </View>
          
          {selectedComplaint && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.complaintModalHeader}>
                <Text style={styles.complaintModalSubject}>{selectedComplaint.subject}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedComplaint.priority) }]}>
                  <Text style={styles.priorityText}>{selectedComplaint.priority.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.complaintModalUser}>
                From: {selectedComplaint.user_name} ({selectedComplaint.user_email})
              </Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.complaintModalDescription}>{selectedComplaint.description}</Text>
                
                <View style={styles.complaintModalMeta}>
                  <Text style={styles.metaLabel}>Category: {selectedComplaint.category}</Text>
                  <Text style={styles.metaLabel}>Created: {new Date(selectedComplaint.created_at).toLocaleString()}</Text>
                  <Text style={styles.metaLabel}>Assigned to: {selectedComplaint.assigned_to || 'Unassigned'}</Text>
                  {selectedComplaint.response_time && (
                    <Text style={styles.metaLabel}>Response time: {selectedComplaint.response_time}h</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  title="Mark as In Progress"
                  onPress={() => handleComplaintStatusUpdate(selectedComplaint.id, 'in_progress')}
                  style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                />
                <Button
                  title="Mark as Resolved"
                  onPress={() => handleComplaintStatusUpdate(selectedComplaint.id, 'resolved')}
                  style={[styles.modalButton, styles.approveButtonModal]}
                />
                <Button
                  title="Close Complaint"
                  onPress={() => handleComplaintStatusUpdate(selectedComplaint.id, 'closed')}
                  variant="outline"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  }

  function renderSubscriptionModal() {
    return (
      <Modal
        visible={showSubscriptionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Subscription Management</Text>
            <TouchableOpacity onPress={() => setShowSubscriptionModal(false)}>
              <X color={COLORS.TEXT_SECONDARY} size={24} />
            </TouchableOpacity>
          </View>
          
          {selectedSubscription && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.subscriptionModalHeader}>
                <Text style={styles.subscriptionModalUser}>{selectedSubscription.user_name}</Text>
                <View style={[styles.planBadge, { backgroundColor: getPlanColor(selectedSubscription.plan_type) }]}>
                  <Crown color="#FFFFFF" size={16} />
                  <Text style={styles.planText}>{selectedSubscription.plan_type.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.subscriptionModalEmail}>{selectedSubscription.user_email}</Text>
              
              <View style={styles.detailSection}>
                <View style={styles.subscriptionModalRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>
                    ${selectedSubscription.amount}/{selectedSubscription.plan_type === 'enterprise' ? 'year' : 'month'}
                  </Text>
                </View>
                
                <View style={styles.subscriptionModalRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>{selectedSubscription.payment_method}</Text>
                </View>
                
                <View style={styles.subscriptionModalRow}>
                  <Text style={styles.detailLabel}>Auto Renew:</Text>
                  <Text style={styles.detailValue}>{selectedSubscription.auto_renew ? 'Yes' : 'No'}</Text>
                </View>
                
                <View style={styles.subscriptionModalRow}>
                  <Text style={styles.detailLabel}>Expires:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedSubscription.end_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.usageSection}>
                <Text style={styles.usageSectionTitle}>Usage Statistics</Text>
                <View style={styles.usageStats}>
                  <View style={styles.usageStat}>
                    <Text style={styles.usageStatValue}>{selectedSubscription.usage_stats.transactions}</Text>
                    <Text style={styles.usageStatLabel}>Transactions</Text>
                  </View>
                  <View style={styles.usageStat}>
                    <Text style={styles.usageStatValue}>{selectedSubscription.usage_stats.api_calls.toLocaleString()}</Text>
                    <Text style={styles.usageStatLabel}>API Calls</Text>
                  </View>
                  <View style={styles.usageStat}>
                    <Text style={styles.usageStatValue}>{selectedSubscription.usage_stats.storage_used}GB</Text>
                    <Text style={styles.usageStatLabel}>Storage</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                {selectedSubscription.status === 'active' && (
                  <>
                    <Button
                      title="Suspend Subscription"
                      onPress={() => handleSubscriptionAction(selectedSubscription.id, 'suspend')}
                      style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                    />
                    <Button
                      title="Cancel Subscription"
                      onPress={() => handleSubscriptionAction(selectedSubscription.id, 'cancel')}
                      variant="outline"
                      style={styles.modalButton}
                    />
                  </>
                )}
                {(selectedSubscription.status === 'suspended' || selectedSubscription.status === 'cancelled') && (
                  <Button
                    title="Reactivate Subscription"
                    onPress={() => handleSubscriptionAction(selectedSubscription.id, 'reactivate')}
                    style={[styles.modalButton, styles.approveButtonModal]}
                  />
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  }

  function renderUserModal() {
    return (
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Management</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <X color={COLORS.TEXT_SECONDARY} size={24} />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.userModalHeader}>
                <Text style={styles.userModalName}>{selectedUser.full_name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                  <Text style={styles.roleText}>{selectedUser.role.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.userModalEmail}>{selectedUser.email}</Text>
              
              <View style={styles.detailSection}>
                <View style={styles.userModalRow}>
                  <Text style={styles.detailLabel}>Account Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getAccountStatusColor(selectedUser.account_status) }]}>
                    <Text style={styles.statusText}>{selectedUser.account_status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.userModalRow}>
                  <Text style={styles.detailLabel}>KYC Status:</Text>
                  <Text style={styles.detailValue}>{selectedUser.kyc_status}</Text>
                </View>
                
                <View style={styles.userModalRow}>
                  <Text style={styles.detailLabel}>Total Investments:</Text>
                  <Text style={styles.detailValue}>${selectedUser.total_investments.toLocaleString()}</Text>
                </View>
                
                <View style={styles.userModalRow}>
                  <Text style={styles.detailLabel}>Risk Score:</Text>
                  <Text style={[styles.detailValue, { 
                    color: selectedUser.risk_score > 70 ? '#EF4444' : '#10B981' 
                  }]}>
                    {selectedUser.risk_score}%
                  </Text>
                </View>
                
                <View style={styles.userModalRow}>
                  <Text style={styles.detailLabel}>Login Count:</Text>
                  <Text style={styles.detailValue}>{selectedUser.login_count}</Text>
                </View>
                
                <View style={styles.userModalRow}>
                  <Text style={styles.detailLabel}>Last Login:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedUser.last_login).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.securitySection}>
                <Text style={styles.securitySectionTitle}>Security Features</Text>
                <View style={styles.securityFeatures}>
                  <View style={styles.securityFeature}>
                    <Lock color={selectedUser.two_factor_enabled ? '#10B981' : '#6B7280'} size={16} />
                    <Text style={styles.securityFeatureText}>
                      Two-Factor Auth: {selectedUser.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <View style={styles.securityFeature}>
                    <CheckCircle color={selectedUser.email_verified ? '#10B981' : '#6B7280'} size={16} />
                    <Text style={styles.securityFeatureText}>
                      Email Verified: {selectedUser.email_verified ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View style={styles.securityFeature}>
                    <CheckCircle color={selectedUser.phone_verified ? '#10B981' : '#6B7280'} size={16} />
                    <Text style={styles.securityFeatureText}>
                      Phone Verified: {selectedUser.phone_verified ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                {selectedUser.account_status === 'active' && (
                  <Button
                    title="Suspend User"
                    onPress={() => handleUserStatusUpdate(selectedUser.id, 'suspended')}
                    style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                  />
                )}
                {selectedUser.account_status === 'suspended' && (
                  <Button
                    title="Reactivate User"
                    onPress={() => handleUserStatusUpdate(selectedUser.id, 'active')}
                    style={[styles.modalButton, styles.approveButtonModal]}
                  />
                )}
                <Button
                  title="Update Role"
                  onPress={() => {
                    Alert.alert(
                      'Update Role',
                      'Select new role for user',
                      [
                        { text: 'User', onPress: () => handleRoleUpdate(selectedUser.id, 'user') },
                        { text: 'Moderator', onPress: () => handleRoleUpdate(selectedUser.id, 'moderator') },
                        { text: 'Admin', onPress: () => handleRoleUpdate(selectedUser.id, 'admin') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                  variant="outline"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  // Enhanced Tab Navigation
  tabNavigation: {
    marginBottom: SPACING.md,
  },
  tabNavigationContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    gap: SPACING.xs,
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.sm,
    minWidth: 100,
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  tabButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  tabButtonTextActive: {
    color: COLORS.PRIMARY,
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  // Enhanced Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  statSubLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  // Revenue Section
  revenueSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  revenueCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  revenueTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  revenueValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.sm,
  },
  revenueChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  revenueChangeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  // System Health
  systemCard: {
    marginBottom: SPACING.lg,
  },
  systemMetrics: {
    gap: SPACING.md,
  },
  systemMetric: {
    gap: SPACING.xs,
  },
  systemMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemMetricLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  systemMetricValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
  },
  systemMetricBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginTop: SPACING.xs,
  },
  // Quick Actions
  quickActionsCard: {
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  quickActions: {
    gap: SPACING.md,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    position: 'relative',
  },
  quickActionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.md,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  // Filter Controls
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Search
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_PRIMARY,
  },
  // Asset Cards
  assetCard: {
    marginBottom: SPACING.md,
  },
  assetContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  assetTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  assetDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  assetUser: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  assetType: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  assetValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.md,
  },
  assetActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  // KYC Cards
  kycCard: {
    marginBottom: SPACING.md,
  },
  kycContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kycName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  kycRiskBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  kycRiskText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  kycEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  kycDocuments: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  kycNotes: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  kycActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  // Complaint Cards
  complaintCard: {
    marginBottom: SPACING.md,
  },
  complaintContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  complaintSubject: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  complaintUser: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  complaintDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  complaintDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  responseTime: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  // Subscription Cards
  subscriptionCard: {
    marginBottom: SPACING.md,
  },
  subscriptionContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  subscriptionUser: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    gap: SPACING.xs,
  },
  planText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  subscriptionEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.md,
  },
  subscriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  subscriptionAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Bold',
    color: COLORS.PRIMARY,
  },
  subscriptionPayment: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  subscriptionUsage: {
    marginBottom: SPACING.md,
  },
  usageLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  usageText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_PRIMARY,
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  // User Cards
  userCard: {
    marginBottom: SPACING.md,
  },
  userContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  userName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  roleText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.md,
  },
  userStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  userStat: {
    flex: 1,
  },
  userStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  userStatValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userSecurityBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  securityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLastLogin: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  // Analytics
  analyticsCard: {
    marginBottom: SPACING.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metric: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  metricValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  revenueChart: {
    gap: SPACING.md,
  },
  revenueItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  revenueItemPeriod: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  revenueItemValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.xs,
  },
  revenueItemMargin: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  assetChart: {
    gap: SPACING.md,
  },
  assetItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  assetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  assetItemCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_PRIMARY,
  },
  assetItemGrowth: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Bold',
  },
  assetItemVolume: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.xs,
  },
  assetItemCount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  complianceMetrics: {
    gap: SPACING.md,
  },
  complianceItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  complianceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  complianceItemMetric: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_PRIMARY,
  },
  complianceTrend: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  complianceScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  complianceScoreText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    minWidth: 50,
  },
  complianceBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  // Compliance Cards
  complianceCard: {
    marginBottom: SPACING.md,
  },
  complianceCardContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  complianceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  complianceRegulation: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  complianceStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  complianceStatusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  complianceAuditInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  complianceAuditLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  complianceAuditDate: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_PRIMARY,
  },
  complianceFindings: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.md,
  },
  complianceActions: {
    backgroundColor: '#F3F4F6',
    padding: SPACING.md,
    borderRadius: 8,
  },
  complianceActionsTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.sm,
  },
  complianceActionItem: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.xl * 2,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  accessDeniedTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  accessDeniedText: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  detailSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  assetDetailTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  assetDetailDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  assetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  riskBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  kycDetailName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  kycDetailEmail: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.lg,
  },
  kycDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notesSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  notesTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.sm,
  },
  notesText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  // Complaint Modal
  complaintModalHeader: {
    marginBottom: SPACING.md,
  },
  complaintModalSubject: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.sm,
  },
  complaintModalUser: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.lg,
  },
  complaintModalDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  complaintModalMeta: {
    gap: SPACING.xs,
  },
  metaLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  // Subscription Modal
  subscriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  subscriptionModalUser: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
  },
  subscriptionModalEmail: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.lg,
  },
  subscriptionModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  usageSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  usageSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageStat: {
    alignItems: 'center',
  },
  usageStatValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.xs,
  },
  usageStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  // User Modal
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userModalName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
  },
  userModalEmail: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.lg,
  },
  userModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  securitySection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  securitySectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  securityFeatures: {
    gap: SPACING.sm,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  securityFeatureText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  modalActions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  modalButton: {
    width: '100%',
  },
  approveButtonModal: {
    backgroundColor: '#10B981',
  },
});
