"use client";

import { useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { Download, QrCode } from "lucide-react";
import { getQRToken } from "@/lib/qr-utils";

interface UserQRCodeProps {
  userId: string;
  userName: string;
  universityId: number;
}

export default function UserQRCode({ userId, userName, universityId }: UserQRCodeProps) {
  const qrToken = getQRToken(userId);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    // Serialize SVG to PNG via canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `library-qr-${universityId}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      }, "image/png");
    };

    img.src = url;
  }, [universityId]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      {/* QR Code Display */}
      <div
        ref={qrRef}
        className="bg-white p-4 sm:p-5 rounded-2xl shadow-lg border-4 border-emerald-400/40"
      >
        <QRCode
          value={qrToken}
          size={180}
          bgColor="#ffffff"
          fgColor="#064e3b"
          level="H"
        />
      </div>

      {/* Labels */}
      <div className="text-center space-y-1">
        <p className="text-white font-semibold text-sm sm:text-base">{userName}</p>
        <p className="text-emerald-300 text-xs sm:text-sm">Student ID: {universityId}</p>
        <p className="text-emerald-400/60 text-[10px] font-mono break-all max-w-[220px]">{qrToken}</p>
      </div>

      {/* Instructions */}
      <p className="text-emerald-200/70 text-xs text-center max-w-xs">
        Show this QR code to the librarian when entering the library. It will be scanned to log your visit.
      </p>

      {/* Download Button */}
      <button
        onClick={downloadQRCode}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md"
      >
        <Download className="h-4 w-4" />
        Download QR Code
      </button>
    </div>
  );
}
