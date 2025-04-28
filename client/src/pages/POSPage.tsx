import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import { Shop } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coffee, Store, CreditCard, ReceiptText, ShoppingBag, Book, PizzaIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import POSSystem from "@/components/pos/POSSystem";

const POSPage = () => {
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [showPOS, setShowPOS] = useState(false);
  const { toast } = useToast();

  // Fetch shops
  const { data: shops, isLoading } = useQuery({
    queryKey: [API.SHOPS],
  });

  // Set active shop when shop is selected
  useEffect(() => {
    if (selectedShop && shops) {
      const shop = shops.find((s: Shop) => s.id === selectedShop);
      if (shop) {
        setActiveShop(shop);
      }
    } else {
      setActiveShop(null);
    }
  }, [selectedShop, shops]);

  // Handle shop change
  const handleShopChange = (shopId: string) => {
    setSelectedShop(parseInt(shopId));
  };

  // Launch POS system
  const launchPOS = () => {
    if (!activeShop) {
      toast({
        title: "Error",
        description: "Please select a shop first",
        variant: "destructive",
      });
      return;
    }

    setShowPOS(true);
  };

  // Get shop icon
  const getShopIcon = (shop: Shop) => {
    switch (shop.icon) {
      case "coffee":
        return <Coffee className="h-5 w-5" />;
      case "book":
        return <Book className="h-5 w-5" />;
      case "pizza":
        return <PizzaIcon className="h-5 w-5" />;
      default:
        return <Store className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">POS System</CardTitle>
          <CardDescription>
            Manage payments and transactions for your shops
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="w-full md:w-64">
              <Select onValueChange={handleShopChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading shops...
                    </SelectItem>
                  ) : shops?.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No shops available
                    </SelectItem>
                  ) : (
                    shops?.map((shop: Shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              size="lg" 
              className="gap-2"
              disabled={!activeShop}
              onClick={launchPOS}
            >
              <CreditCard className="h-5 w-5" />
              Launch POS System
            </Button>
          </div>

          {!activeShop ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Store className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Shop Selected</h3>
              <p className="text-gray-500">
                Please select a shop from the dropdown to access the POS system
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  {getShopIcon(activeShop)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{activeShop.name}</h2>
                  <p className="text-gray-500">{activeShop.description || "No description available"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Today's Sales</div>
                        <div className="text-2xl font-bold mt-1">0 Coins</div>
                      </div>
                      <ReceiptText className="h-8 w-8 text-primary/80" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Transactions</div>
                        <div className="text-2xl font-bold mt-1">0</div>
                      </div>
                      <ShoppingBag className="h-8 w-8 text-primary/80" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Status</div>
                        <div className="text-lg font-medium mt-1 flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          Ready
                        </div>
                      </div>
                      <CreditCard className="h-8 w-8 text-primary/80" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center">
                <Button size="lg" className="gap-2" onClick={launchPOS}>
                  <CreditCard className="h-5 w-5" />
                  Start Selling
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* POS System Modal */}
      <POSSystem 
        open={showPOS} 
        onClose={() => setShowPOS(false)} 
        activeShop={activeShop || undefined}
      />
    </div>
  );
};

export default POSPage;
