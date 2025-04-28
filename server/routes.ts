import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertShopSchema, insertProductSchema, 
  insertNfcCardSchema, insertTransactionSchema,
  NfcCard // Added import for the NfcCard type
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup error handling middleware for Zod validation
  const validateBody = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        } else {
          next(error);
        }
      }
    };
  };

  // User routes
  app.post("/api/users", validateBody(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Shop routes
  app.get("/api/shops", async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined;
      
      let shops;
      if (ownerId) {
        shops = await storage.getShopsByOwner(ownerId);
      } else {
        shops = await storage.getShops();
      }
      
      res.json(shops);
    } catch (error) {
      res.status(500).json({ message: "Error fetching shops" });
    }
  });

  app.get("/api/shops/:id", async (req, res) => {
    try {
      const shop = await storage.getShop(parseInt(req.params.id));
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Error fetching shop" });
    }
  });

  app.post("/api/shops", validateBody(insertShopSchema), async (req, res) => {
    try {
      const shop = await storage.createShop(req.body);
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Error creating shop" });
    }
  });

  app.patch("/api/shops/:id", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      const shop = await storage.getShop(shopId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const updatedShop = await storage.updateShop(shopId, req.body);
      res.json(updatedShop);
    } catch (error) {
      res.status(500).json({ message: "Error updating shop" });
    }
  });

  // Product routes
  // Create memory fallback for products
  const memProducts = new Map();
  let productIdCounter = 1;
  
  // Helper to get demo products when Airtable fails
  const getFallbackProducts = (shopId?: number) => {
    if (memProducts.size === 0) {
      // Add some demo products if none exist yet
      [
        { shopId: 1, name: "Coffee", price: 50, icon: "coffee", available: true, description: "Fresh brewed coffee" },
        { shopId: 1, name: "Tea", price: 40, icon: "mug-hot", available: true, description: "Hot tea" },
        { shopId: 1, name: "Cake", price: 80, icon: "cake", available: true, description: "Delicious cake" },
        { shopId: 2, name: "Pad Thai", price: 120, icon: "bowl-food", available: true, description: "Classic Thai dish" },
        { shopId: 2, name: "Green Curry", price: 150, icon: "utensils", available: true, description: "Spicy green curry" },
        { shopId: 2, name: "Mango Sticky Rice", price: 100, icon: "rice", available: true, description: "Sweet dessert" },
        { shopId: 3, name: "Smartphone", price: 500, icon: "mobile", available: true, description: "Latest smartphone" },
        { shopId: 3, name: "Tablet", price: 700, icon: "tablet", available: true, description: "Portable tablet" },
        { shopId: 3, name: "Earbuds", price: 200, icon: "headphones", available: true, description: "Wireless earbuds" }
      ].forEach(product => {
        const id = productIdCounter++;
        memProducts.set(id, { ...product, id });
      });
    }
    
    const products = Array.from(memProducts.values());
    
    // Filter by shop if needed
    if (shopId) {
      return products.filter(p => p.shopId === shopId);
    }
    
    return products;
  };
  
  app.get("/api/products", async (req, res) => {
    try {
      const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : undefined;
      
      let products;
      try {
        if (shopId) {
          products = await storage.getProductsByShop(shopId);
        } else {
          products = await storage.getProducts();
        }
      } catch (error) {
        console.warn("Falling back to memory storage for products:", error);
        products = getFallbackProducts(shopId);
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      let product;
      
      try {
        product = await storage.getProduct(productId);
      } catch (error) {
        // Fallback to memory storage
        product = memProducts.get(productId);
      }
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", validateBody(insertProductSchema), async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  // NFC Card routes
  // Create memory fallback for NFC cards
  const memNfcCards = new Map<number, NfcCard>();
  let nfcCardIdCounter = 1;
  
  // Helper to get demo NFC cards when Airtable fails
  const getFallbackNfcCards = () => {
    if (memNfcCards.size === 0) {
      // Add some demo cards if none exist yet
      [
        { cardId: "NFC001", balance: 500, active: true },
        { cardId: "NFC002", balance: 200, active: true },
        { cardId: "NFC003", balance: 1000, active: true },
      ].forEach(card => {
        const id = nfcCardIdCounter++;
        memNfcCards.set(id, { ...card, id, lastUsed: null } as NfcCard);
      });
    }
    return Array.from(memNfcCards.values());
  };

  app.get("/api/nfc-cards", async (req, res) => {
    try {
      let cards;
      try {
        cards = await storage.getNfcCards();
      } catch (error) {
        console.warn("Falling back to memory storage for NFC cards:", error);
        cards = getFallbackNfcCards();
      }
      res.json(cards);
    } catch (error) {
      console.error("Error fetching NFC cards:", error);
      res.status(500).json({ message: "Error fetching NFC cards" });
    }
  });

  app.get("/api/nfc-cards/:id", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      let card;
      
      try {
        card = await storage.getNfcCard(cardId);
      } catch (error) {
        // Fallback to memory storage
        card = memNfcCards.get(cardId);
      }
      
      if (!card) {
        return res.status(404).json({ message: "NFC card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Error fetching NFC card" });
    }
  });

  app.get("/api/nfc-cards/by-card-id/:cardId", async (req, res) => {
    try {
      const searchCardId = req.params.cardId;
      let card;
      
      try {
        card = await storage.getNfcCardByCardId(searchCardId);
      } catch (error) {
        // Fallback to memory storage
        card = Array.from(memNfcCards.values()).find(c => c.cardId === searchCardId);
      }
      
      if (!card) {
        return res.status(404).json({ message: "NFC card not found" });
      }
      
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Error fetching NFC card" });
    }
  });

  app.post("/api/nfc-cards", validateBody(insertNfcCardSchema), async (req, res) => {
    try {
      const card = await storage.createNfcCard(req.body);
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Error creating NFC card" });
    }
  });

  app.patch("/api/nfc-cards/:id", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getNfcCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "NFC card not found" });
      }
      
      const updatedCard = await storage.updateNfcCard(cardId, req.body);
      res.json(updatedCard);
    } catch (error) {
      res.status(500).json({ message: "Error updating NFC card" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : undefined;
      const cardId = req.query.cardId ? parseInt(req.query.cardId as string) : undefined;
      
      let transactions;
      if (shopId) {
        transactions = await storage.getTransactionsByShop(shopId);
      } else if (cardId) {
        transactions = await storage.getTransactionsByCard(cardId);
      } else {
        transactions = await storage.getTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(parseInt(req.params.id));
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction" });
    }
  });

  app.post("/api/transactions", validateBody(insertTransactionSchema), async (req, res) => {
    try {
      // For NFC payments, process the card transaction
      if (req.body.cardId && req.body.type === 'purchase') {
        const card = await storage.getNfcCard(req.body.cardId);
        if (!card) {
          return res.status(404).json({ message: "NFC card not found" });
        }
        
        // Check if card has enough balance
        if (card.balance < req.body.amount) {
          return res.status(400).json({ message: "Insufficient balance on NFC card" });
        }
        
        // Update card balance
        await storage.updateNfcCard(card.id, {
          balance: card.balance - req.body.amount,
          lastUsed: new Date()
        });
      }
      
      // Create the transaction record
      const transaction = await storage.createTransaction(req.body);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error creating transaction" });
    }
  });

  // Special endpoint for NFC payment processing
  app.post("/api/nfc-payment", async (req, res) => {
    try {
      const { cardId, shopId, amount } = req.body;
      
      if (!cardId || !shopId || !amount) {
        return res.status(400).json({ message: "Missing required fields: cardId, shopId, or amount" });
      }
      
      // Find the card
      const card = await storage.getNfcCardByCardId(cardId);
      if (!card) {
        return res.status(404).json({ message: "NFC card not found" });
      }
      
      // Check if shop exists
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Check if card has enough balance
      if (card.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance on NFC card" });
      }
      
      // Update card balance
      const updatedCard = await storage.updateNfcCard(card.id, {
        balance: card.balance - amount,
        lastUsed: new Date()
      });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        amount,
        shopId,
        cardId: card.id,
        type: 'purchase',
        status: 'completed'
      });
      
      res.json({
        success: true,
        card: updatedCard,
        transaction,
        remainingBalance: updatedCard.balance
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing NFC payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
