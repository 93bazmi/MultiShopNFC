import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Printer, CreditCard, CalendarClock, Store } from "lucide-react";

interface NFCPaymentSuccessProps {
  open: boolean;
  onClose: () => void;
  paymentResult: any;
}

const NFCPaymentSuccess = ({ open, onClose, paymentResult }: NFCPaymentSuccessProps) => {
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

  if (!paymentResult) return null;

  // Generate transaction ID
  const transactionId = paymentResult.transaction?.id || 
    `TXN${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">การชำระเงินสำเร็จ</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          {/* Success header */}
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Check className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">การชำระเงินสำเร็จ</h3>
            <p className="text-gray-600 text-sm">เลขที่รายการ: {transactionId}</p>
          </div>

          {/* Receipt card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            {/* Store info */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-center">
                <Store className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">{paymentResult.merchant?.name || "ร้านค้า NFC"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatDate()}</p>
            </div>

            {/* Payment details */}
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-gray-600">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                    <span>บัตร #{paymentResult.card?.cardId || "ไม่ทราบ"}</span>
                  </div>
                  <span className="text-gray-800 text-sm">
                    {paymentResult.card?.type || ""}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-t border-dashed border-gray-200">
                  <span className="text-gray-600">ยอดเดิม</span>
                  <span className="text-gray-800">
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

                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-gray-600">ยอดคงเหลือ</span>
                  <span className="font-medium text-primary">
                    {paymentResult.remainingBalance || 0} เหรียญ
                  </span>
                </div>
              </div>
            </div>

            {/* Additional info */}
            {paymentResult.transaction?.note && (
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500">{paymentResult.transaction.note}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              ปิด
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
      </DialogContent>
    </Dialog>
  );
};

export default NFCPaymentSuccess;