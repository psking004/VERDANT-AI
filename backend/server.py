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
import httpx
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class WeatherData(BaseModel):
    temperature: float
    humidity: float
    description: str
    alert: Optional[str] = None

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
    risk_level: str
    radius_km: int
    description: str

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

# Weather API
@api_router.get("/weather", response_model=WeatherData)
async def get_weather(lat: float = 13.0827, lon: float = 80.2707):
    """Get real-time weather data for location (default: Moranapalli, Tamil Nadu)"""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric"
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            return WeatherData(
                temperature=data["main"]["temp"],
                humidity=data["main"]["humidity"],
                description=data["weather"][0]["description"],
                alert="Upcoming Monsoon" if data["main"]["humidity"] > 70 else None
            )
    except Exception as e:
        logging.error(f"Weather API error: {str(e)}")
        # Return mock data on error
        return WeatherData(
            temperature=28.5,
            humidity=75,
            description="partly cloudy",
            alert="Upcoming Monsoon"
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

# Pest Alerts API
@api_router.get("/pest-alerts", response_model=List[PestAlert])
async def get_pest_alerts():
    """Get local pest monitoring alerts"""
    return [
        PestAlert(
            pest_name="Fall Armyworm",
            risk_level="high",
            radius_km=10,
            description="High infestation detected in nearby fields"
        )
    ]

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

# Payment APIs
@api_router.post("/marketplace/checkout")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """Create Stripe checkout session"""
    try:
        # Get cart
        cart = await db.carts.find_one({"id": request.cart_id}, {"_id": 0})
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Calculate total
        total_amount = 0.0
        for item in cart["items"]:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            if product:
                total_amount += product["price"] * item["quantity"]
        
        # Initialize Stripe
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session
        success_url = f"{request.origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
        cancel_url = f"{request.origin_url}/marketplace"
        
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="inr",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"cart_id": request.cart_id}
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction
        transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=total_amount,
            currency="inr",
            payment_status="pending",
            cart_id=request.cart_id,
            metadata={"cart_id": request.cart_id}
        )
        
        transaction_dict = transaction.model_dump()
        transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
        await db.payment_transactions.insert_one(transaction_dict)
        
        return {"url": session.url, "session_id": session.session_id}
    
    except Exception as e:
        logging.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, http_request: Request):
    """Get payment status"""
    try:
        host_url = str(http_request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if payment is complete
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        if transaction and transaction["payment_status"] != "paid" and status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    
    except Exception as e:
        logging.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update payment transaction
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid"}}
            )
        
        return {"status": "success"}
    
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

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
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()