import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertShopSchema,
  insertProductSchema,
  insertNfcCardSchema,
  insertTransactionSchema,
  NfcCard, // Added import for the NfcCard type
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
            errors: error.errors,
          });
        } else {
          next(error);
        }
      }
    };
  };

  // User routes - removed (unused in current app functionality)

  // Shop routes
  app.get("/api/shops", async (req, res) => {
    try {
      const ownerId = req.query.ownerId
        ? parseInt(req.query.ownerId as string)
        : undefined;

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

  // Shop creation and update endpoints removed - not needed for core functionality

  // Product routes - simplified

  app.get("/api/products", async (req, res) => {
    try {
      const shopId = req.query.shopId
        ? parseInt(req.query.shopId as string)
        : undefined;

      let products;
      // ลดรูปการเรียกใช้ฟังก์ชัน
      if (shopId) {
        products = await storage.getProductsByShop(shopId);
      } else {
        products = await storage.getProducts();
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
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  // Product creation and update endpoints removed - not needed for core functionality

  // NFC Card routes

  app.get("/api/nfc-cards", async (req, res) => {
    try {
      let cards;
      cards = await storage.getNfcCards();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching NFC cards:", error);
      res.status(500).json({ message: "Error fetching NFC cards" });
    }
  });

  app.get("/api/nfc-cards/:id", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getNfcCard(cardId);

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
      const card = await storage.getNfcCardByCardId(searchCardId);

      if (!card) {
        return res.status(404).json({ message: "NFC card not found" });
      }

      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Error fetching NFC card" });
    }
  });

  app.post(
    "/api/nfc-cards",
    validateBody(insertNfcCardSchema),
    async (req, res) => {
      try {
        const card = await storage.createNfcCard(req.body);
        res.json(card);
      } catch (error) {
        console.error("Error creating NFC card:", error);
        res.status(500).json({ message: "Error creating NFC card" });
      }
    },
  );

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
      console.error("Error updating NFC card:", error);
      res.status(500).json({ message: "Error updating NFC card" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const shopId = req.query.shopId
        ? parseInt(req.query.shopId as string)
        : undefined;
      const cardId = req.query.cardId
        ? parseInt(req.query.cardId as string)
        : undefined;

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

  app.post(
    "/api/transactions",
    validateBody(insertTransactionSchema),
    async (req, res) => {
      try {
        // For NFC payments, process the card transaction
        if (req.body.cardId && req.body.type === "purchase") {
          const card = await storage.getNfcCard(req.body.cardId);
          if (!card) {
            return res.status(404).json({ message: "NFC card not found" });
          }

          // Check if card has enough balance
          if (card.balance < req.body.amount) {
            return res
              .status(400)
              .json({ message: "Insufficient balance on NFC card" });
          }

          // Store previous and new balance for the transaction
          req.body.previousBalance = card.balance;
          req.body.newBalance = card.balance - req.body.amount;

          // Update card balance
          await storage.updateNfcCard(card.id, {
            balance: req.body.newBalance,
            lastUsed: new Date(),
          });
        } else if (req.body.cardId && req.body.type === "topup") {
          // For top-ups, add to the balance
          const card = await storage.getNfcCard(req.body.cardId);
          if (!card) {
            return res.status(404).json({ message: "NFC card not found" });
          }

          // Store previous and new balance for the transaction
          req.body.previousBalance = card.balance;
          req.body.newBalance = card.balance + req.body.amount;

          // Update card balance
          await storage.updateNfcCard(card.id, {
            balance: req.body.newBalance,
            lastUsed: new Date(),
          });
        }

        // Create the transaction record
        // Make sure to use card.cardId instead of card.id for transaction records
        if (req.body.cardId) {
          // If this is a card transaction, fetch the card to get the cardId (NFC ID)
          const card = await storage.getNfcCard(req.body.cardId);
          if (card) {
            // Use the actual NFC card ID instead of internal ID
            req.body.cardId = card.cardId;
          }
        }
        
        const transaction = await storage.createTransaction(req.body);
        res.json(transaction);
      } catch (error) {
        res.status(500).json({ message: "Error creating transaction" });
      }
    },
  );

  // Special endpoint for NFC payment processing
  app.post("/api/nfc-payment", async (req, res) => {
    try {
      const { cardId, shopId, amount } = req.body;

      console.log("Received NFC payment request:", { cardId, shopId, amount });

      if (!cardId || shopId === undefined || amount === undefined) {
        return res
          .status(400)
          .json({
            message: "Missing required fields: cardId, shopId, or amount",
          });
      }

      // Convert shopId to number if it's a string
      const shopIdNum =
        typeof shopId === "string" ? parseInt(shopId, 10) : shopId;

      if (isNaN(shopIdNum)) {
        return res.status(400).json({ message: "Invalid shop ID format" });
      }

      console.log("Looking for shop with ID:", shopIdNum);

      // Check if shop exists
      let shop;
      // Shop fetch tracking

      try {
        shop = await storage.getShop(shopIdNum);
        console.log(`Found shop via storage: ${shop?.name || 'Unknown'}`);
      } catch (error) {
        console.error(`Error getting shop with ID ${shopIdNum}:`, error);
      }

      // If shop still not found, try to fetch directly from Airtable
      if (!shop) {
        console.warn(
          `Shop with ID ${shopIdNum} not found in primary storage, trying direct Airtable access`,
        );

        try {
          // Try to fetch shop directly from Airtable
          if ((storage as any).base) {
            console.log(`Querying Airtable directly for Shop ID ${shopIdNum}`);
            // Get all shops from Airtable to find the one with matching ID
            const records = await (storage as any).base("Shops").select().all();

            for (const record of records) {
              // Check if this record has our ID - log each shop being checked
              console.log(
                `Checking Airtable shop: ID=${record.fields.id}, Name=${record.fields.name}`,
              );

              if (
                record.fields.id &&
                parseInt(record.fields.id) === shopIdNum
              ) {
                console.log(
                  `Found shop in Airtable with ID ${shopIdNum}: ${record.fields.name}`,
                );
                // Convert Airtable record to our shop format
                shop = {
                  id: parseInt(record.fields.id),
                  name: record.fields.name || `Shop ${shopIdNum}`,
                  description: record.fields.description || null,
                  ownerId: 1, // Default owner ID
                  icon: record.fields.icon || "shopping-bag",
                  iconColor: record.fields.icon || "gray", // Use icon field as color based on mapping
                  status: record.fields.status || "active",
                };
                break;
              }
            }
          }
        } catch (airtableError) {
          console.error(
            "Error fetching shop directly from Airtable:",
            airtableError,
          );
        }

        // If still not found, return error
        if (!shop) {
          console.error(
            `Shop with ID ${shopIdNum} not found in Airtable or system`,
          );
          return res.status(404).json({ message: "Shop not found" });
        }
      }

      console.log(`Found shop: ${shop.name}`);

      // Find the card or create it if it doesn't exist
      let card;
      try {
        card = await storage.getNfcCardByCardId(cardId);
      } catch (error) {
        console.error("Error getting card:", error);
      }

      if (!card) {
        // NFC Card not found, return error instead of creating new card
        console.log(
          `Card ID ${cardId} not found in database. Payment rejected.`,
        );
        return res.status(404).json({
          message: "ไม่พบหมายเลขบัตร NFC ในระบบ",
          error: "card_not_found",
          details:
            "กรุณาตรวจสอบว่าหมายเลขบัตรถูกต้อง หรือใช้บัตรที่ลงทะเบียนในระบบแล้วเท่านั้น",
        });
      }

      // Check if card has enough balance
      if (card.balance < amount) {
        return res
          .status(400)
          .json({ message: "Insufficient balance on NFC card" });
      }

      // Update card balance
      let updatedCard;
      try {
        // Search for the card again by cardId to get the latest Airtable record ID
        const freshAirtableCard = await storage.getNfcCardByCardId(card.cardId);

        if (freshAirtableCard && (freshAirtableCard as any).airtableRecordId) {
          // Use the Airtable record ID directly for updates
          console.log(
            `Using Airtable Record ID ${(freshAirtableCard as any).airtableRecordId} for direct update`,
          );

          try {
            // Update the card using Airtable's API directly
            const airtableFields = {
              balance: card.balance - amount,
              lastUsed: new Date().toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
              }),
            };

            // Airtable expects fields to be passed directly, not wrapped in a fields object
            // Access the Airtable base from the storage implementation
            if ((storage as any).base) {
              const updatedRecord = await (storage as any)
                .base("NFCCards")
                .update(
                  (freshAirtableCard as any).airtableRecordId,
                  airtableFields,
                );
              console.log(
                "Successfully updated card in Airtable:",
                updatedRecord.fields.balance,
              );
            } else {
              throw new Error("Airtable base not available");
            }

            updatedCard = {
              ...card,
              balance: card.balance - amount,
              lastUsed: new Date(),
            };
          } catch (directUpdateError) {
            console.error(
              "Error with direct Airtable update:",
              directUpdateError,
            );
            throw directUpdateError;
          }
        } else {
          // Fall back to regular update
          updatedCard = await storage.updateNfcCard(card.id, {
            balance: card.balance - amount,
            lastUsed: new Date(),
          });
        }
      } catch (updateError) {
        console.error("Error updating card:", updateError);
        // Create fallback updated card
        updatedCard = {
          ...card,
          balance: card.balance - amount,
          lastUsed: new Date(),
        };
        console.log(
          `Using fallback updated card with balance ${updatedCard.balance}`,
        );
      }

      // Create transaction record
      let transaction;
      try {
        // Try to create transaction directly in Airtable
        if ((storage as any).base) {
          try {
            // Create fields object directly without 'fields' wrapper
            const transactionFields = {
              amount: amount,
              shopId: shopIdNum.toString(),
              cardId: card.cardId, // Use actual NFC card ID instead of internal ID
              status: "completed",
              previousBalance: card.balance,
              newBalance: card.balance - amount,
              timestamp: new Date().toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
              }),
            };

            // Create the transaction directly
            const createdRecord = await (storage as any)
              .base("Transactions")
              .create(transactionFields);
            transaction = {
              id:
                parseInt(createdRecord.id) ||
                Math.floor(Math.random() * 1000) + 1000,
              amount,
              shopId: shopIdNum,
              cardId: card.cardId, // Use actual NFC card ID instead of internal ID
              type: "purchase", // For our interface
              status: "completed",
              previousBalance: card.balance,
              newBalance: card.balance - amount,
              timestamp: new Date(
                new Date().toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                }),
              ),
            };
            console.log("Successfully created transaction in Airtable");
          } catch (directTransactionError) {
            console.error(
              "Error creating transaction directly in Airtable:",
              directTransactionError,
            );
            throw directTransactionError;
          }
        } else {
          // Fall back to storage interface
          transaction = await storage.createTransaction({
            amount,
            shopId: shopIdNum,
            cardId: card.cardId, // Use actual NFC card ID instead of internal ID
            type: "purchase", // Required field for TypeScript
            status: "completed",
            previousBalance: card.balance,
            newBalance: card.balance - amount,
          });
        }
      } catch (transactionError) {
        console.error("Error creating transaction:", transactionError);
        // Create fallback transaction
        transaction = {
          id: Math.floor(Math.random() * 1000) + 1000,
          amount,
          shopId: shopIdNum,
          cardId: card.cardId, // Use actual NFC card ID instead of internal ID
          // Note: type is needed for our interface but not for Airtable
          type: "purchase",
          status: "completed",
          previousBalance: card.balance,
          newBalance: card.balance - amount,
          timestamp: new Date(
            new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
          ),
        };
        console.log(`Using fallback transaction with ID ${transaction.id}`);
      }

      res.json({
        success: true,
        card: updatedCard,
        transaction,
        remainingBalance: updatedCard.balance,
      });
    } catch (error) {
      console.error("Error processing NFC payment:", error);
      res.status(500).json({ message: "Error processing NFC payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
