"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface PredictionResult {
  predicted_price: number;
  formatted_price: string;
  price_100k: number;
  confidence: string;
  created_at?: string;
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

const FAQS = [
  {
    q: "How does the California House Price Predictor estimate home values?",
    a: "The tool utilizes a Random Forest Regressor trained on 20,640 California census block groups. It processes 8 primary features (income, house age, room count, spatial coordinates) along with engineered ratio features to generate real-time market value estimates."
  },
  {
    q: "What factors influence California property valuation the most?",
    a: "Median Income (MedInc) is the primary driver, accounting for over 50% of the prediction weight. Geographic location (Latitude & Longitude) and spatial occupancy density (Rooms per Person) form the second highest predictive weights."
  },
  {
    q: "How accurate is this California Housing ML model?",
    a: "The model achieves an R² score of 0.81 (81% variance explained) on validation datasets, providing reliable baseline market estimations across suburban, urban, and rural block groups."
  }
];

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

  const [result, setResult]               = useState<PredictionResult | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<"predict" | "objective" | "history">("predict");
  const [history, setHistory]             = useState<PredictionResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    if (!supabase) return;
    setHistoryLoading(true);
    try {
      const { data, error: sbError } = await supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!sbError && data) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Supabase fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

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
      const data: PredictionResult = await res.json();
      setResult(data);

      if (supabase) {
        await supabase.from("predictions").insert([
          {
            formatted_price: data.formatted_price,
            predicted_price: data.predicted_price,
            confidence:      data.confidence,
            med_inc:         form.MedInc,
            house_age:       form.HouseAge,
            ave_rooms:       form.AveRooms,
            ave_bedrms:      form.AveBedrms,
            population:      form.Population,
            ave_occup:       form.AveOccup,
            latitude:        form.Latitude,
            longitude:       form.Longitude,
          }
        ]);
      }
    } catch (err: any) {
      setError(
        "Could not connect to FastAPI backend at " + API_URL + ". Ensure your backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const roomsPerPerson = (form.AveRooms / (form.AveOccup || 1)).toFixed(2);
  const bedroomRatio   = ((form.AveBedrms / (form.AveRooms || 1)) * 100).toFixed(1);
  const incomePerRoom  = (form.MedInc / (form.AveRooms || 1)).toFixed(2);

  const fields = [
    { id: "input-MedInc",     name: "MedInc",     label: "Median Income",       unit: "$10k",   min: 0.5,   max: 15.0,  step: 0.1,  hint: "Neighbourhood income ($10k = $100,000/yr)" },
    { id: "input-HouseAge",   name: "HouseAge",   label: "House Age",           unit: "years",  min: 1,     max: 52,    step: 1,    hint: "Median block house age" },
    { id: "input-AveRooms",   name: "AveRooms",   label: "Average Rooms",       unit: "rooms",  min: 1.0,   max: 15.0,  step: 0.1,  hint: "Avg total rooms per household" },
    { id: "input-AveBedrms",  name: "AveBedrms",  label: "Average Bedrooms",    unit: "bedrms", min: 0.5,   max: 6.0,   step: 0.1,  hint: "Avg bedrooms per household" },
    { id: "input-Population", name: "Population", label: "Block Population",    unit: "people", min: 50,    max: 10000, step: 50,   hint: "Total census block population" },
    { id: "input-AveOccup",   name: "AveOccup",   label: "Average Occupancy",   unit: "people", min: 1.0,   max: 10.0,  step: 0.1,  hint: "Avg members per household" },
    { id: "input-Latitude",   name: "Latitude",   label: "Latitude",            unit: "°N",     min: 32.5,  max: 42.0,  step: 0.01, hint: "Geographic latitude (32.5° to 42.0°)" },
    { id: "input-Longitude",  name: "Longitude",  label: "Longitude",           unit: "°W",     min: -124.5,max: -114.0,step: 0.01, hint: "Geographic longitude (-124.5° to -114.0°)" },
  ];

  return (
    <main className="min-h-screen text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* ── HEADER (SEMANTIC HTML & SINGLE H1 FOR GOOGLE SEO) ────────────── */}
        <header className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Real Estate AI & Machine Learning Tool
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            California House Price Predictor & <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Real Estate Valuation</span>
          </h1>

          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-normal">
            Estimate California property values in real-time using an advanced Random Forest Machine Learning model ($R^2 = 0.81$) trained on 20,640 California census block groups.
          </p>

          <div className="flex justify-center items-center gap-2 text-xs pt-1">
            <span className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
              isSupabaseConfigured 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? "bg-emerald-400" : "bg-slate-500"}`}></span>
              {isSupabaseConfigured ? "Supabase Cloud Database Connected" : "Cloud Storage Ready"}
            </span>
          </div>

          <nav aria-label="Main Navigation" className="flex justify-center pt-2">
            <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex gap-1 shadow-lg">
              <button
                id="tab-predict"
                onClick={() => setActiveTab("predict")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "predict"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                🏠 House Predictor
              </button>
              <button
                id="tab-objective"
                onClick={() => setActiveTab("objective")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "objective"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                🎯 Model Architecture
              </button>
              <button
                id="tab-history"
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                ⚡ Saved History
              </button>
            </div>
          </nav>
        </header>

        {activeTab === "objective" ? (
          <section aria-labelledby="architecture-title" className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl animate-fade-in">
            <div className="border-b border-slate-800 pb-5">
              <h2 id="architecture-title" className="text-2xl font-bold text-white flex items-center gap-2">
                🎯 Model Architecture & Valuation Objectives
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Data Science ML pipeline trained on California Census data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">1</div>
                <h3 className="text-lg font-semibold text-white">Multi-Variate Valuation</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Estimates median home values across California by modeling complex non-linear spatial and economic interactions.
                </p>
              </article>

              <article className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">2</div>
                <h3 className="text-lg font-semibold text-white">Random Forest Model ($R^2 = 0.81$)</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Trained using 100 decision trees to achieve an 81% coefficient of determination ($R^2$) across all census regions.
                </p>
              </article>
            </div>
          </section>
        ) : activeTab === "history" ? (
          <section aria-labelledby="history-title" className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 id="history-title" className="text-xl font-bold text-white">⚡ Saved California House Predictions</h2>
                <p className="text-xs text-slate-400">Live predictions stored in Supabase PostgreSQL</p>
              </div>
              <button
                id="btn-refresh-history"
                onClick={fetchHistory}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Refresh 🔄
              </button>
            </div>

            {!isSupabaseConfigured ? (
              <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-6 text-center space-y-3">
                <p className="text-amber-300 font-semibold text-sm">⚡ Supabase Credentials Required</p>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Add your <code className="text-amber-200">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-amber-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable persistent history storage.
                </p>
              </div>
            ) : historyLoading ? (
              <p className="text-center text-slate-400 text-sm py-8">Loading history from Supabase...</p>
            ) : history.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">No saved predictions yet. Run a prediction to store data!</p>
            ) : (
              <div className="space-y-3">
                {history.map((h, idx) => (
                  <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono text-indigo-400 font-bold text-sm block">{h.formatted_price}</span>
                      <span className="text-slate-500">{new Date(h.created_at || "").toLocaleString()}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      h.confidence === "high" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {h.confidence} confidence
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* ── INTERACTIVE PREDICTOR SECTION ───────────────────────────────── */
          <div className="space-y-8">
            <section aria-label="Preset Configurations" className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center sm:text-left">
                ⚡ Load Sample California Location Profiles:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    id={`btn-preset-${idx}`}
                    key={p.name}
                    onClick={() => applyPreset(p.data)}
                    className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all text-left truncate shadow-sm cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </section>

            <form
              aria-label="California House Price Valuation Form"
              onSubmit={handleSubmit}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Property & Geographic Input Attributes</h2>
                  <p className="text-xs text-slate-400">Enter census metrics to compute real-time property values</p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
                  8 Predictive Features
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((f) => (
                  <div key={f.name} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label htmlFor={f.id} className="text-sm font-semibold text-slate-200">
                        {f.label}
                      </label>
                      <span className="text-xs font-mono font-medium text-indigo-400">
                        {form[f.name as keyof FormData]} {f.unit}
                      </span>
                    </div>

                    <div className="relative rounded-xl shadow-sm">
                      <input
                        id={f.id}
                        type="number"
                        name={f.name}
                        value={form[f.name as keyof FormData]}
                        onChange={handleChange}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        className="w-full bg-slate-950 text-white font-semibold text-base pl-4 pr-16 py-3 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-mono pointer-events-none bg-slate-900 border border-slate-800 px-2 py-1 rounded-md shadow-sm">
                        {f.unit}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-tight">
                      {f.hint}
                    </p>
                  </div>
                ))}
              </div>

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
                id="btn-submit-prediction"
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
                    Evaluating Machine Learning Model...
                  </>
                ) : (
                  <>
                    Calculate House Price Estimate →
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-2xl p-5 text-sm flex items-start gap-3 shadow-lg">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold">Backend Server Connection Issue</p>
                  <p className="text-rose-300 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <article aria-label="Estimated Market Value Result" className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-indigo-500/30 p-8 text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                    Estimated California Market Value
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
                </div>
              </article>
            )}
          </div>
        )}

        {/* ── SEO FAQ & KNOWLEDGE CONTENT SECTION (TARGETS GOOGLE SEARCH QUERIES) ── */}
        <section aria-labelledby="faq-section-title" className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 id="faq-section-title" className="text-2xl font-bold text-white">
              California Real Estate & House Price Valuation FAQ
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Frequently asked questions about California house price estimation and machine learning real estate models.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <article key={idx} className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <h3 className="text-base font-semibold text-indigo-300">
                  {faq.q}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {faq.a}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="text-center text-slate-400 text-xs pt-6 pb-4 border-t border-slate-800/60">
          <p>
            California House Price Predictor · Built by{" "}
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