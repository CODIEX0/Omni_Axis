from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
from datetime import datetime
import json

from langchain.llms import Ollama
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import Document
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Omni Axis Chat Agent",
    description="Conversational AI for asset tokenization guidance",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Redis connection
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Initialize LLM and embeddings
llm = Ollama(model="mistral", base_url="http://ollama:11434")
embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# Knowledge base documents
knowledge_docs = [
    Document(
        page_content="Real World Asset (RWA) tokenization converts physical assets like real estate, art, or commodities into digital tokens on blockchain. This enables fractional ownership and global trading.",
        metadata={"topic": "tokenization_basics"}
    ),
    Document(
        page_content="KYC (Know Your Customer) verification requires uploading government ID, proof of address, and completing biometric verification. This ensures compliance with financial regulations.",
        metadata={"topic": "kyc_process"}
    ),
    Document(
        page_content="The marketplace allows buying and selling tokenized assets. You can place market orders for immediate execution or limit orders at specific prices.",
        metadata={"topic": "trading"}
    ),
    Document(
        page_content="Your portfolio shows all your tokenized asset holdings, their current values, performance metrics, and dividend payments received.",
        metadata={"topic": "portfolio"}
    ),
    Document(
        page_content="Asset types include: Real Estate (properties, land), Art & Collectibles (paintings, sculptures), Commodities (gold, oil), and Luxury Goods (watches, jewelry).",
        metadata={"topic": "asset_types"}
    ),
    Document(
        page_content="To tokenize your asset: 1) Submit asset details and documentation, 2) Professional valuation, 3) Legal verification, 4) Smart contract deployment, 5) Token distribution.",
        metadata={"topic": "tokenization_process"}
    ),
]

# Create vector store
try:
    vectorstore = FAISS.from_documents(knowledge_docs, embeddings)
    logger.info("Vector store initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize vector store: {e}")
    vectorstore = None

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    timestamp: datetime

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime

# Authentication dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production, implement proper JWT verification
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return credentials.credentials

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now()
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(
    chat_request: ChatMessage,
    token: str = Depends(verify_token)
):
    """
    Process chat message and return AI response
    """
    try:
        logger.info(f"Chat request from user {chat_request.user_id}: {chat_request.message}")
        
        # Generate session ID if not provided
        session_id = chat_request.session_id or f"{chat_request.user_id}_{datetime.now().timestamp()}"
        
        # Get conversation history from Redis
        history_key = f"chat_history:{session_id}"
        history = redis_client.get(history_key)
        
        if history:
            conversation_history = json.loads(history)
        else:
            conversation_history = []
        
        # Create memory with conversation history
        memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            k=10  # Keep last 10 exchanges
        )
        
        # Add previous conversations to memory
        for exchange in conversation_history[-10:]:  # Last 10 exchanges
            memory.chat_memory.add_user_message(exchange["human"])
            memory.chat_memory.add_ai_message(exchange["ai"])
        
        if vectorstore:
            # Create conversational chain with RAG
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
                memory=memory,
                return_source_documents=True
            )
            
            # Get response
            result = qa_chain({"question": chat_request.message})
            reply = result["answer"]
        else:
            # Fallback to direct LLM without RAG
            context = "You are a helpful assistant for Omni Axis, a real-world asset tokenization platform. Help users understand tokenization, trading, and using the platform."
            prompt = f"{context}\n\nUser: {chat_request.message}\nAssistant:"
            reply = llm(prompt)
        
        # Update conversation history
        conversation_history.append({
            "human": chat_request.message,
            "ai": reply,
            "timestamp": datetime.now().isoformat()
        })
        
        # Store updated history in Redis (expire after 24 hours)
        redis_client.setex(
            history_key,
            86400,  # 24 hours
            json.dumps(conversation_history)
        )
        
        logger.info(f"Chat response generated for user {chat_request.user_id}")
        
        return ChatResponse(
            reply=reply,
            session_id=session_id,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )

@app.delete("/chat/{session_id}")
async def clear_chat_history(
    session_id: str,
    token: str = Depends(verify_token)
):
    """Clear chat history for a session"""
    try:
        history_key = f"chat_history:{session_id}"
        redis_client.delete(history_key)
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear chat history"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)