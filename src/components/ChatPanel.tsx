import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  TrendingUp, 
  RefreshCw, 
  Users,
  CheckCircle,
  Loader2,
  Info,
  Mic,
  MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ReceiptState, Message, Person } from "../types";

interface ChatPanelProps {
  state: ReceiptState;
  setState: React.Dispatch<React.SetStateAction<ReceiptState>>;
  isParsingReceipt: boolean;
  darkMode?: boolean;
}

export default function ChatPanel({ 
  state, 
  setState,
  isParsingReceipt,
  darkMode = true
}: ChatPanelProps) {
  const isUSD = state.primaryCurrency === 'USD';
  const rate = state.currencyRate || 2038;

  const formatPrimary = (val: number) => {
    return `${val.toFixed(2)} ${isUSD ? "$" : "FC"}`;
  };

  const formatSecondary = (val: number) => {
    if (isUSD) {
      return `${Math.round(val * rate).toLocaleString('fr-FR')} FC`;
    } else {
      return `${(val / rate).toFixed(2)} $`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Bonjour ! Je suis votre Assistant de Partage d'Addition. 💸\n\nJe peux vous aider à diviser cette addition en langage naturel. Essayez de taper des phrases comme :\n• *\"Dhruv a pris la carbonara et une bière\"*\n• *\"Sarah et Alex ont partagé la pizza\"*\n• *\"Ajoute un pourboire de 15%\"*\n• *\"Qui doit combien ?\"*\n\nLes calculs de répartition, la taxe et le pourboire se mettront à jour automatiquement en temps réel !",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  const toggleSpeech = () => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        if (speechResult) {
          setInput(prev => prev ? `${prev} ${speechResult}` : speechResult);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Calculations for Split Summary
  const itemTotal = state.items.reduce((sum, item) => sum + item.price, 0);
  const tipAmount = state.tipType === 'percentage' 
    ? (itemTotal * state.tip / 100) 
    : state.tip;
  const grandTotal = itemTotal + state.tax + tipAmount;

  // Compute breakdown for each person
  const breakdowns = state.people.map(person => {
    const assignedItems = state.items.filter(item => item.assignedTo.includes(person.id));
    
    const itemsBreakdown = assignedItems.map(item => {
      const sharePrice = item.price / item.assignedTo.length;
      return {
        name: item.name,
        sharePrice
      };
    });

    const personSubtotal = itemsBreakdown.reduce((sum, item) => sum + item.sharePrice, 0);
    
    // Proportional tax and tip distribution based on overall receipt subtotal
    const taxShare = itemTotal > 0 ? (personSubtotal * (state.tax / itemTotal)) : 0;
    const tipShare = itemTotal > 0 ? (personSubtotal * (tipAmount / itemTotal)) : 0;
    const totalOwed = personSubtotal + taxShare + tipShare;

    return {
      person,
      items: itemsBreakdown,
      subtotal: personSubtotal,
      taxShare,
      tipShare,
      total: totalOwed,
      percentage: grandTotal > 0 ? (totalOwed / grandTotal) * 100 : 0
    };
  });

  // Calculate unassigned total
  const unassignedItems = state.items.filter(item => item.assignedTo.length === 0);
  const unassignedTotal = unassignedItems.reduce((sum, item) => sum + item.price, 0);

  // Quick prompt templates
  const suggestions = [
    { label: "Dhruv a pris la Carbonara et la bière", text: "Dhruv a pris la carbonara et la bière" },
    { label: "Sarah et Sue partagent la pizza", text: "Sarah et Sue partagent la pizza Margherita" },
    { label: "Pourboire de 18%", text: "Change le pourboire à 18%" },
    { label: "Réinitialiser", text: "Efface toutes les attributions" }
  ];

  // Send message to Gemini assistant
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          state: state // Send current receipt state so assistant can modify it
        }),
      });

      if (!response.ok) {
        throw new Error("L'assistant est occupé, veuillez réessayer.");
      }

      const data = await response.json();

      // Update state with modified state from AI
      if (data.updatedState) {
        setState(data.updatedState);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.text || "J'ai mis à jour la répartition en fonction de votre demande.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: "assistant",
        text: `⚠️ Erreur: ${error.message || "Impossible de joindre l'assistant."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div id="chat-panel" className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${
      darkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-800"
    }`}>
      
      {/* Upper Section: Real-time Split Summary */}
      <div id="split-summary-panel" className={`border-b p-6 md:p-8 space-y-4 shrink-0 transition-colors duration-300 ${
        darkMode ? "border-slate-900 bg-slate-900/40" : "border-slate-200 bg-slate-50"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 id="summary-title" className={`text-lg font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              Résumé des Partages en Temps Réel
            </h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 whitespace-nowrap">
              Total : {formatPrimary(grandTotal)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
              ~ {formatSecondary(grandTotal)}
            </span>
          </div>
        </div>

        {/* Unassigned alert banner */}
        {unassignedTotal > 0 && (
          <div id="unassigned-banner" className={`flex items-center justify-between p-3 border rounded-lg text-xs transition-colors ${
            darkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <span className="flex items-center space-x-1.5 font-medium">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{formatPrimary(unassignedTotal)} d'articles ne sont pas encore attribués.</span>
            </span>
            <span className={`font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
              darkMode ? "bg-amber-500/20 text-amber-200" : "bg-amber-100 text-amber-800"
            }`}>
              Incomplet
            </span>
          </div>
        )}

        {/* Scrollable list of people totals */}
        <div id="breakdown-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
          {breakdowns.length === 0 ? (
            <div id="no-splitters-placeholder" className={`col-span-full py-6 flex flex-col items-center justify-center border border-dashed rounded-xl space-y-1 ${
              darkMode ? "border-slate-800 text-slate-500" : "border-slate-300 text-slate-400"
            }`}>
              <Users className="w-6 h-6 stroke-[1.5]" />
              <p className="text-xs font-semibold">Aucun participant pour le moment.</p>
              <p className="text-[10px]">Ajoutez des personnes à gauche ou écrivez dans le chat !</p>
            </div>
          ) : (
            breakdowns.map(({ person, items, subtotal: personSubtotal, taxShare, tipShare, total, percentage }) => (
              <div 
                key={person.id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all shadow-sm ${
                  darkMode 
                    ? "bg-slate-900 border-slate-850 hover:border-slate-700" 
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                }`}
              >
                {/* Person Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {person.avatar ? (
                      <img 
                        src={person.avatar} 
                        alt={person.name} 
                        className="w-6 h-6 rounded-full object-cover border border-indigo-500/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full ${person.color.split(" ")[0]}`} />
                    )}
                    <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>{person.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm font-bold text-emerald-400">{formatPrimary(total)}</span>
                    <span className="text-[9px] text-slate-500 font-mono">~ {formatSecondary(total)}</span>
                  </div>
                </div>

                {/* Shared Items list mini */}
                <div className={`mt-2 text-[11px] line-clamp-2 min-h-[32px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {items.length === 0 ? (
                    <span className="italic text-slate-500 font-sans">Aucun article attribué</span>
                  ) : (
                    items.map((it, idx) => (
                      <span key={idx}>
                        {it.name} ({formatPrimary(it.sharePrice)}){idx < items.length - 1 ? ", " : ""}
                      </span>
                    ))
                  )}
                </div>

                {/* Subtotal, tax, tip tooltips */}
                {items.length > 0 && (
                  <div className={`mt-2.5 flex flex-wrap gap-1 items-center justify-between text-[9px] border-t pt-2 font-mono ${
                    darkMode ? "text-slate-500 border-slate-800/60" : "text-slate-400 border-slate-100"
                  }`}>
                    <span>Sous-tot: {formatPrimary(personSubtotal)}</span>
                    <span>Taxe: {formatPrimary(taxShare)}</span>
                    <span>Pourb: {formatPrimary(tipShare)}</span>
                  </div>
                )}

                {/* Progress bar of their share */}
                <div className={`mt-3 w-full rounded-full h-1.5 overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lower Section: Smart Chat Thread */}
      <div id="chat-thread-container" className={`flex-1 flex flex-col justify-between overflow-hidden ${
        darkMode ? "bg-slate-950/20" : "bg-slate-50/50"
      }`}>
        
        {/* Messages List */}
        <div id="chat-messages" className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"} items-start space-x-2.5`}
                >
                  {isAssistant && (
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col space-y-1 max-w-[85%] ${isAssistant ? "items-start" : "items-end"}`}>
                    <div 
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                        isAssistant 
                          ? darkMode
                            ? "bg-slate-900 text-slate-100 border-slate-800 rounded-tl-none"
                            : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                          : "bg-indigo-600 text-white border-indigo-600 rounded-tr-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                  </div>

                  {!isAssistant && (
                    <div className={`p-1.5 rounded-lg shrink-0 ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <div id="typing-indicator" className="flex justify-start items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg animate-pulse shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className={`px-4 py-2.5 rounded-2xl rounded-tl-none text-xs flex items-center space-x-2 shadow-sm border ${
                darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600"
              }`}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>L'assistant met à jour les calculs...</span>
              </div>
            </div>
          )}

          {isParsingReceipt && (
            <div id="parsing-indicator-chat" className="flex justify-start items-center space-x-2.5">
              <div className="p-1.5 bg-amber-500 text-white rounded-lg animate-pulse shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className={`px-4 py-2.5 rounded-2xl rounded-tl-none text-xs border ${
                darkMode ? "bg-amber-950/30 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                Analyse de la photo du ticket avec Gemini...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion tags for quick testing */}
        <div id="suggestions-row" className={`px-6 py-2 border-t overflow-x-auto flex items-center space-x-2 shrink-0 ${
          darkMode ? "border-slate-900 bg-slate-950/40" : "border-slate-200 bg-slate-100"
        }`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0 mr-1">Suggestions :</span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(s.text)}
              disabled={isLoading || isParsingReceipt}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer disabled:opacity-40 border ${
                darkMode 
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 text-slate-300" 
                  : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={onSubmit} className={`p-4 flex items-center gap-2 shrink-0 border-t ${
          darkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"
        }`}>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading || isParsingReceipt}
            placeholder={isParsingReceipt ? "En attente de l'analyse du ticket de caisse..." : "Demandez d'attribuer des coûts, ajuster le pourboire..."}
            className={`flex-1 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm transition-colors border ${
              darkMode 
                ? "bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:bg-slate-900" 
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white"
            }`}
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleSpeech}
              disabled={isLoading || isParsingReceipt}
              className={`p-3 rounded-xl transition-all cursor-pointer relative shrink-0 ${
                isListening
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : darkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
              }`}
              title={isListening ? "Arrêter l'écoute" : "Dicter votre commande vocale (ex: 'Ajoute 5% de taxe')"}
              id="btn-voice-recognition"
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4 animate-pulse [animation-duration:3s]" />
              )}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>
          )}
          <button
            id="btn-send-message"
            type="submit"
            disabled={!input.trim() || isLoading || isParsingReceipt}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
