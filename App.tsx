
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InsulinType, AppSettings, CalculationResult, FoodItem, HistoryItem } from './types';
import { CORRECTION_TABLE } from './constants';
import { parseMealToCarbs } from './services/geminiService';
import { Button } from './components/Button';

const MOTIVATIONAL_MESSAGES = [
  "You're doing a great job managing your health! 🌟",
  "Consistency is key, and you're nailing it! 🚀",
  "Knowledge is power. Way to stay on top of your numbers! 📊",
  "Every healthy choice counts. Keep going! 💪",
  "You've got this! One meal at a time. ✨",
  "Self-care isn't selfish, it's essential. Proud of you! ❤️",
  "Smart tracking leads to better outcomes! 🧠"
];

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const duration = 1000; // 1 second
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function for smoother feel
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = easedProgress * value;
      
      // Handle the 0.5 steps
      setDisplayValue(Math.round(current * 2) / 2);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue.toFixed(displayValue % 1 === 0 ? 0 : 1)}</span>;
};

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('gluco_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // State
  const [activeTab, setActiveTab] = useState<'calc' | 'settings' | 'history'>('calc');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('gluco_settings');
    return saved ? JSON.parse(saved) : { 
      tdd: 40, 
      insulinType: InsulinType.RAPID,
      ccrConstant: 500,
      isfConstant: 1800
    };
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('gluco_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [mealText, setMealText] = useState('');
  const [glucose, setGlucose] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Random Motivational Message
  const motivationalMessage = useMemo(() => 
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)], 
  [result]);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('class', 'dark');
      localStorage.setItem('gluco_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gluco_theme', 'light');
    }
  }, [isDarkMode]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('gluco_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('gluco_history', JSON.stringify(history));
  }, [history]);

  const updateInsulinType = (type: InsulinType) => {
    const newIsf = type === InsulinType.RAPID ? 1800 : 1500;
    setSettings({ ...settings, insulinType: type, isfConstant: newIsf });
  };

  // Derived Calculations
  const calculateResult = async () => {
    if (!mealText.trim()) {
      setError("Please describe what you ate.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const foods = await parseMealToCarbs(mealText);
      const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
      
      const ccr = settings.ccrConstant / settings.tdd;
      const cf = settings.isfConstant / settings.tdd;
      
      const carbInsulin = totalCarbs / ccr;
      
      let correctionInsulin = 0;
      if (glucose) {
        const bg = parseInt(glucose, 10);
        const rule = CORRECTION_TABLE.find(r => bg >= r.min && bg <= r.max);
        if (rule) correctionInsulin = rule.dose;
      }

      const rawTotal = carbInsulin + correctionInsulin;
      const finalDose = Math.max(0, Math.round(rawTotal * 2) / 2);

      const newResult: CalculationResult = {
        foods,
        totalCarbs,
        ccr,
        cf,
        carbInsulin,
        correctionInsulin,
        finalDose
      };

      setResult(newResult);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        mealText,
        glucose: glucose || undefined,
        result: newResult
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
    } catch (err) {
      setError("Failed to calculate. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const shareResult = async () => {
    if (!result) return;

    const summary = `
📊 SugarPilot Summary (${new Date().toLocaleDateString()})
----------------------------
🍽️ Meal: ${mealText}
🩸 BG: ${glucose || 'N/A'} mg/dL
🍞 Total Carbs: ${result.totalCarbs}g

💉 Recommended Dose: ${result.finalDose} Units
(Carb: ${result.carbInsulin.toFixed(1)}U, Correction: ${result.correctionInsulin}U)

⚙️ Settings: TDD ${settings.tdd}, CCR 1:${result.ccr.toFixed(1)}, CF 1:${result.cf.toFixed(1)}
----------------------------
Shared via SugarPilot
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SugarPilot Insulin Dose',
          text: summary,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(summary);
        setShareFeedback("Copied to clipboard!");
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err) {
        console.error("Clipboard error:", err);
      }
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
    }
  };

  const reset = () => {
    setMealText('');
    setGlucose('');
    setResult(null);
    setError(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 md:pb-8 max-w-lg mx-auto shadow-xl flex flex-col transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Celebration Animation Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute animate-float-particle opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                color: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]
              }}
            >
              <i className={`fas ${['fa-star', 'fa-heart', 'fa-circle', 'fa-droplet'][Math.floor(Math.random() * 4)]} text-lg`}></i>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-indigo-600 dark:bg-indigo-800 text-white p-6 rounded-b-[2.5rem] shadow-lg sticky top-0 z-10 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <i className="fas fa-droplet text-indigo-300 dark:text-indigo-400 animate-pulse"></i>
            SugarPilot
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'settings' ? 'calc' : 'settings')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'settings' ? 'bg-white text-indigo-600 dark:text-indigo-800' : 'bg-white/20 hover:bg-white/30'}`}
            >
              <i className={`fas ${activeTab === 'settings' ? 'fa-times' : 'fa-cog'}`}></i>
            </button>
          </div>
        </div>
        
        {activeTab === 'calc' && (
          <div className="flex gap-4 animate-fadeIn">
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <p className="text-xs uppercase opacity-70 mb-1">TDD</p>
              <p className="text-lg font-semibold">{settings.tdd} U</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <p className="text-xs uppercase opacity-70 mb-1">Ratio (1:g)</p>
              <p className="text-lg font-semibold truncate">{(settings.ccrConstant / settings.tdd).toFixed(1)}</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold opacity-90">Meal History</h2>
            <p className="text-xs opacity-70">Review your journey</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'settings' && (
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Setup & Constants</h2>
            
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-5 transition-colors">
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Total Daily Dose (TDD)
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    value={settings.tdd}
                    onChange={(e) => setSettings({ ...settings, tdd: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-2xl px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">units</span>
                </div>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-700 pt-5">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">
                  Calculation Constants
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase mb-1">CCR Rule (500)</p>
                    <input 
                      type="number"
                      value={settings.ccrConstant}
                      onChange={(e) => setSettings({ ...settings, ccrConstant: Number(e.target.value) || 1 })}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase mb-1">ISF Rule (1800)</p>
                    <input 
                      type="number"
                      value={settings.isfConstant}
                      onChange={(e) => setSettings({ ...settings, isfConstant: Number(e.target.value) || 1 })}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">Standard: 500 for Carbs, 1800/1500 for Correction.</p>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-700 pt-5">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Insulin Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => updateInsulinType(InsulinType.RAPID)}
                    className={`p-3 rounded-2xl border-2 transition-all ${settings.insulinType === InsulinType.RAPID ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    Rapid (1800)
                  </button>
                  <button 
                    onClick={() => updateInsulinType(InsulinType.REGULAR)}
                    className={`p-3 rounded-2xl border-2 transition-all ${settings.insulinType === InsulinType.REGULAR ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    Regular (1500)
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 transition-colors">
              <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Your Current Profile:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">1 Unit covers</p>
                  <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{(settings.ccrConstant / settings.tdd).toFixed(1)}g Carbs</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">1 Unit drops BG</p>
                  <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{(settings.isfConstant / settings.tdd).toFixed(1)} mg/dL</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button fullWidth onClick={() => setActiveTab('calc')}>
                Apply & Save
              </Button>
              <Button fullWidth variant="danger" onClick={clearHistory}>
                <i className="fas fa-trash-can"></i> Clear History
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 pt-2">
            {history.length === 0 ? (
              <div className="text-center py-20 opacity-40 dark:text-slate-100">
                <i className="fas fa-heart text-5xl mb-4 text-indigo-400 animate-pulse"></i>
                <p>Every step is progress. Keep tracking!</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-all hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-tighter">
                      {formatDate(item.timestamp)}
                    </span>
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-500 transition-colors p-1"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm line-clamp-2 mb-3">
                    {item.mealText}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Carbs</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.result.totalCarbs}g</span>
                      </div>
                      {item.glucose && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">BG</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.glucose}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl py-1 px-4 flex items-center gap-1 shadow-md shadow-indigo-100 dark:shadow-none">
                      <span className="text-lg font-black">{item.result.finalDose}</span>
                      <span className="text-[10px] font-bold opacity-80 uppercase">Units</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="space-y-6 pt-2">
            {!result ? (
              <>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <i className="fas fa-cookie-bite text-6xl"></i>
                    </div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <i className="fas fa-utensils text-indigo-500 dark:text-indigo-400"></i>
                      Meal Log
                    </label>
                    <textarea 
                      placeholder="e.g., 2 small chapatis, 1 cup dal, and 1 medium apple"
                      value={mealText}
                      onChange={(e) => setMealText(e.target.value)}
                      className="w-full h-32 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl p-4 resize-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white transition-colors relative z-10"
                    ></textarea>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <i className="fas fa-gauge-high text-indigo-500 dark:text-indigo-400"></i>
                      Pre-meal Glucose
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Optional"
                        value={glucose}
                        onChange={(e) => setGlucose(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">mg/dL</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 text-center font-medium italic">
                    {MOTIVATIONAL_MESSAGES[Math.floor(Date.now() / 3600000) % MOTIVATIONAL_MESSAGES.length]}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                    <i className="fas fa-exclamation-circle"></i>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button 
                  fullWidth 
                  onClick={calculateResult} 
                  loading={loading}
                  className="mt-2 py-4 text-lg animate-bounce-subtle"
                >
                  Calculate Dose
                </Button>
              </>
            ) : (
              <div className="space-y-6 pb-12 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ready to go!</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={shareResult} 
                      className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <i className="fas fa-share-nodes"></i>
                    </button>
                    <button onClick={reset} className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">New Meal</button>
                  </div>
                </div>

                {/* Motivational Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl text-white text-sm font-medium shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg animate-bounce">
                      ✨
                    </div>
                    <p>{motivationalMessage}</p>
                  </div>
                </div>

                {/* Final Dose Card */}
                <div className="bg-indigo-600 dark:bg-indigo-800 rounded-[2rem] p-8 text-white text-center shadow-xl shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]">
                  <p className="text-indigo-100 dark:text-indigo-200 uppercase tracking-widest text-sm mb-2">Recommended Dose</p>
                  <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
                    <div className="animate-pop-in">
                      <AnimatedNumber value={result.finalDose} />
                    </div>
                    <span className="text-2xl opacity-60">Units</span>
                  </div>
                  <p className="text-indigo-200 dark:text-indigo-300 text-sm bg-black/10 rounded-full py-1 px-4 inline-block">
                    Rounded for precision
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <i className="fas fa-list-check text-indigo-500 dark:text-indigo-400"></i>
                      Meal Analysis
                    </h3>
                    <div className="space-y-3">
                      {result.foods.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-700/50 pb-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.food}</span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs">{item.quantity}</span>
                          </div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">+{item.carbs}g</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-400 uppercase text-xs">Total Carbs</span>
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{result.totalCarbs}g</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4 transition-colors">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Carb Part</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{result.carbInsulin.toFixed(1)} U</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Correction</p>
                      <p className={`text-xl font-bold ${result.correctionInsulin > 0 ? 'text-orange-500 dark:text-orange-400' : result.correctionInsulin < 0 ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {result.correctionInsulin > 0 ? '+' : ''}{result.correctionInsulin} U
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button fullWidth onClick={shareResult} variant="secondary">
                    <i className="fas fa-share-nodes"></i> Share Update
                  </Button>
                  <Button fullWidth variant="ghost" onClick={reset}>
                    Back to Calculator
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-around items-center max-w-lg mx-auto z-10 transition-colors">
        <button 
          onClick={() => { setActiveTab('calc'); setResult(null); }}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calc' ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-600'}`}
        >
          <i className="fas fa-calculator text-lg"></i>
          <span className="text-[10px] font-bold uppercase">Calc</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-600'}`}
        >
          <div className="relative">
            <i className="fas fa-history text-lg"></i>
            {history.length > 0 && activeTab !== 'history' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full border border-white dark:border-slate-900"></span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase">History</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-600'}`}
        >
          <i className="fas fa-sliders text-lg"></i>
          <span className="text-[10px] font-bold uppercase">Setup</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(calc(Math.random() * 100px - 50px), -200px) scale(0); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }
        .animate-float-particle {
          animation: float-particle 3s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default App;
