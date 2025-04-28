import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import { Shop, Product, insertProductSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageIcon, Plus, Pencil, Trash2 } from "lucide-react";
import * as z from "zod";

const extendedProductSchema = insertProductSchema.extend({
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  price: z.number().min(1, { message: "Price must be at least 1 coin" }),
});

const ProductsPage = () => {
  const [open, setOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Create form
  const form = useForm<z.infer<typeof extendedProductSchema>>({
    resolver: zodResolver(extendedProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      shopId: 0,
      icon: "box",
      available: true,
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (values: z.infer<typeof extendedProductSchema>) => {
      const res = await apiRequest("POST", API.PRODUCTS, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.PRODUCTS, selectedShop] });
      toast({
        title: "Product created",
        description: "Your product has been created successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof extendedProductSchema>) => {
    if (!selectedShop) {
      toast({
        title: "Error",
        description: "Please select a shop first",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...values,
      shopId: selectedShop,
    };

    addProductMutation.mutate(productData);
  };

  // Handle shop change
  const handleShopChange = (shopId: string) => {
    setSelectedShop(parseInt(shopId));
    form.setValue("shopId", parseInt(shopId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage products for your shops. Select a shop to view its products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Select onValueChange={handleShopChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingShops ? (
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

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={!selectedShop}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product name" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (in Coins)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter price" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="coffee">Coffee</SelectItem>
                              <SelectItem value="cookie">Cookie</SelectItem>
                              <SelectItem value="ice-cream">Ice Cream</SelectItem>
                              <SelectItem value="sandwich">Sandwich</SelectItem>
                            </SelectContent>
                          </Select>
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
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? "Creating..." : "Create Product"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {!selectedShop ? (
            <div className="text-center py-8 text-gray-500">
              <PackageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Select a shop to view its products</p>
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
                  <div className="space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full inline-block" />
                    <Skeleton className="h-8 w-8 rounded-full inline-block" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No products found for this shop
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.description || "-"}</TableCell>
                      <TableCell>{product.price} Coins</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.available 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {product.available ? "Available" : "Unavailable"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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
