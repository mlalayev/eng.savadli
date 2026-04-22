import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

function normalizeMongoUri(raw) {
  const trimmed = String(raw ?? "").trim().replace(/^"+|"+$/g, "");
  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) return trimmed;
  try {
    const u = new URL(trimmed);
    const username = u.username ? decodeURIComponent(u.username) : "";
    const password = u.password ? decodeURIComponent(u.password) : "";
    if (username) u.username = encodeURIComponent(username);
    if (password) u.password = encodeURIComponent(password);
    return u.toString();
  } catch {
    return trimmed;
  }
}

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");
const envPath = path.join(cwd, ".env");
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminName = process.env.ADMIN_NAME || "Admin";

if (!adminEmail || !adminPassword) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD.");
  process.exit(1);
}

const client = new MongoClient(normalizeMongoUri(uri));

async function main() {
  await client.connect();
  const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = db.collection("users");

  const existing = await users.findOne({ email: adminEmail });
  if (existing) {
    console.log("Admin already exists:", adminEmail);
    return;
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const firstName = String(adminName).split(/\s+/)[0] || "Admin";
  const surname = String(adminName).split(/\s+/).slice(1).join(" ") || "User";
  await users.insertOne({
    email: adminEmail,
    name: adminName,
    firstName,
    surname,
    phone: "+10000000001",
    dateOfBirth: new Date("1990-01-02T12:00:00.000Z"),
    category: "general",
    role: "admin",
    status: "active",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log("Seeded admin:", adminEmail);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });

