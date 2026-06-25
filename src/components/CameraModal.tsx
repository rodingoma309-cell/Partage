import React, { useState, useRef, useEffect } from "react";
import { Camera, X, RefreshCw, AlertCircle, Check, Loader2 } from "lucide-react";
import { Person } from "../types";

interface CameraModalProps {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (personId: string, photoBase64: string) => void;
  darkMode?: boolean;
}

export default function CameraModal({
  person,
  isOpen,
  onClose,
  onSavePhoto,
  darkMode = true,
}: CameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera helper
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    setIsLoading(true);
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 400 },
          height: { ideal: 400 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video metadata to load to play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        };
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errorMsg = "Impossible d'accéder à la webcam.";
      if (err.name === "NotAllowedError") {
        errorMsg = "Accès à la caméra refusé. Veuillez autoriser la caméra dans votre navigateur.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "Aucune caméra détectée sur votre appareil.";
      }
      setCameraError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger camera start when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCameraError(null);
      // Give DOM time to render video element ref
      const timer = setTimeout(() => {
        startCamera(facingMode);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    // Create a 1:1 square canvas for profile avatars
    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop the video feed to get a perfect square avatar
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Flip horizontally if front camera for mirror effect
    if (facingMode === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Toggle facing mode (front / back camera)
  const toggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Save photo and close
  const handleSave = () => {
    if (capturedImage) {
      onSavePhoto(person.id, capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 ${
          darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          darkMode ? "border-slate-800" : "border-slate-100"
        }`}>
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm tracking-tight">
              Prendre en photo : <span className="text-indigo-400">{person.name}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              darkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-100" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Camera Viewport */}
        <div className="p-6 flex flex-col items-center space-y-6">
          <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-500/20 bg-slate-950 flex items-center justify-center shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-2 text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Démarrage Caméra...</span>
              </div>
            ) : cameraError ? (
              <div className="p-4 text-center flex flex-col items-center space-y-2 text-rose-400">
                <AlertCircle className="w-8 h-8" />
                <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="mt-2 px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />
            )}
          </div>

          {/* Subtext info & iframe warning */}
          <div className="text-center space-y-3 max-w-xs">
            <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {capturedImage 
                ? "Parfait ! Enregistrez ou reprenez la photo si nécessaire." 
                : "Cadrez le visage de votre ami dans le cercle pour créer son avatar personnalisé !"}
            </p>
            
            {/* Helpful warning about iframe context */}
            <div className={`p-2.5 rounded-lg border text-[10px] text-left space-y-1 ${
              darkMode ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-100 text-indigo-800"
            }`}>
              <p className="font-bold">💡 Problème de caméra / webcam ?</p>
              <p className="leading-normal">
                Si la caméra ne démarre pas dans l'aperçu intégré (bloqué par la sécurité de l'iframe), 
                cliquez sur l'icône d'ouverture en haut à droite pour <strong>ouvrir l'application dans un nouvel onglet</strong>. 
                La caméra fonctionnera alors parfaitement !
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-3 w-full">
            {capturedImage ? (
              <>
                <button
                  onClick={handleRetake}
                  className={`flex-1 py-2 px-4 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Reprendre
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleFacingMode}
                  disabled={!!cameraError || isLoading}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-45 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Changer de caméra"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Rotation</span>
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!stream || isLoading}
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturer la photo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
