from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import uvicorn

app = FastAPI(title="Housing Price Predictor API")

# ── CORS — allow Next.js frontend ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model on startup ────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "housing_model.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

model = joblib.load(MODEL_PATH)
print("[OK] Model loaded successfully!")

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
    return {"status": "ok", "message": "Housing Price Predictor API is running"}

# ── Predict endpoint ─────────────────────────────────────────────
@app.post("/predict")
def predict(features: HouseFeatures):
    AveRooms   = features.AveRooms
    AveOccup   = features.AveOccup if features.AveOccup != 0 else 1e-6
    MedInc     = features.MedInc
    Population = features.Population
    AveBedrms  = features.AveBedrms

    RoomsPerPerson = AveRooms / AveOccup
    BedroomRatio   = AveBedrms / (AveRooms if AveRooms != 0 else 1e-6)
    IncomePerRoom  = MedInc / (AveRooms if AveRooms != 0 else 1e-6)
    PopDensity     = Population / AveOccup

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)