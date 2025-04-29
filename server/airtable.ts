import Airtable from "airtable";

// Airtable configuration
export const airtableConfig = {
  apiKey: process.env.AIRTABLE_API_KEY || "patAYWAEknRTyXdKG.cbd23a372b75f8118e9c9d1920127d1a2753ce9206565df236c2af733b0dfc27",
  baseId: process.env.AIRTABLE_BASE_ID || "appQLP7XIvyUmebOQ",
};

// Table names in Airtable
export const TABLES = {
  USERS: "Users",
  SHOPS: "Shops",
  PRODUCTS: "Products",
  NFC_CARDS: "NFCCards",
  TRANSACTIONS: "Transactions",
};

// Field mappings between our schema and Airtable
export const FIELD_MAPS = {
  users: {
    id: "id",
    username: "username",
    password: "password", // Note: In production, you'd store hashed passwords
    name: "name",
    role: "role",
  },
  shops: {
    id: "id",
    name: "name",
    description: "description",
    icon: "icon",
    iconColor: "iconColor",
    status: "status",
    ownerId: "ownerId",
  },
  products: {
    id: "id",
    name: "name",
    description: "description",
    price: "price",
    shopId: "shopId",
    icon: "icon",
    available: "available",
  },
  nfcCards: {
    id: "id",
    cardId: "cardId",
    balance: "balance",
    lastUsed: "lastUsed",
    active: "active",
  },
  transactions: {
    id: "id",
    amount: "amount",
    shopId: "shopId",
    cardId: "cardId",
    timestamp: "timestamp",
    type: "type",
    status: "status",
    previousBalance: "previousBalance",
    newBalance: "newBalance",
  },
};

// Helper to convert from Airtable record to our schema
export function fromAirtableRecord(table: string, record: any) {
  const result: any = { id: parseInt(record.id) };
  const fields = record.fields;
  const fieldMap = (FIELD_MAPS as any)[table];

  for (const key in fieldMap) {
    if (fields[fieldMap[key]] !== undefined) {
      result[key] = fields[fieldMap[key]];
    }
  }

  return result;
}

// Helper to convert from our schema to Airtable fields
export function toAirtableFields(table: string, data: any) {
  const fields: any = {};
  const fieldMap = (FIELD_MAPS as any)[table];

  for (const key in data) {
    if (key !== 'id' && fieldMap[key]) {
      fields[fieldMap[key]] = data[key];
    }
  }

  return fields;
}
