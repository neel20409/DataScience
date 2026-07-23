from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os

app = FastAPI(title="Housing Price Predictor API")

# ── CORS — allow Next.js frontend ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with your Vercel URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model on startup ────────────────────────────────────────
MODEL_PATH = "models/housing_model.pkl"
model = joblib.load(MODEL_PATH)
print("✅ Model loaded!")

# ── Input schema ─────────────────────────────────────────────────
class HouseFeatures(BaseModel):
    MedInc:     float   # median income
    HouseAge:   float   # house age
    AveRooms:   float   # average rooms
    AveBedrms:  float   # average bedrooms
    Population: float   # population
    AveOccup:   float   # average occupancy
    Latitude:   float   # latitude
    Longitude:  float   # longitude

# ── Health check endpoint ────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Housing Price API is running"}

# ── Predict endpoint ─────────────────────────────────────────────
@app.post("/predict")
def predict(features: HouseFeatures):
    # Feature engineering — same as training
    AveRooms   = features.AveRooms
    AveOccup   = features.AveOccup
    MedInc     = features.MedInc
    Population = features.Population
    AveBedrms  = features.AveBedrms

    RoomsPerPerson = AveRooms / AveOccup
    BedroomRatio   = AveBedrms / AveRooms
    IncomePerRoom  = MedInc / AveRooms
    PopDensity     = Population / AveOccup

    # Build feature array — same order as training
    data = np.array([[
        features.MedInc,
        features.HouseAge,
        features.AveRooms,
        features.AveBedrms,
        features.Population,
        features.AveOccup,
        features.Latitude,
        features.Longitude,
        RoomsPerPerson,
        BedroomRatio,
        IncomePerRoom,
        PopDensity,
    ]])

    prediction = model.predict(data)[0]
    price_dollars = round(prediction * 100_000, 2)

    return {
        "predicted_price": price_dollars,
        "formatted_price": f"${price_dollars:,.0f}",
        "price_100k":      round(prediction, 4),
        "confidence":      "high" if 50_000 < price_dollars < 500_000 else "low",
    }