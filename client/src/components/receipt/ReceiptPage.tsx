import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Printer, CreditCard, Store, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface ReceiptPageProps {
  paymentResult: any;
  onBack: () => void;
}

const ReceiptPage = ({ paymentResult, onBack }: ReceiptPageProps) => {
  useEffect(() => {
    // Scroll to top when receipt page is displayed
    window.scrollTo(0, 0);
  }, []);

  // Format date for receipt
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Print receipt
  const printReceipt = () => {
    window.print();
  };

  if (!paymentResult) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-gray-500 mb-4">ไม่พบข้อมูลการชำระเงิน</p>
      <Button onClick={onBack}>กลับสู่หน้าหลัก</Button>
    </div>
  );

  // Generate transaction ID
  const transactionId = paymentResult.transaction?.id ||
    `TXN${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden print:shadow-none">
        {/* Receipt Header */}
        <div className="p-6 print:pb-0">
          <div className="flex justify-between items-start">
            <button 
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 print:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 print:w-12 print:h-12">
                <Check className="text-green-600 w-8 h-8 print:w-6 print:h-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 print:text-xl">ใบเสร็จรับเงิน</h1>
              <p className="text-gray-500 text-sm mt-1">เลขที่รายการ: {transactionId}</p>
            </div>
            <div className="w-5"></div> {/* Empty div for flex balance */}
          </div>
        </div>

        {/* Store Information */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-center">
            <Store className="h-5 w-5 text-primary mr-2" />
            <span className="font-medium">{paymentResult.merchant?.name || "ร้านค้า NFC"}</span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-1">{formatDate()}</p>
        </div>

        {/* Receipt Content */}
        <div className="px-6 py-5">
          {/* Card Information */}
          <div className="flex justify-between items-center mb-5 pb-2 border-b border-dashed border-gray-200">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-gray-600">บัตร #{paymentResult.card?.cardId || "ไม่ทราบ"}</span>
            </div>
            <span className="text-gray-700">
              {paymentResult.card?.type || ""}
            </span>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">ยอดเดิม</span>
              <span className="text-gray-800 font-medium">
                {paymentResult.transaction?.previousBalance !== undefined ?
                  `${paymentResult.transaction.previousBalance} เหรียญ` : "ไม่มีข้อมูล"}
              </span>
            </div>

            <div className="flex justify-between py-2 border-t border-dashed border-gray-200">
              <span className="text-gray-600">ยอดเงินที่ชำระ</span>
              <span className="font-bold text-gray-800">
                {paymentResult.transaction?.amount || 0} เหรียญ
              </span>
            </div>

            <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
              <span className="text-gray-700 font-medium">ยอดคงเหลือ</span>
              <span className="font-semibold text-primary text-lg">
                {paymentResult.remainingBalance || 0} เหรียญ
              </span>
            </div>
          </div>

          {/* Additional Notes */}
          {paymentResult.transaction?.note && (
            <div className="mt-5 p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600">{paymentResult.transaction.note}</p>
            </div>
          )}
        </div>

        {/* Receipt Footer */}
        <div className="px-6 py-4 border-t border-gray-200 print:hidden">
          <div className="flex space-x-4 justify-center">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าหลัก
            </Button>
            <Button
              className="flex-1"
              onClick={printReceipt}
            >
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์ใบเสร็จ
            </Button>
          </div>
        </div>

        {/* Printable footer - only visible when printing */}
        <div className="hidden print:block border-t border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">ขอบคุณที่ใช้บริการ</p>
          <p className="text-xs text-gray-400 mt-1">พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;