import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5215512345678";
const emptyProduct = {
  id: "",
  name: "",
  category: "Camisa",
  description: "",
  price: 749,
  sizes: ["CH", "M", "G"],
  active: true,
  featured: false,
  variants: [
    {
      id: crypto.randomUUID(),
      colorName: "Azul marino",
      hex: "#123C73",
      image: "",
    },
  ],
};

const defaultCredentials = { username: "", password: "" };
const defaultFilters = { category: "Todos", size: "Todas", color: "Todos" };

function App() {
  const [view, setView] = useState("catalog");
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("maja_admin_token") || "");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("maja_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("maja_cart") || "[]");
    } catch {
      return [];
    }
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [credentials, setCredentials] = useState(defaultCredentials);
  const [loginStatus, setLoginStatus] = useState("");
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminDraft, setAdminDraft] = useState(emptyProduct);
  const [saveState, setSaveState] = useState("");
  const [analysisState, setAnalysisState] = useState("");
  const [checkoutState, setCheckoutState] = useState("");

  useEffect(() => {
    localStorage.setItem("maja_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("maja_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("maja_admin_token", token);
    } else {
      localStorage.removeItem("maja_admin_token");
    }
  }, [token]);

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (token) {
      loadAdminProducts(token);
    }
  }, [token]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Ocurrio un error. Intenta nuevamente.");
    }
    return data;
  }

  async function loadCatalog() {
    setStatus("loading");
    setError("");

    try {
      const data = await request("/products");
      setProducts(data.products || []);
      setSelectedVariants(
        Object.fromEntries((data.products || []).map((product) => [product.id, 0])),
      );
      setStatus("ready");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }

  async function loadAdminProducts(authToken = token) {
    try {
      const response = await fetch(`${API_BASE}/admin/products`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el panel.");
      }
      setAdminProducts(data.products || []);
      setAdminDraft(data.products?.[0] || emptyProduct);
    } catch (requestError) {
      setSaveState(requestError.message);
    }
  }

  const availableColors = useMemo(() => {
    const colors = new Set();
    products.forEach((product) => {
      product.variants.forEach((variant) => colors.add(variant.colorName));
    });
    return ["Todos", ...Array.from(colors)];
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach((product) => {
      product.sizes.forEach((size) => sizes.add(size));
    });
    return ["Todas", ...Array.from(sizes)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category !== "Todos" && product.category !== filters.category) return false;
      if (filters.size !== "Todas" && !product.sizes.includes(filters.size)) return false;
      if (
        filters.color !== "Todos" &&
        !product.variants.some((variant) => variant.colorName === filters.color)
      ) {
        return false;
      }
      return true;
    });
  }, [filters, products]);

  const cartDetailed = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) return null;
        const variant = product.variants.find((entry) => entry.id === item.variantId);
          return {
            ...item,
            name: product.name,
            category: product.category,
            price: Number(product.price ?? item.price ?? 0),
            image: variant?.image,
            colorName: variant?.colorName,
          };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartTotal = useMemo(
    () => cartDetailed.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartDetailed],
  );

  function updateDraft(field, value) {
    setAdminDraft((current) => ({ ...current, [field]: value }));
  }

  function updateVariant(index, field, value) {
    setAdminDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  function addVariant() {
    setAdminDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          id: crypto.randomUUID(),
          colorName: "Nuevo color",
          hex: "#D9DDE5",
          image: "",
        },
      ],
    }));
  }

  function createProduct() {
    const product = {
      ...emptyProduct,
      id: "",
      variants: [
        {
          id: crypto.randomUUID(),
          colorName: "Azul marino",
          hex: "#123C73",
          image: "",
        },
      ],
    };
    setAdminDraft(product);
  }

  async function saveProduct() {
    setSaveState("Guardando...");
    try {
      const exists = Boolean(adminDraft.id) && adminProducts.some((product) => product.id === adminDraft.id);
      const data = await request(exists ? `/admin/products/${adminDraft.id}` : "/admin/products", {
        method: exists ? "PUT" : "POST",
        body: JSON.stringify(adminDraft),
      });
      setSaveState("Cambios guardados.");
      setAdminProducts(data.products);
      setProducts(data.publicProducts);
      setAdminDraft(data.products.find((product) => product.id === adminDraft.id) || adminDraft);
    } catch (requestError) {
      setSaveState(requestError.message);
    }
  }

  async function analyzeImage(file) {
    if (!file) return;
    setAnalysisState("Analizando imagen...");

    const fileData = await toOptimizedDataUrl(file);

    try {
      const data = await request("/ai/analyze", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          imageDataUrl: fileData,
        }),
      });

      setAnalysisState("Sugerencia aplicada. Puedes editarla antes de guardar.");
      setAdminDraft((current) => ({
        ...current,
        name: current.name || suggestProductName(data.analysis.category, data.analysis.colorName),
        category: data.analysis.category,
        description: data.analysis.description,
        variants: current.variants.map((variant, index) =>
          index === 0
            ? {
                ...variant,
                colorName: data.analysis.colorName,
                hex: data.analysis.hex,
                image: fileData,
              }
            : variant,
        ),
      }));
    } catch (requestError) {
      setAnalysisState(requestError.message);
    }
  }

  async function updateVariantImage(index, file) {
    if (!file) return;
    const fileData = await toOptimizedDataUrl(file);
    updateVariant(index, "image", fileData);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginStatus("Validando acceso...");
    try {
      const data = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "No se pudo iniciar sesion.");
        }
        return payload;
      });

      setToken(data.token);
      setView("admin");
      setLoginStatus("Acceso concedido.");
    } catch (requestError) {
      setLoginStatus(requestError.message);
    }
  }

  function logout() {
    setToken("");
    setView("catalog");
    setLoginStatus("");
  }

  function toggleFavorite(productId) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((entry) => entry !== productId)
        : [...current, productId],
    );
  }

  function addToCart(product, variantIndex) {
    const variant = product.variants[variantIndex];
    const price = Number(product.price || 0);
    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === product.id && item.variantId === variant.id,
      );
      if (existing) {
        return current.map((item) =>
          item.productId === product.id && item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          price,
        },
      ];
    });
  }

  function changeQuantity(productId, variantId, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function checkoutWhatsApp() {
    if (!cartDetailed.length) {
      setCheckoutState("Agrega productos al carrito primero.");
      return;
    }

    setCheckoutState("Preparando tu pedido...");
    try {
      const data = await request("/checkout/whatsapp-quote", {
        method: "POST",
        body: JSON.stringify({
          phone: WHATSAPP_NUMBER,
          items: cartDetailed.map((item) => ({
            productId: item.productId,
            name: item.name,
            colorName: item.colorName,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      window.open(data.url, "_blank", "noopener,noreferrer");
      setCheckoutState("WhatsApp abierto con el resumen de compra.");
    } catch (requestError) {
      setCheckoutState(requestError.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Moda Premium</p>
          <h1>Catalogo Gris Maja</h1>
        </div>
        <nav className="topnav">
          <button
            className={view === "catalog" ? "nav-chip active" : "nav-chip"}
            onClick={() => setView("catalog")}
          >
            Catalogo
          </button>
          <button
            className={view === "favorites" ? "nav-chip active" : "nav-chip"}
            onClick={() => setView("favorites")}
          >
            Favoritos
          </button>
          <button
            className={view === "admin" ? "nav-chip active" : "nav-chip"}
            onClick={() => setView(token ? "admin" : "login")}
          >
            Admin
          </button>
        </nav>
      </header>

      <main className="main-layout">
        <section className="content-zone">
          {view === "catalog" && (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <p className="eyebrow">Nueva Coleccion</p>
                  <h2>Compra facil y rapida desde tu celular.</h2>
                  <p className="hero-text">
                    Explora nuestra coleccion, elige tu talla y color favorito y realiza tu pedido
                    directo por WhatsApp en segundos.
                  </p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => setView(token ? "admin" : "login")}>
                      Administrar productos
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() =>
                        setFilters({ category: "Camisa", size: "Todas", color: "Todos" })
                      }
                    >
                      Ver catalogo
                    </button>
                  </div>
                </div>
                <div className="hero-art">
                  <div className="hero-card large">
                    <img
                      src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80"
                      alt="Coleccion Maja"
                    />
                  </div>
                  <div className="hero-card info-card">
                    <strong>{products.length}</strong>
                    <span>productos activos</span>
                  </div>
                </div>
              </section>

              <section className="toolbar-card">
                <div className="toolbar-grid">
                  <label>
                    Tipo
                    <select
                      value={filters.category}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, category: event.target.value }))
                      }
                    >
                      <option>Todos</option>
                      <option>Camisa</option>
                      <option>Playera</option>
                      <option>Pantalon</option>
                    </select>
                  </label>
                  <label>
                    Talla
                    <select
                      value={filters.size}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, size: event.target.value }))
                      }
                    >
                      {availableSizes.map((size) => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Color
                    <select
                      value={filters.color}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, color: event.target.value }))
                      }
                    >
                      {availableColors.map((color) => (
                        <option key={color}>{color}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              {status === "loading" && <section className="empty-card">Cargando catalogo...</section>}
              {status === "error" && <section className="empty-card">{error}</section>}

              {status === "ready" && (
                <section className="product-grid">
                  {filteredProducts.map((product) => {
                    const activeIndex = selectedVariants[product.id] ?? 0;
                    const activeVariant = product.variants[activeIndex];
                    return (
                      <article key={product.id} className="product-card">
                        <div className="product-image-wrap">
                          <img src={activeVariant.image} alt={product.name} className="product-image" />
                          <button
                            className={
                              favorites.includes(product.id) ? "favorite-button active" : "favorite-button"
                            }
                            onClick={() => toggleFavorite(product.id)}
                          >
                            {favorites.includes(product.id) ? "Guardado" : "Favorito"}
                          </button>
                        </div>
                        <div className="product-body">
                          <div className="product-price-row">
                            <div>
                              <h3>{product.name}</h3>
                              <p>{product.description}</p>
                            </div>
                            <strong>${Number(product.price || 0).toFixed(2)}</strong>
                          </div>
                          <div className="variant-row">
                            {product.variants.map((variant, index) => (
                              <button
                                key={variant.id}
                                className={index === activeIndex ? "color-dot active" : "color-dot"}
                                style={{ backgroundColor: variant.hex }}
                                title={variant.colorName}
                                onClick={() =>
                                  setSelectedVariants((current) => ({
                                    ...current,
                                    [product.id]: index,
                                  }))
                                }
                              />
                            ))}
                          </div>
                          <div className="product-meta">
                            <span>{product.category}</span>
                            <span>{activeVariant.colorName}</span>
                            <span>{product.sizes.join(" / ")}</span>
                          </div>
                          <button className="primary-button full-width" onClick={() => addToCart(product, activeIndex)}>
                            Agregar al carrito
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </>
          )}

          {view === "favorites" && (
            <section className="favorites-page">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Favoritos</p>
                  <h2>Tus prendas guardadas</h2>
                </div>
              </div>
              <div className="product-grid">
                {products
                  .filter((product) => favorites.includes(product.id))
                  .map((product) => {
                    const variant = product.variants[0];
                    return (
                      <article key={product.id} className="product-card">
                        <div className="product-image-wrap">
                          <img src={variant.image} alt={product.name} className="product-image" />
                        </div>
                        <div className="product-body">
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          )}

          {view === "login" && (
            <section className="login-card">
              <p className="eyebrow">Panel privado</p>
              <h2>Panel administrativo</h2>
              <form className="login-form" onSubmit={handleLogin}>
                <label>
                  Usuario administrador
                  <input
                    value={credentials.username}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, username: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Contrasena
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </label>
                <button className="primary-button" type="submit">
                  Entrar
                </button>
                {loginStatus && <p className="helper-text">{loginStatus}</p>}
              </form>
            </section>
          )}

          {view === "admin" && token && (
            <section className="admin-page">
              <aside className="admin-sidebar">
                <div className="section-head compact">
                  <div>
                    <p className="eyebrow">Productos</p>
                    <h3>Editor admin</h3>
                  </div>
                </div>
                <button className="ghost-button full-width" onClick={createProduct}>
                  Nuevo producto
                </button>
                <div className="admin-list">
                  {adminProducts.map((product) => (
                    <button
                      key={product.id}
                      className={adminDraft.id === product.id ? "admin-item active" : "admin-item"}
                      onClick={() => setAdminDraft(product)}
                    >
                      <strong>{product.name || "Producto sin nombre"}</strong>
                      <span>
                        {product.category} · {product.active ? "Activo" : "Oculto"}
                      </span>
                    </button>
                  ))}
                </div>
                <button className="ghost-button full-width" onClick={logout}>
                  Cerrar sesion
                </button>
              </aside>

              <div className="admin-editor">
                <section className="editor-card">
                  <div className="editor-head">
                    <div>
                      <p className="eyebrow">IA para producto</p>
                      <h3>Sube una imagen</h3>
                    </div>
                    <span className="helper-text">{analysisState}</span>
                  </div>
                  <label className="upload-input">
                    <span>Selecciona una foto para detectar color, categoria y descripcion.</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => analyzeImage(event.target.files?.[0])}
                    />
                  </label>
                </section>

                <section className="editor-card">
                  <div className="editor-head">
                    <div>
                      <p className="eyebrow">Ficha de producto</p>
                      <h3>{adminDraft.name || "Nuevo producto"}</h3>
                    </div>
                    <button className="primary-button" onClick={saveProduct}>
                      Guardar
                    </button>
                  </div>

                  <div className="form-grid">
                    <label>
                      Nombre
                      <input
                        value={adminDraft.name}
                        onChange={(event) => updateDraft("name", event.target.value)}
                      />
                    </label>
                    <label>
                      Categoria
                      <select
                        value={adminDraft.category}
                        onChange={(event) => updateDraft("category", event.target.value)}
                      >
                        <option>Camisa</option>
                        <option>Playera</option>
                        <option>Pantalon</option>
                      </select>
                    </label>
                    <label className="wide">
                      Descripcion
                      <textarea
                        rows="4"
                        value={adminDraft.description}
                        onChange={(event) => updateDraft("description", event.target.value)}
                      />
                    </label>
                    <label>
                      Precio
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={adminDraft.price ?? 0}
                        onChange={(event) =>
                          updateDraft("price", Number(event.target.value || 0))
                        }
                      />
                    </label>
                    <label>
                      Tallas
                      <input
                        value={adminDraft.sizes.join(", ")}
                        onChange={(event) =>
                          updateDraft(
                            "sizes",
                            event.target.value
                              .split(",")
                              .map((size) => size.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </label>
                    <label className="toggle-field">
                      <span>Activo</span>
                      <input
                        type="checkbox"
                        checked={adminDraft.active}
                        onChange={(event) => updateDraft("active", event.target.checked)}
                      />
                    </label>
                  </div>
                  {saveState && <p className="helper-text">{saveState}</p>}
                </section>

                <section className="editor-card">
                  <div className="editor-head">
                    <div>
                      <p className="eyebrow">Variantes</p>
                      <h3>Colores e imagenes</h3>
                    </div>
                    <button className="ghost-button" onClick={addVariant}>
                      Agregar variante
                    </button>
                  </div>
                  <div className="variant-editor-list">
                    {adminDraft.variants.map((variant, index) => (
                      <article key={variant.id} className="variant-editor-item">
                        <div className="variant-preview">
                          {variant.image ? (
                            <img src={variant.image} alt={variant.colorName} />
                          ) : (
                            <div style={{ backgroundColor: variant.hex }} className="color-preview-block"></div>
                          )}
                        </div>
                        <label>
                          Nombre del color
                          <input
                            value={variant.colorName}
                            onChange={(event) => updateVariant(index, "colorName", event.target.value)}
                          />
                        </label>
                        <label>
                          HEX
                          <input
                            value={variant.hex}
                            onChange={(event) => updateVariant(index, "hex", event.target.value)}
                          />
                        </label>
                        <label className="wide">
                          Imagen base64 o URL
                          <textarea
                            rows="3"
                            value={variant.image}
                            onChange={(event) => updateVariant(index, "image", event.target.value)}
                          />
                        </label>
                        <label className="wide">
                          Subir imagen para esta variante
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => updateVariantImage(index, event.target.files?.[0])}
                          />
                        </label>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          )}
        </section>

        <aside className="cart-panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Tu compra</p>
              <h3>Resumen del pedido</h3>
            </div>
          </div>
          <div className="cart-list">
            {cartDetailed.length ? (
              cartDetailed.map((item) => (
                <article key={`${item.productId}-${item.variantId}`} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.colorName} · ${item.price.toFixed(2)}
                    </span>
                    <div className="quantity-row">
                      <button onClick={() => changeQuantity(item.productId, item.variantId, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => changeQuantity(item.productId, item.variantId, 1)}>+</button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-card compact-empty">Tu carrito esta vacio. Agrega productos para comenzar.</div>
            )}
          </div>
          <div className="cart-summary">
            <div>
              <span>Total estimado</span>
              <strong>${cartTotal.toFixed(2)}</strong>
            </div>
            <button className="primary-button full-width" onClick={checkoutWhatsApp}>
              Finalizar pedido por WhatsApp
            </button>
            <p className="helper-text">
              Al comprar, se abre un mensaje con tus productos, cantidades y el total para enviar al
              numero configurado.
            </p>
            {checkoutState && <p className="helper-text">{checkoutState}</p>}
          </div>
        </aside>
      </main>
    </div>
  );
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function toOptimizedDataUrl(file) {
  const original = await toDataUrl(file);

  if (!file.type.startsWith("image/")) {
    return original;
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxWidth = 1400;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(original);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => resolve(original);
    image.src = original;
  });
}

function suggestProductName(category, colorName) {
  if (category === "Playera") {
    return `Playera ${colorName}`;
  }
  if (category === "Pantalon") {
    return `Pantalon ${colorName}`;
  }
  return `Camisa ${colorName}`;
}

export default App;
