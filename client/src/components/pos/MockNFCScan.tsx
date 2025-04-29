import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard } from "lucide-react";
import NFCPaymentSuccess from "./NFCPaymentSuccess";

interface MockNFCScanProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  shopId: number;
  shopName: string;
  onSuccess: (result: any) => void;
}

const scanSchema = z.object({
  cardId: z.string().min(1, "รหัสบัตรจำเป็นต้องระบุ"),
  amount: z.number().min(1, "จำนวนเหรียญต้องมากกว่า 0"),
});

const MockNFCScan = ({ 
  open, 
  onClose, 
  amount, 
  shopId, 
  shopName, 
  onSuccess 
}: MockNFCScanProps) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const form = useForm<z.infer<typeof scanSchema>>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      cardId: "",
      amount: amount,
    },
  });

  const nfcPaymentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof scanSchema>) => {
      return apiRequest("/api/nfc-payment", {
        method: "POST",
        body: JSON.stringify({
          cardId: values.cardId,
          shopId,
          amount: values.amount,
        }),
      });
    },
    onSuccess: (data) => {
      setPaymentResult(data);
      setShowSuccess(true);
      onSuccess(data);
    },
    onError: (error: any) => {
      const message = error.message || "การชำระเงินล้มเหลว";
      form.setError("cardId", { message });
    },
  });

  const onSubmit = (values: z.infer<typeof scanSchema>) => {
    nfcPaymentMutation.mutate(values);
  };

  if (showSuccess) {
    return (
      <NFCPaymentSuccess 
        open={showSuccess} 
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }} 
        paymentResult={paymentResult} 
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>จำลองการแสกนบัตร NFC</DialogTitle>
          <DialogDescription>กรอกรหัสบัตรเพื่อทำการชำระเงิน</DialogDescription>
        </DialogHeader>

        <div className="text-center mb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="text-primary text-2xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">ชำระเงินที่ {shopName}</h3>
          <p className="text-gray-600">จำนวนเงิน: {amount} เหรียญ</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสบัตร</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ระบุรหัสบัตร (เช่น NFC001)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={nfcPaymentMutation.isPending}
              >
                {nfcPaymentMutation.isPending ? "กำลังดำเนินการ..." : "ชำระเงิน"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MockNFCScan;