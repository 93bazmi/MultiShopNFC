import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";

const SimplePOS = () => {
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState("");
  const [progress, setProgress] = useState(0);
  const [showNfcProcess, setShowNfcProcess] = useState(false);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const { toast } = useToast();

  // Check if form is valid
  const isFormValid = () => {
    return amount && !isNaN(Number(amount)) && Number(amount) > 0;
  };

  // Handle payment process
  const handlePayment = async () => {
    if (!isFormValid()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setShowNfcProcess(true);
    setStatus("Waiting for NFC card...");
    setProgress(25);
    setProcessing(true);

    // In a real app, here we would wait for the NFC reader to provide a card
    // For demo, we'll simulate it with a timer
    setTimeout(() => {
      // For demo, use a hardcoded card if none is provided
      const actualCardId = cardId || "NFC001";
      setStatus(`Card ${actualCardId} detected. Processing payment...`);
      setProgress(75);

      // Process the payment
      processPayment(actualCardId, Number(amount));
    }, 1500);
  };

  // Process the payment with the NFC card
  const processPayment = async (nfcCardId: string, paymentAmount: number) => {
    try {
      // Make API call to process payment
      const response = await apiRequest("POST", API.NFC_PAYMENT, {
        cardId: nfcCardId,
        shopId: 1, // Default shop ID
        amount: paymentAmount
      });

      const result = await response.json();
      setPaymentResult(result);
      setStatus("Payment successful!");
      setProgress(100);

      toast({
        title: "Payment completed",
        description: `Payment of ${paymentAmount} coins was successful. Remaining balance: ${result.remainingBalance} coins.`,
        variant: "default"
      });

      // Reset after payment
      setTimeout(() => {
        setAmount("");
        setCardId("");
        setShowNfcProcess(false);
        setProcessing(false);
        setProgress(0);
      }, 3000);

    } catch (error) {
      setStatus("Payment failed");
      setProgress(0);
      
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Could not process payment",
        variant: "destructive"
      });

      setTimeout(() => {
        setShowNfcProcess(false);
        setProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">NFC Payment System</CardTitle>
          <CardDescription className="text-center">Enter amount and tap NFC card to pay</CardDescription>
        </CardHeader>
        <CardContent>
          {showNfcProcess ? (
            // NFC Processing UI
            <div className="text-center">
              <div className="mb-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-2xl">
                    <path d="M2 8l2 2-2 2 2 2-2 2"></path>
                    <path d="M8 8l4 8"></path>
                    <path d="M14 8l-4 8"></path>
                    <path d="M20 8l2 2-2 2 2 2-2 2"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">NFC Payment</h3>
                <p className="text-gray-600 mb-4">Amount: {amount} Coins</p>
              </div>

              <div className="relative mb-8">
                <Progress value={progress} className="h-3" />
                <div className="mt-3 text-sm text-gray-600">{status}</div>
              </div>

              {paymentResult && (
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-green-800 font-medium">Payment Successful!</p>
                  <p className="text-green-700">Remaining balance: {paymentResult.remainingBalance} Coins</p>
                </div>
              )}

              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => {
                  setShowNfcProcess(false);
                  setProcessing(false);
                  setProgress(0);
                }}
                disabled={processing}
              >
                {processing ? "Processing..." : "Cancel"}
              </Button>
            </div>
          ) : (
            // Payment Input UI
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Coins)
                  </label>
                  <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card ID (Optional)
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Enter card ID or tap card" 
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to use default card (NFC001) for testing
                  </p>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  onClick={handlePayment}
                  disabled={!isFormValid()}
                >
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePOS;