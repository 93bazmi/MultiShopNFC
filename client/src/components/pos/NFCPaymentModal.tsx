import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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
  onSuccess 
}: NFCPaymentModalProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("กำลังรอบัตร...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState(""); // ไม่กำหนดค่าเริ่มต้น ให้ผู้ใช้กรอกเอง
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setProgress(0);
      setStatus("กำลังรอบัตร...");
      setIsProcessing(false);
      setShowManualEntry(false);
      
      if (!showManualEntry) {
        // Simulate NFC card detection progress but don't auto-process
        const interval = setInterval(() => {
          setProgress(prev => {
            const next = Math.min(prev + 5, 75); // Only up to 75%
            
            // When progress is at 75%, just show waiting for card
            if (prev < 75 && next >= 75) {
              setStatus("กรุณาป้อนหมายเลขบัตรด้วยตนเอง");
              setShowManualEntry(true); // Auto-switch to manual mode instead
              clearInterval(interval);
            }
            
            return next;
          });
        }, 200);
        
        return () => clearInterval(interval);
      }
    }
  }, [open]);

  // Process NFC payment
  const processPayment = async (manualCardId?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      // Use manual card ID if provided, otherwise use the default one
      const cardIdToUse = manualCardId || cardId;
      
      // Validate that we have a valid shop ID before proceeding
      if (!shopId) {
        throw new Error("ไม่พบข้อมูลร้านค้า กรุณาเลือกร้านค้าก่อนทำรายการ");
      }
      
      console.log("Processing payment with:", {
        cardId: cardIdToUse,
        shopId: shopId,
        amount: amount
      });
      
      const response = await apiRequest("POST", API.NFC_PAYMENT, {
        cardId: cardIdToUse,
        shopId: shopId,
        amount: amount
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for specific error type for card not found
        if (errorData.error === "card_not_found") {
          throw new Error("หมายเลขบัตรไม่ถูกต้อง กรุณาตรวจสอบหมายเลขบัตรอีกครั้ง");
        } else {
          throw new Error(errorData.message || "การชำระเงินล้มเหลว");
        }
      }
      
      const result = await response.json();
      
      // Wait a bit to show the processing state
      setTimeout(() => {
        setStatus("ชำระเงินสำเร็จ!");
        setProgress(100);
        
        // Wait another moment before closing
        setTimeout(() => {
          onSuccess(result);
        }, 1000);
      }, 1000);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "การชำระเงินล้มเหลว",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "destructive"
      });
      setStatus("การชำระเงินล้มเหลว กรุณาลองอีกครั้ง");
      setIsProcessing(false);
      // Not closing automatically so the user can try again
    }
  };

  // For demo purposes, allow manual entry to trigger payment
  const handleManualEntry = () => {
    setShowManualEntry(true);
    setStatus("กรุณาป้อนหมายเลขบัตร NFC");
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
        title: "กรุณาป้อนหมายเลขบัตร",
        variant: "destructive"
      });
      return;
    }
    
    setStatus("กำลังทำรายการ...");
    setProgress(75);
    processPayment(cardId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) onClose();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">การชำระเงินด้วยบัตร NFC</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Wifi className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">ชำระเงินด้วยบัตร NFC</h3>
            {!showManualEntry ? (
              <p className="text-gray-600">กรุณาแตะบัตร NFC ที่เครื่องอ่านบัตรเพื่อชำระเงิน</p>
            ) : (
              <p className="text-gray-600">กรุณาป้อนหมายเลขบัตร NFC ของคุณ</p>
            )}
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">ยอดรวม:</span>
              <span className="font-bold text-gray-800">{amount} เหรียญ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ร้านค้า:</span>
              <span className="text-gray-800">{shopName}</span>
            </div>
          </div>

          {showManualEntry ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                หมายเลขบัตร NFC
              </label>
              <Input
                ref={cardInputRef}
                type="text"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="กรอกหมายเลขบัตร"
                className="mb-4"
              />
            </div>
          ) : (
            <div className="relative mb-6">
              <Progress value={progress} className="h-2" />
              <div className="mt-2 text-sm text-gray-600">{status}</div>
            </div>
          )}
          
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              ยกเลิก
            </Button>
            {!showManualEntry ? (
              <Button 
                className="flex-1" 
                onClick={handleManualEntry}
                disabled={isProcessing}
              >
                ป้อนด้วยตนเอง
              </Button>
            ) : (
              <Button 
                className="flex-1" 
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
