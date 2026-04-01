export const seedProducts = [
  {
    id: "maja-oxford",
    name: "Camisa Oxford Maja",
    category: "Camisa",
    description:
      "Camisa de corte limpio con presencia premium, ideal para proyectar una imagen elegante y moderna en cualquier ocasion.",
    price: 749,
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
    ],
  },
  {
    id: "maja-air",
    name: "Playera Air Flow",
    category: "Playera",
    description:
      "Playera ligera con estetica fresca y comercial, pensada para colecciones versatiles y venta digital de alto impacto visual.",
    price: 549,
    sizes: ["CH", "M", "G"],
    active: true,
    featured: false,
    variants: [
      {
        id: "maja-air-yellow",
        colorName: "Amarillo solar",
        hex: "#F2B705",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
];

export const seedUsers = [
  {
    id: "admin-1",
    username: process.env.ADMIN_USER || "admin",
    passwordHash: "",
  },
];
