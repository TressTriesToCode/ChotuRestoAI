from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.models import *  # ensure all models are registered
from app.api.v1 import auth, tables, menu, pos, qr, kds, orders, inventory, analytics, ai
from app.websocket.manager import ws_manager
from app.initial_data import init_demo_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables and populate initial demo seed data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_demo_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Chotu Restro AI Backend",
        "version": "1.0.0",
        "currency": "INR"
    }

# API v1 Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(tables.router, prefix=f"{settings.API_V1_STR}/tables", tags=["Dining Tables"])
app.include_router(menu.router, prefix=f"{settings.API_V1_STR}/menu", tags=["Menu"])
app.include_router(pos.router, prefix=f"{settings.API_V1_STR}/pos", tags=["Point of Sale"])
app.include_router(qr.router, prefix=f"{settings.API_V1_STR}/qr", tags=["QR Ordering"])
app.include_router(kds.router, prefix=f"{settings.API_V1_STR}/kds", tags=["Kitchen Display System"])
app.include_router(orders.router, prefix=f"{settings.API_V1_STR}/orders", tags=["Orders & Dispatch"])
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["Inventory & Recipes"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Operational Analytics"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["Chotu AI Assistant"])

# WebSocket Endpoint
@app.websocket("/ws/{restaurant_id}")
async def websocket_endpoint(websocket: WebSocket, restaurant_id: str):
    await ws_manager.connect(websocket, restaurant_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, restaurant_id)
