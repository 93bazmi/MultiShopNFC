import { useState, useEffect } from "react";
import { Shop, Product } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Search, Coffee, Cookie, IceCream, ChefHat, Sandwich, ChevronsLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import NFCPaymentModal from "./NFCPaymentModal";
import NFCPaymentSuccess from "./NFCPaymentSuccess";
import { cn } from "@/lib/utils";

interface POSSystemProps {
  open: boolean;
  onClose: () => void;
  activeShop?: Shop;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const POSSystem = ({ open, onClose, activeShop }: POSSystemProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"nfc" | "cash">("nfc");
  const [showNfcPayment, setShowNfcPayment] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Fetch products for the active shop
  const { data: products, isLoading } = useQuery({
    queryKey: [API.PRODUCTS, activeShop?.id],
    queryFn: async () => {
      if (!activeShop) return [];
      const response = await fetch(`${API.PRODUCTS}?shopId=${activeShop.id}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!activeShop,
  });

  // Reset cart when shop changes
  useEffect(() => {
    setCart([]);
  }, [activeShop]);

  // Filter products by search term
  const filteredProducts = products
    ? products.filter((product: Product) => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // Get product icon
  const getProductIcon = (product: Product) => {
    switch (product.icon) {
      case "coffee":
        return <Coffee className="text-gray-600 text-xl" />;
      case "cookie":
        return <Cookie className="text-gray-600 text-xl" />;
      case "ice-cream":
        return <IceCream className="text-gray-600 text-xl" />;
      case "sandwich":
        return <Sandwich className="text-gray-600 text-xl" />;
      default:
        return <ChefHat className="text-gray-600 text-xl" />;
    }
  };

  // Process payment
  const processPayment = () => {
    if (paymentMethod === "nfc") {
      setShowNfcPayment(true);
    } else {
      // Cash payment processing
      // In a real application, this would handle cash payment
      alert("Cash payment not implemented in this demo");
    }
  };

  // Handle NFC payment success
  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    setShowNfcPayment(false);
    setShowPaymentSuccess(true);
  };

  // Close all modals and reset
  const handleCloseAll = () => {
    setShowNfcPayment(false);
    setShowPaymentSuccess(false);
    setCart([]);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>POS System - {activeShop?.name || "Shop"}</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left Side - Products */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                  <Search className="h-4 w-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 h-96 overflow-y-auto">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3">
                      <Skeleton className="h-16 w-full rounded-lg mb-2" />
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 h-96 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center h-full text-gray-500">
                      <ChevronsLeft className="h-12 w-12 mb-2" />
                      <p>No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product: Product) => (
                      <div 
                        key={product.id} 
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => addToCart(product)}
                      >
                        <div className="mb-2 bg-gray-100 rounded-lg p-2 flex items-center justify-center h-16">
                          {getProductIcon(product)}
                        </div>
                        <div className="text-sm font-medium text-gray-800 mb-1">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.price} Coins</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Right Side - Cart & Payment */}
            <div>
              {/* Cart */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">Current Order</h4>
                <div className="h-48 overflow-y-auto mb-3">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p>Cart is empty</p>
                      <p className="text-xs mt-1">Add products from the left</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center border-b border-gray-100 py-2">
                        <div className="flex items-center">
                          <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center mr-2">
                            {getProductIcon(item.product)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                            <p className="text-xs text-gray-500">{item.product.price} Coins</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                            min={1}
                            className="w-12 px-2 py-1 text-sm mr-2"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-800">{calculateTotal()} Coins</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium text-gray-800">0 Coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-md font-medium text-gray-800">Total:</span>
                    <span className="text-md font-bold text-primary">{calculateTotal()} Coins</span>
                  </div>
                </div>
              </div>
              
              {/* Payment */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">Payment Method</h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button
                    variant={paymentMethod === "nfc" ? "default" : "outline"}
                    className={cn(
                      paymentMethod === "nfc" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                    )}
                    onClick={() => setPaymentMethod("nfc")}
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    <span>NFC Payment</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    className={cn(
                      paymentMethod === "cash" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                    )}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    <span>Cash</span>
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={processPayment}
                    disabled={cart.length === 0}
                  >
                    Complete Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFC Payment Modal */}
      <NFCPaymentModal
        open={showNfcPayment}
        onClose={() => setShowNfcPayment(false)}
        amount={calculateTotal()}
        shopId={activeShop?.id || 0}
        shopName={activeShop?.name || ""}
        onSuccess={handlePaymentSuccess}
      />

      {/* Payment Success Modal */}
      <NFCPaymentSuccess
        open={showPaymentSuccess}
        onClose={handleCloseAll}
        paymentResult={paymentResult}
      />
    </>
  );
};

export default POSSystem;
