import { useState, useEffect, useCallback } from 'react';

// เพิ่ม interface สำหรับ NDEFReader
interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  onreading: ((event: any) => void) | null;
  onreadingerror: ((error: any) => void) | null;
}

// ต่อขยาย Window interface เพื่อเพิ่ม NDEFReader
declare global {
  interface Window {
    NDEFReader?: {
      new (): NDEFReader;
    };
  }
}

export type NFCReadStatus = 'idle' | 'reading' | 'success' | 'error' | 'not-supported';

interface UseNFCOptions {
  onRead?: (serialNumber: string) => void;
  autoStart?: boolean;
}

export function useNFC({ onRead, autoStart = false }: UseNFCOptions = {}) {
  const [isReading, setIsReading] = useState(false);
  const [status, setStatus] = useState<NFCReadStatus>('idle');
  const [supportedNFC, setSupportedNFC] = useState<boolean | null>(null);
  const [lastTagId, setLastTagId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // เพิ่มสถานะเพื่อป้องกันการอ่านบัตรซ้ำในระยะเวลาสั้นๆ
  const [recentlyReadTags, setRecentlyReadTags] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const debounceTimeRef = useCallback(() => 3000, []); // กำหนดเวลา 3 วินาทีในการป้องกันการอ่านซ้ำ

  // ตรวจสอบการรองรับ NFC
  useEffect(() => {
    const checkNFCSupport = async () => {
      // ตรวจสอบว่าเบราว์เซอร์รองรับ NDEFReader หรือไม่
      if ('NDEFReader' in window) {
        try {
          setSupportedNFC(true);
          console.log('Web NFC API is supported');
          
          // ถ้า autoStart เป็น true ให้เริ่มการอ่าน NFC ทันที
          if (autoStart) {
            startReading();
          }
        } catch (err) {
          console.error('Error checking NFC support:', err);
          setSupportedNFC(false);
        }
      } else {
        console.warn('Web NFC API is NOT supported');
        setSupportedNFC(false);
      }
    };

    checkNFCSupport();
  }, [autoStart]);

  // ฟังก์ชันเริ่มอ่าน NFC
  const startReading = useCallback(async () => {
    if (!window.NDEFReader) {
      setError(new Error('NFC not supported on this device or browser'));
      setStatus('not-supported');
      return;
    }

    try {
      setStatus('reading');
      setIsReading(true);
      setError(null);

      const controller = new AbortController();
      setAbortController(controller);

      const ndef = new window.NDEFReader();
      
      ndef.onreading = (event: any) => {
        console.log('NFC Tag read!', event);
        
        // พยายามดึงรหัสประจำตัวของแท็ก NFC
        if (event.serialNumber) {
          const serialNumber = event.serialNumber;
          console.log(`> Serial Number: ${serialNumber}`);
          
          // เก็บรหัสประจำตัวล่าสุด
          setLastTagId(serialNumber);
          setStatus('success');
          
          // ตรวจสอบว่ากำลังประมวลผลอยู่หรือไม่
          if (isProcessing) {
            console.log(`กำลังประมวลผลข้อมูล ไม่สามารถอ่านบัตรซ้ำได้ในขณะนี้`);
            return;
          }
          
          // ตรวจสอบว่าบัตรนี้ถูกอ่านเมื่อเร็วๆ นี้หรือไม่
          const now = Date.now();
          const lastReadTime = recentlyReadTags[serialNumber] || 0;
          const timeSinceLastRead = now - lastReadTime;
          
          // ถ้าบัตรนี้ถูกอ่านเมื่อไม่นานมานี้ (น้อยกว่า 3 วินาที) ให้ข้ามไป
          if (lastReadTime > 0 && timeSinceLastRead < debounceTimeRef()) {
            console.log(`ข้าม - บัตร ${serialNumber} เพิ่งถูกอ่านเมื่อ ${timeSinceLastRead}ms ที่แล้ว`);
            return;
          }
          
          // บันทึกเวลาที่อ่านบัตรนี้
          setRecentlyReadTags(prev => ({
            ...prev,
            [serialNumber]: now
          }));
          
          // ตั้งค่าสถานะกำลังประมวลผล
          setIsProcessing(true);
          
          // เรียกใช้งาน callback หากมีการกำหนด
          if (onRead) {
            try {
              onRead(serialNumber);
            } finally {
              // ตั้งเวลาเพื่อรีเซ็ตสถานะหลังจากเสร็จสิ้น
              setTimeout(() => {
                setIsProcessing(false);
              }, 500);
            }
          } else {
            setIsProcessing(false);
          }
        }
      };

      ndef.onreadingerror = (error: any) => {
        console.error('Error reading NFC tag:', error);
        setError(new Error('Error reading NFC tag'));
        setStatus('error');
      };

      console.log('Starting NFC scan...');
      await ndef.scan({ signal: controller.signal });
    } catch (error: any) {
      console.error('Error starting NFC scan:', error);
      setError(error);
      setStatus('error');
      setIsReading(false);
    }
  }, [onRead]);

  // ฟังก์ชันหยุดอ่าน NFC
  const stopReading = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsReading(false);
    setStatus('idle');
  }, [abortController]);

  // ฟังก์ชันเคลียร์ประวัติการอ่านบัตร
  const clearReadHistory = useCallback(() => {
    setRecentlyReadTags({});
    setIsProcessing(false);
  }, []);
  
  // คืนค่าสถานะและฟังก์ชันควบคุม
  return {
    isReading,
    status,
    supportedNFC,
    lastTagId,
    error,
    startReading,
    stopReading,
    clearReadHistory
  };
}

// ฟังก์ชันตรวจสอบว่าอุปกรณ์รองรับ NFC หรือไม่
export const checkNFCSupport = (): boolean => {
  return 'NDEFReader' in window;
};

export default useNFC;