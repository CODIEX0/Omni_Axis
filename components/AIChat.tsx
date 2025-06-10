import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { GiftedChat, IMessage, InputToolbar, Send, Bubble } from 'react-native-gifted-chat';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, X, Send as SendIcon, Bot } from 'lucide-react-native';
import { useTypedSelector } from '../hooks/useTypedSelector';

interface AIChatProps {
  visible: boolean;
  onClose: () => void;
}

export function AIChat({ visible, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { user } = useTypedSelector(state => state.auth);

  useEffect(() => {
    if (visible) {
      // Initialize with welcome message
      setMessages([
        {
          _id: 1,
          text: "Hello! I'm your Omni Axis assistant. I can help you understand asset tokenization, guide you through the platform, or answer questions about trading. How can I assist you today?",
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Omni Assistant',
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

  const onSend = async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    setIsTyping(true);

    try {
      // Call AI chat service
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || 'demo-token'}`,
        },
        body: JSON.stringify({
          message: userMessage.text,
          user_id: user?.id || 'demo-user',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage: IMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: data.reply,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Omni Assistant',
            avatar: '🤖',
          },
        };

        setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback response
      const fallbackMessage: IMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact support if you need immediate assistance.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Omni Assistant',
          avatar: '🤖',
        },
      };

      setMessages(previousMessages => GiftedChat.append(previousMessages, [fallbackMessage]));
    } finally {
      setIsTyping(false);
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
          placeholder="Ask me anything about Omni Axis..."
          alwaysShowSend
          scrollToBottom
          showUserAvatar={false}
        />
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
});