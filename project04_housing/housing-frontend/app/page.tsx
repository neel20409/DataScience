"use client";
import { useState } from "react";

interface PredictionResult {
  predicted_price: number;
  formatted_price: string;
  price_100k: number;
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

const PRESETS = [
  {
    name: "🌴 Beverly Hills Luxury",
    data: { MedInc: 10.5, HouseAge: 25, AveRooms: 7.8, AveBedrms: 1.2, Population: 950, AveOccup: 2.7, Latitude: 34.07, Longitude: -118.40 }
  },
  {
    name: "🏡 Silicon Valley Suburban",
    data: { MedInc: 6.8, HouseAge: 18, AveRooms: 6.2, AveBedrms: 1.1, Population: 1450, AveOccup: 3.0, Latitude: 37.38, Longitude: -122.08 }
  },
  {
    name: "🏢 SF City Apartment",
    data: { MedInc: 3.5, HouseAge: 45, AveRooms: 4.1, AveBedrms: 1.0, Population: 2600, AveOccup: 2.4, Latitude: 37.77, Longitude: -122.41 }
  },
  {
    name: "🌾 Central Valley Rural",
    data: { MedInc: 2.1, HouseAge: 12, AveRooms: 4.8, AveBedrms: 1.2, Population: 750, AveOccup: 3.5, Latitude: 36.75, Longitude: -119.77 }
  }
];

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
  const [activeTab, setActiveTab] = useState<"predict" | "objective">("predict");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setForm({ ...form, [e.target.name]: isNaN(val) ? 0 : val });
  };

  const applyPreset = (presetData: FormData) => {
    setForm(presetData);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error(`API responded with status code ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(
        "Could not connect to FastAPI backend at " + API_URL + ". Ensure 'uvicorn main:app --reload' is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculated helper metrics for feature visualization
  const roomsPerPerson = (form.AveRooms / (form.AveOccup || 1)).toFixed(2);
  const bedroomRatio   = ((form.AveBedrms / (form.AveRooms || 1)) * 100).toFixed(1);
  const incomePerRoom  = (form.MedInc / (form.AveRooms || 1)).toFixed(2);

  const fields = [
    { name: "MedInc",     label: "Median Income",       unit: "$10k",   min: 0.5,   max: 15.0,  step: 0.1,  hint: "Neighbourhood income ($10k = $100,000/yr)" },
    { name: "HouseAge",   label: "House Age",           unit: "years",  min: 1,     max: 52,    step: 1,    hint: "Median block house age" },
    { name: "AveRooms",   label: "Average Rooms",       unit: "rooms",  min: 1.0,   max: 15.0,  step: 0.1,  hint: "Avg total rooms per household" },
    { name: "AveBedrms",  label: "Average Bedrooms",    unit: "bedrms", min: 0.5,   max: 6.0,   step: 0.1,  hint: "Avg bedrooms per household" },
    { name: "Population", label: "Block Population",    unit: "people", min: 50,    max: 10000, step: 50,   hint: "Total census block population" },
    { name: "AveOccup",   label: "Average Occupancy",   unit: "people", min: 1.0,   max: 10.0,  step: 0.1,  hint: "Avg members per household" },
    { name: "Latitude",   label: "Latitude",            unit: "°N",     min: 32.5,  max: 42.0,  step: 0.01, hint: "Geographic latitude (32.5° to 42.0°)" },
    { name: "Longitude",  label: "Longitude",           unit: "°W",     min: -124.5,max: -114.0,step: 0.01, hint: "Geographic longitude (-124.5° to -114.0°)" },
  ];

  return (
    <main className="min-h-screen text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Machine Learning API · Project 04
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            California Housing <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Price Predictor</span>
          </h1>

          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Real-time property valuation model trained on 20,640 California census block groups using Random Forest Regression ($R^2 = 0.81$).
          </p>

          {/* Tab Selection */}
          <div className="flex justify-center pt-2">
            <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex gap-1 shadow-lg">
              <button
                onClick={() => setActiveTab("predict")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "predict"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                🏠 Interactive Predictor
              </button>
              <button
                onClick={() => setActiveTab("objective")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "objective"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                🎯 Project Objective & Insights
              </button>
            </div>
          </div>
        </header>

        {activeTab === "objective" ? (
          /* ── PROJECT OBJECTIVE & INSIGHTS CARD ──────────────────────────── */
          <section className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🎯 Project Objective & Technical Highlights
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Understanding the data science pipeline behind the Housing Price Predictor model.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Objective 1 */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white">Automated Valuation Model</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The primary goal is to estimate median house values for census blocks in California using multi-variate demographic, geographic, and structural features.
                </p>
              </div>

              {/* Objective 2 */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white">Engineered Ratios</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Raw features are enhanced with engineered metrics such as <code className="text-purple-300">RoomsPerPerson</code>, <code className="text-purple-300">BedroomRatio</code>, and <code className="text-purple-300">PopDensity</code> to capture density and luxury factors.
                </p>
              </div>

              {/* Objective 3 */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white">Model Metrics ($R^2 = 0.81$)</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Trained using Scikit-Learn's <code className="text-emerald-300">RandomForestRegressor</code> with 100 decision trees, delivering robust predictions across varied geographic zones.
                </p>
              </div>

              {/* Objective 4 */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <h3 className="text-lg font-semibold text-white">Decoupled REST Architecture</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  FastAPI provides a high-performance, asynchronous REST backend for real-time predictions, consumed seamlessly by this Next.js frontend client.
                </p>
              </div>
            </div>

            {/* Model Feature Importance Summary */}
            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-5 space-y-3">
              <h4 className="text-indigo-300 font-semibold text-sm uppercase tracking-wider">💡 Key Predictive Drivers</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-slate-400">#1 Driver</p>
                  <p className="font-bold text-white text-sm mt-0.5">Median Income</p>
                  <p className="text-indigo-400 font-medium">~52% Weight</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-slate-400">#2 Driver</p>
                  <p className="font-bold text-white text-sm mt-0.5">Location (Lat/Long)</p>
                  <p className="text-purple-400 font-medium">~18% Weight</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-slate-400">#3 Driver</p>
                  <p className="font-bold text-white text-sm mt-0.5">Rooms / Person</p>
                  <p className="text-emerald-400 font-medium">~14% Weight</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-slate-400">#4 Driver</p>
                  <p className="font-bold text-white text-sm mt-0.5">House Age</p>
                  <p className="text-amber-400 font-medium">~8% Weight</p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ── INTERACTIVE PREDICTOR SECTION ───────────────────────────────── */
          <div className="space-y-8">
            
            {/* Quick Presets */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center sm:text-left">
                ⚡ Load Sample Preset Profiles:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p.data)}
                    className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all text-left truncate shadow-sm"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Input Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Property & Location Features</h2>
                  <p className="text-xs text-slate-400">Adjust the attributes below to run live estimation</p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
                  8 Features
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((f) => (
                  <div key={f.name} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label className="text-sm font-semibold text-slate-200">
                        {f.label}
                      </label>
                      <span className="text-xs font-mono font-medium text-indigo-400">
                        {form[f.name as keyof FormData]} {f.unit}
                      </span>
                    </div>

                    {/* HIGH CONTRAST INPUT STYLING - FULLY VISIBLE TEXT IN BOTH LIGHT & DARK */}
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="number"
                        name={f.name}
                        value={form[f.name as keyof FormData]}
                        onChange={handleChange}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        className="w-full bg-slate-950 text-white font-semibold text-base px-4 py-3 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all placeholder-slate-500"
                        required
                      />
                      <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-mono pointer-events-none">
                        {f.unit}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-tight">
                      {f.hint}
                    </p>
                  </div>
                ))}
              </div>

              {/* Derived Metric Badges preview */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-400">Rooms / Person</p>
                  <p className="text-sm font-bold text-indigo-400 mt-0.5">{roomsPerPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Bedroom Ratio</p>
                  <p className="text-sm font-bold text-purple-400 mt-0.5">{bedroomRatio}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Income / Room</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{incomePerRoom}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-base flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Evaluating ML Model...
                  </>
                ) : (
                  <>
                    Run Price Prediction →
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-2xl p-5 text-sm flex items-start gap-3 shadow-lg">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold">Backend Connection Issue</p>
                  <p className="text-rose-300 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-indigo-500/30 p-8 text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                    Estimated Market Value
                  </span>
                  <p className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                    {result.formatted_price}
                  </p>
                </div>

                <div className="flex justify-center items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${
                      result.confidence === "high"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {result.confidence === "high" ? "✅ High Model Confidence" : "⚠️ Low Model Confidence"}
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                    Output Metric: {result.price_100k} ($100k unit)
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
                  <div>
                    <p className="text-slate-500">Algorithm</p>
                    <p className="font-semibold text-white mt-0.5">Random Forest</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Trees</p>
                    <p className="font-semibold text-white mt-0.5">100 Estimators</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Dataset</p>
                    <p className="font-semibold text-white mt-0.5">CA Census 1990</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Accuracy ($R^2$)</p>
                    <p className="font-semibold text-emerald-400 mt-0.5">0.81 (81%)</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="text-center text-slate-400 text-xs pt-6 pb-4 border-t border-slate-800/60">
          <p>
            Housing Price Predictor · Built by{" "}
            <span className="font-semibold text-slate-300">Neel Bhatt</span> ·{" "}
            <a
              href="https://github.com/neel20409/DataScience"
              className="text-indigo-400 underline hover:text-indigo-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              View GitHub Repository
            </a>
          </p>
        </footer>

      </div>
    </main>
  );
}