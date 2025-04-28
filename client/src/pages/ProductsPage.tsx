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
      <Card>
        <CardHeader>
          <CardTitle>สินค้า</CardTitle>
          <CardDescription>
            ดูรายการสินค้าทั้งหมดในแต่ละร้านค้า เลือกร้านค้าเพื่อดูสินค้า
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Select onValueChange={handleShopChange}>
              <SelectTrigger className="w-[200px]">
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
            <div className="text-center py-8 text-gray-500">
              <PackageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>เลือกร้านค้าเพื่อดูรายการสินค้า</p>
            </div>
          ) : isLoadingProducts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>ราคา</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      ไม่พบสินค้าในร้านนี้
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.description || "-"}</TableCell>
                      <TableCell>{product.price} เหรียญ</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
