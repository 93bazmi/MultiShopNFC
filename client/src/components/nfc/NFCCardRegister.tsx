import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import useNFC from '@/hooks/use-nfc';

// สร้าง schema สำหรับตรวจสอบข้อมูล
const formSchema = z.object({
  cardId: z.string().min(1, { message: 'ต้องระบุหมายเลขบัตร NFC' }),
  balance: z.coerce.number().min(0, { message: 'ยอดเงินต้องไม่ต่ำกว่า 0' }),
});

type FormValues = z.infer<typeof formSchema>;

export function NFCCardRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [useScannedCard, setUseScannedCard] = useState(true);
  
  // ใช้ NFC hook
  const { 
    isReading, 
    supportedNFC, 
    lastTagId, 
    startReading, 
    stopReading 
  } = useNFC();

  // สร้าง form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardId: '',
      balance: 0,
    }
  });

  // อัพเดทค่าหมายเลขบัตรเมื่อมีการสแกน
  useState(() => {
    if (lastTagId && useScannedCard) {
      form.setValue('cardId', lastTagId);
    }
  });

  // ส่งข้อมูลบัตรไปยังเซิร์ฟเวอร์
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitSuccess(false);
      setSubmitError(null);

      // ส่งข้อมูลไปยังเซิร์ฟเวอร์
      const response = await apiRequest('POST', '/api/nfc-cards', {
        cardId: values.cardId,
        balance: values.balance,
        active: true
      });

      console.log('Card registration response:', response);
      setSubmitSuccess(true);
      
      // รีเซ็ตฟอร์ม
      form.reset({
        cardId: '',
        balance: 0
      });
      
    } catch (error: any) {
      console.error('Failed to register card:', error);
      setSubmitError(error.message || 'เกิดข้อผิดพลาดในการลงทะเบียนบัตร');
    } finally {
      setIsSubmitting(false);
    }
  };

  // แสดงข้อความสถานะการสแกน NFC
  const getNFCStatusText = () => {
    if (!supportedNFC) return 'อุปกรณ์ของคุณไม่รองรับ NFC';
    if (isReading) return 'โปรดแตะบัตร NFC ของคุณที่อุปกรณ์...';
    if (lastTagId) return `บัตร: ${lastTagId}`;
    return 'กดปุ่มเพื่อเริ่มอ่านบัตร NFC';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ลงทะเบียนบัตร NFC</CardTitle>
        <CardDescription>
          เพิ่มบัตร NFC ใหม่เข้าสู่ระบบพร้อมกำหนดยอดเงินเริ่มต้น
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {submitSuccess && (
          <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
            <Check className="h-4 w-4" />
            <AlertTitle>สำเร็จ</AlertTitle>
            <AlertDescription>
              ลงทะเบียนบัตร NFC เรียบร้อยแล้ว
            </AlertDescription>
          </Alert>
        )}
        
        {submitError && (
          <Alert className="mb-4 bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
            <AlertDescription>
              {submitError}
            </AlertDescription>
          </Alert>
        )}
        
        {supportedNFC && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-700">สแกนบัตร NFC</p>
                <p className="text-xs text-blue-600">{getNFCStatusText()}</p>
              </div>
              
              {isReading ? (
                <Button variant="outline" size="sm" onClick={stopReading}>
                  หยุดสแกน
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={startReading}>
                  เริ่มสแกน
                </Button>
              )}
            </div>
            
            {lastTagId && (
              <div className="mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={useScannedCard ? "bg-blue-100" : ""}
                  onClick={() => {
                    setUseScannedCard(true);
                    form.setValue('cardId', lastTagId);
                  }}
                >
                  ใช้บัตรที่สแกน
                </Button>
              </div>
            )}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเลขบัตร NFC</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ระบุหมายเลขบัตร NFC" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ยอดเงินเริ่มต้น (บาท)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" step="1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลงทะเบียนบัตร
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-center text-sm text-gray-500">
        หมายเหตุ: บัตรที่ลงทะเบียนสามารถใช้ชำระเงินได้ทันที
      </CardFooter>
    </Card>
  );
}

export default NFCCardRegister;