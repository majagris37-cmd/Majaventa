import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcryptjs";
import { seedProducts, seedUsers } from "./seed.js";

const dataDir = join(process.cwd(), "server", "data");
const file = join(dataDir, "db.json");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const adapter = new JSONFile(file);
export const db = new Low(adapter, { products: [], users: [] });

export async function initDb() {
  await db.read();

  if (!db.data.products.length) {
    db.data.products = seedProducts;
  }

  if (!db.data.users.length) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10);
    db.data.users = seedUsers.map((user) => ({ ...user, passwordHash }));
  }

  await db.write();
}
