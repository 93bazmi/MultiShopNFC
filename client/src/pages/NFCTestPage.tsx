import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wifi, Loader2, CheckCircle2, XCircle, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useNFC from "@/hooks/use-nfc";

import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";

// เพิ่ม interface สำหรับข้อมูลบัตร
interface CardData {
  id?: number;
  cardId: string;
  balance?: number;
  lastUsed?: string | null;
  active?: boolean;
  notRegistered?: boolean;
}

const NFCTestPage = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("พร้อมทดสอบการอ่านบัตร NFC");
  const [cardInfo, setCardInfo] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
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
      // เมื่ออ่านบัตรได้แล้ว ให้ส่งค่าไปตรวจสอบกับ API
      console.log("NFC card read:", serialNumber);
      testReadNFCCard(serialNumber);
    }
  });
  
  // แสดงผลการอัพเดทความคืบหน้าเมื่อกำลังอ่านบัตร
  useEffect(() => {
    if (isReading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          // คงความคืบหน้าไว้ที่ 90% จนกว่าจะอ่านบัตรได้จริง
          return Math.min(prev + 10, 90);
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      // ถ้าไม่ได้อ่านแล้ว ให้รีเซ็ตหรือตั้งค่าความคืบหน้าให้เหมาะสม
      if (cardInfo) {
        setProgress(100); // สำเร็จ
      } else if (error) {
        setProgress(0); // ล้มเหลว
      }
    }
  }, [isReading, cardInfo, error]);
  
  // อัพเดท status เมื่อมีการเปลี่ยนแปลงสถานะการอ่าน
  useEffect(() => {
    if (!supportedNFC) {
      setStatus("อุปกรณ์ของคุณไม่รองรับ NFC");
      return;
    }
    
    if (isReading) {
      setStatus("กำลังอ่านบัตร NFC... โปรดแตะบัตรที่อุปกรณ์ของคุณ");
    } else if (cardInfo) {
      setStatus("อ่านบัตรสำเร็จ");
    } else if (error) {
      setStatus("การอ่านบัตรล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } else {
      setStatus("พร้อมทดสอบการอ่านบัตร NFC");
    }
  }, [isReading, cardInfo, error, supportedNFC]);
  
  // อัพเดทข้อความผิดพลาดเมื่อ NFC error เปลี่ยน
  useEffect(() => {
    if (nfcError) {
      setError(nfcError.message);
    }
  }, [nfcError]);

  // ฟังก์ชันเริ่มต้นการอ่านบัตร NFC แบบจริง
  const startReading = () => {
    // รีเซ็ตสถานะ
    setProgress(0);
    setCardInfo(null);
    setError(null);
    
    // ตรวจสอบการรองรับ NFC
    if (!supportedNFC) {
      setError("อุปกรณ์ของคุณไม่รองรับ NFC");
      toast({
        title: "ไม่รองรับ NFC",
        description: "อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการอ่านบัตร NFC",
        variant: "destructive"
      });
      return;
    }
    
    // เริ่มอ่านบัตร NFC จริง
    startNFCReading();
  };

  // ฟังก์ชันทดสอบการอ่านบัตร NFC ผ่าน API
  const testReadNFCCard = async (cardId: string) => {
    try {
      // เรียกใช้ API endpoint ทดสอบการอ่านบัตร
      const response = await apiRequest("POST", "/api/nfc-test-read", { cardId });

      if (!response.ok) {
        const errorData = await response.json();

        // กรณีที่อ่านบัตรได้แต่ไม่พบในระบบ
        if (errorData.error === "card_not_found") {
          setProgress(100);
          setStatus("อ่านบัตรสำเร็จ แต่ไม่พบข้อมูลในระบบ");

          // สร้างข้อมูลบัตรเปล่าเพื่อแสดงผล
          setCardInfo({
            cardId: cardId,
            balance: 0,
            lastUsed: null,
            notRegistered: true
          });

          toast({
            title: "อ่านบัตรสำเร็จ",
            description: "พบบัตร NFC แต่ยังไม่ได้ลงทะเบียนในระบบ",
            variant: "default"
          });

          return;
        }

        throw new Error(errorData.message || "ไม่สามารถอ่านบัตรได้");
      }

      // อ่านข้อมูลบัตรสำเร็จและพบในระบบ
      const result = await response.json();
      setCardInfo(result.card);
      setProgress(100);
      setStatus("อ่านบัตรสำเร็จ");

      toast({
        title: "อ่านบัตรสำเร็จ",
        description: `หมายเลขบัตร: ${result.card.cardId}`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error testing card:", error);
      setProgress(0);
      setStatus("เกิดข้อผิดพลาดในการอ่านบัตร");
      setError(error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อกับระบบได้");

      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อกับระบบได้",
        variant: "destructive"
      });
    }
    
    // ในกรณีที่ใช้ Web NFC API จริง เราไม่ต้องหยุดการอ่านที่นี่
    // เพราะเราอาจต้องการที่จะอ่านบัตรอื่นต่อไป
    // ผู้ใช้จะเป็นคนตัดสินใจกดปุ่มหยุดเอง
  };

  // ฟังก์ชันลงทะเบียนบัตรใหม่
  const registerNewCard = async () => {
    if (!cardInfo?.cardId) return;

    try {
      // แสดงสถานะกำลังลงทะเบียน
      setStatus("กำลังลงทะเบียนบัตรใหม่...");
      setError(null);

      // เรียกใช้ API ลงทะเบียนบัตรใหม่
      const response = await apiRequest("POST", API.NFC_CARDS, {
        cardId: cardInfo.cardId,
        balance: 0,
        active: true
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "ไม่สามารถลงทะเบียนบัตรได้");
      }

      const newCardData = await response.json();
      setCardInfo(newCardData);
      setError(null);
      setStatus("ลงทะเบียนบัตรสำเร็จ");

      toast({
        title: "ลงทะเบียนบัตรสำเร็จ",
        description: `หมายเลขบัตร: ${newCardData.cardId}`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error registering card:", error);
      setStatus("ลงทะเบียนบัตรไม่สำเร็จ");
      setError(error instanceof Error ? error.message : "ไม่สามารถลงทะเบียนบัตรได้");

      toast({
        title: "ลงทะเบียนบัตรไม่สำเร็จ",
        description: error instanceof Error ? error.message : "ไม่สามารถลงทะเบียนบัตรได้",
        variant: "destructive"
      });
    }
  };

  // ฟังก์ชันรีเซ็ตการทดสอบ
  const resetTest = () => {
    // หยุดการอ่าน NFC ถ้ากำลังอ่านอยู่
    if (isReading) {
      stopNFCReading();
    }
    
    // รีเซ็ตสถานะทั้งหมด
    setProgress(0);
    setStatus("พร้อมทดสอบการอ่านบัตร NFC");
    setCardInfo(null);
    setError(null);
  };

  return (
    <div>
      <div className="container max-w-md mx-auto py-6">
        <h1 className="text-2xl font-bold text-center mb-6">ทดสอบการอ่านบัตร NFC</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {supportedNFC ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span>NFC Card Reader Test</span>
            </CardTitle>
            <CardDescription>
              {supportedNFC 
                ? "ทดสอบการอ่านบัตร NFC และตรวจสอบข้อมูลบัตร" 
                : "อุปกรณ์นี้ไม่รองรับ NFC หรือ Web NFC API ได้รับการรองรับเฉพาะใน Chrome บน Android เท่านั้น"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* แสดงสถานะการอ่านบัตร */}
            <div className="text-center p-4 border rounded-lg bg-gray-50">
              {isReading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-700">{status}</p>
                  <Progress value={progress} className="h-2 mt-4" />
                </div>
              ) : cardInfo ? (
                <div className="flex flex-col items-center">
                  {error ? (
                    <XCircle className="h-10 w-10 text-red-500 mb-4" />
                  ) : (
                    <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
                  )}
                  <p className="text-sm font-medium text-gray-700">{status}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {supportedNFC ? (
                    <Wifi className="h-10 w-10 text-gray-400 mb-4" />
                  ) : (
                    <WifiOff className="h-10 w-10 text-red-500 mb-4" />
                  )}
                  <p className="text-sm font-medium text-gray-700">{status}</p>
                  {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                  )}
                </div>
              )}
            </div>

            {/* แสดงข้อมูลบัตร */}
            {cardInfo && (
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">ข้อมูลบัตร NFC</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">หมายเลขบัตร:</span>
                    <span className="font-medium">{cardInfo.cardId}</span>
                  </div>
                  {!cardInfo.notRegistered ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ยอดเงินคงเหลือ:</span>
                        <span className="font-medium">{cardInfo.balance} Coins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ใช้งานล่าสุด:</span>
                        <span className="font-medium">
                          {cardInfo.lastUsed 
                            ? new Date(cardInfo.lastUsed).toLocaleString('th-TH') 
                            : 'ยังไม่เคยใช้งาน'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">สถานะ:</span>
                        <span className={`font-medium ${cardInfo.active ? 'text-green-600' : 'text-red-600'}`}>
                          {cardInfo.active ? 'ใช้งานได้' : 'ถูกระงับการใช้งาน'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center mt-2">
                      <p className="text-red-500 mb-4">บัตรนี้ยังไม่ได้ลงทะเบียนในระบบ</p>
                      <Button 
                        onClick={registerNewCard} 
                        disabled={isReading}
                        className="w-full"
                      >
                        ลงทะเบียนบัตรใหม่
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* แสดงคำอธิบายเพิ่มเติมเกี่ยวกับ Web NFC API */}
            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p>
                <strong>หมายเหตุ:</strong> Web NFC API เป็น API ทดลองและรองรับเฉพาะ Chrome บน Android เท่านั้น
              </p>
              <p className="mt-1">
                เมื่อกดปุ่ม "เริ่มอ่านบัตร NFC" ระบบจะขออนุญาตใช้งาน NFC และรอการแตะบัตร
              </p>
            </div>
          </CardContent>

          <CardFooter>
            {isReading ? (
              <Button 
                onClick={stopNFCReading} 
                className="w-full" 
                variant="outline"
              >
                หยุดอ่านบัตร
              </Button>
            ) : cardInfo ? (
              <Button 
                onClick={resetTest} 
                className="w-full" 
                variant="outline"
              >
                ทดสอบใหม่อีกครั้ง
              </Button>
            ) : (
              <Button 
                onClick={startReading} 
                disabled={isReading || !supportedNFC}
                className="w-full"
              >
                เริ่มอ่านบัตร NFC
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default NFCTestPage;