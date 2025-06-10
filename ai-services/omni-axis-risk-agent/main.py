from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import logging
from datetime import datetime, timedelta
import json
import requests

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Omni Axis Risk Agent",
    description="Risk assessment and fraud detection for asset tokenization",
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

# Initialize ML models
isolation_forest = IsolationForest(contamination=0.1, random_state=42)
scaler = StandardScaler()

# Risk thresholds
RISK_THRESHOLDS = {
    "low": 0.3,
    "medium": 0.6,
    "high": 0.8,
    "critical": 0.95
}

# Pydantic models
class UserRiskData(BaseModel):
    user_id: str
    ip_address: str
    transaction_count: int
    total_volume: float
    geolocation: Optional[Dict[str, str]] = None
    device_fingerprint: Optional[str] = None
    kyc_status: str = "pending"
    account_age_days: int = 0
    failed_login_attempts: int = 0
    suspicious_activity_count: int = 0

class TransactionRiskData(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    asset_type: str
    timestamp: datetime
    ip_address: str
    geolocation: Optional[Dict[str, str]] = None
    payment_method: str
    is_cross_border: bool = False

class RiskAssessment(BaseModel):
    risk_score: float
    risk_level: str
    flags: List[str]
    recommendations: List[str]
    confidence: float

class RiskResponse(BaseModel):
    assessment: RiskAssessment
    timestamp: datetime
    processing_time: float

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime

# Authentication dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return credentials.credentials

def get_ip_geolocation(ip_address: str) -> Dict[str, str]:
    """Get geolocation data for IP address using free service"""
    try:
        # Use ipapi.co free service (1000 requests/day)
        response = requests.get(f"https://ipapi.co/{ip_address}/json/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "country": data.get("country_name", "Unknown"),
                "country_code": data.get("country_code", "XX"),
                "city": data.get("city", "Unknown"),
                "region": data.get("region", "Unknown"),
                "latitude": str(data.get("latitude", 0)),
                "longitude": str(data.get("longitude", 0))
            }
    except Exception as e:
        logger.warning(f"Failed to get geolocation for IP {ip_address}: {e}")
    
    return {
        "country": "Unknown",
        "country_code": "XX",
        "city": "Unknown",
        "region": "Unknown",
        "latitude": "0",
        "longitude": "0"
    }

def check_ip_reputation(ip_address: str) -> Dict[str, any]:
    """Check IP reputation using free services"""
    try:
        # Simple checks for common patterns
        reputation = {
            "is_tor": False,
            "is_vpn": False,
            "is_proxy": False,
            "is_malicious": False,
            "reputation_score": 0.5  # Neutral by default
        }
        
        # Check for private/local IPs
        if ip_address.startswith(("192.168.", "10.", "172.")) or ip_address == "127.0.0.1":
            reputation["reputation_score"] = 0.8  # Higher trust for local IPs
        
        return reputation
    except Exception as e:
        logger.warning(f"Failed to check IP reputation for {ip_address}: {e}")
        return {"reputation_score": 0.5}

def calculate_user_risk_score(user_data: UserRiskData) -> RiskAssessment:
    """Calculate risk score for a user"""
    flags = []
    recommendations = []
    risk_factors = []
    
    # IP and geolocation analysis
    if user_data.geolocation:
        geo_data = user_data.geolocation
    else:
        geo_data = get_ip_geolocation(user_data.ip_address)
    
    ip_reputation = check_ip_reputation(user_data.ip_address)
    
    # Risk factor 1: IP reputation
    ip_risk = 1.0 - ip_reputation.get("reputation_score", 0.5)
    risk_factors.append(ip_risk * 0.2)  # 20% weight
    
    if ip_risk > 0.7:
        flags.append("Suspicious IP address")
        recommendations.append("Verify user identity through additional channels")
    
    # Risk factor 2: Account age
    if user_data.account_age_days < 1:
        account_age_risk = 0.8
        flags.append("New account (less than 1 day old)")
        recommendations.append("Apply enhanced monitoring for new accounts")
    elif user_data.account_age_days < 7:
        account_age_risk = 0.6
    elif user_data.account_age_days < 30:
        account_age_risk = 0.3
    else:
        account_age_risk = 0.1
    
    risk_factors.append(account_age_risk * 0.15)  # 15% weight
    
    # Risk factor 3: Transaction patterns
    if user_data.transaction_count > 50:
        tx_risk = 0.7  # High frequency trading
        flags.append("High frequency trading pattern")
    elif user_data.transaction_count > 20:
        tx_risk = 0.4
    else:
        tx_risk = 0.1
    
    risk_factors.append(tx_risk * 0.2)  # 20% weight
    
    # Risk factor 4: Volume analysis
    if user_data.total_volume > 100000:  # $100k+
        volume_risk = 0.6
        flags.append("High volume transactions")
        recommendations.append("Verify source of funds")
    elif user_data.total_volume > 50000:
        volume_risk = 0.4
    else:
        volume_risk = 0.1
    
    risk_factors.append(volume_risk * 0.15)  # 15% weight
    
    # Risk factor 5: Failed login attempts
    if user_data.failed_login_attempts > 5:
        login_risk = 0.8
        flags.append("Multiple failed login attempts")
        recommendations.append("Require password reset and 2FA")
    elif user_data.failed_login_attempts > 2:
        login_risk = 0.4
    else:
        login_risk = 0.1
    
    risk_factors.append(login_risk * 0.1)  # 10% weight
    
    # Risk factor 6: KYC status
    if user_data.kyc_status == "rejected":
        kyc_risk = 0.9
        flags.append("KYC verification failed")
        recommendations.append("Manual review required")
    elif user_data.kyc_status == "pending":
        kyc_risk = 0.5
        flags.append("KYC verification pending")
    else:
        kyc_risk = 0.1
    
    risk_factors.append(kyc_risk * 0.2)  # 20% weight
    
    # Calculate final risk score
    risk_score = sum(risk_factors)
    risk_score = min(max(risk_score, 0.0), 1.0)  # Clamp between 0 and 1
    
    # Determine risk level
    if risk_score >= RISK_THRESHOLDS["critical"]:
        risk_level = "critical"
    elif risk_score >= RISK_THRESHOLDS["high"]:
        risk_level = "high"
    elif risk_score >= RISK_THRESHOLDS["medium"]:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    # Add general recommendations based on risk level
    if risk_level in ["high", "critical"]:
        recommendations.append("Block transactions until manual review")
        recommendations.append("Escalate to compliance team")
    elif risk_level == "medium":
        recommendations.append("Apply enhanced monitoring")
        recommendations.append("Require additional verification")
    
    confidence = 0.8  # Base confidence, could be improved with more data
    
    return RiskAssessment(
        risk_score=risk_score,
        risk_level=risk_level,
        flags=flags,
        recommendations=recommendations,
        confidence=confidence
    )

def calculate_transaction_risk_score(tx_data: TransactionRiskData) -> RiskAssessment:
    """Calculate risk score for a transaction"""
    flags = []
    recommendations = []
    risk_factors = []
    
    # Get user's recent transaction history
    user_history_key = f"user_tx_history:{tx_data.user_id}"
    recent_transactions = redis_client.lrange(user_history_key, 0, 9)  # Last 10 transactions
    
    # Risk factor 1: Transaction amount
    if tx_data.amount > 50000:
        amount_risk = 0.8
        flags.append("Large transaction amount")
        recommendations.append("Verify source of funds")
    elif tx_data.amount > 10000:
        amount_risk = 0.5
    else:
        amount_risk = 0.2
    
    risk_factors.append(amount_risk * 0.3)  # 30% weight
    
    # Risk factor 2: Transaction frequency
    if len(recent_transactions) >= 5:  # 5+ transactions recently
        frequency_risk = 0.7
        flags.append("High transaction frequency")
    elif len(recent_transactions) >= 3:
        frequency_risk = 0.4
    else:
        frequency_risk = 0.1
    
    risk_factors.append(frequency_risk * 0.2)  # 20% weight
    
    # Risk factor 3: Cross-border transaction
    if tx_data.is_cross_border:
        cross_border_risk = 0.6
        flags.append("Cross-border transaction")
        recommendations.append("Verify compliance with international regulations")
    else:
        cross_border_risk = 0.2
    
    risk_factors.append(cross_border_risk * 0.15)  # 15% weight
    
    # Risk factor 4: Time-based analysis
    current_hour = tx_data.timestamp.hour
    if current_hour < 6 or current_hour > 22:  # Outside business hours
        time_risk = 0.5
        flags.append("Transaction outside business hours")
    else:
        time_risk = 0.1
    
    risk_factors.append(time_risk * 0.1)  # 10% weight
    
    # Risk factor 5: Payment method
    if tx_data.payment_method in ["crypto", "anonymous"]:
        payment_risk = 0.6
        flags.append("High-risk payment method")
    elif tx_data.payment_method in ["credit_card", "bank_transfer"]:
        payment_risk = 0.2
    else:
        payment_risk = 0.3
    
    risk_factors.append(payment_risk * 0.15)  # 15% weight
    
    # Risk factor 6: Asset type
    high_risk_assets = ["art", "luxury", "collectibles"]
    if tx_data.asset_type in high_risk_assets:
        asset_risk = 0.5
        flags.append("High-risk asset type")
    else:
        asset_risk = 0.2
    
    risk_factors.append(asset_risk * 0.1)  # 10% weight
    
    # Calculate final risk score
    risk_score = sum(risk_factors)
    risk_score = min(max(risk_score, 0.0), 1.0)
    
    # Determine risk level
    if risk_score >= RISK_THRESHOLDS["critical"]:
        risk_level = "critical"
    elif risk_score >= RISK_THRESHOLDS["high"]:
        risk_level = "high"
    elif risk_score >= RISK_THRESHOLDS["medium"]:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    # Store transaction in history
    tx_record = {
        "amount": tx_data.amount,
        "timestamp": tx_data.timestamp.isoformat(),
        "risk_score": risk_score
    }
    redis_client.lpush(user_history_key, json.dumps(tx_record))
    redis_client.ltrim(user_history_key, 0, 19)  # Keep last 20 transactions
    redis_client.expire(user_history_key, 86400 * 30)  # Expire after 30 days
    
    confidence = 0.75
    
    return RiskAssessment(
        risk_score=risk_score,
        risk_level=risk_level,
        flags=flags,
        recommendations=recommendations,
        confidence=confidence
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now()
    )

@app.post("/evaluate-user", response_model=RiskResponse)
async def evaluate_user_risk(
    user_data: UserRiskData,
    token: str = Depends(verify_token)
):
    """
    Evaluate risk score for a user
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Evaluating risk for user {user_data.user_id}")
        
        # Calculate risk assessment
        assessment = calculate_user_risk_score(user_data)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"User risk evaluation completed: {assessment.risk_level} ({assessment.risk_score:.3f})")
        
        return RiskResponse(
            assessment=assessment,
            timestamp=datetime.now(),
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error evaluating user risk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate user risk"
        )

@app.post("/evaluate-transaction", response_model=RiskResponse)
async def evaluate_transaction_risk(
    tx_data: TransactionRiskData,
    token: str = Depends(verify_token)
):
    """
    Evaluate risk score for a transaction
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Evaluating transaction risk for {tx_data.transaction_id}")
        
        # Calculate risk assessment
        assessment = calculate_transaction_risk_score(tx_data)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Transaction risk evaluation completed: {assessment.risk_level} ({assessment.risk_score:.3f})")
        
        return RiskResponse(
            assessment=assessment,
            timestamp=datetime.now(),
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error evaluating transaction risk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate transaction risk"
        )

@app.get("/risk-stats/{user_id}")
async def get_user_risk_stats(
    user_id: str,
    token: str = Depends(verify_token)
):
    """Get risk statistics for a user"""
    try:
        history_key = f"user_tx_history:{user_id}"
        transactions = redis_client.lrange(history_key, 0, -1)
        
        if not transactions:
            return {
                "user_id": user_id,
                "transaction_count": 0,
                "average_risk_score": 0.0,
                "high_risk_transactions": 0
            }
        
        risk_scores = []
        high_risk_count = 0
        
        for tx_json in transactions:
            tx_data = json.loads(tx_json)
            risk_score = tx_data.get("risk_score", 0.0)
            risk_scores.append(risk_score)
            
            if risk_score >= RISK_THRESHOLDS["high"]:
                high_risk_count += 1
        
        return {
            "user_id": user_id,
            "transaction_count": len(transactions),
            "average_risk_score": np.mean(risk_scores) if risk_scores else 0.0,
            "high_risk_transactions": high_risk_count,
            "risk_trend": "increasing" if len(risk_scores) > 1 and risk_scores[0] > risk_scores[-1] else "stable"
        }
        
    except Exception as e:
        logger.error(f"Error getting risk stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get risk statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)