import { useState } from "react";
import { Shop } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Wine, ShoppingBag, ChefHat, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import POSSystem from "@/components/pos/POSSystem";

interface ShopListProps {
  shops: Shop[];
  isLoading: boolean;
}

const ShopList = ({ shops, isLoading }: ShopListProps) => {
  const [showPOS, setShowPOS] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // Get icon for shop
  const getShopIcon = (shop: Shop) => {
    switch (shop.icon) {
      case "wine":
        return <Wine className="text-primary" />;
      case "food":
        return <ChefHat className="text-primary" />;
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
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">ร้านค้าทั้งหมด</h3>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-12 w-12 rounded-full mr-3" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg">ไม่พบร้านค้า</p>
                <p className="text-sm text-gray-400 mt-1">ขออภัย ไม่มีร้านค้าที่พร้อมให้บริการในขณะนี้</p>
              </div>
            ) : (
              shops.map((shop) => (
                <div 
                  key={shop.id} 
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
                  onClick={() => {
                    setSelectedShop(shop);
                    setShowPOS(true);
                  }}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-all duration-300"></div>
                  
                  <div className="flex items-center mb-4">
                    <div className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center mr-4",
                      "bg-gradient-to-br", 
                      shop.iconColor === "blue" ? "from-blue-500 to-blue-600" : 
                      shop.iconColor === "purple" ? "from-purple-500 to-purple-600" : 
                      shop.iconColor === "green" ? "from-green-500 to-green-600" : 
                      "from-yellow-500 to-yellow-600"
                    )}>
                      {getShopIcon(shop)}
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">{shop.name}</h4>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">รายละเอียด:</span>
                      <span className="font-medium text-gray-800 text-right">{shop.description || "ไม่มีรายละเอียด"}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">สถานะ:</span>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        shop.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      )}>
                        {shop.status === "active" ? "เปิดให้บริการ" : "ปิดให้บริการ"}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-2 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300" 
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
