"use client";
import { useState } from "react";

interface PredictionResult {
  predicted_price: number;
  formatted_price: string;
  confidence: string;
}

interface FormData {
  MedInc:     number;
  HouseAge:   number;
  AveRooms:   number;
  AveBedrms:  number;
  Population: number;
  AveOccup:   number;
  Latitude:   number;
  Longitude:  number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [form, setForm] = useState<FormData>({
    MedInc:     5.0,
    HouseAge:   20,
    AveRooms:   6.0,
    AveBedrms:  1.2,
    Population: 1500,
    AveOccup:   3.0,
    Latitude:   34.0,
    Longitude:  -118.0,
  });

  const [result, setResult]   = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Could not connect to API. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "MedInc",     label: "Median Income",      min: 0.5,   max: 15,    step: 0.1,  hint: "Neighbourhood median income" },
    { name: "HouseAge",   label: "House Age (years)",  min: 1,     max: 52,    step: 1,    hint: "Median age of houses in block" },
    { name: "AveRooms",   label: "Average Rooms",      min: 1,     max: 20,    step: 0.1,  hint: "Avg rooms per household" },
    { name: "AveBedrms",  label: "Average Bedrooms",   min: 0.5,   max: 10,    step: 0.1,  hint: "Avg bedrooms per household" },
    { name: "Population", label: "Population",         min: 3,     max: 35682, step: 10,   hint: "Block group population" },
    { name: "AveOccup",   label: "Average Occupancy",  min: 1,     max: 20,    step: 0.1,  hint: "Avg household members" },
    { name: "Latitude",   label: "Latitude",           min: 32.5,  max: 42,    step: 0.01, hint: "Geographic latitude" },
    { name: "Longitude",  label: "Longitude",          min: -124,  max: -114,  step: 0.01, hint: "Geographic longitude" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏠 House Price Predictor
          </h1>
          <p className="text-gray-500">
            Powered by Random Forest ML model · R² = 0.81
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                </label>
                <input
                  type="number"
                  name={f.name}
                  value={form[f.name as keyof FormData]}
                  onChange={handleChange}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">{f.hint}</p>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Predicting..." : "Predict Price →"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm mb-2">Predicted House Price</p>
            <p className="text-5xl font-bold text-blue-600 mb-4">
              {result.formatted_price}
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                result.confidence === "high"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {result.confidence === "high"
                ? "✅ High confidence"
                : "⚠️ Low confidence"}
            </span>
            <p className="text-gray-400 text-xs mt-4">
              Model: Random Forest · Trained on California Housing Dataset
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Built by Neel Bhatt ·{" "}
          <a
            href="https://github.com/neel20409/DataScience"
            className="underline hover:text-gray-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </div>
    </main>
  );
}