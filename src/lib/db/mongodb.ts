import { MongoClient } from "mongodb";
import { normalizeMongoUri } from "./normalize-mongo-uri";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI. Set it in .env.local");
}

const client = new MongoClient(normalizeMongoUri(uri));

export const mongoClientPromise: Promise<MongoClient> =
  global.__mongoClientPromise ?? (global.__mongoClientPromise = client.connect());

export async function getDb() {
  const client = await mongoClientPromise;
  return process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
}

