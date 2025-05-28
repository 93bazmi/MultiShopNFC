import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, WifiOff, PlusCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import useNFC from "@/hooks/use-nfc";

interface NFCPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  shopId: number;
  shopName: string;
  onSuccess: (result: any) => void;
}

const NFCPaymentModal = ({
  open,
  onClose,
  amount,
  shopId,
  shopName,
  onSuccess,
}: NFCPaymentModalProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("กรุณาแตะบัตร NFC ที่ด้านหลังอุปกรณ์");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState("");
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);

  // ป้องกันอ่านซ้ำ
  const [processedCardIds, setProcessedCardIds] = useState<Set<string>>(
    new Set(),
  );
  const [processingTransaction, setProcessingTransaction] = useState(false);

  const [nfcEnabled, setNfcEnabled] = useState(false);

  const {
    isReading,
    supportedNFC,
    startReading: startNFCReading,
    stopReading: stopNFCReading,
    error: nfcError,
  } = useNFC({
    onRead: (serialNumber) => {
      if (isProcessing || processingTransaction) return;

      if (processedCardIds.has(serialNumber)) {
        toast({
          title: "รายการนี้กำลังประมวลผล โปรดรอสักครู่",
          variant: "default",
        });
        return;
      }

      setCardId(serialNumber);
      processPayment(serialNumber);
    },
    allowNFCReading: nfcEnabled, // อนุญาตให้อ่าน NFC เฉพาะเมื่อเปิดใช้งาน
  });

  useEffect(() => {
    if (open) {
      setProgress(0);
      setStatus("กรุณากดปุ่ม 'Pay Now' เพื่อเริ่มชำระเงิน");
      setIsProcessing(false);
      setShowManualEntry(false);
      setCardId("");
      setProcessedCardIds(new Set());
      setNfcEnabled(false); // ปิด NFC เมื่อเปิด modal

      if (!supportedNFC) {
        setStatus("อุปกรณ์ของคุณไม่รองรับ NFC");
        setShowManualEntry(true);
        return;
      }
    } else {
      setProgress(0);
      setStatus("");
      setIsProcessing(false);
      setNfcEnabled(false); // ปิด NFC เมื่อปิด modal
      stopNFCReading();
    }
  }, [open, supportedNFC]);

  useEffect(() => {
    if (nfcError) {
      setStatus("เกิดข้อผิดพลาดในการอ่านบัตร");
      toast({
        title: "เกิดข้อผิดพลาดในการอ่านบัตร",
        description: nfcError.message,
        variant: "destructive",
      });
      stopNFCReading();
      setShowManualEntry(true);
    }
  }, [nfcError, toast]);

  const processPayment = async (manualCardId?: string) => {
    if (isProcessing || processingTransaction) return;

    const cardIdToUse = manualCardId || cardId;

    if (processedCardIds.has(cardIdToUse)) {
      toast({
        title: "รายการนี้กำลังประมวลผล โปรดรอสักครู่",
        variant: "default",
      });
      return;
    }

    setStatus(`กำลังประมวลผลชำระเงินจำนวน ${amount} Coins...`);
    setProgress(10);
    setIsProcessing(true);
    setProcessingTransaction(true);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval);
          return p;
        }
        return p + 5;
      });
    }, 200);

    setProcessedCardIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(cardIdToUse);
      return newSet;
    });

    try {
      if (!shopId) {
        throw new Error("ไม่พบข้อมูลร้านค้า กรุณาเลือกร้านค้าก่อนชำระเงิน");
      }

      const response = await apiRequest("POST", "/api/nfc-payment", {
        cardId: cardIdToUse,
        shopId: shopId,
        amount: amount,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "การชำระเงินล้มเหลว");
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);
      setStatus("ชำระเงินสำเร็จ!");

      // หยุดอ่าน NFC ทันทีเมื่อชำระเงินสำเร็จ
      stopNFCReading();
      
      setTimeout(() => {
        setProcessingTransaction(false);
        onSuccess(result);
      }, 1000);
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setStatus("การชำระเงินล้มเหลว กรุณาลองอีกครั้ง");
      setIsProcessing(false);
      setProcessingTransaction(false);

      setProcessedCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardIdToUse);
        return newSet;
      });

      toast({
        title: "การชำระเงินล้มเหลว",
        description: error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
        variant: "destructive",
      });
    }
  };

  const handleManualEntry = () => {
    stopNFCReading();
    setNfcEnabled(false);
    setShowManualEntry(true);
    setStatus("กรุณากรอกหมายเลขบัตร NFC");
    setProgress(0);
    setCardId("");
  };

  const handleProcessManualEntry = () => {
    if (!cardId.trim()) {
      toast({
        title: "กรุณากรอกหมายเลขบัตร",
        variant: "destructive",
      });
      return;
    }
    processPayment(cardId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isProcessing) {
          if (isReading) stopNFCReading();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">ชำระเงินด้วยบัตร NFC</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
              {!supportedNFC ? (
                <WifiOff className="text-red-500 text-xl md:text-2xl" />
              ) : isReading ? (
                <Wifi className="text-blue-500 text-xl md:text-2xl" />
              ) : (
                <PlusCircle className="text-primary text-xl md:text-2xl" />
              )}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              ชำระเงินด้วยบัตร NFC
            </h3>

            <div className="border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm md:text-base text-gray-600">
                  จำนวนเงินที่ชำระ:
                </span>
                <span className="text-sm md:text-base font-bold text-gray-800">
                  {amount} Coins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm md:text-base text-gray-600">
                  ร้านค้า:
                </span>
                <span className="text-sm md:text-base text-gray-800">
                  {shopName}
                </span>
              </div>
            </div>

            {!supportedNFC && (
              <p className="text-xs text-gray-500 mt-1">
                Web NFC API รองรับเฉพาะบน Chrome บน Android เท่านั้น
              </p>
            )}

            {!showManualEntry ? (
              <p className="text-sm md:text-base text-gray-600">{status}</p>
            ) : (
              <p className="text-sm md:text-base text-gray-600">
                กรุณากรอกหมายเลขบัตร NFC
              </p>
            )}
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
            </div>
          )}

          <div className="flex space-x-3 md:space-x-4">
            <Button
              variant="outline"
              className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
              onClick={() => {
                if (isReading) stopNFCReading();
                setNfcEnabled(false);
                onClose();
              }}
              disabled={isProcessing}
            >
              ยกเลิก
            </Button>

            {!showManualEntry ? (
              !nfcEnabled && !isProcessing ? (
                <Button
                  className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setNfcEnabled(true);
                    setStatus("กรุณาแตะบัตร NFC ที่ด้านหลังอุปกรณ์");
                    startNFCReading();
                  }}
                  disabled={isProcessing}
                >
                  Pay Now
                </Button>
              ) : (
                <Button
                  className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
                  onClick={handleManualEntry}
                  disabled={isProcessing}
                >
                  กรอกเอง
                </Button>
              )
            ) : (
              <Button
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10 bg-primary hover:bg-primary/90"
                onClick={handleProcessManualEntry}
                disabled={isProcessing}
              >
                ชำระเงิน
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFCPaymentModal;
