import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/airtable";
import { NfcCard, Transaction, insertNfcCardSchema, insertTransactionSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Coins, CreditCard, Plus, Wallet, ArrowUpRight, ArrowDownRight, Pencil, RefreshCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Extended schema for card creation with validation
const extendedNfcCardSchema = insertNfcCardSchema.extend({
  cardId: z.string().min(4, { message: "Card ID must be at least 4 characters" }),
  balance: z.number().min(0, { message: "Balance must be 0 or higher" }),
});

// Schema for topping up a card
const topupCardSchema = z.object({
  cardId: z.number(),
  amount: z.number().min(1, { message: "Amount must be at least 1 coin" }),
});

const CoinsPage = () => {
  const [openNewCard, setOpenNewCard] = useState(false);
  const [openTopup, setOpenTopup] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch NFC cards
  const { data: nfcCards, isLoading: isLoadingCards } = useQuery({
    queryKey: [API.NFC_CARDS],
  });

  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: [API.TRANSACTIONS],
  });

  // Form for creating a new NFC card
  const newCardForm = useForm<z.infer<typeof extendedNfcCardSchema>>({
    resolver: zodResolver(extendedNfcCardSchema),
    defaultValues: {
      cardId: "",
      balance: 0,
      active: true,
    },
  });

  // Form for topping up a card
  const topupForm = useForm<z.infer<typeof topupCardSchema>>({
    resolver: zodResolver(topupCardSchema),
    defaultValues: {
      cardId: 0,
      amount: 0,
    },
  });

  // Create new NFC card mutation
  const createCardMutation = useMutation({
    mutationFn: async (values: z.infer<typeof extendedNfcCardSchema>) => {
      const res = await apiRequest("POST", API.NFC_CARDS, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.NFC_CARDS] });
      toast({
        title: "Success",
        description: "New NFC card created successfully",
      });
      setOpenNewCard(false);
      newCardForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create NFC card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Top-up card mutation
  const topupCardMutation = useMutation({
    mutationFn: async (values: z.infer<typeof topupCardSchema>) => {
      const card = nfcCards.find((c: NfcCard) => c.id === values.cardId);
      if (!card) throw new Error("Card not found");

      // Create transaction record
      const transaction = {
        amount: values.amount,
        shopId: 1, // Default shop ID for topups
        cardId: card.id,
        type: "topup",
        status: "completed",
      };

      // Create transaction
      const transactionRes = await apiRequest("POST", API.TRANSACTIONS, transaction);
      const transactionData = await transactionRes.json();

      // Update card balance
      const updatedCard = {
        ...card,
        balance: card.balance + values.amount,
        lastUsed: new Date(),
      };

      const cardRes = await apiRequest("PATCH", `${API.NFC_CARDS}/${card.id}`, {
        balance: updatedCard.balance,
        lastUsed: updatedCard.lastUsed,
      });

      return {
        transaction: transactionData,
        card: await cardRes.json(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.NFC_CARDS] });
      queryClient.invalidateQueries({ queryKey: [API.TRANSACTIONS] });
      toast({
        title: "Success",
        description: "Card topped up successfully",
      });
      setOpenTopup(false);
      topupForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to top up card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle new card form submission
  const onSubmitNewCard = (values: z.infer<typeof extendedNfcCardSchema>) => {
    createCardMutation.mutate(values);
  };

  // Handle top-up form submission
  const onSubmitTopup = (values: z.infer<typeof topupCardSchema>) => {
    topupCardMutation.mutate(values);
  };

  // Handle card select for top-up
  const handleSelectCardForTopup = (card: NfcCard) => {
    setSelectedCardId(card.id);
    topupForm.setValue("cardId", card.id);
    setOpenTopup(true);
  };

  // Format time ago
  const formatTimeAgo = (timestamp: Date | null) => {
    if (!timestamp) return "Never used";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Calculate total coins in circulation
  const totalCoinsInCirculation = nfcCards
    ? nfcCards.reduce((sum: number, card: NfcCard) => sum + card.balance, 0)
    : 0;

  // Filter card transactions
  const getCardTransactions = (cardId: number) => {
    return transactions
      ? transactions.filter((t: Transaction) => t.cardId === cardId)
      : [];
  };

  // Loading state
  const isLoading = isLoadingCards || isLoadingTransactions;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Coin Management</CardTitle>
            <CardDescription>
              Manage digital coins and NFC cards for your payment system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
              <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between flex-1">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Coins in Circulation</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalCoinsInCirculation.toLocaleString()} Coins</p>
                </div>
                <Coins className="h-10 w-10 text-primary" />
              </div>
              
              <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between flex-1">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Active NFC Cards</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {nfcCards ? nfcCards.filter((c: NfcCard) => c.active).length : 0}
                  </p>
                </div>
                <CreditCard className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">NFC Cards</h3>
              <Dialog open={openNewCard} onOpenChange={setOpenNewCard}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Issue New Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Issue New NFC Card</DialogTitle>
                  </DialogHeader>
                  <Form {...newCardForm}>
                    <form onSubmit={newCardForm.handleSubmit(onSubmitNewCard)} className="space-y-4">
                      <FormField
                        control={newCardForm.control}
                        name="cardId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter card ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={newCardForm.control}
                        name="balance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Balance (Coins)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenNewCard(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCardMutation.isPending}
                        >
                          {createCardMutation.isPending ? "Creating..." : "Create Card"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card ID</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcCards?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No NFC cards found
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfcCards?.map((card: NfcCard) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-medium">#{card.cardId}</TableCell>
                          <TableCell>{card.balance} Coins</TableCell>
                          <TableCell>{formatTimeAgo(card.lastUsed)}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              card.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            )}>
                              {card.active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleSelectCardForTopup(card)}
                              >
                                <Wallet className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Recent card transactions and balance changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center mb-4 border-b border-gray-100 pb-4">
                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                      <Skeleton className="h-4 w-32 mt-1" />
                      <Skeleton className="h-4 w-16 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {transactions?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent transactions found
                  </div>
                ) : (
                  transactions?.filter((t: Transaction) => t.cardId)
                  .sort((a: Transaction, b: Transaction) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
                  .slice(0, 5)
                  .map((transaction: Transaction) => {
                    const card = nfcCards?.find((c: NfcCard) => c.id === transaction.cardId);
                    
                    return (
                      <div key={transaction.id} className="flex items-center border-b border-gray-100 pb-4 last:border-0">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mr-3",
                          transaction.type === "topup" ? "bg-green-100" : "bg-blue-100"
                        )}>
                          {transaction.type === "topup" ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-800">
                              {card ? `Card #${card.cardId}` : "Unknown Card"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(transaction.timestamp)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {transaction.type === "topup" ? "Topped up" : "Used for purchase"}
                          </p>
                          <p className={cn(
                            "text-sm font-medium mt-0.5",
                            transaction.type === "topup" ? "text-green-600" : "text-blue-600"
                          )}>
                            {transaction.type === "topup" ? "+" : "-"}
                            {transaction.amount} Coins
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <p className="text-sm text-gray-500">
              Total value: {totalCoinsInCirculation} Coins
            </p>
            <Button variant="ghost" size="sm" className="gap-1">
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Top-up Dialog */}
      <Dialog open={openTopup} onOpenChange={setOpenTopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up NFC Card</DialogTitle>
          </DialogHeader>
          <Form {...topupForm}>
            <form onSubmit={topupForm.handleSubmit(onSubmitTopup)} className="space-y-4">
              <FormField
                control={topupForm.control}
                name="cardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={selectedCardId?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a card" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {nfcCards?.map((card: NfcCard) => (
                          <SelectItem key={card.id} value={card.id.toString()}>
                            Card #{card.cardId} - Balance: {card.balance} Coins
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={topupForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Coins)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenTopup(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={topupCardMutation.isPending}
                >
                  {topupCardMutation.isPending ? "Processing..." : "Top Up Card"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Card Transactions and Details */}
      <Card>
        <CardHeader>
          <CardTitle>Card Transactions</CardTitle>
          <CardDescription>
            View detailed transactions for specific NFC cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions">
            <TabsList className="mb-4">
              <TabsTrigger value="transactions">All Transactions</TabsTrigger>
              <TabsTrigger value="details">Card Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <div className="mb-4">
                <Select onValueChange={(value) => setSelectedCardId(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a card to view transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    {nfcCards?.map((card: NfcCard) => (
                      <SelectItem key={card.id} value={card.id.toString()}>
                        Card #{card.cardId} - Balance: {card.balance} Coins
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedCardId ? (
                <div className="text-center py-8 text-gray-500">
                  Select a card to view its transactions
                </div>
              ) : isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCardTransactions(selectedCardId).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No transactions found for this card
                          </TableCell>
                        </TableRow>
                      ) : (
                        getCardTransactions(selectedCardId).map((transaction: Transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="capitalize">{transaction.type}</TableCell>
                            <TableCell className={cn(
                              "font-medium",
                              transaction.type === "topup" ? "text-green-600" : "text-blue-600"
                            )}>
                              {transaction.type === "topup" ? "+" : "-"}
                              {transaction.amount} Coins
                            </TableCell>
                            <TableCell>{formatTimeAgo(transaction.timestamp)}</TableCell>
                            <TableCell>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs",
                                transaction.status === "completed" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              )}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details">
              <div className="mb-4">
                <Select onValueChange={(value) => setSelectedCardId(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a card to view details" />
                  </SelectTrigger>
                  <SelectContent>
                    {nfcCards?.map((card: NfcCard) => (
                      <SelectItem key={card.id} value={card.id.toString()}>
                        Card #{card.cardId} - Balance: {card.balance} Coins
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedCardId ? (
                <div className="text-center py-8 text-gray-500">
                  Select a card to view its details
                </div>
              ) : isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {nfcCards && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      {(() => {
                        const card = nfcCards.find((c: NfcCard) => c.id === selectedCardId);
                        if (!card) return <div>Card not found</div>;
                        
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <CreditCard className="h-12 w-12 text-primary mr-4" />
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">Card #{card.cardId}</h3>
                                <p className="text-gray-500">
                                  {card.active ? "Active" : "Inactive"} • Last used {formatTimeAgo(card.lastUsed)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="bg-white rounded-lg border p-4">
                                <p className="text-sm text-gray-500">Current Balance</p>
                                <p className="text-2xl font-bold text-gray-900">{card.balance} Coins</p>
                              </div>
                              
                              <div className="bg-white rounded-lg border p-4">
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {getCardTransactions(card.id).length}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex mt-4 gap-2">
                              <Button 
                                onClick={() => handleSelectCardForTopup(card)}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Top Up Card
                              </Button>
                              <Button variant="outline" className="gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit Card
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoinsPage;
