import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Receipt from "@/components/receipt/ReceiptPage";
import { API } from "@/lib/airtable";

const ReceiptPage = () => {
  const [, setLocation] = useLocation();
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get transaction ID from URL
    const params = new URLSearchParams(window.location.search);
    const txId = params.get("id");
    setTransactionId(txId);
  }, []);

  // Fetch transaction data
  const { data: transaction, isLoading, error } = useQuery({
    queryKey: [API.TRANSACTIONS, transactionId],
    queryFn: async () => {
      if (!transactionId) return null;
      
      const response = await fetch(`${API.TRANSACTIONS}/${transactionId}`);
      if (!response.ok) throw new Error("Failed to fetch transaction");
      return response.json();
    },
    enabled: !!transactionId,
  });

  // Get relevant card and shop data
  const { data: card } = useQuery({
    queryKey: [API.NFC_CARDS, transaction?.cardId],
    queryFn: async () => {
      if (!transaction?.cardId) return null;
      
      // Try by card ID string first if cardId is a string (NFC card ID)
      if (typeof transaction.cardId === 'string') {
        const response = await fetch(`${API.NFC_CARDS}/by-card-id/${transaction.cardId}`);
        if (response.ok) {
          return await response.json();
        }
      }
      
      // If numeric ID or previous method failed, try direct endpoint
      const cardId = typeof transaction.cardId === 'number' ? transaction.cardId : transaction.cardId;
      const response = await fetch(`${API.NFC_CARDS}/${cardId}`);
      if (!response.ok) throw new Error("Failed to fetch card");
      return await response.json();
    },
    enabled: !!transaction?.cardId,
  });

  const { data: shop } = useQuery({
    queryKey: [API.SHOPS, transaction?.shopId],
    queryFn: async () => {
      if (!transaction?.shopId) return null;
      
      const response = await fetch(`${API.SHOPS}/${transaction.shopId}`);
      if (!response.ok) throw new Error("Failed to fetch shop");
      return response.json();
    },
    enabled: !!transaction?.shopId,
  });

  // Prepare data for receipt
  const paymentResult = transaction && {
    transaction: transaction,
    card: card,
    merchant: shop,
    remainingBalance: card?.balance || 0
  };

  // Handle back button
  const handleBack = () => {
    setLocation("/transactions");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูลใบเสร็จ...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลใบเสร็จ</h2>
          <p className="text-gray-600 mb-6">ไม่พบใบเสร็จที่ต้องการ หรือใบเสร็จอาจถูกลบไปแล้ว</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return <Receipt paymentResult={paymentResult} onBack={handleBack} />;
};

export default ReceiptPage;