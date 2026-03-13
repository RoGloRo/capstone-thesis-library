"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { recordVisit } from "@/lib/actions/visit-logs";
import { parseQRCode } from "@/lib/qr-utils";
import Image from "next/image";

type ScanState = "idle" | "scanning" | "processing" | "success" | "error" | "duplicate";

interface ScannedUser {
  id: string;
  fullName: string;
  universityId: number;
  universityCard: string;
  email: string;
}

interface QRScannerProps {
  onVisitRecorded?: () => void;
}

export default function QRScanner({ onVisitRecorded }: QRScannerProps) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-scanner-div";
  const isProcessingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore stop errors
      }
    }
    setCameraActive(false);
  }, [cameraActive]);

  const startScanner = useCallback(async () => {
    setScanState("scanning");
    setScannedUser(null);
    setMessage("");
    isProcessingRef.current = false;

    try {
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;

          // Stop scanning once a code is read
          try {
            await scanner.stop();
          } catch {
            // ignore
          }
          setCameraActive(false);
          setScanState("processing");

          // Validate QR format
          const userId = parseQRCode(decodedText);
          if (!userId) {
            setScanState("error");
            setMessage("Invalid QR code. Please use a valid Library QR code.");
            return;
          }

          const result = await recordVisit(userId);

          if (result.success) {
            setScanState("success");
            setMessage(result.message);
            setScannedUser(result.user ?? null);
            onVisitRecorded?.();
          } else if (result.message.includes("already recorded")) {
            setScanState("duplicate");
            setMessage(result.message);
            setScannedUser(result.user ?? null);
          } else {
            setScanState("error");
            setMessage(result.message);
          }
        },
        () => {
          // QR not detected yet — silent
        }
      );

      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied or unavailable.";
      setScanState("error");
      setMessage(msg.includes("permission") || msg.includes("NotAllowed")
        ? "Camera permission denied. Please allow camera access and try again."
        : "Unable to start camera. Please ensure a camera is connected and permissions are granted.");
      setCameraActive(false);
    }
  }, [onVisitRecorded]);

  const reset = useCallback(async () => {
    await stopScanner();
    setScanState("idle");
    setScannedUser(null);
    setMessage("");
    isProcessingRef.current = false;
  }, [stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Camera viewport */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-2 border-emerald-500/30 min-h-[320px] flex items-center justify-center">
        {/* The div that html5-qrcode mounts into */}
        <div
          id={scannerDivId}
          className={`w-full ${cameraActive ? "block" : "hidden"}`}
          style={{ minHeight: 300 }}
        />

        {/* Overlay UI when camera is not active */}
        {!cameraActive && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            {scanState === "idle" && (
              <>
                <Camera className="h-16 w-16 text-emerald-400/40" />
                <p className="text-gray-400 text-sm">Camera is off. Press "Start Scanner" to begin.</p>
              </>
            )}
            {scanState === "processing" && (
              <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />
            )}
            {scanState === "success" && (
              <CheckCircle className="h-16 w-16 text-emerald-400 animate-bounce" />
            )}
            {scanState === "duplicate" && (
              <XCircle className="h-16 w-16 text-amber-400" />
            )}
            {scanState === "error" && (
              <XCircle className="h-16 w-16 text-red-400" />
            )}
          </div>
        )}

        {/* Scanning overlay frame */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-60 h-60 border-4 border-emerald-400 rounded-2xl opacity-70 animate-pulse" />
          </div>
        )}
      </div>

      {/* Result message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium text-center border ${
            scanState === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : scanState === "duplicate"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Scanned user card */}
      {scannedUser && (scanState === "success" || scanState === "duplicate") && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {scannedUser.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{scannedUser.fullName}</p>
            <p className="text-emerald-300 text-sm">ID: {scannedUser.universityId}</p>
            <p className="text-gray-400 text-xs truncate">{scannedUser.email}</p>
          </div>
          {scanState === "success" && (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5 whitespace-nowrap">
              Logged In
            </span>
          )}
          {scanState === "duplicate" && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5 whitespace-nowrap">
              Already Logged
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 justify-center flex-wrap">
        {scanState === "idle" && (
          <button
            onClick={startScanner}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Camera className="h-4 w-4" />
            Start Scanner
          </button>
        )}
        {scanState === "scanning" && (
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <CameraOff className="h-4 w-4" />
            Stop Scanner
          </button>
        )}
        {(scanState === "success" || scanState === "error" || scanState === "duplicate") && (
          <button
            onClick={startScanner}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Scan Next
          </button>
        )}
      </div>
    </div>
  );
}
