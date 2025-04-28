import { useState } from "react";
import { Shop } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Book, ShoppingBag, PizzaIcon, Plus, CreditCard } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertShopSchema } from "@shared/schema";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { API } from "@/lib/airtable";
import { cn } from "@/lib/utils";
import POSSystem from "@/components/pos/POSSystem";

interface ShopListProps {
  shops: Shop[];
  isLoading: boolean;
}

const extendedShopSchema = insertShopSchema.extend({
  name: z.string().min(2, { message: "Shop name must be at least 2 characters" }),
});

const ShopList = ({ shops, isLoading }: ShopListProps) => {
  const [open, setOpen] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create form
  const form = useForm<z.infer<typeof extendedShopSchema>>({
    resolver: zodResolver(extendedShopSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "store",
      iconColor: "blue",
      status: "active",
      ownerId: 1, // Default owner ID
    },
  });

  // Add shop mutation
  const addShopMutation = useMutation({
    mutationFn: async (values: z.infer<typeof extendedShopSchema>) => {
      const res = await apiRequest("POST", API.SHOPS, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.SHOPS] });
      toast({
        title: "Shop created",
        description: "Your shop has been created successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create shop: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof extendedShopSchema>) => {
    addShopMutation.mutate(values);
  };

  // Get icon for shop
  const getShopIcon = (shop: Shop) => {
    switch (shop.icon) {
      case "coffee":
        return <Coffee className="text-primary" />;
      case "book":
        return <Book className="text-secondary" />;
      case "pizza":
        return <PizzaIcon className="text-yellow-600" />;
      default:
        return <ShoppingBag className="text-primary" />;
    }
  };

  // Get background color class for icon
  const getIconBgColor = (shop: Shop) => {
    switch (shop.iconColor) {
      case "blue":
        return "bg-blue-100";
      case "purple":
        return "bg-purple-100";
      case "green":
        return "bg-green-100";
      case "yellow":
        return "bg-yellow-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">ร้านค้าทั้งหมด</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มร้านค้า
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มร้านค้าใหม่</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อร้านค้า</FormLabel>
                        <FormControl>
                          <Input placeholder="กรอกชื่อร้านค้า" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รายละเอียด</FormLabel>
                        <FormControl>
                          <Input placeholder="กรอกรายละเอียดร้านค้า" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={addShopMutation.isPending}
                    >
                      {addShopMutation.isPending ? "กำลังสร้าง..." : "สร้างร้านค้า"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                ไม่พบร้านค้า กรุณาสร้างร้านค้าแรกของคุณ!
              </div>
            ) : (
              shops.map((shop) => (
                <div 
                  key={shop.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedShop(shop);
                    setShowPOS(true);
                  }}
                >
                  <div className="flex items-center mb-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center mr-3",
                      getIconBgColor(shop)
                    )}>
                      {getShopIcon(shop)}
                    </div>
                    <h4 className="text-md font-medium text-gray-800">{shop.name}</h4>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <span>รายละเอียด:</span>
                    <span className="font-medium text-gray-800">{shop.description || "ไม่มีรายละเอียด"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <span>สถานะ:</span>
                    <span className={cn(
                      "font-medium",
                      shop.status === "active" ? "text-green-600" : "text-yellow-600"
                    )}>
                      {shop.status === "active" ? "เปิดให้บริการ" : "ปิดให้บริการ"}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-2 gap-2" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShop(shop);
                      setShowPOS(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                    ชำระเงินและเลือกสินค้า
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* POS System Modal */}
      {selectedShop && (
        <POSSystem 
          open={showPOS} 
          onClose={() => setShowPOS(false)} 
          activeShop={selectedShop}
        />
      )}
    </>
  );
};

export default ShopList;
