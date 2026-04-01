# Camisas Maja

Catalogo moderno con:

- Vista publica con filtros, favoritos y carrito.
- Panel privado con login.
- Persistencia local en `server/data/db.json`.
- Analisis de imagen con OpenAI o fallback heuristico.
- Checkout por WhatsApp con resumen automatico del pedido.

## Uso

1. Instala Node.js 18 o superior.
2. Copia `.env.example` como `.env`.
3. Configura tu numero de WhatsApp en `VITE_WHATSAPP_NUMBER`.
4. Configura `OPENAI_API_KEY` si quieres analisis real de imagen.
5. Ejecuta:

```bash
npm install
npm run dev
```

## Acceso admin

- Usuario: el valor de `ADMIN_USER`
- Contrasena: el valor de `ADMIN_PASSWORD`

## Notas

- El backend corre en `http://localhost:4000`.
- El frontend usa `VITE_API_URL`.
- Si no configuras OpenAI, el sistema usa una sugerencia local basada en el nombre del archivo.
