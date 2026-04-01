import "dotenv/config";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByUsername, getProducts, initDb, productExists, saveProduct } from "./db.js";
import { analyzeProductImage } from "./openai.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "camisas_maja_secret_cambiar";
const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const distPath = join(currentDir, "..", "dist");

app.use(cors());
app.use(express.json({ limit: "30mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, date: new Date().toISOString() });
});

app.post("/api/auth/login", async (request, response) => {
  const { username, password } = request.body || {};
  const user = await findUserByUsername(username);

  if (!user) {
    return response.status(401).json({ error: "Usuario no encontrado." });
  }

  const matches = await bcrypt.compare(password || "", user.password_hash);
  if (!matches) {
    return response.status(401).json({ error: "Contrasena incorrecta." });
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, {
    expiresIn: "7d",
  });

  response.json({ token });
});

app.get("/api/products", async (_request, response) => {
  response.json({
    products: await getProducts({ activeOnly: true }),
  });
});

app.get("/api/admin/products", requireAuth, async (_request, response) => {
  response.json({ products: await getProducts() });
});

app.post("/api/admin/products", requireAuth, async (request, response) => {
  await saveProduct(normalizeProduct(request.body));
  response.json({
    products: await getProducts(),
    publicProducts: await getProducts({ activeOnly: true }),
  });
});

app.put("/api/admin/products/:id", requireAuth, async (request, response) => {
  if (!(await productExists(request.params.id))) {
    return response.status(404).json({ error: "Producto no encontrado." });
  }

  await saveProduct(normalizeProduct(request.body));

  response.json({
    products: await getProducts(),
    publicProducts: await getProducts({ activeOnly: true }),
  });
});

app.post("/api/ai/analyze", requireAuth, async (request, response) => {
  const analysis = await analyzeProductImage(request.body || {});
  response.json({ analysis });
});

app.post("/api/checkout/whatsapp-quote", (request, response) => {
  const { phone, items = [] } = request.body || {};
  if (!phone) {
    return response.status(400).json({ error: "Falta el numero de WhatsApp destino." });
  }

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const lines = [
    "Hola, quiero pedir estas prendas de Camisas Maja:",
    ...items.map(
      (item, index) =>
        `${index + 1}. ${item.name} - ${item.colorName} x${item.quantity} = $${(
          Number(item.price) * Number(item.quantity)
        ).toFixed(2)}`,
    ),
    `Total estimado: $${total.toFixed(2)}`,
  ];

  const text = lines.join("\n");
  const url = `https://wa.me/${String(phone).replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  response.json({ url, text, total });
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("/", (_request, response) => {
    response.sendFile(join(distPath, "index.html"));
  });

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next();
      return;
    }
    response.sendFile(join(distPath, "index.html"));
  });
}

initDb().then(() => {
  app.listen(port, () => {
    console.log(`Camisas Maja API activa en http://localhost:${port}`);
    console.log(`Dist detectado: ${distPath} -> ${existsSync(distPath)}`);
  });
});

function requireAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return response.status(401).json({ error: "Falta token de acceso." });
  }

  try {
    request.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return response.status(401).json({ error: "Sesion expirada o token invalido." });
  }
}

function normalizeProduct(product = {}) {
    return {
      id: product.id || crypto.randomUUID(),
      name: product.name || "",
      category: product.category || "Camisa",
      description: product.description || "",
      price: Number(product.price || 0),
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      active: Boolean(product.active),
    featured: Boolean(product.featured),
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          id: variant.id || crypto.randomUUID(),
          colorName: variant.colorName || "Color",
          hex: variant.hex || "#D9DDE5",
          image: variant.image || "",
        }))
      : [],
  };
}
