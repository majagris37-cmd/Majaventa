export const initialProducts = [
  {
    id: "maja-oxford",
    name: "Camisa Oxford Maja",
    category: "Camisa",
    description:
      "Camisa de presencia impecable con estructura ligera, ideal para elevar looks casuales o formales con una silueta limpia y contemporánea.",
    sizes: ["CH", "M", "G", "XG"],
    active: true,
    featured: true,
    variants: [
      {
        id: "maja-oxford-navy",
        colorName: "Azul marino",
        hex: "#123C73",
        image:
          "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "maja-oxford-white",
        colorName: "Blanco",
        hex: "#F5F7FA",
        image:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "maja-oxford-red",
        colorName: "Rojo",
        hex: "#C51F38",
        image:
          "https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    id: "maja-air-tee",
    name: "Playera Air Flow",
    category: "Playera",
    description:
      "Playera esencial con tacto suave y caída fluida, pensada para días activos, combinaciones fáciles y una imagen pulida sin esfuerzo.",
    sizes: ["CH", "M", "G"],
    active: true,
    featured: true,
    variants: [
      {
        id: "maja-air-tee-yellow",
        colorName: "Amarillo solar",
        hex: "#F2B705",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "maja-air-tee-black",
        colorName: "Negro",
        hex: "#131313",
        image:
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "maja-air-tee-blue",
        colorName: "Azul eléctrico",
        hex: "#1877F2",
        image:
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    id: "maja-urban-pant",
    name: "Pantalón Urban Motion",
    category: "Pantalon",
    description:
      "Pantalón versátil con líneas limpias y acabado premium que equilibra comodidad, movimiento y una estética urbana refinada.",
    sizes: ["30", "32", "34", "36"],
    active: true,
    featured: false,
    variants: [
      {
        id: "maja-urban-pant-sand",
        colorName: "Arena",
        hex: "#C9A66B",
        image:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "maja-urban-pant-blue",
        colorName: "Azul profundo",
        hex: "#274690",
        image:
          "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
];

export const aiUploads = [
  {
    fileName: "look-azul-frontal.jpg",
    detectedColor: "Azul marino",
    confidence: "97%",
    suggestedCategory: "Camisa",
    generatedDescription:
      "Camisa en tono azul profundo con presencia elegante y alto potencial para colecciones premium.",
  },
  {
    fileName: "playera-ligera-studio.png",
    detectedColor: "Amarillo solar",
    confidence: "93%",
    suggestedCategory: "Playera",
    generatedDescription:
      "Playera fresca y luminosa, perfecta para un catálogo moderno con enfoque energético.",
  },
];
