/**
 * Attribute Clause Utility
 * Generates human-readable titles and meta descriptions for dynamic filter pages
 */

export const generateTitle = (category, attribute, clause) => {
    if (!clause) return category?.name || 'Products';

    const prefix = clause.prefix || '';
    const suffix = clause.suffix || '';
    const categoryName = category?.name || 'Products';

    return `${prefix}${categoryName}${suffix}`.trim();
};

export const generateDescription = (category, attribute, clause) => {
    if (!clause) return category?.description || '';

    // 1. Use manual SEO template if defined
    if (clause.seo_template) {
        let text = clause.seo_template;
        text = text.replace(/\[Category\]/g, category?.name || '');
        text = text.replace(/\[Attribute\]/g, attribute?.label || '');
        text = text.replace(/\[Title\]/g, generateTitle(category, attribute, clause));
        return text;
    }

    // 2. Automatic Fallback
    const title = generateTitle(category, attribute, clause);
    const catDesc = category?.description || '';
    const attrLabel = attribute?.label || '';

    return `Discover our curated selection of ${title}. ${catDesc}. Browse the best ${category?.name || 'products'} with ${attrLabel} matching your needs.`.trim();
};

export const generatePrettyUrl = (categorySlug, clause) => {
    if (!clause || !categorySlug) return null;

    const prefix = clause.prefix || '';
    const suffix = clause.suffix || '';
    const brandedString = `${prefix}${categorySlug}${suffix}`;

    return brandedString
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

export default {
    generateTitle,
    generateDescription,
    generatePrettyUrl
};
