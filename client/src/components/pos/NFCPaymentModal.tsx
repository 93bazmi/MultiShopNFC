import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, XCircle, WifiOff, AlertTriangle, CreditCard, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import useNFC from "@/hooks/use-nfc";
import TopupCardModal from "@/components/nfc/TopUpCardModal";

interface NFCPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  shopId: number;
  shopName: string;
  onSuccess: (result: any) => void;
}

const NFCPaymentModal = ({ 
  open, 
  onClose, 
  amount, 
  shopId, 
  shopName,
  onSuccess 
}: NFCPaymentModalProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("กำลังอ่านบัตร...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cardId, setCardId] = useState("");
  const { toast } = useToast();
  const cardInputRef = useRef<HTMLInputElement>(null);

  // ใช้ hook useNFC สำหรับการอ่านบัตร NFC จริง
  const { 
    isReading, 
    supportedNFC, 
    lastTagId, 
    startReading: startNFCReading, 
    stopReading: stopNFCReading,
    error: nfcError
  } = useNFC({
    onRead: (serialNumber) => {
      // เมื่ออ่านบัตรได้แล้ว ส่งไปประมวลผลการชำระเงิน
      console.log("NFC card read for payment:", serialNumber);
      setCardId(serialNumber);
      processPayment(serialNumber);
    }
  });

  useEffect(() => {
    if (open) {
      // รีเซ็ตสถานะเมื่อเปิดหน้าต่าง
      setProgress(0);
      setStatus("กำลังอ่านบัตร...");
      setIsProcessing(false);
      setShowManualEntry(false);
      setCardId("");

      // ตรวจสอบการรองรับ NFC
      if (!supportedNFC) {
        setStatus("อุปกรณ์ของคุณไม่รองรับ NFC");
        setShowManualEntry(true);
        return;
      }

      // เริ่มอ่านบัตร NFC จริงด้วย Web NFC API
      if (!showManualEntry) {
        startNFCReading();
        
        // แสดงความคืบหน้าการรอบัตร
        const interval = setInterval(() => {
          setProgress(prev => {
            // คงความคืบหน้าไว้ที่ 75% จนกว่าจะอ่านบัตรได้จริง
            return Math.min(prev + 5, 75);
          });
        }, 200);

        return () => {
          clearInterval(interval);
          stopNFCReading(); // หยุดการอ่านเมื่อออกจากหน้าต่าง
        };
      }
    }
  }, [open, supportedNFC, showManualEntry, startNFCReading, stopNFCReading]);

  // แสดงข้อความเตือนเมื่อมีข้อผิดพลาดจาก NFC API
  useEffect(() => {
    if (nfcError) {
      console.error("NFC error:", nfcError);
      setStatus("เกิดข้อผิดพลาดในการอ่านบัตร");
      toast({
        title: "เกิดข้อผิดพลาดในการอ่านบัตร",
        description: nfcError.message,
        variant: "destructive"
      });
      setShowManualEntry(true);
    }
  }, [nfcError, toast]);

  // State for handling insufficient balance
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [neededAmount, setNeededAmount] = useState(0);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  
  // Process NFC payment
  const processPayment = async (manualCardId?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setInsufficientBalance(false);
    
    try {
      // Use manual card ID if provided, otherwise use the default one
      const cardIdToUse = manualCardId || cardId;
      
      // Validate that we have a valid shop ID before proceeding
      if (!shopId) {
        throw new Error("ไม่พบข้อมูลร้านค้า กรุณาเลือกร้านค้าก่อนชำระเงิน");
      }
      
      console.log("Processing payment with:", {
        cardId: cardIdToUse,
        shopId: shopId,
        amount: amount
      });
      
      const response = await apiRequest("POST", API.NFC_PAYMENT, {
        cardId: cardIdToUse,
        shopId: shopId,
        amount: amount
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for specific error type for card not found
        if (errorData.error === "card_not_found") {
          setStatus("ไม่พบบัตร NFC ในระบบ");
          
          // ปรับข้อความแสดงความผิดพลาดให้สวยงามขึ้น
          const errorMessage = `${errorData.message}\n${errorData.details || ""}`;
          
          // ใช้ error object ที่มีข้อมูลเพิ่มเติม
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).icon = <XCircle className="h-6 w-6 text-red-500" />;
          (enhancedError as any).isCardError = true;
          
          throw enhancedError;
        } 
        // Check for insufficient balance
        else if (errorData.error === "insufficient_balance" || 
                 errorData.message?.includes("Insufficient balance")) {
          
          console.log("Insufficient balance detected", errorData);
          
          // Extract current balance from error message if available
          let balance = 0;
          if (errorData.currentBalance !== undefined) {
            balance = errorData.currentBalance;
          } else if (errorData.card?.balance !== undefined) {
            balance = errorData.card.balance;
          }
          
          // Show insufficient balance state
          setInsufficientBalance(true);
          setCurrentBalance(balance);
          setNeededAmount(amount - balance);
          setStatus("ยอดเงินในบัตรไม่เพียงพอ");
          setProgress(0);
          setIsProcessing(false);
          
          // Don't throw error here as we want to keep the modal open
          // with insufficient balance view
          return;
        } else {
          throw new Error(errorData.message || "การชำระเงินล้มเหลว");
        }
      }
      
      const result = await response.json();
      
      // Wait a bit to show the processing state
      setTimeout(() => {
        setStatus("ชำระเงินสำเร็จ!");
        setProgress(100);
        
        // Wait another moment before closing
        setTimeout(() => {
          onSuccess(result);
        }, 1000);
      }, 1000);
      
    } catch (error) {
      console.error("Payment error:", error);
      // ปรับปรุงการแสดงข้อความผิดพลาด
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      
      // แบ่งข้อความตามบรรทัดใหม่ถ้ามี
      const errorLines = errorMessage.split('\n');
      
      // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับบัตรหรือไม่
      const isCardError = (error as any)?.isCardError;
      
      toast({
        title: "การชำระเงินล้มเหลว",
        description: (
          <div className="space-y-2">
            {isCardError && (
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
      // Not closing automatically so the user can try again
    }
  };
  
  // Handle topup success
  const handleTopupSuccess = (result: any) => {
    setIsTopupModalOpen(false);
    
    toast({
      title: "เติมเงินสำเร็จ",
      description: `เติมเงินจำนวน ${result.topupAmount || result.amount} Coins เรียบร้อยแล้ว`,
      variant: "default"
    });
    
    // Reset insufficient balance state
    setInsufficientBalance(false);
    
    // Try payment again
    setStatus("กำลังลองชำระเงินอีกครั้ง...");
    processPayment(cardId);
  };

  // For demo purposes, allow manual entry to trigger payment
  const handleManualEntry = () => {
    setShowManualEntry(true);
    setStatus("Please enter your NFC card number");
    setProgress(0);
    
    // Focus on the input after showing it
    setTimeout(() => {
      if (cardInputRef.current) {
        cardInputRef.current.focus();
      }
    }, 100);
  };

  const handleProcessManualEntry = () => {
    if (!cardId.trim()) {
      toast({
        title: "Please enter your card number",
        variant: "destructive"
      });
      return;
    }
    
    setStatus("Processing transaction...");
    setProgress(75);
    processPayment(cardId);
  };

  return (
    <>
      {/* เปิด Topup Modal เมื่อต้องการเติมเงิน */}
      <TopupCardModal
        open={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        amount={Math.max(100, neededAmount)} // เติมขั้นต่ำ 100 หรือตามที่ต้องการ
        onSuccess={handleTopupSuccess}
      />
      
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && !isProcessing) {
          // ถ้าปิดหน้าต่าง ต้องหยุดการอ่านบัตรด้วย
          if (isReading) {
            stopNFCReading();
          }
          onClose();
        }
      }}>
        <DialogContent className="max-w-md p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="sr-only">ชำระเงินด้วยบัตร NFC</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <div className="mb-4 md:mb-6">
              <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                {insufficientBalance ? (
                  <CreditCard className="text-orange-500 text-xl md:text-2xl" />
                ) : !supportedNFC ? (
                  <WifiOff className="text-red-500 text-xl md:text-2xl" />
                ) : isReading ? (
                  <Wifi className="text-blue-500 text-xl md:text-2xl" />
                ) : (
                  <Wifi className="text-primary text-xl md:text-2xl" />
                )}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                {insufficientBalance ? "ยอดเงินไม่เพียงพอ" : "ชำระเงินด้วยบัตร NFC"}
              </h3>
              
              {insufficientBalance ? (
                <p className="text-sm md:text-base text-orange-600">
                  กรุณาเติมเงินในบัตรเพื่อทำรายการต่อ
                </p>
              ) : !supportedNFC ? (
                <p className="text-sm md:text-base text-red-500">
                  อุปกรณ์นี้ไม่รองรับ NFC หรือ Web NFC API
                </p>
              ) : !showManualEntry ? (
                <p className="text-sm md:text-base text-gray-600">กรุณาแตะบัตร NFC ที่ด้านหลังอุปกรณ์</p>
              ) : (
                <p className="text-sm md:text-base text-gray-600">กรุณากรอกหมายเลขบัตร NFC</p>
              )}
              
              {!supportedNFC && !insufficientBalance && (
                <p className="text-xs text-gray-500 mt-1">
                  Web NFC API รองรับเฉพาะบน Chrome บน Android เท่านั้น
                </p>
              )}
            </div>
            
            {/* ส่วนแสดงข้อมูลยอดเงินไม่เพียงพอ */}
            {insufficientBalance ? (
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm md:text-base text-gray-700">ยอดเงินในบัตร:</span>
                  <span className="text-sm md:text-base font-bold text-gray-800">{currentBalance} Coins</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm md:text-base text-gray-700">ยอดที่ต้องชำระ:</span>
                  <span className="text-sm md:text-base font-bold text-gray-800">{amount} Coins</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-orange-200">
                  <span className="text-sm md:text-base text-orange-700">ยอดเงินที่ต้องเติม:</span>
                  <span className="text-sm md:text-base font-bold text-orange-700">{neededAmount} Coins</span>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm md:text-base text-gray-600">ยอดรวม:</span>
                  <span className="text-sm md:text-base font-bold text-gray-800">{amount} Coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm md:text-base text-gray-600">ร้านค้า:</span>
                  <span className="text-sm md:text-base text-gray-800">{shopName}</span>
                </div>
              </div>
            )}

            {/* ส่วนป้อนข้อมูลบัตรด้วยตนเองหรือแสดง Progress */}
            {!insufficientBalance && (
              showManualEntry ? (
                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 text-left">
                    หมายเลขบัตร NFC
                  </label>
                  <Input
                    ref={cardInputRef}
                    type="text"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    placeholder="กรอกหมายเลขบัตร"
                    className="mb-4 text-sm"
                  />
                </div>
              ) : (
                <div className="relative mb-4 md:mb-6">
                  <Progress value={progress} className="h-2" />
                  <div className="mt-2 text-xs md:text-sm text-gray-600">
                    {status}
                    {isReading && <span className="ml-1 animate-pulse">...</span>}
                  </div>
                </div>
              )
            )}
            
            {/* ปุ่มดำเนินการ */}
            <div className="flex space-x-3 md:space-x-4">
              {/* ปุ่มยกเลิก */}
              <Button 
                variant="outline" 
                className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10"
                onClick={() => {
                  if (isReading) {
                    stopNFCReading();
                  }
                  onClose();
                }}
                disabled={isProcessing}
              >
                ยกเลิก
              </Button>
              
              {/* ปุ่มเติมเงินกรณียอดเงินไม่พอ */}
              {insufficientBalance ? (
                <Button 
                  className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10 bg-green-600 hover:bg-green-700 flex items-center justify-center" 
                  onClick={() => setIsTopupModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> เติมเงิน
                </Button>
              ) : !showManualEntry ? (
                <Button 
                  className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10" 
                  onClick={() => {
                    if (isReading) {
                      stopNFCReading();
                    }
                    handleManualEntry();
                  }}
                  disabled={isProcessing}
                >
                  กรอกเอง
                </Button>
              ) : (
                <Button 
                  className="flex-1 text-xs md:text-sm py-1 h-9 md:h-10" 
                  onClick={handleProcessManualEntry}
                  disabled={isProcessing}
                >
                  ชำระเงิน
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFCPaymentModal;
