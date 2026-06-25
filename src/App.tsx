import { useState } from "react";
import { Sparkles, HelpCircle, Receipt, Sun, Moon, Printer, Menu } from "lucide-react";
import { ReceiptState } from "./types";
import ReceiptPanel from "./components/ReceiptPanel";
import ChatPanel from "./components/ChatPanel";
import SplashScreen from "./components/SplashScreen";
import PrintReceipt from "./components/PrintReceipt";
import SidebarMenu from "./components/SidebarMenu";
import { AnimatePresence } from "motion/react";

// Sample pre-populated receipt data for instant interactivity
const INITIAL_PEOPLE = [
  { id: "1", name: "Dhruv", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "2", name: "Sarah", color: "bg-violet-100 text-violet-800 border-violet-300" },
  { id: "3", name: "Sue", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "4", name: "Alex", color: "bg-rose-100 text-rose-800 border-rose-300" },
];

const INITIAL_ITEMS = [
  { id: "i1", name: "Pizza Margherita (Grande)", price: 16.50, assignedTo: ["2", "3"] }, // Shared by Sarah & Sue
  { id: "i2", name: "Spaghetti Carbonara", price: 18.00, assignedTo: ["1"] }, // Dhruv
  { id: "i3", name: "Frites à la truffe (Entrée)", price: 9.50, assignedTo: [] }, // Unassigned
  { id: "i4", name: "Bière IPA Artisanale", price: 7.50, assignedTo: ["1"] }, // Dhruv
  { id: "i5", name: "Verre de Vin Rouge", price: 9.00, assignedTo: ["2"] }, // Sarah
  { id: "i6", name: "Moelleux au Chocolat", price: 8.50, assignedTo: [] }, // Unassigned
];

const INITIAL_STATE: ReceiptState = {
  items: INITIAL_ITEMS,
  people: INITIAL_PEOPLE,
  tax: 5.40,
  tip: 15,
  tipType: "percentage",
  currencyRate: 2038,
  primaryCurrency: "USD",
};

export default function App() {
  const [state, setState] = useState<ReceiptState>(INITIAL_STATE);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleResetToEmpty = () => {
    setState({
      items: [],
      people: [],
      tax: 0,
      tip: 0,
      tipType: "percentage",
      currencyRate: 2038,
      primaryCurrency: "USD",
    });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <div className={`flex flex-col h-screen w-screen overflow-hidden transition-colors duration-300 print:hidden ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}>
        
        {/* Top Navbar */}
        <header id="app-header" className={`border-b h-14 px-6 flex items-center justify-between shrink-0 z-10 shadow-sm transition-colors duration-300 ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                darkMode 
                  ? "text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700" 
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
              }`}
              title="Ouvrir le menu principal"
              id="btn-hamburger"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className={`p-1.5 rounded-lg border transition-colors ${
              darkMode ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 id="brand-title" className="text-sm font-bold tracking-tight flex items-center space-x-1.5">
                <span className={darkMode ? "text-white" : "text-slate-900"}>Partag'Add</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-colors ${
                  darkMode ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                }`}>
                  Propulsé par IA
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`text-xs hidden lg:inline flex items-center space-x-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Calculateur Intelligent & Multi-Devises (USD / FC)</span>
            </span>

            {/* Print / Export PDF button */}
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition-all cursor-pointer"
              title="Exporter l'addition en PDF / Imprimer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter PDF</span>
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
                darkMode 
                  ? "text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700" 
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
              }`}
              title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs flex items-center space-x-1 ${
                darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">Aide</span>
            </a>
          </div>
        </header>

        {/* Main split-screen layout */}
        <main id="app-main" className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Receipt Image parser and Item listing */}
          <section className="flex-1 h-full min-w-0">
            <ReceiptPanel 
              state={state} 
              setState={setState} 
              onParseStart={() => setIsParsingReceipt(true)}
              onParseEnd={() => setIsParsingReceipt(false)}
              darkMode={darkMode}
            />
          </section>

          {/* Right Side: Visual Breakdowns & AI chat */}
          <section className={`flex-1 h-full min-w-0 border-t md:border-t-0 md:border-l transition-colors duration-300 ${
            darkMode ? "border-slate-800" : "border-slate-200"
          }`}>
            <ChatPanel 
              state={state} 
              setState={setState}
              isParsingReceipt={isParsingReceipt}
              darkMode={darkMode}
            />
          </section>

        </main>
      </div>

      {/* Hidden print layout component which only displays during browser print/PDF export */}
      <PrintReceipt state={state} />

      {/* Sidebar Navigation Menu */}
      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentState={state}
        onSelectPreset={setState}
        onResetToEmpty={handleResetToEmpty}
        onTriggerSplash={() => setShowSplash(true)}
        darkMode={darkMode}
      />
    </>
  );
}
