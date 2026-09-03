from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import time

# System Metadata & OpenAPI Configuration
app = FastAPI(
    title="CYBERPOOL // Analytics & Anti-Fraud Engine",
    description="Asynchronous microservice for real-time marketplace telemetry, risk scoring heuristics, and OpenAPI documentation.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Strict CORS Configuration: No wildcard with credentials
CORS_ORIGINS_ENV = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
)
allowed_origins = [o.strip() for o in CORS_ORIGINS_ENV.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "x-signature"],
)

# ---------------------------------------------------------
# Models
# ---------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: float
    uptime: float

class FraudEvaluationRequest(BaseModel):
    user_id: str = Field(..., description="ID của tài khoản người dùng")
    amount: float = Field(..., description="Số tiền giao dịch (VND)")
    ip_address: Optional[str] = Field(None, description="Địa chỉ IP nguồn")
    frequency_10m: int = Field(default=1, description="Số lượng đơn hàng tạo trong 10 phút qua")
    is_new_device: bool = Field(default=False, description="Cờ cảnh báo thiết bị lạ")

class FraudEvaluationResponse(BaseModel):
    risk_score: float = Field(..., description="Điểm rủi ro từ 0.0 đến 100.0")
    recommendation: str = Field(..., description="ACCEPT, REQUIRE_2FA, hoặc REJECT")
    triggered_rules: List[str]
    evaluation_time_ms: float

# ---------------------------------------------------------
# Endpoints
# ---------------------------------------------------------
_START_TIME = time.time()

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Kiểm tra tình trạng hoạt động và thời gian uptime của dịch vụ."""
    now = time.time()
    return HealthResponse(
        status="healthy",
        service="CyberPool FastAPI Analytics Engine",
        timestamp=now,
        uptime=round(now - _START_TIME, 2)
    )

@app.get("/api/v1/meta", tags=["Metadata"])
async def get_system_meta():
    """Thông tin kiến trúc hệ thống và danh sách tính năng cốt lõi."""
    return {
        "name": "CYBERPOOL PRODUCTION ENGINE",
        "version": "1.2.0",
        "architecture": {
            "api_gateway": "Express.js + TypeScript (Port 3000)",
            "microservice_analytics": "FastAPI + Uvicorn Python 3.11",
            "database_schema": "PostgreSQL 64+ Tables Double-Entry Accounting Ledger",
            "security": "AES-256-GCM + Cryptographic JWT HMAC-SHA256 + Constant-time Signature Verification"
        },
        "capabilities": [
            "DOUBLE_ENTRY_LEDGER",
            "STATE_MACHINE_ESCROW",
            "MUTEX_INVENTORY_LOCK",
            "VERIFIED_PURCHASE_REVIEW",
            "IMMUTABLE_AUDIT_LOG",
            "AES_256_GCM_CREDENTIAL_VAULT",
            "VIETQR_HMAC_VERIFIED_DEPOSIT"
        ]
    }

@app.post("/api/v1/fraud/evaluate", response_model=FraudEvaluationResponse, tags=["Anti-Fraud"])
async def evaluate_fraud(req: FraudEvaluationRequest):
    """
    Quy tắc đánh giá rủi ro giao dịch tức thời:
    - Kiểm tra đột biến hạn mức đơn hàng (> 20 triệu VND)
    - Tần suất giao dịch nhanh liên tục
    - Cảnh báo thiết bị chưa từng đăng nhập
    """
    start_t = time.time()
    score = 10.0
    rules: List[str] = []

    if req.amount > 20_000_000:
        score += 45.0
        rules.append("HIGH_VALUE_THRESHOLD_EXCEEDED")
    elif req.amount > 5_000_000:
        score += 15.0
        rules.append("MEDIUM_VALUE_TRANSACTION")

    if req.frequency_10m >= 5:
        score += 35.0
        rules.append("BURST_FREQUENCY_DETECTED")
    elif req.frequency_10m >= 3:
        score += 15.0
        rules.append("ELEVATED_VELOCITY")

    if req.is_new_device:
        score += 20.0
        rules.append("NEW_DEVICE_FINGERPRINT")

    score = min(100.0, max(0.0, score))

    if score >= 75.0:
        decision = "REJECT"
    elif score >= 45.0:
        decision = "REQUIRE_2FA"
    else:
        decision = "ACCEPT"

    eval_ms = round((time.time() - start_t) * 1000, 2)

    return FraudEvaluationResponse(
        risk_score=score,
        recommendation=decision,
        triggered_rules=rules,
        evaluation_time_ms=eval_ms
    )
