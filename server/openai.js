import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function heuristicAnalysis(fileName = "") {
  const normalized = fileName.toLowerCase();
  const color = normalized.includes("roj")
    ? { colorName: "Rojo vibrante", hex: "#C51F38" }
    : normalized.includes("amar")
      ? { colorName: "Amarillo solar", hex: "#F2B705" }
      : normalized.includes("blan")
        ? { colorName: "Blanco", hex: "#F5F7FA" }
        : { colorName: "Azul marino", hex: "#123C73" };

  const category = normalized.includes("pant")
    ? "Pantalon"
    : normalized.includes("play") || normalized.includes("tee")
      ? "Playera"
      : "Camisa";

  return {
    ...color,
    category,
    description: `${category} en tono ${color.colorName.toLowerCase()} con acabado visual premium, ideal para un catalogo elegante y comercial.`,
    source: "heuristic",
  };
}

export async function analyzeProductImage({ imageDataUrl, fileName }) {
  if (!client || !imageDataUrl) {
    return heuristicAnalysis(fileName);
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Analiza la prenda y responde SOLO JSON con las claves: category, colorName, hex, description. category debe ser Camisa, Playera o Pantalon.",
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: `Archivo: ${fileName || "producto"}` },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "product_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: { type: "string" },
              colorName: { type: "string" },
              hex: { type: "string" },
              description: { type: "string" },
            },
            required: ["category", "colorName", "hex", "description"],
          },
        },
      },
    });

    const raw = response.output_text || "{}";
    return {
      ...JSON.parse(raw),
      source: "openai",
    };
  } catch {
    return heuristicAnalysis(fileName);
  }
}
