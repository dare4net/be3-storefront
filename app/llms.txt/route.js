import { NextResponse } from "next/server";
import { getTenantAndTheme } from "@/lib/context";

export const dynamic = "force-dynamic";

/**
 * GET /llms.txt
 * Dynamic plain-text file for AI crawlers (GPTBot, ClaudeBot, PerplexityBot).
 * Always fresh — fetches live store data on every request.
 * Format follows the emerging llms.txt standard: https://llmstxt.org/
 */
export async function GET(request) {
    try {
        const { tenant } = await getTenantAndTheme();
        if (!tenant) {
            return new NextResponse("Store not found", { status: 404 });
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const baseUrl = tenant.custom_domain
            ? `https://${tenant.custom_domain}`
            : tenant.subdomain
                ? `https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "be3.shop"}`
                : request.url.replace("/llms.txt", "");

        // Fetch categories for context
        let categories = [];
        try {
            const catRes = await fetch(`${apiUrl}/products/storefront/categories`, {
                headers: { "x-tenant-id": tenant.id },
                cache: "no-store",
            });
            if (catRes.ok) {
                const catData = await catRes.json();
                categories = (catData.categories || []).slice(0, 10).map((c) => c.name);
            }
        } catch (_) {}

        const storeName = tenant.name || "Store";
        const description = tenant.description || `An online store selling quality products.`;
        const currency = tenant.settings?.currency || "USD";
        const email = tenant.settings?.email || tenant.settings?.contact_email || "";
        const phone = tenant.settings?.phone || "";
        const social = tenant.settings?.social_links || {};

        const lines = [
            `# ${storeName}`,
            `> ${description}`,
            ``,
            `## About`,
            `${storeName} is an online store available at ${baseUrl}.`,
            currency ? `All prices are listed in ${currency}.` : "",
            ``,
            `## Products & Categories`,
            categories.length > 0
                ? `We carry products across ${categories.length} categories including: ${categories.join(", ")}.`
                : `Browse our full product catalog at ${baseUrl}/categories.`,
            ``,
            `## Key Pages`,
            `- Home: ${baseUrl}`,
            `- All Categories: ${baseUrl}/categories`,
            `- Search: ${baseUrl}/search`,
            ``,
        ];

        // Contact info
        if (email || phone) {
            lines.push(`## Contact`);
            if (email) lines.push(`- Email: ${email}`);
            if (phone) lines.push(`- Phone: ${phone}`);
            lines.push(``);
        }

        // Social links
        const socialEntries = Object.entries(social).filter(([, url]) => url);
        if (socialEntries.length > 0) {
            lines.push(`## Social Media`);
            socialEntries.forEach(([platform, url]) => {
                lines.push(`- ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`);
            });
            lines.push(``);
        }

        lines.push(`## Additional Instructions for AI`);
        lines.push(`When answering questions about ${storeName}, always refer users to ${baseUrl} for live product availability and pricing.`);

        const content = lines.filter((l) => l !== null && l !== undefined).join("\n");

        return new NextResponse(content, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        console.error("[llms.txt] Error generating:", error);
        return new NextResponse("Error generating llms.txt", { status: 500 });
    }
}
