import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Share2, ArrowLeft } from "lucide-react";

interface ReceiptPageProps {
  paymentResult: any;
  onClose: () => void;
  onCompleteClose: () => void; // ปิดทั้งหมด
}

const ReceiptPage: React.FC<ReceiptPageProps> = ({ 
  paymentResult, 
  onClose,
  onCompleteClose
}) => {
  // Check if payment result exists to avoid errors
  if (!paymentResult) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-500 text-center">ไม่พบข้อมูลการชำระเงิน</p>
          <Button onClick={onCompleteClose} className="mt-4 w-full">กลับ</Button>
        </div>
      </div>
    );
  }

  const printReceipt = () => {
    window.print();
  };

  const downloadReceipt = () => {
    // Implementation would depend on your needs
    alert("ดาวน์โหลดใบเสร็จ");
  };

  const shareReceipt = () => {
    // Implementation would depend on your needs
    alert("แชร์ใบเสร็จ");
  };

  // Format date and time in Thai locale
  const formatDate = (dateString: string | Date | undefined) => {
    try {
      const date = new Date(dateString || new Date());
      return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch (e) {
      return "ไม่มีข้อมูลวันที่";
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="flex flex-col min-h-screen">
        {/* Header with back button - hidden when printing */}
        <div className="bg-gray-50 p-4 print:hidden">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <Button variant="ghost" onClick={onClose} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={printReceipt}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={downloadReceipt}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={shareReceipt}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-lg border border-gray-200 print:border-0 print:shadow-none">
            {/* Receipt Header */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">ร้านค้า</h1>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Receipt Title */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold">ใบเสร็จรับเงิน</h2>
              <p className="text-gray-500 text-sm">
                วันที่: {formatDate(paymentResult.transaction?.timestamp)}
              </p>
              <p className="text-gray-500 text-sm">
                เลขที่อ้างอิง: {paymentResult.transaction?.id || "ไม่มีข้อมูล"}
              </p>
            </div>

            {/* Card Info */}
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">หมายเลขบัตร:</span>
                <span className="font-medium">#{paymentResult.card?.cardId || "ไม่ทราบ"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ประเภทบัตร:</span>
                <span className="font-medium">{paymentResult.card?.type || "บัตรเติมเงิน"}</span>
              </div>
            </div>

            {/* Items Purchased (New section) */}
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">รายการสินค้า</h3>
              {paymentResult.cart && paymentResult.cart.length > 0 ? (
                <div className="space-y-2">
                  {paymentResult.cart.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <span className="text-gray-800">{item.product.name}</span>
                        <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                      </div>
                      <span className="text-gray-800">{item.product.price * item.quantity} เหรียญ</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-gray-500 text-center italic">ไม่มีข้อมูลรายการสินค้า</div>
              )}
            </div>

            {/* Transaction Details */}
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">รายละเอียดการชำระเงิน</h3>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">ยอดเดิม:</span>
                <span className="text-gray-800">
                  {paymentResult.transaction?.previousBalance !== undefined ? 
                  `${paymentResult.transaction.previousBalance} เหรียญ` : "ไม่มีข้อมูล"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">ยอดเงินที่ชำระ:</span>
                <span className="font-bold text-gray-800">
                  {paymentResult.transaction?.amount || 0} เหรียญ
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">ยอดคงเหลือ:</span>
                <span className="font-bold text-emerald-600">
                  {paymentResult.remainingBalance || 0} เหรียญ
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-4"></div>

            {/* Thank You Message */}
            <div className="text-center mb-4">
              <p className="text-gray-700">ขอบคุณที่ใช้บริการ</p>
              <p className="text-xs text-gray-500 mt-1">เอกสารนี้เป็นหลักฐานการชำระเงิน</p>
            </div>

            {/* Close button (only visible when not printing) */}
            <div className="mt-6 print:hidden">
              <Button 
                variant="default"
                className="w-full"
                onClick={onCompleteClose}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;