"use client";

import { useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue?: string };
type DetectorInstance = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type DetectorConstructor = new (options?: { formats?: string[] }) => DetectorInstance;

type BarcodeInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  onDetected?: (value: string) => void;
};

export default function BarcodeInput({ name, label, placeholder, required, onDetected }: BarcodeInputProps) {
  const [value, setValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  function stopScanner() {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function startScanner() {
    setMessage(null);
    const Detector = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera barcode scanning is not supported in this browser. Enter or use a hardware scanner in the field below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setScanning(true);

      const detector = new Detector({ formats: ["qr_code", "data_matrix", "code_128", "ean_13", "ean_8", "upc_a", "upc_e"] });
      const scan = async () => {
        try {
          const results = await detector.detect(video);
          const detected = results.find((result) => result.rawValue?.trim());
          if (detected?.rawValue) {
            const next = detected.rawValue.trim();
            setValue(next);
            onDetected?.(next);
            setMessage(`Captured: ${next}`);
            stopScanner();
            return;
          }
        } catch {
          // Individual frames can fail while autofocus settles; continue scanning.
        }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      stopScanner();
      setMessage("Camera access was unavailable. You can still type or scan with a connected barcode scanner.");
    }
  }

  return (
    <div className="field">
      <label htmlFor={`${name}-barcode`}>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <input
          id={`${name}-barcode`}
          name={name}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            onDetected?.(event.target.value);
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          style={{ flex: 1 }}
        />
        <button className="button button--ghost" type="button" onClick={scanning ? stopScanner : startScanner}>
          {scanning ? "Stop" : "Scan"}
        </button>
      </div>
      <video
        ref={videoRef}
        playsInline
        muted
        aria-label="Barcode camera preview"
        style={{ display: scanning ? "block" : "none", width: "100%", maxHeight: 260, objectFit: "cover", marginTop: 10 }}
      />
      {message ? <small style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>{message}</small> : null}
    </div>
  );
}
