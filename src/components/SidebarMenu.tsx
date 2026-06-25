import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Home, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Receipt, 
  Coffee, 
  Wine, 
  Users, 
  Coins 
} from "lucide-react";
import { ReceiptState } from "../types";
import { PRESETS, Preset } from "../data/presets";

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: ReceiptState;
  onSelectPreset: (presetState: ReceiptState) => void;
  onResetToEmpty: () => void;
  onTriggerSplash: () => void;
  darkMode?: boolean;
}

export default function SidebarMenu({
  isOpen,
  onClose,
  currentState,
  onSelectPreset,
  onResetToEmpty,
  onTriggerSplash,
  darkMode = true,
}: SidebarMenuProps) {

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "pizza":
        return <span className="text-xl">🍕</span>;
      case "coffee":
        return <Coffee className="w-5 h-5 text-amber-500" />;
      case "wine":
        return <Wine className="w-5 h-5 text-rose-500" />;
      default:
        return <Receipt className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlap */}
          <motion.div
            id="menu-backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar drawer container */}
          <motion.div
            id="menu-sidebar"
            className={`fixed top-0 left-0 bottom-0 w-80 z-50 flex flex-col shadow-2xl border-r transition-all duration-300 ${
              darkMode 
                ? "bg-slate-900 border-slate-800 text-slate-100" 
                : "bg-white border-slate-200 text-slate-800"
            }`}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
          >
            {/* Header section with brand and close btn */}
            <div className={`p-5 border-b flex items-center justify-between ${
              darkMode ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight">Menu Principal</h2>
                  <p className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Explorez & Parcourez l'App</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  darkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-950"
                }`}
                title="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable menu contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Navigation Action section */}
              <div className="space-y-2">
                <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Navigation générale
                </span>
                <button
                  onClick={() => {
                    onTriggerSplash();
                    onClose();
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                    darkMode 
                      ? "bg-slate-950/40 hover:bg-slate-950 border-slate-800 hover:border-slate-700" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Home className="w-4 h-4 text-indigo-500" />
                  <div className="flex-1">
                    <p className={darkMode ? "text-slate-100" : "text-slate-900"}>Recommencer l'intro</p>
                    <p className={`text-[9px] font-normal ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Revoir l'animation de démarrage par IA</p>
                  </div>
                </button>
              </div>

              {/* Presets - Parcourir l'App section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    Exemples à parcourir
                  </span>
                  <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/15">
                    Mode d'emploi rapide
                  </span>
                </div>
                <p className={`text-[10px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Sélectionnez un ticket pré-rempli pour découvrir instantanément comment l'algorithme calcule les taxes, pourboires et partages de coûts :
                </p>

                <div className="space-y-2.5">
                  {PRESETS.map((preset) => {
                    // Check if current is matching this preset's items length (basic indicator)
                    const isCurrent = currentState.items.length === preset.state.items.length && 
                                      currentState.people.length === preset.state.people.length;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onSelectPreset(preset.state);
                          onClose();
                        }}
                        className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? darkMode
                              ? "bg-indigo-950/30 border-indigo-500 text-slate-100 shadow-md shadow-indigo-950/20"
                              : "bg-indigo-50 border-indigo-500 text-slate-900 shadow-sm"
                            : darkMode
                              ? "bg-slate-950/20 border-slate-800/80 hover:bg-slate-950/50 hover:border-slate-700 text-slate-300"
                              : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {getPresetIcon(preset.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">{preset.name}</span>
                            {isCurrent && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-1 py-0.2 rounded">
                                Actif
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] mt-1 leading-normal ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {preset.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-2 text-[9px] font-mono">
                            <span className="flex items-center text-slate-400">
                              <Users className="w-3 h-3 mr-0.5" />
                              {preset.state.people.length} convives
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center text-slate-400">
                              <Coins className="w-3 h-3 mr-0.5" />
                              {preset.state.items.length} articles
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset Operations */}
              <div className="space-y-2">
                <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Actions de réinitialisation
                </span>
                
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      onResetToEmpty();
                      onClose();
                    }}
                    className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      darkMode
                        ? "bg-rose-950/10 hover:bg-rose-950/30 border-rose-500/20 text-rose-300 hover:border-rose-500/30"
                        : "bg-rose-50 hover:bg-rose-100 border-rose-100 text-rose-700 hover:border-rose-200"
                    }`}
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Tout vider (Table rase)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer with elegant credits */}
            <div className={`p-4 border-t text-center space-y-1.5 ${
              darkMode ? "border-slate-800 bg-slate-950/30" : "border-slate-100 bg-slate-50/50"
            }`}>
              <div className="flex items-center justify-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className={`text-[10px] font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Partag'Add v1.4</span>
              </div>
              <p className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Conçu pour un partage d'addition serein.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
