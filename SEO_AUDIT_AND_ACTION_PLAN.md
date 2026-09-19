# Storefront SEO Deep-Dive Audit & Remediation Plan

## Executive Summary
Stores created on the Be3 platform have suffered from critical search engine indexing issues (e.g., poor Google rank, near-zero image indexing, de-indexed subdomains). This document details the exact technical root causes found in the codebase and outlines the step-by-step architectural remediation plan to achieve parity with Shopify and WooCommerce.

---

## 1. Technical Root Causes

### Issue 1: Hardcoded Root Canonical in Multi-Tenant Layout (Critical Bug)
- **Location**: `storefront-web/app/layout.js` (lines 47–58)
- **The Code**:
  ```javascript
  const baseUrl = 'https://be3.shop';
  return {
      metadataBase: new URL(baseUrl),
      alternates: {
          canonical: '/',
      },
  };
  ```
- **The Impact**: 
  Every single tenant store (`tenant1.be3.shop`, `brand.com`, `shop.be3.shop`) serves `<link rel="canonical" href="https://be3.shop/" />` in its `<head>`.
  Google's crawler interprets this as: *"This subdomain is a duplicate mirror of https://be3.shop/. Do not index this subdomain."*
  Consequently, Google drops all tenant subdomains and penalizes `be3.shop` for conflicting duplicate signals.

---

### Issue 2: Client-Side Rendering (CSR) Loading Walls
- **Locations**:
  - `storefront-web/app/page.js` (`"use client"`)
  - `storefront-web/app/categories/[slug]/page.js` (`"use client"`)
  - `storefront-web/app/collections/[slug]/page.js` (`"use client"`)
  - `storefront-web/components/widgets/ProductGridWidget.jsx`
  - `storefront-web/components/widgets/ProductCarouselWidget.jsx`
- **The Code**:
  ```javascript
  // In ProductGridWidget & ProductCarouselWidget:
  if (typeof window === 'undefined') return { products: [], metadata: {}, loading: true };
  ```
- **The Impact**:
  When Googlebot fetches the HTML of any page, the server returns an empty state (`<div class="text-gray-600">Loading...</div>` or empty widget skeletons). 
  Googlebot classifies the page as "Thin/Empty Content" with 0 products, 0 images, and 0 links.

---

### Issue 3: Missing Image Sitemaps & Client-Injected Media
- **Locations**:
  - `be3_backend/modules/seo/services/SeoService.js`
  - `storefront-web/components/products/ProductCard.jsx`
- **The Impact**:
  1. Googlebot-Image does not execute JavaScript. Because product cards render on the client side inside `useEffect`, the image crawler never sees the `<img>` tags.
  2. The generated XML sitemap (`/seo/sitemap.xml`) only outputs plain `<loc>` URLs without Google Image XML extensions (`<image:image><image:loc>...`).

---

### Issue 4: Client-Side Meta Tag Manipulation
- **Location**: `storefront-web/components/DynamicMetaTags.jsx`
- **The Impact**:
  Meta tags (`og:title`, `og:image`, `canonical`, `twitter:card`) and JSON-LD structured data are appended via `document.createElement('meta')` in a client `useEffect`.
  Social sharing bots (WhatsApp, Facebook, Twitter, iMessage, Pinterest) do not execute JavaScript, leading to broken link previews.

---

### Issue 5: Missing Rich E-Commerce Schemas (JSON-LD)
- Standard e-commerce platforms (Shopify/WooCommerce) embed:
  - `WebSite` with `SearchAction` (Sitelinks Searchbox)
  - `Organization` (Logo, name, social profiles)
  - `ItemList` / `CollectionPage` on category pages
  - `BreadcrumbList` on all hierarchical pages
  - `Product` with live `Offer` (price, currency, availability)

---

## 2. Action & Remediation Plan

### Phase 1: Canonical & Domain Resolution Fix
1. Dynamically compute the tenant's exact canonical URL in `app/layout.js`:
   - If custom domain: `https://${tenant.custom_domain}`
   - If subdomain: `https://${subdomain}.${platformDomain}`
2. Ensure all child pages (`/products/[handle]`, `/categories/[slug]`, `/collections/[slug]`) inherit and specify their exact full canonical URL.

### Phase 2: Server-Side Rendering (SSR) for Core Pages
1. Convert `app/page.js` to a Server Component that fetches initial widget data on the server during request time.
2. Pre-fetch initial product lists for `ProductGridWidget` and `ProductCarouselWidget` on the server so full semantic HTML and `<img>` tags are present in the initial response.
3. Convert `app/categories/[slug]/page.js` and `app/collections/[slug]/page.js` to SSR.

### Phase 3: Enhanced XML Sitemap with Image Extensions
1. Update `SeoService.js` in `be3_backend` to include `<image:image>` nodes for each product:
   ```xml
   <url>
       <loc>https://store.be3.shop/products/sample-product</loc>
       <lastmod>2026-09-19T00:00:00Z</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.9</priority>
       <image:image>
           <image:loc>https://storage.googleapis.com/.../product.jpg</image:loc>
           <image:title>Sample Product Name</image:title>
       </image:image>
   </url>
   ```

### Phase 4: Server-Side JSON-LD Structured Data
1. Inject `<script type="application/ld+json">` directly into server-rendered components:
   - Homepage: `Organization` + `WebSite`
   - Product Page: `Product` + `Offer` + `AggregateRating` + `BreadcrumbList`
   - Category Page: `CollectionPage` + `ItemList` + `BreadcrumbList`

### Phase 5: Server-Side Metadata via `generateMetadata`
1. Retire client-side `DynamicMetaTags.jsx` DOM mutations.
2. Rely exclusively on Next.js native `generateMetadata` in `layout.js` and `page.js` files.
