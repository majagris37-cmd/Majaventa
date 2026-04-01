import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { initDb, saveProduct } from "../server/db.js";

const sourcePath = resolve(process.cwd(), "server", "data", "db.json");

async function main() {
  const raw = await readFile(sourcePath, "utf8");
  const parsed = JSON.parse(raw);
  const products = Array.isArray(parsed.products) ? parsed.products : [];

  if (!products.length) {
    console.log("No se encontraron productos para importar.");
    return;
  }

  await initDb();

  for (const product of products) {
    await saveProduct(normalizeProduct(product));
  }

  console.log(`Importacion completada. Productos importados: ${products.length}`);
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

main().catch((error) => {
  console.error("Error importando productos:", error);
  process.exitCode = 1;
});
