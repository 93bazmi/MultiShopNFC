import NFCCardRegister from "@/components/nfc/NFCCardRegister";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NFCRegisterPage() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">ลงทะเบียนบัตร NFC</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
      </div>
      
      <div className="max-w-lg mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                ใช้หน้านี้เพื่อเพิ่มบัตร NFC ใหม่เข้าสู่ระบบ
              </p>
            </div>
          </div>
        </div>
        
        <NFCCardRegister />
        
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">คำแนะนำการใช้งาน</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>สามารถกรอกหมายเลขบัตรด้วยตนเอง หรือใช้การสแกนบัตรอัตโนมัติ</li>
            <li>กำหนดยอดเงินเริ่มต้นสำหรับบัตรใหม่</li>
            <li>บัตรที่ลงทะเบียนแล้วจะสามารถใช้ชำระเงินได้ทันที</li>
            <li>หมายเลขบัตรต้องไม่ซ้ำกับบัตรที่มีอยู่ในระบบ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}