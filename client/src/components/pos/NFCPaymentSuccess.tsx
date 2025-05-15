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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">การชำระเงินสำเร็จ</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">การชำระเงินสำเร็จ</h3>
            <p className="text-gray-600">การชำระเงินของคุณเสร็จสมบูรณ์แล้ว</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">ยอดเงินที่ชำระ:</span>
              <span className="font-bold text-gray-800">
                {paymentResult.transaction?.amount || 0} เหรียญ
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">บัตร:</span>
              <span className="text-gray-800">
                #{paymentResult.card?.cardId || "ไม่ทราบ"}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">ยอดเดิม:</span>
              <span className="text-gray-800">
                {paymentResult.transaction?.previousBalance !== undefined ? 
                 `${paymentResult.transaction.previousBalance} เหรียญ` : "ไม่มีข้อมูล"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ยอดคงเหลือ:</span>
              <span className="font-bold text-primary">
                {paymentResult.remainingBalance || 0} เหรียญ
              </span>
            </div>
          </div>

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
              onClick={handlePrintReceipt}
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