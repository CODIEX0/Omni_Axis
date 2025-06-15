import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { GiftedChat, IMessage, InputToolbar, Send, Bubble } from 'react-native-gifted-chat';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, X, Send as SendIcon, Bot, ExternalLink, BookOpen } from 'lucide-react-native';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { deepSeekAIService, ChatMessage, AIResponse } from '../services/deepSeekAI';
import { router } from 'expo-router';

interface AIChatProps {
  visible: boolean;
  onClose: () => void;
  context?: {
    currentScreen?: string;
    assetType?: string;
    userRole?: 'investor' | 'issuer' | 'regulator';
  };
}

export function AIChat({ visible, onClose, context }: AIChatProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { user, isAuthenticated } = useTypedSelector(state => state.auth);
  const { kycStatus } = useTypedSelector(state => state.user);

  useEffect(() => {
    if (visible) {
      // Initialize with personalized welcome message
      const welcomeMessage = getWelcomeMessage();
      setMessages([
        {
          _id: 1,
          text: welcomeMessage,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'OmniAxis AI',
            avatar: '🤖',
          },
        },
      ]);

      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const getWelcomeMessage = (): string => {
    if (!isAuthenticated) {
      return "Hello! I'm OmniAxis AI, your guide to asset tokenization and blockchain technology. I can help you understand how to tokenize real-world assets, navigate DeFi, and learn about our platform. What would you like to know?";
    }

    const role = context?.userRole || 'investor';
    const name = user?.name || 'there';

    switch (role) {
      case 'issuer':
        return `Hi ${name}! As an asset issuer, I can help you understand the tokenization process, compliance requirements, and how to create successful token offerings. What asset are you looking to tokenize?`;
      case 'regulator':
        return `Hello ${name}! I can assist with compliance frameworks, regulatory requirements, and oversight tools for tokenized assets. How can I help with your regulatory needs?`;
      default:
        return `Welcome back, ${name}! I'm here to help you discover investment opportunities, understand tokenized assets, and navigate the platform. What interests you today?`;
    }
  };

  const onSend = async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    setIsTyping(true);

    try {
      // Prepare conversation history
      const conversationHistory: ChatMessage[] = messages.map(msg => ({
        id: msg._id.toString(),
        role: msg.user._id === 2 ? 'assistant' : 'user',
        content: msg.text,
        timestamp: new Date(msg.createdAt),
      }));

      // Call DeepSeek AI service
      const response = await deepSeekAIService.sendMessage(
        userMessage.text,
        sessionId,
        {
          userRole: context?.userRole,
          currentAsset: context?.assetType,
          kycStatus: kycStatus,
          conversationHistory,
        }
      );

      setCurrentResponse(response);

      const aiMessage: IMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: response.message,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'OmniAxis AI',
          avatar: '🤖',
        },
      };

      setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback response based on message content
      const fallbackMessage = getFallbackResponse(userMessage.text);
      
      const aiMessage: IMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: fallbackMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'OmniAxis AI',
          avatar: '🤖',
        },
      };

      setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
    } finally {
      setIsTyping(false);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('tokenize') || lowerMessage.includes('asset')) {
      return "I can help you understand asset tokenization! It's the process of converting real-world assets into digital tokens on the blockchain. This enables fractional ownership, increased liquidity, and global accessibility. Would you like to learn about tokenizing a specific type of asset?";
    }
    
    if (lowerMessage.includes('invest') || lowerMessage.includes('buy')) {
      return "Investment in tokenized assets offers unique opportunities for portfolio diversification. Our marketplace features verified assets with detailed documentation. Before investing, ensure you complete KYC verification and review all risk factors. What type of assets interest you?";
    }
    
    if (lowerMessage.includes('kyc') || lowerMessage.includes('verification')) {
      return "KYC (Know Your Customer) verification is essential for regulatory compliance. Our decentralized KYC system protects your privacy while meeting legal requirements. The process is usually quick and straightforward. Do you need help starting your KYC verification?";
    }
    
    return "I'm here to help you navigate the world of asset tokenization and DeFi. You can ask me about tokenizing assets, investment opportunities, platform features, or blockchain technology in general. What would you like to explore?";
  };

  const handleActionPress = (action: AIResponse['actions'][0]) => {
    if (!action) return;

    switch (action.type) {
      case 'navigate':
        if (action.data?.screen) {
          router.push(`/(tabs)/${action.data.screen}` as any);
          onClose();
        }
        break;
      case 'tokenize':
        router.push('/(tabs)/tokenize-new');
        onClose();
        break;
      case 'invest':
        router.push('/(tabs)/marketplace');
        onClose();
        break;
      case 'kyc':
        router.push('/(auth)/kyc');
        onClose();
        break;
      case 'learn':
        router.push('/(tabs)/community');
        onClose();
        break;
      default:
        console.log('Unhandled action:', action);
    }
  };

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputPrimary}
    />
  );

  const renderSend = (props: any) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <View style={styles.sendButton}>
        <SendIcon color="#FFFFFF" size={16} />
      </View>
    </Send>
  );

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#1E40AF',
        },
        left: {
          backgroundColor: '#F3F4F6',
        },
      }}
      textStyle={{
        right: {
          color: '#FFFFFF',
          fontFamily: 'Inter-Regular',
        },
        left: {
          color: '#1F2937',
          fontFamily: 'Inter-Regular',
        },
      }}
    />
  );

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [600, 0],
            }),
          }],
        },
      ]}
    >
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.botIcon}>
              <Bot color="#FFFFFF" size={20} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Omni Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
            name: user?.firstName || 'User',
          }}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderBubble={renderBubble}
          isTyping={isTyping}
          placeholder="Ask me anything about tokenization..."
          alwaysShowSend
          scrollToBottom
          showUserAvatar={false}
        />
        
        {/* Action Buttons and Suggestions */}
        {currentResponse && (currentResponse.actions || currentResponse.suggestions) && (
          <View style={styles.actionsContainer}>
            {currentResponse.actions && currentResponse.actions.length > 0 && (
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
                  {currentResponse.actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.actionButton}
                      onPress={() => handleActionPress(action)}
                    >
                      <Text style={styles.actionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {currentResponse.suggestions && currentResponse.suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Suggestions</Text>
                {currentResponse.suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => onSend([{
                      _id: Math.round(Math.random() * 1000000),
                      text: suggestion,
                      createdAt: new Date(),
                      user: { _id: 1 },
                    }])}
                  >
                    <Text style={styles.suggestionText}>💡 {suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {currentResponse.sources && currentResponse.sources.length > 0 && (
              <View style={styles.sourcesSection}>
                <Text style={styles.sectionTitle}>Learn More</Text>
                {currentResponse.sources.map((source, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sourceButton}
                    onPress={() => {
                      if (source.url) {
                        Alert.alert(
                          'Open External Link',
                          `Would you like to open ${source.title}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open', onPress: () => console.log('Open:', source.url) },
                          ]
                        );
                      }
                    }}
                  >
                    <View style={styles.sourceContent}>
                      <BookOpen size={16} color="#6B7280" style={styles.sourceIcon} />
                      <View style={styles.sourceText}>
                        <Text style={styles.sourceTitle}>{source.title}</Text>
                        <Text style={styles.sourceDescription}>{source.description}</Text>
                      </View>
                      {source.url && <ExternalLink size={16} color="#6B7280" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1000,
  },
  header: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inputToolbar: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sendButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    maxHeight: 200,
  },
  actionsSection: {
    marginBottom: 12,
  },
  suggestionsSection: {
    marginBottom: 12,
  },
  sourcesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  actionsScroll: {
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  suggestionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  sourceButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    marginRight: 12,
  },
  sourceText: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  sourceDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
});