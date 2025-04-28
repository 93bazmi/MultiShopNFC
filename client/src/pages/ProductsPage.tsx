import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import { Shop, Product } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageIcon } from "lucide-react";

const ProductsPage = () => {
  const [selectedShop, setSelectedShop] = useState<number | null>(null);

  // Fetch shops
  const { data: shops, isLoading: isLoadingShops } = useQuery({
    queryKey: [API.SHOPS],
  });

  // Fetch products for selected shop
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: [API.PRODUCTS, selectedShop],
    queryFn: async () => {
      if (!selectedShop) return [];
      const response = await fetch(`${API.PRODUCTS}?shopId=${selectedShop}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!selectedShop,
  });

  // Handle shop change
  const handleShopChange = (shopId: string) => {
    setSelectedShop(parseInt(shopId));
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-md overflow-hidden border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            สินค้า
          </CardTitle>
          <CardDescription className="text-blue-100">
            ดูรายการสินค้าทั้งหมดในแต่ละร้านค้า เลือกร้านค้าเพื่อดูสินค้า
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <Select onValueChange={handleShopChange}>
              <SelectTrigger className="w-[250px] rounded-lg border-gray-300 shadow-sm">
                <SelectValue placeholder="เลือกร้านค้า" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingShops ? (
                  <SelectItem value="loading" disabled>
                    กำลังโหลดรายชื่อร้านค้า...
                  </SelectItem>
                ) : shops?.length === 0 ? (
                  <SelectItem value="none" disabled>
                    ไม่พบร้านค้า
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

          {!selectedShop ? (
            <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
              <div className="bg-blue-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                <PackageIcon className="h-10 w-10 text-blue-400" />
              </div>
              <p className="text-lg font-medium text-gray-600">เลือกร้านค้าเพื่อดูรายการสินค้า</p>
              <p className="text-sm text-gray-400 mt-1">กรุณาเลือกร้านค้าจากรายการด้านบน</p>
            </div>
          ) : isLoadingProducts ? (
            <div className="space-y-6 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center border border-gray-100 p-4 rounded-lg shadow-sm">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold">ชื่อสินค้า</TableHead>
                    <TableHead className="font-semibold">รายละเอียด</TableHead>
                    <TableHead className="font-semibold">ราคา</TableHead>
                    <TableHead className="font-semibold">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                            <PackageIcon className="h-6 w-6 text-red-400" />
                          </div>
                          <p className="text-gray-500">ไม่พบสินค้าในร้านนี้</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products?.map((product: Product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-gray-600">{product.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium text-blue-600">
                            {product.price} <span className="text-xs font-normal">เหรียญ</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.available 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {product.available ? "พร้อมจำหน่าย" : "ไม่พร้อมจำหน่าย"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
