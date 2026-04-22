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

// Fixed creator account (requested).
const creatorEmail = "creator@creator.com";
const creatorPassword = "murad123";
const creatorName = process.env.CREATOR_NAME || "Creator";

const legacyCreatorEmail = "lalayevmurad@gmail.com";

const client = new MongoClient(normalizeMongoUri(uri));

async function main() {
  await client.connect();
  const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = db.collection("users");

  // If the legacy creator exists, remove creator powers to avoid confusion.
  const legacy = await users.findOne({ email: legacyCreatorEmail });
  if (legacy && legacy.role === "creator") {
    await users.updateOne(
      { _id: legacy._id },
      { $set: { role: "admin", updatedAt: new Date() } },
    );
    console.log("Updated legacy creator to admin:", legacyCreatorEmail);
  }

  const existing = await users.findOne({ email: creatorEmail });
  if (existing) {
    // Ensure role is creator
    if (existing.role !== "creator") {
      await users.updateOne(
        { _id: existing._id },
        { $set: { role: "creator", status: existing.status ?? "active", updatedAt: new Date() } },
      );
      console.log("Updated existing user to creator:", creatorEmail);
    } else {
      console.log("Creator already exists:", creatorEmail);
    }
    return;
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(creatorPassword, 12);
  const firstName = String(creatorName).split(/\s+/)[0] || "Creator";
  const surname = String(creatorName).split(/\s+/).slice(1).join(" ") || "User";
  await users.insertOne({
    email: creatorEmail,
    name: creatorName,
    firstName,
    surname,
    phone: "+10000000000",
    dateOfBirth: new Date("1990-01-01T12:00:00.000Z"),
    category: "general",
    role: "creator",
    status: "active",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log("Seeded creator:", creatorEmail);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });

