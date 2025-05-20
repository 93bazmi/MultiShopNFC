    import { useState, useEffect } from "react";
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { Progress } from "@/components/ui/progress";
    import { Wifi, Loader2, CheckCircle2, XCircle } from "lucide-react";
    import { useToast } from "@/hooks/use-toast";

    import { apiRequest } from "@/lib/queryClient";
    import { API } from "@/lib/airtable";

    const NFCTestPage = () => {
      const [isReading, setIsReading] = useState(false);
      const [progress, setProgress] = useState(0);
      const [status, setStatus] = useState("พร้อมทดสอบการอ่านบัตร NFC");
      const [cardInfo, setCardInfo] = useState<any>(null);
      const [error, setError] = useState<string | null>(null);
      const { toast } = useToast();

      // ฟังก์ชันเริ่มต้นการอ่านบัตร NFC
      const startReading = () => {
        setIsReading(true);
        setProgress(0);
        setStatus("กำลังอ่านบัตร NFC...");
        setCardInfo(null);
        setError(null);

        // จำลองการอ่านบัตร NFC
        // ในระบบจริงส่วนนี้จะถูกแทนที่ด้วยโค้ดที่ใช้สำหรับอ่านค่าจากอุปกรณ์ NFC จริง
        const interval = setInterval(() => {
          setProgress(prev => {
            const next = Math.min(prev + 10, 90);
            return next;
          });
        }, 300);

        // จำลองการอ่านบัตรสำเร็จหลังจาก 3 วินาที
        // ในระบบจริง ส่วนนี้จะเป็นการรอรับข้อมูลจริงจากอุปกรณ์อ่าน NFC
        setTimeout(() => {
          clearInterval(interval);

          // สุ่มเพื่อจำลองความสำเร็จหรือล้มเหลว (เพื่อการทดสอบ)
          const success = Math.random() > 0.3; // 70% โอกาสที่จะสำเร็จ

          if (success) {
            // จำลองข้อมูลบัตร NFC
            const mockCardId = `NFC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

            // เรียกใช้ API endpoint ทดสอบการอ่านบัตร
            testReadNFCCard(mockCardId);
          } else {
            // จำลองการอ่านล้มเหลว
            setProgress(0);
            setStatus("การอ่านบัตรล้มเหลว กรุณาลองใหม่อีกครั้ง");
            setError("ไม่พบบัตร NFC หรือไม่สามารถอ่านข้อมูลได้");
            setIsReading(false);

            toast({
              title: "อ่านบัตรไม่สำเร็จ",
              description: "ไม่พบบัตร NFC หรือไม่สามารถอ่านข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
              variant: "destructive"
            });
          }
        }, 3000);
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
        } finally {
          setIsReading(false);
        }
      };

      // ฟังก์ชันลงทะเบียนบัตรใหม่
      const registerNewCard = async () => {
        if (!cardInfo?.cardId) return;

        try {
          setIsReading(true);
          setStatus("กำลังลงทะเบียนบัตรใหม่...");

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
        } finally {
          setIsReading(false);
        }
      };

      // ฟังก์ชันรีเซ็ตการทดสอบ
      const resetTest = () => {
        setIsReading(false);
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
                  <Wifi className="h-5 w-5" />
                  <span>NFC Card Reader Test</span>
                </CardTitle>
                <CardDescription>
                  ทดสอบการอ่านบัตร NFC และตรวจสอบข้อมูลบัตร
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
                      <Wifi className="h-10 w-10 text-gray-400 mb-4" />
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
              </CardContent>

              <CardFooter>
                {cardInfo ? (
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
                    disabled={isReading}
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