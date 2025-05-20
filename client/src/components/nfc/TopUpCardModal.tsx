import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, PlusCircle, WifiOff, AlertTriangle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import useNFC from "@/hooks/use-nfc";

interface TopupCardModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: (result: any) => void;
}

const TopupCardModal = ({ 
  open, 
  onClose, 
  amount,
  onSuccess 
}: TopupCardModalProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("กำลังอ่านบัตร...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState(""); 
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);
  
  // เพิ่มสถานะเพื่อป้องกันการแสกนซ้ำ
  const [processedCardIds, setProcessedCardIds] = useState<Set<string>>(new Set());
  const [processingTransaction, setProcessingTransaction] = useState(false);

  // ใช้ hook useNFC สำหรับการอ่านบัตร NFC จริง
  const { 
    isReading, 
    supportedNFC, 
    lastTagId, 
    startReading: startNFCReading, 
    stopReading: stopNFCReading,
    error: nfcError
  } = useNFC({
    onRead: (serialNumber) => {
      // เมื่ออ่านบัตรได้แล้ว ส่งไปประมวลผลการเติมเงิน
      console.log("NFC card read for topup:", serialNumber);
      
      // ตรวจสอบว่ากำลังประมวลผลอยู่หรือไม่
      if (isProcessing || processingTransaction) {
        console.log("Already processing a transaction, ignoring new card scan");
        return;
      }
      
      // ตรวจสอบว่าเคยประมวลผลบัตรใบนี้ไปแล้วหรือไม่
      if (processedCardIds.has(serialNumber)) {
        console.log("Card already processed, preventing duplicate topup", serialNumber);
        toast({
          title: "การประมวลผลถูกป้องกัน",
          description: "บัตรนี้กำลังถูกประมวลผล โปรดรอสักครู่",
          variant: "default"
        });
        return;
      }
      
      setCardId(serialNumber);
      processTopup(serialNumber);
    }
  });

  useEffect(() => {
    if (open) {
      // รีเซ็ตสถานะเมื่อเปิดหน้าต่าง
      setProgress(0);
      setStatus("กำลังอ่านบัตร...");
      setIsProcessing(false);
      setShowManualEntry(false);
      setCardId("");

      // ตรวจสอบการรองรับ NFC
      if (!supportedNFC) {
        setStatus("อุปกรณ์ของคุณไม่รองรับ NFC");
        setShowManualEntry(true);
        return;
      }

      // เริ่มอ่านบัตร NFC จริงด้วย Web NFC API
      if (!showManualEntry) {
        startNFCReading();
        
        // แสดงความคืบหน้าการรอบัตร
        const interval = setInterval(() => {
          setProgress(prev => {
            // คงความคืบหน้าไว้ที่ 75% จนกว่าจะอ่านบัตรได้จริง
            return Math.min(prev + 5, 75);
          });
        }, 200);

        return () => {
          clearInterval(interval);
          stopNFCReading(); // หยุดการอ่านเมื่อออกจากหน้าต่าง
        };
      }
    }
  }, [open, supportedNFC, showManualEntry, startNFCReading, stopNFCReading]);

  // แสดงข้อความเตือนเมื่อมีข้อผิดพลาดจาก NFC API
  useEffect(() => {
    if (nfcError) {
      console.error("NFC error:", nfcError);
      setStatus("เกิดข้อผิดพลาดในการอ่านบัตร");
      toast({
        title: "เกิดข้อผิดพลาดในการอ่านบัตร",
        description: nfcError.message,
        variant: "destructive"
      });
      setShowManualEntry(true);
    }
  }, [nfcError, toast]);

  // Process Topup transaction
  const processTopup = async (manualCardId?: string) => {
    // ตรวจสอบว่ากำลังประมวลผลอยู่หรือไม่
    if (isProcessing || processingTransaction) return;
    
    // ใช้ cardId ที่ส่งมาหรือที่อ่านได้จาก NFC
    const cardIdToUse = manualCardId || cardId;
    
    // ตรวจสอบว่าเคยประมวลผลบัตรใบนี้ไปแล้วหรือไม่
    if (processedCardIds.has(cardIdToUse)) {
      console.log("Card already processed, preventing duplicate topup", cardIdToUse);
      toast({
        title: "การประมวลผลถูกป้องกัน",
        description: "บัตรนี้กำลังถูกประมวลผล โปรดรอสักครู่",
        variant: "default"
      });
      return;
    }
    
    setProcessingTransaction(true);
    setIsProcessing(true);
    
    // เพิ่มบัตรเข้าไปในรายการที่กำลังประมวลผล
    setProcessedCardIds(prev => {
      const newSet = new Set(prev);
      newSet.add(cardIdToUse);
      return newSet;
    });

    try {
      // ใช้ cardId ที่ส่งมาหรือที่อ่านได้จาก NFC - ประกาศไว้ด้านบนแล้ว

      console.log("Processing topup with:", {
        cardId: cardIdToUse,
        amount: amount,
        type: "topup"
      });

      // Use the dedicated NFC topup endpoint
      const response = await apiRequest("POST", "/api/nfc-topup", {
        cardId: cardIdToUse,
        amount: amount
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for specific error type for card not found
        if (errorData.error === "card_not_found") {
          setStatus("NFC card not found");

          // ปรับข้อความแสดงความผิดพลาดให้สวยงามขึ้น
          const errorMessage = `${errorData.message}\n${errorData.details || ""}`;

          // ใช้ error object ที่มีข้อมูลเพิ่มเติม
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).icon = <XCircle className="h-6 w-6 text-red-500" />;
          (enhancedError as any).isCardError = true;

          throw enhancedError;
        } else {
          throw new Error(errorData.message || "Topup failed");
        }
      }

      const result = await response.json();

      // Wait a bit to show the processing state
      setTimeout(() => {
        setStatus("Topup Success!");
        setProgress(100);

        // Wait another moment before closing
        setTimeout(() => {
          // รีเซ็ตสถานะในการประมวลผลบัตร
          setProcessingTransaction(false);
          
          // ส่งผลลัพธ์กลับไป
          onSuccess(result);
        }, 1000);
      }, 1000);

    } catch (error) {
      console.error("Topup error:", error);
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      const errorLines = errorMessage.split('\n');

      toast({
        title: "การเติมเงินล้มเหลว",
        description: (
          <div className="space-y-2">
            <div className="space-y-1">
              {errorLines.map((line, index) => (
                <p key={index} 
                  className={index === 0 
                    ? "font-semibold text-base"
                    : "text-sm text-gray-600"
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        ),
        variant: "destructive"
      });
      
      setStatus("การเติมเงินล้มเหลว กรุณาลองอีกครั้ง");
      setIsProcessing(false);
      setProcessingTransaction(false);
      
      // นำบัตรออกจากรายการประมวลผล เพื่อให้สามารถทำรายการใหม่ได้
      setProcessedCardIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardIdToUse);
        return newSet;
      });
    }
  };

  // For demo purposes, allow manual entry to trigger topup
  const handleManualEntry = () => {
    setShowManualEntry(true);
    setStatus("Please enter your NFC card number");
    setProgress(0);

    // Focus on the input after showing it
    setTimeout(() => {
      if (cardInputRef.current) {
        cardInputRef.current.focus();
      }
    }, 100);
  };

  const handleProcessManualEntry = () => {
    if (!cardId.trim()) {
      toast({
        title: "Please enter your card number",
        variant: "destructive"
      });
      return;
    }

    setStatus("Processing transaction...");
    setProgress(75);
    processTopup(cardId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) {
        // ถ้าปิดหน้าต่าง ต้องหยุดการอ่านบัตรด้วย
        if (isReading) {
          stopNFCReading();
        }
        onClose();
      }
    }}>
      <DialogContent className="max-w-md p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">เติมเงินบัตร NFC</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
              {!supportedNFC ? (
                <WifiOff className="text-red-500 text-xl md:text-2xl" />
              ) : isReading ? (
                <Wifi className="text-blue-500 text-xl md:text-2xl" />
              ) : (
                <PlusCircle className="text-green-600 text-xl md:text-2xl" />
              )}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">เติมเงินบัตร NFC</h3>
            {!supportedNFC ? (
              <p className="text-sm md:text-base text-red-500">
                อุปกรณ์นี้ไม่รองรับ NFC หรือ Web NFC API
              </p>
            ) : !showManualEntry ? (
              <p className="text-sm md:text-base text-gray-600">กรุณาแตะบัตร NFC ที่ด้านหลังอุปกรณ์</p>
            ) : (
              <p className="text-sm md:text-base text-gray-600">กรุณากรอกหมายเลขบัตร NFC</p>
            )}
            
            {!supportedNFC && (
              <p className="text-xs text-gray-500 mt-1">
                Web NFC API รองรับเฉพาะบน Chrome บน Android เท่านั้น
              </p>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm md:text-base text-gray-600">จำนวนเงินที่เติม:</span>
              <span className="text-sm md:text-base font-bold text-gray-800">{amount} Coins</span>
            </div>
          </div>

          {showManualEntry ? (
            <div className="mb-4 md:mb-6">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 text-left">
                หมายเลขบัตร NFC
              </label>
              <Input
                ref={cardInputRef}
                type="text"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="กรอกหมายเลขบัตร"
                className="mb-4 text-sm"
              />
            </div>
          ) : (
            <div className="relative mb-4 md:mb-6">
              <Progress value={progress} className="h-2" />
              <div className="mt-2 text-xs md:text-sm text-gray-600">
                {status}
                {isReading && <span className="ml-1 animate-pulse">...</span>}
              </div>
            </div>
          )}

          <div className="flex space-x-3 md:space-x-4">
            <Button 
              variant="outline" 
              className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
              onClick={() => {
                if (isReading) {
                  stopNFCReading();
                }
                onClose();
              }}
              disabled={isProcessing}
            >
              ยกเลิก
            </Button>
            
            {!showManualEntry ? (
              <Button 
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10" 
                onClick={() => {
                  if (isReading) {
                    stopNFCReading();
                  }
                  handleManualEntry();
                }}
                disabled={isProcessing}
              >
                กรอกเอง
              </Button>
            ) : (
              <Button 
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10 bg-green-600 hover:bg-green-700" 
                onClick={handleProcessManualEntry}
                disabled={isProcessing}
              >
                เติมเงิน
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopupCardModal;