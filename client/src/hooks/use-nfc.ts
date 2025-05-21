import { useState, useEffect, useCallback } from "react";

interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  onreading: ((event: any) => void) | null;
  onreadingerror: ((error: any) => void) | null;
}

declare global {
  interface Window {
    NDEFReader?: {
      new (): NDEFReader;
    };
  }
}

export type NFCReadStatus =
  | "idle"
  | "reading"
  | "success"
  | "error"
  | "not-supported";

interface UseNFCOptions {
  onRead?: (serialNumber: string) => Promise<void> | void;
  autoStart?: boolean;
}

export function useNFC({ onRead, autoStart = false }: UseNFCOptions = {}) {
  const [isReading, setIsReading] = useState(false);
  const [status, setStatus] = useState<NFCReadStatus>("idle");
  const [supportedNFC, setSupportedNFC] = useState<boolean | null>(null);
  const [lastTagId, setLastTagId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkNFCSupport = () => {
      if ("NDEFReader" in window) {
        setSupportedNFC(true);
        if (autoStart) {
          startReading();
        }
      } else {
        setSupportedNFC(false);
      }
    };
    checkNFCSupport();
  }, [autoStart]);

  const stopReading = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsReading(false);
    setStatus("idle");
  }, [abortController]);

  const startReading = useCallback(async () => {
    if (!window.NDEFReader) {
      setError(new Error("NFC not supported on this device or browser"));
      setStatus("not-supported");
      return;
    }

    try {
      setStatus("reading");
      setIsReading(true);
      setError(null);

      const controller = new AbortController();
      setAbortController(controller);

      const ndef = new window.NDEFReader();

      ndef.onreading = (event: any) => {
        const serialNumber = event.serialNumber;
        if (!serialNumber) return;

        stopReading(); // หยุดอ่านทันทีหลังอ่านได้

        if (isProcessing) return;

        setLastTagId(serialNumber);
        setStatus("success");
        setIsProcessing(true);

        if (onRead) {
          (async () => {
            try {
              await onRead(serialNumber);
            } catch (err) {
              console.error("Error in onRead:", err);
            } finally {
              setTimeout(() => {
                setIsProcessing(false);
              }, 500);
            }
          })();
        } else {
          setIsProcessing(false);
        }
      };

      // เปลี่ยนตรงนี้: ไม่แสดง error UI แค่ log เฉยๆ
      ndef.onreadingerror = (event) => {
        console.warn("⚠️ NFC reading error (ignored):", event);
        // ไม่ set error หรือ status แสดง UI
      };

      await ndef.scan({ signal: controller.signal }).catch((err) => {
        ndef.onreading = null;
        ndef.onreadingerror = null;
        throw err;
      });
    } catch (error: any) {
      setError(error);
      setStatus("error");
      setIsReading(false);
    }
  }, [onRead, stopReading, isProcessing]);

  return {
    isReading,
    status,
    supportedNFC,
    lastTagId,
    error,
    startReading,
    stopReading,
  };
}

export const checkNFCSupport = (): boolean => {
  return "NDEFReader" in window;
};

export default useNFC;
