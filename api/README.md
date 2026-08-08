# My Blog API

This folder contains the Cloudflare Workers backend for **my‑blog**. It implements a full CRUD API using the **Hono** framework, Cloudflare **D1** (SQLite) for data storage and **R2** for file assets.

---

## 📦 Prerequisites

- Cloudflare account with **Workers** and **Pages** access.
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) (v4+).
- Node.js ≥ 22.

---

## ⚙️ Day 2 – Cloudflare Dashboard / Wrangler setup

The following steps prepare the required Cloudflare resources and bind them to the Worker.

1. **Create the D1 database**
   ```bash
   wrangler d1 create my-blog-db
   ```
   The command prints a **Database ID** – copy it.

2. **Apply the schema**
   ```bash
   # Executes the schema.sql that lives in this folder
   wrangler d1 execute my-blog-db --file schema.sql
   ```

3. **Create the R2 bucket**
   ```bash
   wrangler r2 bucket create my-blog-cdn
   ```

4. **Add secrets (admin credentials & token key)**
   ```bash
   # Each command will prompt for the value
   wrangler secret put ADMIN_USERNAME
   wrangler secret put ADMIN_PASSWORD
   wrangler secret put TOKEN_SECRET   # a random 64‑char hex string, e.g. `openssl rand -hex 32`
   ```
   > **Tip**: keep the secret values out of source control.

5. **Configure the `wrangler.toml`**
   - Fill the placeholder `<在Dashboard创建D1后填入>` in `api/wrangler.toml` with the Database ID from step 1.
   - If you prefer the Worker to read the ID from a secret, you can also put it under `[vars]`.

6. **Front‑end environment variable**
   In Cloudflare Pages (or wherever the Astro frontend is hosted) set the variable:
   ```text
   PUBLIC_API_BASE_URL = https://<your‑worker‑subdomain>.workers.dev
   ```
   The front‑end fetch utility (`src/services/client.ts`) reads this variable.

---

## 📥 Day 3 – Data population (seed)

The repository ships a minimal `seed.sql` containing example rows for each table. After the database is created you can import the seed data:

```bash
wrangler d1 execute my-blog-db --file seed.sql
```

If you have existing markdown (MDX) posts you can write a custom script to migrate them into the `posts` table – the schema expects the fields listed in `schema.sql` (slug, title, date, tags, summary, body, cover_image, status).

For R2 assets (e.g. game HTML files) you can upload them via the Dashboard or with the CLI:

```bash
# Example: upload a static folder to R2
wrangler r2 object put my-blog-cdn/games/snake/index.html --file ./frontend/public/games/snake/index.html
```

---

## 📜 NPM scripts

| Script | Description |
|--------|-------------|
| `dev`   | Run the Worker locally (`wrangler dev`). |
| `deploy`| Deploy to Cloudflare (`wrangler deploy`). |
| `types` | Type‑check the project (`tsc --noEmit`). |
| `setup-db` | Apply the D1 schema (`wrangler d1 execute my-blog-db --file schema.sql`). |
| `seed-db`  | Load the example seed data (`wrangler d1 execute my-blog-db --file seed.sql`). |

You can invoke them with `npm run <script>`.

---

## 🛠️ Quick sanity check

```bash
# Install deps
npm install
# Verify TypeScript compilation
npm run types
# Run locally (requires wrangler dev to be installed)
npm run dev
```

When the development server starts, `GET https://<worker‑dev‑url>/` should return `{ "status": "ok", "timestamp": 172… }`.

---

## 📚 Further reading

- Hono docs – https://hono.dev
- Cloudflare D1 – https://developers.cloudflare.com/d1/
- Cloudflare R2 – https://developers.cloudflare.com/r2/
- Workers bindings – https://developers.cloudflare.com/workers/runtime-apis/bindings/

---

*All steps are idempotent; re‑run them if you need to recreate resources.*
