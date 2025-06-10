export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, user_id, session_id } = body;

    // In production, this would call the actual AI chat service
    // For now, we'll provide intelligent responses based on keywords
    
    const response = await generateAIResponse(message, user_id);

    return Response.json({
      reply: response,
      session_id: session_id || `${user_id}_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(message: string, userId: string): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Tokenization questions
  if (lowerMessage.includes('tokeniz') || lowerMessage.includes('token')) {
    return "Asset tokenization converts physical assets like real estate, art, or commodities into digital tokens on the blockchain. This enables fractional ownership, making expensive assets accessible to more investors. Each token represents a share of the underlying asset's value and rights.";
  }

  // KYC questions
  if (lowerMessage.includes('kyc') || lowerMessage.includes('verification') || lowerMessage.includes('identity')) {
    return "KYC (Know Your Customer) verification is required for compliance with financial regulations. You'll need to upload a government-issued ID, proof of address, and complete biometric verification. The process typically takes 24-48 hours for review.";
  }

  // Trading questions
  if (lowerMessage.includes('trade') || lowerMessage.includes('buy') || lowerMessage.includes('sell')) {
    return "You can trade tokenized assets in our marketplace. Use market orders for immediate execution at current prices, or limit orders to set your preferred price. All trades are settled on the blockchain for transparency and security.";
  }

  // Portfolio questions
  if (lowerMessage.includes('portfolio') || lowerMessage.includes('holdings')) {
    return "Your portfolio shows all your tokenized asset holdings, their current values, performance metrics, and any dividend payments received. You can track your investments' performance and see detailed analytics for each asset.";
  }

  // Asset types
  if (lowerMessage.includes('real estate') || lowerMessage.includes('property')) {
    return "Real estate tokens represent fractional ownership in properties like office buildings, residential complexes, or land. These typically offer steady returns through rental income and potential appreciation.";
  }

  if (lowerMessage.includes('art') || lowerMessage.includes('collectible')) {
    return "Art and collectibles tokenization allows you to own fractions of valuable artworks, rare collectibles, or cultural artifacts. These assets can appreciate significantly and offer portfolio diversification.";
  }

  // Fees and costs
  if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
    return "Trading fees are 2.5% per transaction. Asset tokenization has a creation fee of 0.1 ETH. There are no monthly account fees, and you only pay gas fees for blockchain transactions.";
  }

  // Security questions
  if (lowerMessage.includes('secure') || lowerMessage.includes('safe') || lowerMessage.includes('security')) {
    return "Omni Axis uses bank-grade security with multi-signature wallets, encrypted data storage, and regular security audits. Your assets are protected by blockchain technology and smart contracts that have been thoroughly tested.";
  }

  // Getting started
  if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('how')) {
    return "To get started: 1) Complete KYC verification, 2) Connect your wallet or add payment methods, 3) Browse available assets in the marketplace, 4) Start with small investments to learn the platform. I'm here to help with any questions!";
  }

  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm here to help you navigate Omni Axis and understand asset tokenization. What would you like to know about our platform?";
  }

  // Default response
  return "I'd be happy to help you with that! I can assist with questions about asset tokenization, trading, KYC verification, portfolio management, or any other aspect of the Omni Axis platform. Could you be more specific about what you'd like to know?";
}