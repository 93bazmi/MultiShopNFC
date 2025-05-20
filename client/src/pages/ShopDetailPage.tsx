import { useState, useEffect } from 'react';
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wine, ShoppingBag, ChefHat, CreditCard, ArrowLeft, Coffee, Cookie, IceCream, Sandwich } from "lucide-react";
import { cn } from "@/lib/utils";
import POSSystem from "@/components/pos/POSSystem";
import { Shop, Product } from "@shared/schema";

const ShopDetailPage = () => {
  const [, params] = useRoute("/shop/:id");
  const shopId = params?.id ? parseInt(params.id) : 0;
  const [showPOS, setShowPOS] = useState(false);

  // Fetch shop
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: [`/api/shops/${shopId}`],
    enabled: !!shopId,
    retry: 3,
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [API.PRODUCTS],
  });

  // Filter products for this shop
  const shopProducts = Array.isArray(products) 
    ? products.filter((product: Product) => product.shopId === shopId) 
    : [];

  // Get icon for shop
  const getShopIcon = (shop: Shop) => {
    switch (shop?.icon) {
      case "wine":
        return <Wine className="text-white" size={24} />;
      case "food":
        return <ChefHat className="text-white" size={24} />;
      default:
        return <ShoppingBag className="text-white" size={24} />;
    }
  };

  // Get background color class for icon
  const getIconBgColor = (shop: Shop) => {
    switch (shop?.iconColor) {
      case "blue":
        return "from-blue-500 to-blue-600";
      case "purple":
        return "from-purple-500 to-purple-600";
      case "green":
        return "from-green-500 to-green-600";
      case "yellow":
        return "from-yellow-500 to-yellow-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  // Get product icon
  const getProductIcon = (product: Product) => {
    switch (product.icon) {
      case "coffee":
        return <Coffee className="text-gray-600 text-lg" />;
      case "cookie":
        return <Cookie className="text-gray-600 text-lg" />;
      case "ice-cream":
        return <IceCream className="text-gray-600 text-lg" />;
      case "sandwich":
        return <Sandwich className="text-gray-600 text-lg" />;
      default:
        return <ChefHat className="text-gray-600 text-lg" />;
    }
  };

  if (shopLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ไม่พบร้านค้า</CardTitle>
            <CardDescription>
              ไม่พบข้อมูลร้านค้าที่คุณกำลังค้นหา
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.href = "/shops"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปยังรายการร้านค้า
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // TypeScript safety for shop object
  const shopData = shop as Shop;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => window.location.href = "/shops"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปยังรายการร้านค้า
          </Button>
        </div>
        
        <Card className="overflow-hidden border-none shadow-md">
          {/* Shop Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className={cn(
                "h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center mr-4 mb-4 md:mb-0",
                "bg-gradient-to-br", 
                getIconBgColor(shopData)
              )}>
                {getShopIcon(shopData)}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{shopData.name}</h1>
                <p className="text-blue-100">{shopData.description || "ไม่มีรายละเอียด"}</p>
                <div className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2",
                  shopData.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                )}>
                  {shopData.status === "active" ? "เปิดให้บริการ" : "ปิดให้บริการ"}
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">สินค้าของร้าน</h2>
            
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <Skeleton className="h-32 w-full rounded-lg mb-2" />
                    <Skeleton className="h-5 w-2/3 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : shopProducts.length === 0 ? (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg">ไม่พบสินค้า</p>
                <p className="text-sm text-gray-400 mt-1">ร้านค้านี้ยังไม่มีสินค้าในระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {shopProducts.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                    <div className="mb-3 bg-gray-100 rounded-lg p-4 flex items-center justify-center h-24">
                      {getProductIcon(product)}
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{product.description || "ไม่มีคำอธิบาย"}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">{product.category}</span>
                      <span className="text-sm font-bold text-blue-600">{product.price} Coins</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <Button 
                className="px-6 py-6 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300" 
                onClick={() => setShowPOS(true)}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                ชำระเงินและเลือกสินค้า
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* POS System Modal */}
      <POSSystem 
        open={showPOS} 
        onClose={() => setShowPOS(false)} 
        activeShop={shopData}
      />
    </>
  );
};

export default ShopDetailPage;