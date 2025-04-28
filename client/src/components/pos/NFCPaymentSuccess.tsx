import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Printer } from "lucide-react";

interface NFCPaymentSuccessProps {
  open: boolean;
  onClose: () => void;
  paymentResult: any;
}

const NFCPaymentSuccess = ({ open, onClose, paymentResult }: NFCPaymentSuccessProps) => {
  // Print receipt (not implemented, just for demo)
  const printReceipt = () => {
    window.print();
  };

  if (!paymentResult) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Successful</h3>
            <p className="text-gray-600">Your payment has been processed successfully</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-bold text-gray-800">
                {paymentResult.transaction?.amount || 0} Coins
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Card:</span>
              <span className="text-gray-800">
                #{paymentResult.card?.cardId || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className="font-bold text-primary">
                {paymentResult.remainingBalance || 0} Coins
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button 
              className="flex-1"
              onClick={printReceipt}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFCPaymentSuccess;
