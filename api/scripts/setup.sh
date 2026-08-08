#!/usr/bin/env bash
# Setup Cloudflare resources for My Blog API

# Create D1 database
wrangler d1 create my-blog-db

# Apply schema
wrangler d1 execute my-blog-db --file schema.sql

# Create R2 bucket
wrangler r2 bucket create my-blog-cdn

# Set secrets (you will be prompted)
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD
wrangler secret put TOKEN_SECRET

# After creating the DB, copy the Database ID into wrangler.toml:
#   database_id = "<your-db-id>"
