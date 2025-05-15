import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { useSearchParams } from "@/hooks/use-search-params";

const ReceiptPage = () => {
  const [, setLocation] = useLocation();
  const { getParam } = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [currentDate] = useState<Date>(new Date());

  useEffect(() => {
    const dataParam = getParam("data");
    
    if (!dataParam) {
      // If no receipt data, redirect to shops
      setLocation("/shops");
      return;
    }
    
    try {
      const data = JSON.parse(decodeURIComponent(dataParam));
      setPaymentData(data);
    } catch (error) {
      console.error("Error parsing receipt data:", error);
      setLocation("/shops");
    }
  }, [getParam, setLocation]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    setLocation("/shops");
  };

  if (!paymentData) {
    return null;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-md mx-auto print:max-w-full">
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">ใบเสร็จรับเงิน</h1>
        <p className="text-gray-500">ระบบชำระเงินด้วยบัตร NFC</p>
      </div>
      
      <Card className="my-4 print:shadow-none print:border-none">
        <CardHeader className="border-b print:pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg md:text-xl print:text-2xl">ใบเสร็จรับเงิน</CardTitle>
              <CardDescription>
                วันที่: {formatDate(currentDate)} เวลา: {formatTime(currentDate)}
              </CardDescription>
            </div>
            <div className="print:hidden">
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">ข้อมูลร้านค้า</h3>
            <div className="bg-gray-50 p-3 rounded-md print:bg-white print:border print:border-gray-200">
              <p className="font-medium">{paymentData.transaction?.shopName || "ไม่ระบุ"}</p>
              <p className="text-sm text-gray-600">รหัสร้านค้า: {paymentData.transaction?.shopId || "ไม่ระบุ"}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">ข้อมูลบัตร</h3>
            <div className="bg-gray-50 p-3 rounded-md print:bg-white print:border print:border-gray-200">
              <p className="font-medium">บัตร NFC: {paymentData.card?.cardId || "ไม่ทราบ"}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">รายละเอียดการชำระเงิน</h3>
            <div className="border rounded-md divide-y">
              <div className="p-3 flex justify-between">
                <span className="text-gray-700">ยอดเงินก่อนชำระ:</span>
                <span>{paymentData.transaction?.previousBalance || 0} เหรียญ</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-gray-700">จำนวนที่ชำระ:</span>
                <span className="font-medium">{paymentData.transaction?.amount || 0} เหรียญ</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-gray-700">ยอดเงินคงเหลือ:</span>
                <span className="font-bold">{paymentData.remainingBalance || 0} เหรียญ</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">สถานะ</h3>
            <div className="bg-green-50 text-green-800 p-3 rounded-md font-medium text-center print:bg-white print:border print:border-green-200">
              ชำระเงินเรียบร้อย
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 pt-4 print:pt-8 print:text-sm">
            <p>เอกสารนี้ออกโดยระบบอัตโนมัติ</p>
            <p>ขอบคุณที่ใช้บริการ</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-6 border-t print:hidden">
          <Button
            variant="outline"
            onClick={handleBack}
            className="text-xs md:text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับหน้าหลัก
          </Button>
          
          <Button
            onClick={handlePrint}
            className="text-xs md:text-sm"
          >
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์ใบเสร็จ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReceiptPage;