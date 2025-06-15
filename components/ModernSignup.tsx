import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Building, 
  Shield, 
  Eye, 
  EyeOff,
  Check,
  ArrowRight,
  Users,
  TrendingUp,
  FileText,
  Headphones
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { demoAccountService } from '../services/demoAccounts';

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  role: 'investor' | 'issuer' | 'compliance' | 'support' | '';
  company?: string;
  agreeToTerms: boolean;
}

const roleIcons = {
  investor: TrendingUp,
  issuer: Building,
  compliance: Shield,
  support: Headphones,
  admin: Users,
};

const roleColors = {
  investor: '#FF9800',
  issuer: '#4CAF50', 
  compliance: '#9C27B0',
  support: '#607D8B',
  admin: '#2196F3',
};

export const ModernSignup: React.FC = () => {
  const { signUp, signInWithDemoAccount, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'United States',
    role: '',
    company: '',
    agreeToTerms: false,
  });

  const updateForm = (field: keyof SignupForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(form.password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!form.role) {
      Alert.alert('Error', 'Please select a role');
      return false;
    }
    
    if (!form.agreeToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }
    
    if (isValid) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSignup();
      }
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    
    try {
      const { user, error } = await signUp({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
        country: form.country,
        role: form.role,
        company: form.company,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create account');
        return;
      }

      if (user) {
        Alert.alert(
          'Success!', 
          'Your account has been created successfully. Please check your email for verification.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/login')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoAccount = async (accountType: string) => {
    try {
      setIsLoading(true);
      const { user, error } = await signInWithDemoAccount(accountType);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to access demo account');
        return;
      }

      if (user) {
        setShowDemoModal(false);
        Alert.alert(
          'Demo Mode Activated!',
          `You are now signed in as a ${accountType} with demo data.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access demo account');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            {currentStep > step ? (
              <Check size={16} color="white" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step && styles.stepLabelActive
          ]}>
            {step === 1 ? 'Personal' : step === 2 ? 'Security' : 'Role & Terms'}
          </Text>
          {step < 3 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Let's start with your basic details</Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
            <User size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={form.firstName}
              onChangeText={(text) => updateForm('firstName', text)}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <TextInput
              style={[styles.input, { paddingLeft: 15 }]}
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={(text) => updateForm('lastName', text)}
              autoCapitalize="words"
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Mail size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Phone size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={form.phone}
            onChangeText={(text) => updateForm('phone', text)}
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <MapPin size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={form.country}
            onChangeText={(text) => updateForm('country', text)}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Account Security</Text>
      <Text style={styles.stepSubtitle}>Create a strong password for your account</Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Lock size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#666" />
            ) : (
              <Eye size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Lock size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChangeText={(text) => updateForm('confirmPassword', text)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#666" />
            ) : (
              <Eye size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <Text style={styles.requirement}>• At least 8 characters long</Text>
        <Text style={styles.requirement}>• Contains uppercase and lowercase letters</Text>
        <Text style={styles.requirement}>• Contains at least one number</Text>
        <Text style={styles.requirement}>• Contains at least one special character</Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Role</Text>
      <Text style={styles.stepSubtitle}>Select the role that best describes your intended use</Text>
      
      <View style={styles.roleGrid}>
        {Object.entries(demoAccounts.rolePermissions).map(([roleKey, roleData]) => {
          if (roleKey === 'admin') return null; // Admin not available for signup
          
          const IconComponent = roleIcons[roleKey as keyof typeof roleIcons];
          const color = roleColors[roleKey as keyof typeof roleColors];
          const isSelected = form.role === roleKey;
          
          return (
            <TouchableOpacity
              key={roleKey}
              style={[
                styles.roleCard,
                isSelected && { borderColor: color, backgroundColor: `${color}10` }
              ]}
              onPress={() => updateForm('role', roleKey)}
            >
              <View style={[styles.roleIcon, { backgroundColor: color }]}>
                <IconComponent size={24} color="white" />
              </View>
              <Text style={styles.roleName}>
                {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}
              </Text>
              <Text style={styles.roleDescription}>
                {roleData.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {form.role === 'issuer' && (
        <View style={styles.inputContainer}>
          <Building size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Company Name (Optional)"
            value={form.company}
            onChangeText={(text) => updateForm('company', text)}
          />
        </View>
      )}
      
      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => updateForm('agreeToTerms', !form.agreeToTerms)}
      >
        <View style={[
          styles.checkbox,
          form.agreeToTerms && styles.checkboxChecked
        ]}>
          {form.agreeToTerms && <Check size={16} color="white" />}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDemoModal = () => {
    const demoAccountsSummary = demoAccountService.getAccountSummary();
    
    return (
      <Modal
        visible={showDemoModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.demoModalContainer}>
          <View style={styles.demoModalHeader}>
            <Text style={styles.demoModalTitle}>Demo Accounts</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDemoModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.demoModalContent}>
            <Text style={styles.demoModalSubtitle}>
              Choose a pre-configured demo account to explore different roles and features
            </Text>
            
            {Object.entries(demoAccountsSummary).map(([role, info]) => {
              const IconComponent = roleIcons[role as keyof typeof roleIcons];
              const color = roleColors[role as keyof typeof roleColors];
              
              return (
                <TouchableOpacity
                  key={role}
                  style={styles.demoAccountCard}
                  onPress={() => useDemoAccount(role)}
                  disabled={isLoading}
                >
                  <View style={[styles.demoRoleIcon, { backgroundColor: color }]}>
                    <IconComponent size={20} color="white" />
                  </View>
                  <View style={styles.demoAccountInfo}>
                    <Text style={styles.demoAccountRole}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                    <Text style={styles.demoAccountDescription}>{info.description}</Text>
                  </View>
                  <ArrowRight size={20} color="#666" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.demoModalFooter}>
            <Text style={styles.demoModalNote}>
              Demo accounts have pre-populated data and all features unlocked
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>Join the future of asset tokenization</Text>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setShowDemoModal(true)}
          >
            <Text style={styles.demoButtonText}>Use Demo Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading ? 'Creating Account...' : 
               currentStep === 3 ? 'Create Account' : 'Next'}
            </Text>
            {!isLoading && <ArrowRight size={20} color="white" />}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {renderDemoModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#667eea',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '100%',
    width: 50,
    height: 2,
    backgroundColor: '#e9ecef',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#667eea',
  },
  stepContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
  },
  inputGroup: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#343a40',
  },
  eyeIcon: {
    padding: 4,
  },
  passwordRequirements: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  roleGrid: {
    gap: 16,
    marginBottom: 24,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  termsText: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  nextButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#6c757d',
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  demoModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  demoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  demoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
  },
  demoModalContent: {
    flex: 1,
    padding: 20,
  },
  demoModalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 24,
  },
  demoAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  demoRoleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  demoAccountInfo: {
    flex: 1,
  },
  demoAccountRole: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  demoAccountEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  demoAccountDescription: {
    fontSize: 12,
    color: '#adb5bd',
  },
  demoModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  demoModalNote: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
