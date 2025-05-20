import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coins, Wallet } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NfcCard } from "@shared/schema";

interface TopUpCardModalProps {
  open: boolean;
  onClose: () => void;
  card: NfcCard | null;
}

// Schema for top-up form
const topUpSchema = z.object({
  amount: z.number()
    .min(10, { message: "ขั้นต่ำ 10 เหรียญต่อการเติม" })
    .max(1000, { message: "สูงสุด 1,000 เหรียญต่อการเติม" }),
});

const TopUpCardModal = ({ open, onClose, card }: TopUpCardModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create top-up form
  const form = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      amount: 100,
    },
  });

  // Reset form and state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setIsComplete(false);
      form.reset({ amount: 100 });
    }
  }, [open, form]);

  // Handle top-up mutation
  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!card) throw new Error("ไม่พบข้อมูลบัตร");

      // Create transaction record
      const transaction = {
        amount: amount,
        shopId: 1, // Default shop ID for top-ups
        cardId: card.id,
        type: "topup",
        status: "completed",
      };

      // Create transaction
      const transactionRes = await apiRequest("POST", API.TRANSACTIONS, transaction);
      const transactionData = await transactionRes.json();

      // Update card balance
      const updatedCard = {
        ...card,
        balance: card.balance + amount,
        lastUsed: new Date(),
      };

      const cardRes = await apiRequest("PATCH", `${API.NFC_CARDS}/${card.id}`, {
        balance: updatedCard.balance,
        lastUsed: updatedCard.lastUsed,
      });

      return {
        transaction: transactionData,
        card: await cardRes.json(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.NFC_CARDS] });
      queryClient.invalidateQueries({ queryKey: [API.TRANSACTIONS] });
      setIsComplete(true);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถเติมเหรียญได้: ${error.message}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      onClose();
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof topUpSchema>) => {
    setIsSubmitting(true);
    topUpMutation.mutate(values.amount);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setIsComplete(false);
      form.reset({ amount: 100 });
    }
  };

  // Show completion screen
  if (isComplete && card) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">เติมเหรียญสำเร็จ</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <Coins className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-1">เติมเหรียญเรียบร้อย</h3>
            <p className="text-gray-500 mb-4">บัตร #{card.cardId} ได้รับการเติมเหรียญแล้ว</p>
            
            <Card className="w-full border border-gray-200 shadow-sm mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">จำนวนเติม:</span>
                  <span className="font-semibold">{form.getValues().amount} เหรียญ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">ยอดคงเหลือ:</span>
                  <span className="font-semibold text-lg">{card.balance + form.getValues().amount} เหรียญ</span>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 py-3 px-6 flex justify-between">
                <span className="text-sm text-gray-500">วันที่เติม:</span>
                <span className="text-sm font-medium">{new Date().toLocaleString("th-TH")}</span>
              </CardFooter>
            </Card>
            
            <Button onClick={handleClose} className="w-full">
              เสร็จสิ้น
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เติมเหรียญ</DialogTitle>
        </DialogHeader>
        
        {card && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-6 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">บัตร NFC</p>
                  <p className="text-lg font-semibold">#{card.cardId}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">ยอดปัจจุบัน</p>
                <p className="text-lg font-semibold text-right">{card.balance} เหรียญ</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนเหรียญที่ต้องการเติม</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value || "0"))}
                          className="text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "กำลังทำรายการ..." : "ยืนยันการเติมเหรียญ"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleClose}
                    className="w-full"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopUpCardModal;