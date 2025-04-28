import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";

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
  const [status, setStatus] = useState("Waiting for card...");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setProgress(0);
      setStatus("Waiting for card...");
      setIsProcessing(false);
      
      // Simulate NFC card detection
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = Math.min(prev + 5, 100);
          
          // When progress is at 75%, simulate a card detection
          if (prev < 75 && next >= 75) {
            setStatus("Card detected, processing...");
            processPayment();
          }
          
          return next;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [open]);

  // Process NFC payment
  const processPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      // In a real app, the cardId would come from the NFC reader
      // For demo purposes, we're using a hardcoded card ID
      const cardId = "8742";
      
      const response = await apiRequest("POST", API.NFC_PAYMENT, {
        cardId,
        shopId,
        amount
      });
      
      const result = await response.json();
      
      // Wait a bit to show the processing state
      setTimeout(() => {
        setStatus("Payment successful!");
        setProgress(100);
        
        // Wait another moment before closing
        setTimeout(() => {
          onSuccess(result);
        }, 1000);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setStatus("Payment failed. Please try again.");
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  // For demo purposes, allow manual entry to trigger payment
  const handleManualEntry = () => {
    setStatus("Card detected, processing...");
    setProgress(75);
    processPayment();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Wifi className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">NFC Payment</h3>
            <p className="text-gray-600">Please tap your NFC card on the reader to complete payment</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-gray-800">{amount} Coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shop:</span>
              <span className="text-gray-800">{shopName}</span>
            </div>
          </div>

          <div className="relative mb-6">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 text-sm text-gray-600">{status}</div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleManualEntry}
              disabled={isProcessing}
            >
              Manual Entry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFCPaymentModal;
