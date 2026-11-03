from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import stripe
from starlette.concurrency import run_in_threadpool

import weather as wx
import pest_risk

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'verdant_ai')]

# Stripe (official library). Keys come from the environment only.
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
# Optional: fixed public URL of the frontend, used for Stripe success/cancel redirects
PUBLIC_APP_URL = os.environ.get('PUBLIC_APP_URL', '').rstrip('/')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class ForecastDay(BaseModel):
    date: str
    description: str
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    rain_mm: Optional[float] = None
    rain_probability: Optional[float] = None
    humidity_mean: Optional[float] = None

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    description: str
    alert: Optional[str] = None
    location: str
    latitude: float
    longitude: float
    wind_speed_kmh: Optional[float] = None
    observed_at: Optional[str] = None
    source: str = "Open-Meteo"
    forecast: List[ForecastDay] = []

class SoilHealthData(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    location: str

class ProfitPrediction(BaseModel):
    crop: str
    data: List[Dict[str, Any]]

class PestAlert(BaseModel):
    pest_name: str
    crop: str
    risk_level: str  # low | moderate | high
    favourable_days: int
    forecast_days: int
    description: str
    method: str

class ActionPlanInput(BaseModel):
    land_size: float
    budget: float
    crop_type: Optional[str] = "Hybrid Tomato"

class ActionPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    land_size: float
    budget: float
    crop_type: str
    timeline: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: float
    rating: float
    verified: bool
    image_url: str
    description: str
    shop_name: str

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = "guest"
    items: List[CartItem]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    cart_id: str
    origin_url: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    amount: float
    currency: str
    payment_status: str
    cart_id: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = "guest"
    language: str = "en"
    notifications_enabled: bool = True
    tour_completed: bool = False

# Weather API (Open-Meteo, no key needed)
@api_router.get("/weather", response_model=WeatherData)
async def get_weather(lat: float = wx.DEFAULT_LAT, lon: float = wx.DEFAULT_LON, location: Optional[str] = None):
    """Live weather + 7-day forecast. Default location: Moranapalli, Hosur (12.73 N, 77.78 E)."""
    try:
        data = await wx.fetch_forecast(lat, lon)
    except wx.WeatherUnavailable as e:
        logging.error(str(e))
        raise HTTPException(status_code=503, detail="Live weather is temporarily unavailable")

    cur = data.get("current", {})
    rows = wx.daily_rows(data)
    is_default = (lat, lon) == (wx.DEFAULT_LAT, wx.DEFAULT_LON)
    return WeatherData(
        temperature=cur.get("temperature_2m"),
        humidity=cur.get("relative_humidity_2m"),
        description=wx.describe(cur.get("weather_code")),
        alert=wx.weather_alert(rows),
        location=location or (wx.DEFAULT_LOCATION_NAME if is_default else f"{lat:.2f}, {lon:.2f}"),
        latitude=data.get("latitude", lat),
        longitude=data.get("longitude", lon),
        wind_speed_kmh=cur.get("wind_speed_10m"),
        observed_at=cur.get("time"),
        forecast=rows,
    )

# Soil Health API
@api_router.get("/soil-health", response_model=SoilHealthData)
async def get_soil_health(location: str = "Moranapalli, Tamil Nadu"):
    """Get soil health data for location"""
    return SoilHealthData(
        nitrogen=45.5,
        phosphorus=32.0,
        potassium=28.5,
        ph=6.8,
        location=location
    )

# Profit Predictions API
@api_router.get("/profit-predictions", response_model=ProfitPrediction)
async def get_profit_predictions(crop: str = "Hybrid Tomato"):
    """Get profit predictions for crop"""
    if crop == "Hybrid Tomato":
        data = [
            {"month": "Jan", "profit": 45000},
            {"month": "Feb", "profit": 52000},
            {"month": "Mar", "profit": 48000},
            {"month": "Apr", "profit": 61000},
            {"month": "May", "profit": 58000},
            {"month": "Jun", "profit": 67000}
        ]
    else:  # Rice
        data = [
            {"month": "Jan", "profit": 38000},
            {"month": "Feb", "profit": 42000},
            {"month": "Mar", "profit": 45000},
            {"month": "Apr", "profit": 48000},
            {"month": "May", "profit": 52000},
            {"month": "Jun", "profit": 55000}
        ]
    
    return ProfitPrediction(crop=crop, data=data)

# Pest Alerts API — rule-based risk from the live forecast (see pest_risk.py)
@api_router.get("/pest-alerts", response_model=List[PestAlert])
async def get_pest_alerts(lat: float = wx.DEFAULT_LAT, lon: float = wx.DEFAULT_LON):
    """Weather-driven pest/disease risk for the next 7 days. Rule-based thresholds, not ML."""
    try:
        data = await wx.fetch_forecast(lat, lon)
    except wx.WeatherUnavailable as e:
        logging.error(str(e))
        raise HTTPException(status_code=503, detail="Pest risk needs the weather forecast, which is temporarily unavailable")
    return pest_risk.assess(wx.daily_rows(data))

# Action Plan APIs
@api_router.post("/action-plans", response_model=ActionPlan)
async def create_action_plan(plan_input: ActionPlanInput):
    """Create a personalized action plan"""
    timeline = [
        {"week": 1, "task": "Soil Preparation", "description": "Deep plowing and adding organic matter"},
        {"week": 2, "task": "Soil Testing", "description": "Test NPK levels and pH balance"},
        {"week": 3, "task": "Apply Organic Fungicide", "description": "Prevent soil-borne diseases"},
        {"week": 4, "task": "Planting", "description": f"Plant {plan_input.crop_type} seeds"},
        {"week": 8, "task": "First Fertilization", "description": "Apply balanced NPK fertilizer"},
        {"week": 12, "task": "Pest Monitoring", "description": "Check for pests and diseases"},
        {"week": 16, "task": "Harvest Window", "description": "Optimal harvest period begins"}
    ]
    
    plan = ActionPlan(
        land_size=plan_input.land_size,
        budget=plan_input.budget,
        crop_type=plan_input.crop_type,
        timeline=timeline
    )
    
    plan_dict = plan.model_dump()
    plan_dict["created_at"] = plan_dict["created_at"].isoformat()
    await db.action_plans.insert_one(plan_dict)
    
    return plan

@api_router.get("/action-plans", response_model=List[ActionPlan])
async def get_action_plans():
    """Get all action plans"""
    plans = await db.action_plans.find({}, {"_id": 0}).to_list(100)
    for plan in plans:
        if isinstance(plan.get("created_at"), str):
            plan["created_at"] = datetime.fromisoformat(plan["created_at"])
    return plans

# Marketplace Products APIs
@api_router.get("/marketplace/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, verified: Optional[bool] = None, search: Optional[str] = None):
    """Get marketplace products with filters"""
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    
    if not products:
        # Initialize with seed data
        seed_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Premium Hybrid Tomato Seeds",
                "category": "Seeds",
                "price": 450.0,
                "rating": 4.8,
                "verified": True,
                "image_url": "https://images.pexels.com/photos/14300545/pexels-photo-14300545.jpeg",
                "description": "High-yield disease-resistant hybrid tomato seeds",
                "shop_name": "AgroSeeds India"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Organic NPK Fertilizer (50kg)",
                "category": "Fertilizers",
                "price": 1200.0,
                "rating": 4.6,
                "verified": True,
                "image_url": "https://images.unsplash.com/photo-1768264312532-7780b660b74a",
                "description": "Balanced NPK 19-19-19 organic fertilizer",
                "shop_name": "GreenGrow Fertilizers"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Tractor Rental - Mahindra 575",
                "category": "Tractors",
                "price": 2500.0,
                "rating": 4.9,
                "verified": True,
                "image_url": "https://images.unsplash.com/photo-1774351922923-f12a07b538f0",
                "description": "Daily rental - includes operator and fuel",
                "shop_name": "FarmEquip Rentals"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Bio Pesticide Spray (5L)",
                "category": "Pesticides",
                "price": 850.0,
                "rating": 4.5,
                "verified": True,
                "image_url": "https://images.unsplash.com/photo-1768264312532-7780b660b74a",
                "description": "Organic pest control solution",
                "shop_name": "EcoFarm Solutions"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Drip Irrigation Kit",
                "category": "Equipment",
                "price": 3500.0,
                "rating": 4.7,
                "verified": False,
                "image_url": "https://images.unsplash.com/photo-1609412058473-c199497c3c5d",
                "description": "Complete drip irrigation system for 1 acre",
                "shop_name": "WaterWise Tech"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Rice Seeds - Sona Masuri",
                "category": "Seeds",
                "price": 380.0,
                "rating": 4.4,
                "verified": True,
                "image_url": "https://images.pexels.com/photos/14300545/pexels-photo-14300545.jpeg",
                "description": "Premium quality rice seeds",
                "shop_name": "AgroSeeds India"
            }
        ]
        await db.products.insert_many(seed_products)
        products = seed_products
    
    # Apply filters
    if category:
        products = [p for p in products if p["category"] == category]
    if verified is not None:
        products = [p for p in products if p["verified"] == verified]
    if search:
        products = [p for p in products if search.lower() in p["name"].lower() or search.lower() in p["description"].lower()]
    
    return products

# Cart APIs
@api_router.post("/marketplace/cart", response_model=Cart)
async def create_or_update_cart(cart: Cart):
    """Create or update shopping cart"""
    cart_dict = cart.model_dump()
    cart_dict["updated_at"] = cart_dict["updated_at"].isoformat()
    
    await db.carts.update_one(
        {"id": cart.id},
        {"$set": cart_dict},
        upsert=True
    )
    return cart

@api_router.get("/marketplace/cart/{cart_id}", response_model=Cart)
async def get_cart(cart_id: str):
    """Get cart by ID"""
    cart = await db.carts.find_one({"id": cart_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    if isinstance(cart.get("updated_at"), str):
        cart["updated_at"] = datetime.fromisoformat(cart["updated_at"])
    return cart

# Payment APIs — official Stripe Python library (stripe.checkout.Session)
def _require_stripe():
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Payments are not configured (set STRIPE_API_KEY)")


@api_router.post("/marketplace/checkout")
async def create_checkout_session(request: CheckoutRequest):
    """Create a Stripe Checkout session for the cart (prices are read from the DB, never the client)."""
    _require_stripe()
    cart = await db.carts.find_one({"id": request.cart_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    line_items = []
    total_amount = 0.0
    for item in cart.get("items", []):
        if item.get("quantity", 0) <= 0:
            continue
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if not product:
            continue
        total_amount += product["price"] * item["quantity"]
        line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {"name": product["name"]},
                "unit_amount": int(round(product["price"] * 100)),  # paise
            },
            "quantity": item["quantity"],
        })
    if not line_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    origin = PUBLIC_APP_URL or request.origin_url.rstrip('/')
    if not origin.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid origin_url")

    try:
        session = await run_in_threadpool(
            stripe.checkout.Session.create,
            api_key=STRIPE_API_KEY,
            mode="payment",
            line_items=line_items,
            success_url=f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/marketplace",
            metadata={"cart_id": request.cart_id},
        )
    except stripe.StripeError as e:
        logging.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=502, detail="Could not start checkout with Stripe")

    transaction = PaymentTransaction(
        session_id=session.id,
        amount=total_amount,
        currency="inr",
        payment_status="pending",
        cart_id=request.cart_id,
        metadata={"cart_id": request.cart_id},
    )
    transaction_dict = transaction.model_dump()
    transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
    await db.payment_transactions.insert_one(transaction_dict)

    return {"url": session.url, "session_id": session.id}


async def _mark_paid(session_id: str):
    await db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"payment_status": "paid"}},
    )


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Read the Checkout session from Stripe and sync our transaction record."""
    _require_stripe()
    try:
        session = await run_in_threadpool(stripe.checkout.Session.retrieve, session_id, api_key=STRIPE_API_KEY)
    except stripe.InvalidRequestError:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    except stripe.StripeError as e:
        logging.error(f"Stripe status error: {e}")
        raise HTTPException(status_code=502, detail="Could not reach Stripe")

    if session.payment_status == "paid":
        await _mark_paid(session_id)

    return {
        "status": session.status,                  # open | complete | expired
        "payment_status": session.payment_status,  # paid | unpaid | no_payment_required
        "amount_total": session.amount_total,      # smallest unit (paise)
        "currency": session.currency,
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook. Requires STRIPE_WEBHOOK_SECRET; unsigned events are rejected."""
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured (set STRIPE_WEBHOOK_SECRET)")
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError) as e:
        logging.warning(f"Rejected Stripe webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        obj = event["data"]["object"]
        if obj.get("payment_status") == "paid":
            await _mark_paid(obj["id"])

    return {"status": "success"}

# Settings APIs
@api_router.post("/settings", response_model=UserSettings)
async def update_settings(settings: UserSettings):
    """Update user settings"""
    settings_dict = settings.model_dump()
    
    await db.user_settings.update_one(
        {"user_id": settings.user_id},
        {"$set": settings_dict},
        upsert=True
    )
    return settings

@api_router.get("/settings/{user_id}", response_model=UserSettings)
async def get_settings(user_id: str = "guest"):
    """Get user settings"""
    settings = await db.user_settings.find_one({"user_id": user_id}, {"_id": 0})
    if not settings:
        # Return default settings
        return UserSettings(user_id=user_id)
    return settings

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',') if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Production: serve the React build (frontend/build) from this server when it exists,
# so one service can host both. Set FRONTEND_BUILD_DIR to override the location.
FRONTEND_BUILD_DIR = Path(os.environ.get('FRONTEND_BUILD_DIR', ROOT_DIR.parent / 'frontend' / 'build'))
if (FRONTEND_BUILD_DIR / 'index.html').is_file():
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / 'static'), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = (FRONTEND_BUILD_DIR / full_path).resolve()
        if full_path and candidate.is_file() and FRONTEND_BUILD_DIR.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(FRONTEND_BUILD_DIR / 'index.html')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8001)))
