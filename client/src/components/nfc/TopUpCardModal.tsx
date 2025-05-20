import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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
  const [status, setStatus] = useState("Reading card...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState(""); 
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setProgress(0);
      setStatus("Reading card...");
      setIsProcessing(false);
      setShowManualEntry(false);
      setCardId("");

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

  // Process Topup transaction
  const processTopup = async (manualCardId?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Use manual card ID if provided, otherwise use the default one
      const cardIdToUse = manualCardId || cardId;

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
          onSuccess(result);
        }, 1000);
      }, 1000);

    } catch (error) {
      console.error("Topup error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorLines = errorMessage.split('\n');

      toast({
        title: "Topup failed",
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
      setStatus("Topup failed. Please try again.");
      setIsProcessing(false);
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
      if (!isOpen && !isProcessing) onClose();
    }}>
      <DialogContent className="max-w-md p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">Topup NFC Card</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <PlusCircle className="text-green-600 text-xl md:text-2xl" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">เติมเงินบัตร NFC</h3>
            {!showManualEntry ? (
              <p className="text-sm md:text-base text-gray-600">กรุณาแตะบัตร NFC ที่เครื่องอ่าน</p>
            ) : (
              <p className="text-sm md:text-base text-gray-600">กรุณากรอกหมายเลขบัตร NFC</p>
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
              ยกเลิก
            </Button>
            {!showManualEntry ? (
              <Button 
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10" 
                onClick={handleManualEntry}
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