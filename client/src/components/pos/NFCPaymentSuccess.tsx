import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Printer } from "lucide-react";

interface NFCPaymentSuccessProps {
  open: boolean;
  onClose: () => void;
  paymentResult: any;
  onPrintReceipt: () => void; // เพิ่ม prop ใหม่
}

const NFCPaymentSuccess = ({ 
  open, 
  onClose, 
  paymentResult,
  onPrintReceipt // รับ prop ใหม่
}: NFCPaymentSuccessProps) => {
  // Print receipt
  const handlePrintReceipt = () => {
    onPrintReceipt(); // เรียกใช้ฟังก์ชันที่รับมาจาก prop
  };

  if (!paymentResult) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">การชำระเงินสำเร็จ</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <Check className="text-green-600 text-xl md:text-2xl" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">การชำระเงินสำเร็จ</h3>
            <p className="text-sm md:text-base text-gray-600">การชำระเงินของคุณเสร็จสมบูรณ์แล้ว</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
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
              onClick={onClose}
            >
              ปิด
            </Button>
            <Button 
              className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
              onClick={handlePrintReceipt}
            >
              <Printer className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              พิมพ์ใบเสร็จ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFCPaymentSuccess;