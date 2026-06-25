import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Receipt, Coins, Bot, ArrowRight, Zap } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  key?: string;
}

const STEPS = [
  "Initialisation du moteur de calcul...",
  "Activation de la détection de ticket par IA...",
  "Préparation de l'espace de partage...",
  "Connexion à l'assistant intelligent..."
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Smoothly increment progress over 6000ms (6 seconds)
  useEffect(() => {
    const totalDuration = 5600; // Leave 400ms for exit animations and transition
    const intervalTime = 50;
    const stepsCount = totalDuration / intervalTime;
    const increment = 100 / stepsCount;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(progressInterval);
  }, []);

  // Update text steps periodically
  useEffect(() => {
    const stepDuration = 1400; // 5600 / 4 steps
    const stepInterval = setInterval(() => {
      setCurrentStepIdx(prev => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(stepInterval);
  }, []);

  // Auto-complete after 6 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete();
    }, 6000);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <motion.div
      id="splash-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Immersive background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-delay:2s]" />

      <div className="relative flex flex-col items-center max-w-md px-6 text-center z-10">
        
        {/* Cool floating icons stack */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer rotating/pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <div className="relative flex items-center justify-center">
            {/* Animated coins orbiting the logo */}
            <motion.div
              className="absolute -top-6 -left-6 p-2 bg-indigo-900/80 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-lg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Coins className="w-5 h-5" />
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -right-6 p-2 bg-purple-900/80 border border-purple-500/30 rounded-xl text-purple-400 shadow-lg"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            >
              <Bot className="w-5 h-5" />
            </motion.div>

            <motion.div
              className="absolute -right-8 -top-4 p-1.5 bg-amber-900/80 border border-amber-500/30 rounded-lg text-amber-400 shadow-lg"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>

            {/* Central App icon container */}
            <motion.div
              className="w-20 h-20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl border border-indigo-400/30"
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(99, 102, 241, 0.2)",
                  "0 0 35px rgba(99, 102, 241, 0.4)",
                  "0 0 20px rgba(99, 102, 241, 0.2)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Receipt className="w-10 h-10 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Brand/App Name */}
        <motion.h1
          className="text-4xl font-extrabold font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-300 drop-shadow"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Partag'Add
        </motion.h1>

        <motion.p
          className="text-slate-400 text-sm mt-2 font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Le partage d'addition intelligent par IA
        </motion.p>

        {/* Loading Steps & Progress container */}
        <div className="w-64 mt-12 space-y-4">
          
          {/* Custom styled progress bar */}
          <div className="relative w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 p-[1px]">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
              layoutId="splash-progress"
            />
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span>CHARGEMENT</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Current step with smooth fade animation */}
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStepIdx}
                className="text-xs text-indigo-300 font-sans tracking-wide"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {STEPS[currentStepIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Skip button in bottom-right corner */}
        <button
          onClick={onComplete}
          className="absolute bottom-8 right-6 flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-400 font-medium transition-colors bg-slate-900/50 hover:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
        >
          <span>Passer l'intro</span>
          <ArrowRight className="w-3 h-3" />
        </button>

      </div>
    </motion.div>
  );
}
