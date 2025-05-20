import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TopupCardModal from "@/components/nfc/TopUpCardModal";

const TopupPage = () => {
  const [amount, setAmount] = useState<number>(100); // Default 100 coins
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    } else {
      setAmount(0);
    }
  };

  const handleTopupSuccess = (result: any) => {
    setIsTopupModalOpen(false);

    toast({
      title: "เติมเงินสำเร็จ",
      description: (
        <div className="space-y-2">
          <p>เติมเงินจำนวน {amount} Coins เรียบร้อยแล้ว</p>
          <p className="text-sm text-gray-600">ยอดเงินคงเหลือ: {result.newBalance} Coins</p>
        </div>
      ),
      variant: "default"
    });
  };

  const predefinedAmounts = [100, 200, 500, 1000];

  return (
    <div>
      <div className="container max-w-md mx-auto py-6">
        <h1 className="text-2xl font-bold text-center mb-6">เติมเงินบัตร NFC</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>เติมเงินเข้าบัตร</span>
            </CardTitle>
            <CardDescription>
              เติมเงินเข้าบัตร NFC เพื่อใช้บริการในร้านค้า
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">จำนวนเงินที่ต้องการเติม (Coins)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                min={1}
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {predefinedAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  variant={amount === presetAmount ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setAmount(presetAmount)}
                >
                  {presetAmount}
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setIsTopupModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              disabled={amount <= 0}
            >
              <PlusCircle className="h-5 w-5" />
              <span>เติมเงิน {amount} Coins</span>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <TopupCardModal
        open={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        amount={amount}
        onSuccess={handleTopupSuccess}
      />
    </div>
  );
};

export default TopupPage;