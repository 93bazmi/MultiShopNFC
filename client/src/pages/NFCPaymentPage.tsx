import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Wifi, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NFCPaymentPage = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ shopId: string; amount: string }>("/payment/:shopId/:amount");
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("กำลังรอบัตร...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState("");
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [shopName, setShopName] = useState<string>("");
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Get shop info and amount from params
  const shopId = params?.shopId ? parseInt(params.shopId) : 0;
  const amount = params?.amount ? parseInt(params.amount) : 0;

  useEffect(() => {
    if (!match) {
      // Redirect if no match
      setLocation("/shops");
      return;
    }
    
    // Get shop info
    if (shopId) {
      const fetchShop = async () => {
        try {
          const shop = await apiRequest(`/api/shops/${shopId}`, { method: "GET" });
          if (shop) {
            setShopName(shop.name);
          }
        } catch (error) {
          console.error("Error fetching shop:", error);
          toast({
            title: "ไม่สามารถดึงข้อมูลร้านค้าได้",
            variant: "destructive",
          });
        }
      };
      
      fetchShop();
    }
    
    // Setup the payment simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 1;
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [shopId, match, setLocation, toast]);

  const processPayment = async (manualCardId?: string) => {
    const cardToUse = manualCardId || cardId;
    
    if (!cardToUse) {
      setError({
        title: "กรุณาป้อนหมายเลขบัตร",
        message: "คุณต้องป้อนหมายเลขบัตร NFC เพื่อดำเนินการชำระเงิน"
      });
      return;
    }
    
    setIsProcessing(true);
    setProgress(50);
    setStatus("กำลังดำเนินการ...");
    
    try {
      const response = await apiRequest("/api/nfc-payment", {
        method: "POST",
        body: JSON.stringify({
          cardId: cardToUse,
          shopId,
          amount
        })
      });
      
      setProgress(100);
      setStatus("สำเร็จ!");
      
      // Navigate to success page with payment result
      setLocation(`/payment-success?result=${encodeURIComponent(JSON.stringify(response))}`);
    } catch (error: any) {
      console.error("Payment error:", error);
      setProgress(0);
      
      const errorMessage = error.message || "ไม่สามารถดำเนินการชำระเงินได้";
      const errorDetails = error.details || "กรุณาลองอีกครั้ง";
      
      setError({
        title: errorMessage,
        message: errorDetails
      });
      
      // Show error as toast
      const errorLines = [
        errorMessage,
        errorDetails
      ];
      
      toast({
        title: "การชำระเงินล้มเหลว",
        description: (
          <div className="mt-2 bg-red-50 p-3 rounded-md border border-red-200">
            {error.error === "card_not_found" && (
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
      
      setStatus("การชำระเงินล้มเหลว กรุณาลองอีกครั้ง");
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => {
    if (!isProcessing) {
      setLocation("/shops");
    }
  };

  const handleManualPayment = () => {
    processPayment(cardId);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="my-4">
        <CardHeader>
          <CardTitle className="text-center">ชำระเงินด้วยบัตร NFC</CardTitle>
          <CardDescription className="text-center">
            กรุณาแตะบัตรที่เครื่องอ่าน หรือป้อนหมายเลขบัตรด้วยตนเอง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 md:mb-6 bg-blue-50 rounded-full p-4 md:p-6 relative">
              <div className={`
                animate-ping absolute inset-0 m-auto 
                rounded-full border-4 border-blue-400 
                h-10 w-10 md:h-12 md:w-12 opacity-75
              `}></div>
              <Wifi className="h-10 w-10 md:h-12 md:w-12 text-blue-500 relative z-10" />
            </div>

            <div className="w-full mb-4 md:mb-6">
              <h3 className="font-semibold text-base md:text-lg mb-1">
                {shopName || "ร้านค้า"}
              </h3>
              <div className="text-xl md:text-2xl font-bold mb-2">
                {amount} เหรียญ
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-xs md:text-sm text-gray-500">{status}</p>
            </div>

            {error && (
              <div className="w-full p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-3 md:mb-4 text-xs md:text-sm">
                <div className="flex items-center mb-1">
                  <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  <span className="font-medium">{error.title}</span>
                </div>
                <p className="text-xs text-red-500">{error.message}</p>
              </div>
            )}

            {!showManualEntry ? (
              <>
                <Button
                  variant="outline"
                  className="mb-2 w-full text-xs md:text-sm"
                  onClick={() => setShowManualEntry(true)}
                  disabled={isProcessing}
                >
                  ใส่หมายเลขบัตรด้วยตนเอง
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs md:text-sm"
                  onClick={handleGoBack}
                  disabled={isProcessing}
                >
                  ยกเลิก
                </Button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <Input
                    placeholder="ใส่หมายเลขบัตร NFC"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    ref={cardInputRef}
                    className="text-center"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500">เช่น SWT-1, SWT-2</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualEntry(false)}
                    disabled={isProcessing}
                    className="text-xs md:text-sm"
                  >
                    ยกเลิก
                  </Button>
                  
                  <Button
                    disabled={!cardId.trim() || isProcessing}
                    onClick={handleManualPayment}
                    className="text-xs md:text-sm"
                  >
                    ชำระเงิน
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFCPaymentPage;