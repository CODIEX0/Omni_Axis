import axios from 'axios';
import { config } from '../config';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    assetType?: string;
    context?: string;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  context?: {
    currentAsset?: string;
    userRole?: 'investor' | 'issuer' | 'regulator';
    kycStatus?: string;
  };
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  actions?: {
    type: 'navigate' | 'tokenize' | 'invest' | 'kyc' | 'learn';
    data?: any;
    label: string;
  }[];
  confidence: number;
  sources?: {
    title: string;
    url?: string;
    description: string;
  }[];
}

class DeepSeekAIService {
  private apiUrl: string;
  private apiKey: string;
  private systemPrompt: string;

  constructor() {
    this.apiUrl = config.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
    this.apiKey = config.DEEPSEEK_API_KEY || '';
    
    this.systemPrompt = `You are OmniAxis AI, an intelligent assistant specialized in asset tokenization, blockchain technology, and decentralized finance. Your role is to help users understand and navigate the world of Real World Asset (RWA) tokenization.

EXPERTISE AREAS:
- Asset Tokenization (Real Estate, Bonds, Invoices, Commodities, Art)
- Blockchain Technology (Ethereum, Smart Contracts, DeFi)
- Compliance and Regulations (KYC/AML, Securities Law, Cross-border)
- Investment Strategies and Risk Management
- Decentralized Finance (DeFi) protocols and mechanisms
- Digital Identity and Privacy Protection

PLATFORM CAPABILITIES:
- Token Creation and Management
- Marketplace Trading
- KYC/AML Verification
- Bank Integration for Fiat-Token Exchange
- Role-based Access (Investors, Issuers, Regulators)
- Multi-jurisdictional Compliance

RESPONSE GUIDELINES:
1. Provide accurate, educational information about tokenization and blockchain
2. Offer specific guidance based on user's role and context
3. Suggest relevant platform actions when appropriate
4. Maintain compliance awareness in all recommendations
5. Use clear, non-technical language for beginners
6. Provide technical details when requested by advanced users
7. Always emphasize security and regulatory compliance
8. Cite relevant sources when discussing regulations or technical concepts

TONE: Professional, educational, helpful, and trustworthy. Always prioritize user education and safety.`;
  }

  /**
   * Send a message to DeepSeek AI and get response
   */
  async sendMessage(
    message: string,
    sessionId?: string,
    context?: {
      userRole?: 'investor' | 'issuer' | 'regulator';
      currentAsset?: string;
      kycStatus?: string;
      conversationHistory?: ChatMessage[];
    }
  ): Promise<AIResponse> {
    try {
      // Prepare conversation history
      const messages = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Add context if provided
      if (context) {
        let contextMessage = 'CURRENT CONTEXT:\n';
        if (context.userRole) contextMessage += `User Role: ${context.userRole}\n`;
        if (context.currentAsset) contextMessage += `Current Asset: ${context.currentAsset}\n`;
        if (context.kycStatus) contextMessage += `KYC Status: ${context.kycStatus}\n`;
        
        messages.push({ role: 'system', content: contextMessage });
      }

      // Add conversation history (last 10 messages)
      if (context?.conversationHistory) {
        const recentMessages = context.conversationHistory.slice(-10);
        messages.push(...recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })));
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const aiMessage = response.data.choices[0].message.content;
      
      // Parse the response to extract suggestions and actions
      const aiResponse = this.parseAIResponse(aiMessage, context);
      
      return aiResponse;
    } catch (error: any) {
      console.error('DeepSeek AI Error:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  /**
   * Parse AI response to extract structured information
   */
  private parseAIResponse(
    message: string,
    context?: any
  ): AIResponse {
    // Basic response structure
    const response: AIResponse = {
      message,
      confidence: 0.9,
      suggestions: [],
      actions: [],
      sources: [],
    };

    // Extract suggestions (lines starting with "- " or "• ")
    const suggestionRegex = /^[•\-]\s(.+)$/gm;
    const suggestions = [];
    let match;
    while ((match = suggestionRegex.exec(message)) !== null) {
      suggestions.push(match[1]);
    }
    response.suggestions = suggestions.slice(0, 3); // Limit to 3 suggestions

    // Generate contextual actions based on message content
    response.actions = this.generateActions(message, context);

    // Add relevant sources based on content
    response.sources = this.generateSources(message);

    return response;
  }

  /**
   * Generate contextual actions based on AI response
   */
  private generateActions(
    message: string,
    context?: any
  ): AIResponse['actions'] {
    const actions: AIResponse['actions'] = [];
    const lowerMessage = message.toLowerCase();

    // Tokenization actions
    if (lowerMessage.includes('tokenize') || lowerMessage.includes('create token')) {
      actions.push({
        type: 'tokenize',
        label: 'Start Tokenization Process',
        data: { screen: 'tokenize-new' }
      });
    }

    // Investment actions
    if (lowerMessage.includes('invest') || lowerMessage.includes('buy token')) {
      actions.push({
        type: 'invest',
        label: 'Explore Investment Opportunities',
        data: { screen: 'marketplace' }
      });
    }

    // KYC actions
    if (lowerMessage.includes('kyc') || lowerMessage.includes('verification')) {
      actions.push({
        type: 'kyc',
        label: 'Complete KYC Verification',
        data: { screen: 'kyc' }
      });
    }

    // Learning actions
    if (lowerMessage.includes('learn') || lowerMessage.includes('guide')) {
      actions.push({
        type: 'learn',
        label: 'Learn More About Tokenization',
        data: { screen: 'community' }
      });
    }

    // Navigation actions
    if (lowerMessage.includes('portfolio')) {
      actions.push({
        type: 'navigate',
        label: 'View Your Portfolio',
        data: { screen: 'portfolio' }
      });
    }

    return actions.slice(0, 2); // Limit to 2 actions
  }

  /**
   * Generate relevant sources based on content
   */
  private generateSources(message: string): AIResponse['sources'] {
    const sources: AIResponse['sources'] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('regulation') || lowerMessage.includes('compliance')) {
      sources.push({
        title: 'Securities and Exchange Commission (SEC) Guidelines',
        description: 'Official regulatory guidance on digital assets and tokenization'
      });
    }

    if (lowerMessage.includes('erc-20') || lowerMessage.includes('smart contract')) {
      sources.push({
        title: 'Ethereum ERC-20 Token Standard',
        url: 'https://ethereum.org/en/developers/docs/standards/tokens/erc-20/',
        description: 'Technical documentation for ERC-20 token implementation'
      });
    }

    if (lowerMessage.includes('kyc') || lowerMessage.includes('aml')) {
      sources.push({
        title: 'FATF Guidance on Digital Assets',
        description: 'International standards for Anti-Money Laundering compliance'
      });
    }

    return sources.slice(0, 2); // Limit to 2 sources
  }

  /**
   * Get fallback response when AI service is unavailable
   */
  private getFallbackResponse(
    message: string,
    context?: any
  ): AIResponse {
    const lowerMessage = message.toLowerCase();

    // Provide basic responses based on keywords
    if (lowerMessage.includes('tokenize') || lowerMessage.includes('token')) {
      return {
        message: "Asset tokenization is the process of converting real-world assets into digital tokens on a blockchain. This allows for fractional ownership, increased liquidity, and global accessibility. In our platform, you can tokenize various assets like real estate, bonds, or invoices using our secure smart contract system.",
        confidence: 0.8,
        suggestions: [
          "Start by completing KYC verification",
          "Choose the type of asset you want to tokenize",
          "Upload relevant documentation and valuations"
        ],
        actions: [
          {
            type: 'tokenize',
            label: 'Start Tokenization',
            data: { screen: 'tokenize-new' }
          }
        ]
      };
    }

    if (lowerMessage.includes('kyc') || lowerMessage.includes('verification')) {
      return {
        message: "KYC (Know Your Customer) verification is required for compliance with financial regulations. Our decentralized KYC system ensures your personal information is secure while meeting regulatory requirements. The process typically takes 1-3 business days.",
        confidence: 0.8,
        suggestions: [
          "Prepare government-issued ID",
          "Have proof of address ready",
          "Ensure good lighting for document photos"
        ],
        actions: [
          {
            type: 'kyc',
            label: 'Complete KYC',
            data: { screen: 'kyc' }
          }
        ]
      };
    }

    if (lowerMessage.includes('invest') || lowerMessage.includes('buy')) {
      return {
        message: "You can invest in tokenized assets through our marketplace. Each asset token represents fractional ownership in real-world assets. Before investing, make sure to review the asset details, risk factors, and ensure you're KYC verified.",
        confidence: 0.8,
        suggestions: [
          "Browse available assets in the marketplace",
          "Review asset documentation and risk factors",
          "Start with smaller investments to understand the process"
        ],
        actions: [
          {
            type: 'navigate',
            label: 'View Marketplace',
            data: { screen: 'marketplace' }
          }
        ]
      };
    }

    // Generic fallback
    return {
      message: "I'm here to help you with asset tokenization, blockchain technology, and navigating our platform. You can ask me about tokenizing assets, investment opportunities, KYC requirements, or any other questions about decentralized finance.",
      confidence: 0.7,
      suggestions: [
        "Ask about tokenizing a specific asset type",
        "Learn about investment opportunities",
        "Get help with KYC verification"
      ],
      actions: [
        {
          type: 'learn',
          label: 'Learn More',
          data: { screen: 'community' }
        }
      ]
    };
  }

  /**
   * Get topic-specific educational content
   */
  async getEducationalContent(topic: string): Promise<{
    title: string;
    content: string;
    resources: { title: string; description: string; url?: string }[];
  }> {
    const educationalContent = {
      tokenization: {
        title: 'Asset Tokenization Fundamentals',
        content: `Asset tokenization is the process of converting rights to an asset into a digital token on a blockchain. This revolutionary approach offers several key benefits:

• **Fractional Ownership**: Divide expensive assets into smaller, more affordable shares
• **Increased Liquidity**: Trade assets 24/7 on global markets
• **Lower Barriers**: Reduce minimum investment requirements
• **Transparency**: All transactions recorded on blockchain
• **Global Access**: Investors worldwide can participate
• **Programmable Features**: Smart contracts automate processes

Common asset types suitable for tokenization include:
- Real Estate (commercial, residential, REITs)
- Financial Instruments (bonds, loans, invoices)
- Commodities (gold, oil, agricultural products)
- Art and Collectibles
- Intellectual Property
- Business Equity

The tokenization process typically involves:
1. Asset identification and valuation
2. Legal structure creation
3. Regulatory compliance (KYC/AML)
4. Smart contract deployment
5. Token distribution
6. Secondary market trading`,
        resources: [
          {
            title: 'Tokenization Best Practices',
            description: 'Comprehensive guide to successful asset tokenization',
          },
          {
            title: 'Regulatory Compliance Guide',
            description: 'Understanding legal requirements for tokenized assets',
          },
          {
            title: 'Smart Contract Security',
            description: 'Ensuring security in tokenization smart contracts',
          }
        ]
      },
      blockchain: {
        title: 'Blockchain Technology for Asset Tokenization',
        content: `Blockchain technology provides the foundation for secure, transparent asset tokenization:

**Key Blockchain Features:**
• **Immutability**: Records cannot be altered once confirmed
• **Decentralization**: No single point of failure
• **Transparency**: All transactions are publicly verifiable
• **Smart Contracts**: Automated execution of agreements
• **Global Accessibility**: 24/7 operation across borders

**Ethereum Ecosystem:**
Our platform uses Ethereum-compatible blockchains, providing:
- ERC-20 standard for fungible tokens
- ERC-1400 for security tokens with compliance features
- Mature developer ecosystem
- Extensive tooling and infrastructure

**Security Considerations:**
- Multi-signature wallets for asset custody
- Regular smart contract audits
- Decentralized oracle systems for price feeds
- Encrypted metadata storage on IPFS
- Role-based access controls

**Scalability Solutions:**
- Layer 2 solutions for lower transaction costs
- Sidechains for specific asset classes
- Cross-chain interoperability`,
        resources: [
          {
            title: 'Ethereum Developer Documentation',
            description: 'Official Ethereum development resources',
            url: 'https://ethereum.org/developers/'
          },
          {
            title: 'Smart Contract Best Practices',
            description: 'Security guidelines for smart contract development',
          },
          {
            title: 'DeFi Security Guidelines',
            description: 'Best practices for decentralized finance security',
          }
        ]
      },
      compliance: {
        title: 'Regulatory Compliance in Asset Tokenization',
        content: `Regulatory compliance is crucial for successful asset tokenization:

**KYC/AML Requirements:**
• Identity verification of all participants
• Source of funds verification
• Ongoing monitoring for suspicious activities
• Reporting to relevant authorities
• Regular compliance audits

**Securities Regulations:**
Different jurisdictions have varying requirements:
- SEC regulations in the United States
- MiFID II in European Union
- Local securities laws worldwide
- Cross-border compliance considerations

**Key Compliance Features:**
• Investor accreditation verification
• Transfer restrictions and whitelisting
• Automated compliance checks
• Audit trails and reporting
• Privacy protection measures

**Our Compliance Approach:**
- Decentralized KYC with privacy protection
- Automated compliance monitoring
- Multi-jurisdictional support
- Regular regulatory updates
- Integration with traditional banking systems`,
        resources: [
          {
            title: 'SEC Digital Asset Guidelines',
            description: 'US Securities and Exchange Commission guidance',
          },
          {
            title: 'Global Regulatory Landscape',
            description: 'Overview of tokenization regulations worldwide',
          },
          {
            title: 'Privacy-Preserving Compliance',
            description: 'Balancing compliance with user privacy',
          }
        ]
      }
    };

    return educationalContent[topic as keyof typeof educationalContent] || educationalContent.tokenization;
  }
}

export const deepSeekAIService = new DeepSeekAIService();
