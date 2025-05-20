import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, XCircle } from "lucide-react";
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
  const [status, setStatus] = useState("Reading card...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState(""); // ไม่กำหนดค่าเริ่มต้น ให้ผู้ใช้กรอกเอง
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setProgress(0);
      setStatus("Reading card...");
      setIsProcessing(false);
      setShowManualEntry(false);
      
      if (!showManualEntry) {
        // Simulate NFC card detection progress but don't auto-process
        const interval = setInterval(() => {
          setProgress(prev => {
            const next = Math.min(prev + 5, 75); // Only up to 75%
            
            // When progress is at 75%, just show waiting for card
            if (prev < 75 && next >= 75) {
              setStatus("Please enter your card number");
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
        throw new Error("Store information not found. Please select a store before making a purchase.");
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
          setStatus("NFC card not found");
          
          // ปรับข้อความแสดงความผิดพลาดให้สวยงามขึ้น
          const errorMessage = `${errorData.message}\n${errorData.details || ""}`;
          
          // ใช้ error object ที่มีข้อมูลเพิ่มเติม
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).icon = <XCircle className="h-6 w-6 text-red-500" />;
          (enhancedError as any).isCardError = true;
          
          throw enhancedError;
        } else {
          throw new Error(errorData.message || "Payment failed");
        }
      }
      
      const result = await response.json();
      
      // Wait a bit to show the processing state
      setTimeout(() => {
        setStatus("Payment Success!");
        setProgress(100);
        
        // Wait another moment before closing
        setTimeout(() => {
          onSuccess(result);
        }, 1000);
      }, 1000);
      
    } catch (error) {
      console.error("Payment error:", error);
      // ปรับปรุงการแสดงข้อความผิดพลาด
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      
      // แบ่งข้อความตามบรรทัดใหม่ถ้ามี
      const errorLines = errorMessage.split('\n');
      
      // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับบัตรหรือไม่
      const isCardError = (error as any)?.isCardError;
      
      toast({
        title: "Payment failed",
        description: (
          <div className="space-y-2">
            {isCardError && (
              <div className="flex justify-center mb-2">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            )}
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
      setStatus("Payment failed. Please try again.");
      setIsProcessing(false);
      // Not closing automatically so the user can try again
    }
  };

  // For demo purposes, allow manual entry to trigger payment
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
    processPayment(cardId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) onClose();
    }}>
      <DialogContent className="max-w-md p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">Pay with NFC Card</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <Wifi className="text-primary text-xl md:text-2xl" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Pay with NFC Card</h3>
            {!showManualEntry ? (
              <p className="text-sm md:text-base text-gray-600">กPlease place your NFC card to the reader</p>
            ) : (
              <p className="text-sm md:text-base text-gray-600">Please enter your NFC card number</p>
            )}
          </div>
          
          <div className="border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm md:text-base text-gray-600">Total:</span>
              <span className="text-sm md:text-base font-bold text-gray-800">{amount} Coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm md:text-base text-gray-600">Store:</span>
              <span className="text-sm md:text-base text-gray-800">{shopName}</span>
            </div>
          </div>

          {showManualEntry ? (
            <div className="mb-4 md:mb-6">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 text-left">
                NFC Card Number
              </label>
              <Input
                ref={cardInputRef}
                type="text"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="Enter card number"
                className="mb-4 text-sm"
              />
            </div>
          ) : (
            <div className="relative mb-4 md:mb-6">
              <Progress value={progress} className="h-2" />
              <div className="mt-2 text-xs md:text-sm text-gray-600">{status}</div>
            </div>
          )}
          
          <div className="flex space-x-3 md:space-x-4">
            <Button 
              variant="outline" 
              className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {!showManualEntry ? (
              <Button 
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10" 
                onClick={handleManualEntry}
                disabled={isProcessing}
              >
                Manual Input
              </Button>
            ) : (
              <Button 
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10" 
                onClick={handleProcessManualEntry}
                disabled={isProcessing}
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFCPaymentModal;
