import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "@/hooks/use-search-params";

const PaymentSuccessPage = () => {
  const [, setLocation] = useLocation();
  const { getParam } = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    const resultParam = getParam("result");
    
    if (!resultParam) {
      // If no payment result, redirect to shops
      setLocation("/shops");
      return;
    }
    
    try {
      const result = JSON.parse(decodeURIComponent(resultParam));
      setPaymentResult(result);
    } catch (error) {
      console.error("Error parsing payment result:", error);
      setLocation("/shops");
    }
  }, [getParam, setLocation]);

  const handleClose = () => {
    setLocation("/shops");
  };

  const handlePrintReceipt = () => {
    if (paymentResult) {
      setLocation(`/receipt?data=${encodeURIComponent(JSON.stringify(paymentResult))}`);
    }
  };

  if (!paymentResult) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="my-4">
        <CardHeader>
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <Check className="text-green-600 text-xl md:text-2xl" />
          </div>
          <CardTitle className="text-center">การชำระเงินสำเร็จ</CardTitle>
          <CardDescription className="text-center">
            การชำระเงินของคุณเสร็จสมบูรณ์แล้ว
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-3 md:p-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs md:text-sm text-gray-600">ยอดเงินที่ชำระ:</span>
              <span className="text-xs md:text-sm font-bold text-gray-800">
                {paymentResult.transaction?.amount || 0} เหรียญ
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-xs md:text-sm text-gray-600">บัตร:</span>
              <span className="text-xs md:text-sm text-gray-800">
                #{paymentResult.card?.cardId || "ไม่ทราบ"}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-xs md:text-sm text-gray-600">ยอดเดิม:</span>
              <span className="text-xs md:text-sm text-gray-800">
                {paymentResult.transaction?.previousBalance !== undefined ? 
                 `${paymentResult.transaction.previousBalance} เหรียญ` : "ไม่มีข้อมูล"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">ยอดคงเหลือ:</span>
              <span className="text-xs md:text-sm font-bold text-primary">
                {paymentResult.remainingBalance || 0} เหรียญ
              </span>
            </div>
          </div>

          <div className="flex space-x-3 md:space-x-4">
            <Button 
              variant="outline"
              className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
              onClick={handleClose}
            >
              กลับหน้าหลัก
            </Button>
            <Button 
              className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
              onClick={handlePrintReceipt}
            >
              <Printer className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              พิมพ์ใบเสร็จ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;