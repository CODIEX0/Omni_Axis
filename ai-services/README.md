# Omni Axis AI Services

This directory contains the AI microservices for the Omni Axis Real World Asset Tokenization Platform. Each service is containerized and provides specific AI capabilities through RESTful APIs.

## 🤖 AI Services Overview

### 1. Chat Agent (`omni-axis-chat-agent`)
**Purpose**: Conversational AI for user guidance and support
- **Technology**: LangChain + Ollama (Mistral) + FAISS
- **Features**: RAG-based responses, conversation memory, multi-language support
- **Port**: 8001

### 2. NLP Agent (`omni-axis-nlp-agent`)
**Purpose**: Document processing and entity extraction
- **Technology**: spaCy + Tesseract OCR + pdfplumber
- **Features**: Multi-language OCR, entity extraction, document validation
- **Port**: 8002

### 3. Risk Agent (`omni-axis-risk-agent`)
**Purpose**: Risk assessment and fraud detection
- **Technology**: Scikit-learn + IP reputation APIs
- **Features**: User risk scoring, transaction analysis, anomaly detection
- **Port**: 8003

### 4. Authenticity Agent (`omni-axis-authenticity-agent`)
**Purpose**: Asset verification and valuation
- **Technology**: Computer Vision + ML models + External APIs
- **Features**: Image verification, GPS validation, price estimation
- **Port**: 8004

### 5. KYC Agent (`omni-axis-kyc-agent`)
**Purpose**: Automated identity verification
- **Technology**: DeepFace + OpenCV + Liveness detection
- **Features**: Face matching, document verification, liveness checks
- **Port**: 8005

### 6. Contract Generator Agent (`omni-axis-contractgen-agent`)
**Purpose**: Smart contract generation and validation
- **Technology**: LLM + Solidity templates + Code analysis
- **Features**: Contract generation, ABI creation, security validation
- **Port**: 8006

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- At least 8GB RAM (for running all services)
- NVIDIA GPU (optional, for faster inference)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ai-services
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Start All Services
```bash
# Start all AI services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f chat-agent
```

### 4. Initialize Ollama Models
```bash
# Pull required models
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull codellama
```

## 📡 API Documentation

### Authentication
All services use JWT-based authentication. Include the token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

### Chat Agent API

#### POST /chat
Start or continue a conversation
```json
{
  "message": "How do I tokenize my real estate?",
  "user_id": "user123",
  "session_id": "optional-session-id"
}
```

Response:
```json
{
  "reply": "To tokenize real estate, you need to...",
  "session_id": "user123_1234567890",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### NLP Agent API

#### POST /extract
Extract entities from uploaded documents
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  http://localhost:8002/extract
```

Response:
```json
{
  "entities": {
    "name": "John Doe",
    "address": "123 Main St, New York, NY",
    "asset_type": "real estate",
    "certificate_id": "RE123456",
    "confidence": 0.85
  },
  "raw_text": "Document text...",
  "processing_time": 2.3,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Risk Agent API

#### POST /evaluate-user
Assess user risk profile
```json
{
  "user_id": "user123",
  "ip_address": "192.168.1.1",
  "transaction_count": 15,
  "total_volume": 50000.0,
  "kyc_status": "approved",
  "account_age_days": 30
}
```

Response:
```json
{
  "assessment": {
    "risk_score": 0.35,
    "risk_level": "medium",
    "flags": ["High volume transactions"],
    "recommendations": ["Apply enhanced monitoring"],
    "confidence": 0.8
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "processing_time": 0.15
}
```

## 🔧 Development

### Adding New Services
1. Create new directory: `omni-axis-<service-name>-agent/`
2. Add Dockerfile and requirements.txt
3. Implement FastAPI application
4. Add service to docker-compose.yml
5. Update this README

### Testing
```bash
# Run tests for specific service
cd omni-axis-chat-agent
python -m pytest tests/

# Run integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Monitoring
```bash
# View service metrics
docker stats

# Check service health
curl http://localhost:8001/health
curl http://localhost:8002/health
# ... for all services
```

## 🛡️ Security

### API Security
- JWT token validation on all endpoints
- Rate limiting (100 requests/minute per user)
- Input validation and sanitization
- CORS protection

### Data Privacy
- No persistent storage of user data
- Encrypted communication between services
- Audit logging for all operations
- GDPR compliance features

## 📊 Performance

### Resource Requirements
| Service | CPU | RAM | Storage |
|---------|-----|-----|---------|
| Chat Agent | 1 core | 2GB | 1GB |
| NLP Agent | 2 cores | 4GB | 2GB |
| Risk Agent | 1 core | 1GB | 500MB |
| Authenticity Agent | 2 cores | 3GB | 2GB |
| KYC Agent | 2 cores | 3GB | 2GB |
| Contract Generator | 1 core | 2GB | 1GB |

### Scaling
- Horizontal scaling with Docker Swarm or Kubernetes
- Load balancing with nginx or HAProxy
- Redis clustering for shared state
- Database read replicas

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: AI Services CI/CD
on:
  push:
    paths:
      - 'ai-services/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          cd ai-services
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          # Deployment commands
```

## 📈 Monitoring & Observability

### Health Checks
All services expose `/health` endpoints for monitoring:
```bash
# Check all services
for port in 8001 8002 8003 8004 8005 8006; do
  curl -s http://localhost:$port/health | jq .
done
```

### Logging
Centralized logging with structured JSON format:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "chat-agent",
  "level": "INFO",
  "message": "Chat request processed",
  "user_id": "user123",
  "processing_time": 0.5
}
```

### Metrics
Key metrics tracked:
- Request latency (p50, p95, p99)
- Error rates by service
- Resource utilization
- Model inference time
- User satisfaction scores

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Verify dependencies
docker-compose ps

# Restart service
docker-compose restart <service-name>
```

#### High Memory Usage
```bash
# Monitor resource usage
docker stats

# Optimize model loading
# Edit service configuration to use smaller models
```

#### Slow Response Times
```bash
# Check service health
curl http://localhost:8001/health

# Monitor database connections
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Scale services
docker-compose up --scale chat-agent=3
```

## 📞 Support

For issues and questions:
- Create GitHub issues for bugs
- Check documentation at `/docs` endpoint for each service
- Contact the development team

## 🔮 Future Enhancements

### Planned Features
- [ ] Multi-modal AI (text + image + audio)
- [ ] Real-time streaming responses
- [ ] Advanced analytics dashboard
- [ ] A/B testing framework
- [ ] Auto-scaling based on load
- [ ] Edge deployment capabilities
- [ ] Federated learning support
- [ ] Advanced security features (homomorphic encryption)

### Model Improvements
- [ ] Fine-tuned models for financial domain
- [ ] Custom NER models for asset documents
- [ ] Improved risk assessment algorithms
- [ ] Better multilingual support
- [ ] Continuous learning capabilities