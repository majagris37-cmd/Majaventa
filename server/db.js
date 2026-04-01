import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { seedProducts, seedUsers } from "./seed.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta DATABASE_URL. Configura PostgreSQL en tu entorno.");
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payload JSONB NOT NULL
    );
  `);

  const usersCount = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (usersCount.rows[0].count === 0) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10);
    for (const user of seedUsers) {
      await pool.query(
        "INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)",
        [user.id, process.env.ADMIN_USER || user.username, passwordHash],
      );
    }
  }

  const productsCount = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (productsCount.rows[0].count === 0) {
    for (const product of seedProducts) {
      await saveProduct(product);
    }
  }
}

export async function findUserByUsername(username) {
  const result = await pool.query(
    "SELECT id, username, password_hash FROM users WHERE username = $1 LIMIT 1",
    [username],
  );
  return result.rows[0] || null;
}

export async function getProducts({ activeOnly = false } = {}) {
  const result = await pool.query(
    `
      SELECT payload
      FROM products
      ${activeOnly ? "WHERE active = TRUE" : ""}
      ORDER BY updated_at DESC, id ASC
    `,
  );

  return result.rows.map((row) => row.payload);
}

export async function saveProduct(product) {
  await pool.query(
    `
      INSERT INTO products (id, active, updated_at, payload)
      VALUES ($1, $2, NOW(), $3::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        active = EXCLUDED.active,
        updated_at = NOW(),
        payload = EXCLUDED.payload
    `,
    [product.id, Boolean(product.active), JSON.stringify(product)],
  );
}

export async function productExists(id) {
  const result = await pool.query("SELECT 1 FROM products WHERE id = $1 LIMIT 1", [id]);
  return result.rowCount > 0;
}
