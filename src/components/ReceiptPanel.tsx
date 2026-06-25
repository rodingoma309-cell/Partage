import React, { useState, useRef } from "react";
import { 
  Upload, 
  Plus, 
  Trash2, 
  Percent, 
  DollarSign, 
  FileText, 
  UserPlus, 
  Sparkles,
  Loader2,
  AlertCircle,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ReceiptState, ReceiptItem, Person } from "../types";
import CameraModal from "./CameraModal";

interface ReceiptPanelProps {
  state: ReceiptState;
  setState: React.Dispatch<React.SetStateAction<ReceiptState>>;
  onParseStart: () => void;
  onParseEnd: () => void;
  darkMode?: boolean;
}

export default function ReceiptPanel({ 
  state, 
  setState,
  onParseStart,
  onParseEnd,
  darkMode = true
}: ReceiptPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms local state
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const [selectedPersonForCamera, setSelectedPersonForCamera] = useState<Person | null>(null);

  const handleSavePhoto = (personId: string, photoBase64: string) => {
    setState(prev => ({
      ...prev,
      people: prev.people.map(p => p.id === personId ? { ...p, avatar: photoBase64 } : p)
    }));
  };

  const colors = [
    "bg-emerald-100 text-emerald-800 border-emerald-300",
    "bg-violet-100 text-violet-800 border-violet-300",
    "bg-amber-100 text-amber-800 border-amber-300",
    "bg-rose-100 text-rose-800 border-rose-300",
    "bg-blue-100 text-blue-800 border-blue-300",
    "bg-cyan-100 text-cyan-800 border-cyan-300",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300"
  ];

  // Convert uploaded image to Base64 and send to parser API
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setParseError("Veuillez charger un fichier image (PNG, JPG, WEBP).");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    onParseStart();

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        
        const response = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64String,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Échec de l'analyse du ticket de caisse");
        }

        const data = await response.json();
        
        // Generate UUIDs for parsed items
        const parsedItems: ReceiptItem[] = data.items.map((item: any, idx: number) => ({
          id: `p-${Date.now()}-${idx}`,
          name: item.name,
          price: parseFloat(item.price) || 0,
          assignedTo: [], // parsed items start unassigned
        }));

        setState(prev => ({
          ...prev,
          items: parsedItems,
          tax: parseFloat(data.tax) || 0,
          tip: parseFloat(data.tip) || 0,
          tipType: 'fixed', // default parsed tip to fixed dollars/euros
        }));

      } catch (error: any) {
        console.error(error);
        setParseError(error.message || "Une erreur est survenue lors de l'analyse du ticket.");
      } finally {
        setIsParsing(false);
        onParseEnd();
      }
    };

    reader.onerror = () => {
      setParseError("Impossible de lire l'image.");
      setIsParsing(false);
      onParseEnd();
    };

    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Add custom manual item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newItemPrice);
    if (!newItemName || isNaN(price)) return;

    const newItem: ReceiptItem = {
      id: `m-${Date.now()}`,
      name: newItemName,
      price,
      assignedTo: [],
    };

    setState(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setNewItemName("");
    setNewItemPrice("");
  };

  // Add person
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const randomColor = colors[state.people.length % colors.length];
    const newPerson: Person = {
      id: `u-${Date.now()}`,
      name: newPersonName.trim(),
      color: randomColor,
    };

    setState(prev => ({
      ...prev,
      people: [...prev.people, newPerson]
    }));

    setNewPersonName("");
  };

  // Remove person and clear their assignments
  const handleRemovePerson = (personId: string) => {
    setState(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== personId),
      items: prev.items.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(id => id !== personId)
      }))
    }));
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Toggle item assignment for a person
  const toggleAssignment = (itemId: string, personId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        const assigned = item.assignedTo.includes(personId);
        return {
          ...item,
          assignedTo: assigned 
            ? item.assignedTo.filter(id => id !== personId)
            : [...item.assignedTo, personId]
        };
      })
    }));
  };

  // Quick helper to auto-assign unassigned items to everyone
  const splitUnassignedEqually = () => {
    const allPersonIds = state.people.map(p => p.id);
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        assignedTo: item.assignedTo.length === 0 ? allPersonIds : item.assignedTo
      }))
    }));
  };

  const subtotal = state.items.reduce((sum, item) => sum + item.price, 0);

  const isUSD = state.primaryCurrency === 'USD';
  const rate = state.currencyRate || 2038;

  // Converts a primary currency amount to secondary display
  const formatSecondary = (val: number) => {
    if (isUSD) {
      return `${Math.round(val * rate).toLocaleString('fr-FR')} FC`;
    } else {
      return `${(val / rate).toFixed(2)} $`;
    }
  };

  const formatPrimarySymbol = () => {
    return isUSD ? "$" : "FC";
  };

  // Maps light color badges to neon glow variants in dark mode
  const getPersonStyle = (colorClass: string, isDark: boolean) => {
    if (!isDark) return colorClass;
    const parts = colorClass.split(" ");
    const mainBg = parts[0]; // e.g. bg-emerald-100
    if (!mainBg) return colorClass;
    const colorName = mainBg.split("-")[1]; // emerald, violet, etc.
    
    const colorMap: Record<string, string> = {
      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      violet: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      fuchsia: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    };
    return colorMap[colorName] || "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  const grandTotalVal = subtotal + state.tax + (state.tipType === 'percentage' ? (subtotal * state.tip / 100) : state.tip);

  return (
    <div id="receipt-panel" className={`flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-6 transition-colors duration-300 ${
      darkMode ? "bg-slate-950 text-slate-100 border-r border-slate-900" : "bg-slate-50 text-slate-800 border-r border-slate-200"
    }`}>
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="receipt-title" className={`text-2xl font-bold font-sans tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
            Ticket de Caisse & Articles
          </h2>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Importez une image ou gérez manuellement vos articles
          </p>
        </div>
        
        {state.items.length > 0 && (
          <button 
            id="btn-split-all"
            onClick={splitUnassignedEqually}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
              darkMode 
                ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Diviser les non-attribués</span>
          </button>
        )}
      </div>

      {/* Multi-Currency Config widget */}
      <div className={`rounded-xl p-4 border shadow-sm space-y-4 transition-all duration-300 ${
        darkMode 
          ? "bg-slate-900 border-slate-800 text-slate-100" 
          : "bg-white border-slate-200 text-slate-900"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Devise Principale du Ticket
            </label>
            <div className={`flex rounded-lg p-1 mt-1 border max-w-[240px] ${
              darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, primaryCurrency: 'USD' }))}
                className={`flex-1 py-1 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  state.primaryCurrency === 'USD' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : `${darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-950"}`
                }`}
              >
                Dollars ($)
              </button>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, primaryCurrency: 'CDF' }))}
                className={`flex-1 py-1 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  state.primaryCurrency === 'CDF' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : `${darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-950"}`
                }`}
              >
                Franc Congolais (FC)
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[200px]">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Taux de change (1 USD)
            </label>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                1 $ =
              </span>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={state.currencyRate || ""}
                  onChange={(e) => {
                    const rateVal = parseFloat(e.target.value) || 0;
                    setState(prev => ({ ...prev, currencyRate: rateVal }));
                  }}
                  className={`w-full pl-3 pr-8 py-1.5 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:border-indigo-500 ${
                    darkMode 
                      ? "bg-slate-950 border-slate-850 text-slate-100" 
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  placeholder="2038"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">
                  FC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        id="dropzone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileInput}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging 
            ? "border-indigo-500 bg-indigo-500/5" 
            : isParsing
            ? "border-amber-400 bg-amber-500/5 pointer-events-none"
            : darkMode 
            ? "border-slate-800 hover:border-indigo-500 bg-slate-900/50" 
            : "border-slate-300 hover:border-indigo-400 bg-white"
        }`}
      >
        <input 
          id="receipt-file-input"
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <AnimatePresence mode="wait">
          {isParsing ? (
            <motion.div 
              key="parsing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="p-3 bg-amber-100/10 text-amber-400 rounded-full animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <div>
                <p className={`font-semibold ${darkMode ? "text-amber-300" : "text-amber-900"}`}>Gemini analyse votre ticket...</p>
                <p className={`text-xs max-w-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Extraction automatique des articles, prix, taxes et pourboire.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className={`p-3 rounded-full ${darkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-900"}`}>
                  <span className="text-indigo-400">Cliquez pour importer</span> ou glissez une photo du ticket
                </p>
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>PNG, JPG, JPEG, WEBP | Conversion automatique de devises</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {parseError && (
        <div id="parse-error-banner" className={`flex items-start space-x-2 p-3.5 border rounded-lg text-xs ${
          darkMode ? "bg-rose-950/40 border-rose-900/50 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <p className="font-semibold">Erreur d'analyse du ticket</p>
            <p className="mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {/* People management bar */}
      <div id="people-management" className={`rounded-xl p-4 border shadow-sm space-y-3 transition-colors duration-300 ${
        darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <h3 id="people-list-title" className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Participants Actifs ({state.people.length})
        </h3>
        
        {/* People badges list */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {state.people.map(person => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex items-center space-x-2 pl-1.5 pr-1.5 py-1 text-sm font-medium rounded-full border transition-all ${
                  getPersonStyle(person.color, darkMode)
                }`}
              >
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-5 h-5 rounded-full object-cover border border-indigo-500/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    darkMode ? "bg-slate-950 text-slate-400" : "bg-slate-200 text-slate-600"
                  }`}>
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[80px]">{person.name}</span>
                
                {/* Camera snapshot button */}
                <button
                  type="button"
                  onClick={() => setSelectedPersonForCamera(person)}
                  className={`p-0.5 rounded-full transition-colors shrink-0 cursor-pointer ${
                    darkMode ? "hover:bg-slate-800 text-slate-400 hover:text-indigo-400" : "hover:bg-slate-200/50 text-slate-500 hover:text-indigo-600"
                  }`}
                  title="Prendre une photo de webcam"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => handleRemovePerson(person.id)}
                  className={`p-0.5 rounded-full transition-colors shrink-0 cursor-pointer ${
                    darkMode ? "hover:bg-slate-800 text-slate-400 hover:text-rose-400" : "hover:bg-slate-200/50 text-slate-500 hover:text-rose-600"
                  }`}
                  title={`Retirer ${person.name}`}
                >
                  <Plus className="w-3.5 h-3.5 rotate-45" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add person form */}
        <form onSubmit={handleAddPerson} className="flex gap-2">
          <div className="relative flex-1">
            <UserPlus className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="new-person-input"
              type="text"
              value={newPersonName}
              onChange={e => setNewPersonName(e.target.value)}
              placeholder="Ajouter une personne, ex. Alice"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:border-indigo-500 transition-colors ${
                darkMode 
                  ? "bg-slate-950 border-slate-800 text-slate-100 focus:bg-slate-950 focus:border-indigo-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
              }`}
            />
          </div>
          <button
            id="btn-add-person"
            type="submit"
            disabled={!newPersonName.trim()}
            className="px-3.5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
          >
            Ajouter
          </button>
        </form>
      </div>

      {/* Styled Paper Receipt Card */}
      <div id="receipt-card" className={`relative border shadow-md rounded-lg overflow-hidden transition-colors duration-300 ${
        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        
        {/* Jagged / decorative header */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        
        <div className="p-6 space-y-6">
          <div className={`flex items-center justify-between border-b border-dashed pb-4 ${
            darkMode ? "border-slate-800" : "border-slate-200"
          }`}>
            <div className="flex items-center space-x-2">
              <FileText className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
              <span className={`font-mono text-sm font-bold tracking-widest uppercase ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                TICKET DE CAISSE
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">#PARTAG-ADD</span>
          </div>

          {/* Items list */}
          <div className="space-y-4">
            {state.items.length === 0 ? (
              <div id="no-items-placeholder" className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-500 font-sans">Aucun article sur ce ticket pour le moment.</p>
                <p className="text-xs text-slate-400 max-w-[240px]">Importez une image ci-dessus ou ajoutez des articles manuellement ci-dessous.</p>
              </div>
            ) : (
              <div className={`divide-y max-h-[360px] overflow-y-auto pr-1 ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                {state.items.map((item) => {
                  const isUnassigned = item.assignedTo.length === 0;
                  return (
                    <div 
                      key={item.id} 
                      className={`py-3.5 flex flex-col space-y-2 transition-all ${
                        isUnassigned 
                          ? darkMode
                            ? "bg-amber-500/5 -mx-3 px-3 rounded-lg border border-transparent hover:border-amber-500/10"
                            : "bg-amber-50/30 -mx-3 px-3 rounded-lg border border-transparent hover:border-amber-100"
                          : ""
                      }`}
                    >
                      {/* Item Main Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setState(prev => ({
                                ...prev,
                                items: prev.items.map(it => it.id === item.id ? { ...it, name: val } : it)
                              }));
                            }}
                            className={`w-full font-sans text-sm font-medium border-b border-transparent focus:border-indigo-500 focus:outline-none bg-transparent ${
                              darkMode ? "text-white hover:border-slate-800" : "text-slate-900 hover:border-slate-200"
                            }`}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-3 shrink-0">
                          {/* Dual currency price editor */}
                          <div className="flex flex-col items-end">
                            <div className={`flex items-center text-sm font-mono font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                              <span className="text-slate-400 mr-1">{formatPrimarySymbol()}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price || ""}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setState(prev => ({
                                    ...prev,
                                    items: prev.items.map(it => it.id === item.id ? { ...it, price: val } : it)
                                  }));
                                }}
                                className={`w-16 text-right border-b border-transparent focus:border-indigo-500 focus:outline-none bg-transparent font-bold ${
                                  darkMode ? "text-white hover:border-slate-800" : "text-slate-950 hover:border-slate-300"
                                }`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ~ {formatSecondary(item.price)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              darkMode ? "text-slate-500 hover:text-rose-400 hover:bg-slate-800" : "text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title="Supprimer l'article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item assignment details */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider mr-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                          Payé par :
                        </span>
                        
                        {state.people.map(person => {
                          const isAssigned = item.assignedTo.includes(person.id);
                          return (
                            <button
                              key={person.id}
                              onClick={() => toggleAssignment(item.id, person.id)}
                              className={`flex items-center space-x-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                                isAssigned 
                                  ? getPersonStyle(person.color, darkMode)
                                  : darkMode
                                  ? "bg-slate-950 hover:bg-slate-800 text-slate-500 border-slate-800"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                            >
                              {person.avatar ? (
                                <img
                                  src={person.avatar}
                                  alt={person.name}
                                  className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                                  darkMode ? "bg-slate-950 text-slate-400" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {person.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span>{person.name}</span>
                              {isAssigned && <span className="ml-1 text-[9px] font-bold">✓</span>}
                            </button>
                          );
                        })}

                        {isUnassigned && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border animate-pulse ${
                            darkMode 
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                              : "text-amber-600 bg-amber-50 border-amber-200"
                          }`}>
                            ⚠️ Non attribué
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add custom manual item form */}
          <form onSubmit={handleAddItem} className={`pt-4 border-t flex gap-2 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
            <input
              id="new-item-name-input"
              type="text"
              placeholder="Nouvel article (ex. Pizza)"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md focus:outline-none focus:border-indigo-500 ${
                darkMode 
                  ? "bg-slate-950 border-slate-800 text-slate-100 focus:bg-slate-950" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
              }`}
            />
            <div className="relative w-28">
              <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">{formatPrimarySymbol()}</span>
              <input
                id="new-item-price-input"
                type="number"
                step="0.01"
                placeholder="Prix"
                value={newItemPrice}
                onChange={e => setNewItemPrice(e.target.value)}
                className={`w-full pl-6 pr-2 py-1.5 text-xs rounded-md focus:outline-none focus:border-indigo-500 font-mono font-bold ${
                  darkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-100 focus:bg-slate-950" 
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                }`}
              />
            </div>
            <button
              id="btn-add-item"
              type="submit"
              disabled={!newItemName || !newItemPrice}
              className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Receipt Summary Calculations with Dual-Currency output */}
          <div className={`border-t border-dashed pt-4 space-y-3 font-mono text-xs ${
            darkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"
          }`}>
            
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span>Sous-total :</span>
              <div className="flex flex-col items-end">
                <span className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {subtotal.toFixed(2)} {formatPrimarySymbol()}
                </span>
                <span className="text-[10px] text-slate-500">
                  ~ {formatSecondary(subtotal)}
                </span>
              </div>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between">
              <span>Taxe (TVA) :</span>
              <div className="flex items-center space-x-1">
                <input
                  id="tax-amount-input"
                  type="number"
                  step="0.01"
                  value={state.tax || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setState(prev => ({ ...prev, tax: val }));
                  }}
                  className={`w-16 text-right font-bold border-b focus:border-indigo-500 focus:outline-none mr-1 ${
                    darkMode ? "text-white border-slate-800 bg-transparent" : "text-slate-950 border-slate-200 bg-transparent"
                  }`}
                />
                <span className="text-slate-400 font-bold">{formatPrimarySymbol()}</span>
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  (~ {formatSecondary(state.tax)})
                </span>
              </div>
            </div>

            {/* Tip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span>Pourboire :</span>
                <div className={`flex border rounded overflow-hidden ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, tipType: 'percentage' }))}
                    className={`p-1 text-[9px] font-bold ${state.tipType === 'percentage' ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                  >
                    <Percent className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, tipType: 'fixed' }))}
                    className={`p-1 text-[9px] font-bold ${state.tipType === 'fixed' ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                  >
                    <span className="text-[10px] leading-3">{formatPrimarySymbol()}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <input
                  id="tip-amount-input"
                  type="number"
                  step="0.1"
                  value={state.tip || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setState(prev => ({ ...prev, tip: val }));
                  }}
                  className={`w-16 text-right font-bold border-b focus:border-indigo-500 focus:outline-none ${
                    darkMode ? "text-white border-slate-800 bg-transparent" : "text-slate-950 border-slate-200 bg-transparent"
                  }`}
                />
                {state.tipType === 'percentage' ? (
                  <span className="text-slate-500 font-bold ml-1">%</span>
                ) : (
                  <>
                    <span className="text-slate-400 font-bold ml-1">{formatPrimarySymbol()}</span>
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      (~ {formatSecondary(state.tip)})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Grand Total */}
            <div className={`border-t border-dashed pt-3 flex justify-between items-center text-sm font-bold ${
              darkMode ? "border-slate-850" : "border-slate-200"
            }`}>
              <span className={darkMode ? "text-slate-200" : "text-slate-950"}>Total Général :</span>
              <div className="flex flex-col items-end">
                <span className="text-indigo-400 text-base font-extrabold">
                  {grandTotalVal.toFixed(2)} {formatPrimarySymbol()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  ~ {formatSecondary(grandTotalVal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative receipt bottom zigzag */}
        <div className={`h-2 border-t relative overflow-hidden flex ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 shrink-0 rotate-45 -mt-2 ${
                darkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"
              }`} 
              style={{ marginLeft: i === 0 ? '-4px' : '2px' }} 
            />
          ))}
        </div>
      </div>

      {/* Camera Modal */}
      {selectedPersonForCamera && (
        <CameraModal
          person={selectedPersonForCamera}
          isOpen={!!selectedPersonForCamera}
          onClose={() => setSelectedPersonForCamera(null)}
          onSavePhoto={handleSavePhoto}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
