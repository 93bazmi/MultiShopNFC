import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Share2, ArrowLeft } from "lucide-react";

interface ReceiptPageProps {
  paymentResult: any;
  onClose: () => void;
  onCompleteClose: () => void;
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
        <div className="w-full max-w-xs mx-auto bg-white p-3 rounded-lg shadow-lg">
          <p className="text-red-500 text-center text-sm">ไม่พบข้อมูลการชำระเงิน</p>
          <Button onClick={onCompleteClose} className="mt-3 w-full text-xs">กลับ</Button>
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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return "ไม่มีข้อมูลวันที่";
    }
  };

  // Add print styles directly in the component
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: 55mm auto;
          margin: 0;
        }
        body {
          width: 55mm;
          margin: 0;
          padding: 0;
        }
        .receipt-content {
          width: 55mm;
          padding: 3mm;
          font-size: 9pt;
        }
        .receipt-title {
          font-size: 10pt;
        }
        .store-name {
          font-size: 12pt;
        }
        .text-small {
          font-size: 8pt;
        }
        .text-xs {
          font-size: 7pt;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="flex flex-col items-center min-h-screen">
        {/* Header with back button - hidden when printing */}
        <div className="bg-gray-50 p-2 w-full print:hidden">
          <div className="max-w-xs mx-auto flex justify-between items-center">
            <Button variant="ghost" onClick={onClose} size="sm" className="flex items-center text-xs">
              <ArrowLeft className="mr-1 h-3 w-3" />
              กลับ
            </Button>
            <div className="flex space-x-1">
              <Button 
                variant="outline"
                size="sm"
                onClick={printReceipt}
                className="h-7 w-7 p-0"
              >
                <Printer className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={downloadReceipt}
                className="h-7 w-7 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={shareReceipt}
                className="h-7 w-7 p-0"
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="flex-grow flex items-start justify-center p-2 w-full">
          <div className="w-full max-w-xs mx-auto bg-white p-3 rounded-lg border border-gray-200 print:border-0 print:shadow-none receipt-content">
            {/* Receipt Header */}
            <div className="text-center mb-2">
              <h1 className="text-base font-bold text-gray-800 store-name">ร้านค้า</h1>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* Receipt Title */}
            <div className="text-center mb-2">
              <h2 className="text-sm font-semibold receipt-title">ใบเสร็จรับเงิน</h2>
              <p className="text-gray-500 text-xs text-small">
                {formatDate(paymentResult.transaction?.timestamp)}
              </p>
              <p className="text-gray-500 text-xs text-small">
                REF: {paymentResult.transaction?.id || "ไม่มีข้อมูล"}
              </p>
            </div>

            {/* Card Info */}
            <div className="bg-gray-50 p-2 rounded-md mb-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">บัตร:</span>
                <span className="font-medium">#{paymentResult.card?.cardId || "ไม่ทราบ"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ประเภท:</span>
                <span className="font-medium">{paymentResult.card?.type || "บัตรเติมเงิน"}</span>
              </div>
            </div>

            {/* Items Purchased */}
            <div className="mb-2">
              <h3 className="text-xs font-semibold mb-1">รายการสินค้า</h3>
              {paymentResult.cart && paymentResult.cart.length > 0 ? (
                <div className="space-y-1">
                  {paymentResult.cart.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 border-b border-gray-100 text-xs">
                      <div className="flex-1">
                        <span className="text-gray-800">{item.product.name}</span>
                        <span className="text-gray-500 text-xs ml-1">x{item.quantity}</span>
                      </div>
                      <span className="text-gray-800">{item.product.price * item.quantity} ฿</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-1 text-gray-500 text-center italic text-xs">ไม่มีข้อมูลรายการสินค้า</div>
              )}
            </div>

            {/* Transaction Details */}
            <div className="mb-2">
              <h3 className="text-xs font-semibold mb-1">รายละเอียดการชำระเงิน</h3>
              <div className="flex justify-between py-1 border-b border-gray-100 text-xs">
                <span className="text-gray-600">ยอดเดิม:</span>
                <span className="text-gray-800">
                  {paymentResult.transaction?.previousBalance !== undefined ? 
                  `${paymentResult.transaction.previousBalance} ฿` : "ไม่มีข้อมูล"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 text-xs">
                <span className="text-gray-600">ยอดเงินที่ชำระ:</span>
                <span className="font-bold text-gray-800">
                  {paymentResult.transaction?.amount || 0} ฿
                </span>
              </div>
              <div className="flex justify-between py-1 text-xs">
                <span className="text-gray-600">ยอดคงเหลือ:</span>
                <span className="font-bold text-emerald-600">
                  {paymentResult.remainingBalance || 0} ฿
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* Thank You Message */}
            <div className="text-center mb-2">
              <p className="text-gray-700 text-xs">ขอบคุณที่ใช้บริการ</p>
              <p className="text-xs text-gray-500 mt-1 text-xs">เอกสารนี้เป็นหลักฐานการชำระเงิน</p>
            </div>

            {/* Close button (only visible when not printing) */}
            <div className="mt-3 print:hidden">
              <Button 
                variant="default"
                className="w-full text-xs h-8"
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