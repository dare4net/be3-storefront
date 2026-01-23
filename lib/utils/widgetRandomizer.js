/**
 * Widget Randomization Utility
 * Handles randomization logic and interval-based caching
 */

/**
 * Pick a random item from an array
 */
function pickRandom(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pick random item with collision prevention via context
 * Falls back to basic random if context not provided
 * @param {Array} array - Items to pick from
 * @param {Object} context - RandomizationContext (optional)
 * @param {string} type - 'categories' | 'collections' | 'attributeClauses'
 * @param {string} widgetId - Widget identifier for debugging
 * @returns {Object|null}
 */
function pickRandomWithContext(array, context, type, widgetId) {
    if (!context || !context.getNextRandom) {
        // No context - use basic random (backward compatible)
        return pickRandom(array);
    }

    // Use context for deduplication
    return context.getNextRandom(type, array, widgetId);
}

/**
 * Check if we should randomize based on interval
 * @param {string} widgetId - Widget ID
 * @param {string} interval - 'page_load' | 'session' | 'hourly' | 'daily'
 * @returns {boolean}
 */
export function shouldRandomize(widgetId, interval) {
    if (interval === 'page_load') {
        return true; // Always randomize on page load
    }

    const key = `widget_random_v2_${widgetId}_${interval}`;
    const stored = sessionStorage.getItem(key);

    if (!stored) return true; // No cache, randomize

    try {
        const { timestamp } = JSON.parse(stored);
        const now = Date.now();

        switch (interval) {
            case 'session':
                return false; // Once per session, don't randomize again
            case 'hourly':
                return (now - timestamp) > 3600000; // 1 hour
            case 'daily':
                return (now - timestamp) > 86400000; // 24 hours
            default:
                return true;
        }
    } catch (e) {
        return true; // Invalid cache, randomize
    }
}

/**
 * Get cached random selection
 * @param {string} widgetId
 * @param {string} interval
 * @returns {Object|null}
 */
export function getCachedRandomSelection(widgetId, interval) {
    if (interval === 'page_load') return null; // Never cache page_load

    const key = `widget_random_v2_${widgetId}_${interval}`;
    const stored = sessionStorage.getItem(key);

    if (!stored) return null;

    try {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Check if cache is still valid
        switch (interval) {
            case 'session':
                return parsed; // Valid for entire session
            case 'hourly':
                if ((now - parsed.timestamp) > 3600000) return null;
                return parsed;
            case 'daily':
                if ((now - parsed.timestamp) > 86400000) return null;
                return parsed;
            default:
                return null;
        }
    } catch (e) {
        return null;
    }
}

/**
 * Store random selection in sessionStorage
 * @param {string} widgetId
 * @param {Object} randomizedValues - Only the values that were randomized
 * @param {string} interval
 */
export function storeRandomSelection(widgetId, randomizedValues, interval) {
    if (interval === 'page_load') return; // Don't cache page_load

    const key = `widget_random_v2_${widgetId}_${interval}`;
    const data = {
        timestamp: Date.now(),
        selection: randomizedValues
    };

    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('[widgetRandomizer] Failed to store random selection:', e);
    }
}

/**
 * Pick random category from available categories
 * @param {Array} categories
 * @param {Array} allowedIds - Empty array = all categories, or specific IDs to filter
 * @returns {Object|null}
 */
function pickRandomCategory(categories, allowedIds = []) {
    if (!categories || categories.length === 0) return null;

    let filtered = categories;
    if (allowedIds && allowedIds.length > 0) {
        filtered = categories.filter(c => allowedIds.includes(c.id));
    }

    if (filtered.length === 0) return null;
    return pickRandom(filtered);
}

/**
 * Pick random collection from available collections
 * @param {Array} collections
 * @param {Array} allowedIds - Empty array = all collections, or specific IDs to filter
 * @returns {Object|null}
 */
function pickRandomCollection(collections, allowedIds = []) {
    if (!collections || collections.length === 0) return null;

    let filtered = collections;
    if (allowedIds && allowedIds.length > 0) {
        filtered = collections.filter(c => allowedIds.includes(c.id));
    }

    if (filtered.length === 0) return null;
    return pickRandom(filtered);
}

/**
 * Pick random attribute and clause
 * @param {Array} attributes - Attributes with clauses
 * @param {Array} allowedCodes - Empty array = all attributes, or specific codes to filter
 * @returns {{attribute: Object, clause: Object}|null}
 */
function pickRandomAttributeClause(attributes, allowedCodes = []) {
    if (!attributes || attributes.length === 0) return null;

    let filtered = attributes;
    if (allowedCodes && allowedCodes.length > 0) {
        filtered = attributes.filter(a => allowedCodes.includes(a.code));
    }

    // Filter to only attributes with clauses
    filtered = filtered.filter(a => {
        const clauses = a.clauses || [];
        return Array.isArray(clauses) && clauses.length > 0;
    });

    if (filtered.length === 0) return null;

    // Pick random attribute
    const attribute = pickRandom(filtered);
    if (!attribute) return null;

    // Pick random clause from that attribute
    const clauses = attribute.clauses || [];
    if (clauses.length === 0) return null;

    const clause = pickRandom(clauses);
    if (!clause) return null;

    return { attribute, clause };
}

/**
 * Apply randomization to product widget config
 * @param {Object} config - Widget config
 * @param {Object} data - { categories, collections, attributes }
 * @param {Object} context - RandomizationContext for collision prevention (optional)
 * @returns {Object} - New config with randomized values applied
 */
export function applyProductRandomization(config, data, context = null) {
    // If randomization is disabled, return config as-is
    if (!config.randomize?.enabled) {
        return config;
    }

    const newConfig = { ...config }; // Start with fixed values
    const widgetId = config.id || `widget_${Date.now()}`;
    const randomize = config.randomize;

    // Check if we should randomize (based on interval)
    const shouldRandomizeNow = shouldRandomize(widgetId, randomize.interval);

    // Try to get cached selection first
    let cached = null;
    if (!shouldRandomizeNow) {
        cached = getCachedRandomSelection(widgetId, randomize.interval);
        if (cached) {
            // Merge cached random values into config
            return { ...newConfig, ...cached.selection };
        }
    }

    // Store what we're randomizing
    const randomizedValues = {};

    // Randomize source (ONLY if enabled)
    if (randomize.randomizeSource) {
        const allowedTypes = randomize.allowedSourceTypes || [];
        const sourceType = pickRandom(allowedTypes);

        console.log('[widgetRandomizer] Randomizing source. Approved types:', allowedTypes, 'Picked:', sourceType);

        if (sourceType) {
            newConfig.sourceType = sourceType;
            randomizedValues.sourceType = sourceType;

            // Clear previous source-specific values
            newConfig.categoryId = null;
            newConfig.collectionId = null;
            newConfig.collectionSlug = null;
            newConfig.attributeClause = null;

            switch (sourceType) {
                case 'category': {
                    // Filter allowed categories first
                    let filtered = data.categories || [];
                    if (randomize.allowedCategories && randomize.allowedCategories.length > 0) {
                        filtered = filtered.filter(c => randomize.allowedCategories.includes(c.id));
                    }

                    // Use context-aware selection
                    const category = pickRandomWithContext(filtered, context, 'categories', widgetId);
                    console.log('[widgetRandomizer] Selected category:', category);

                    if (category) {
                        newConfig.categoryId = category.id;
                        randomizedValues.categoryId = category.id;

                        // Auto-enable dynamic title for randomized category
                        newConfig.autogenerateTitle = true;
                        randomizedValues.autogenerateTitle = true;
                    } else {
                        console.warn('[widgetRandomizer] No categories available, falling back to "all"');
                        // Fallback to 'all' if no categories available
                        newConfig.sourceType = 'all';
                        randomizedValues.sourceType = 'all';
                    }
                    break;
                }
                case 'collection': {
                    // Filter allowed collections first
                    let filtered = data.collections || [];
                    if (randomize.allowedCollections && randomize.allowedCollections.length > 0) {
                        filtered = filtered.filter(c => randomize.allowedCollections.includes(c.id));
                    }

                    // Use context-aware selection
                    const collection = pickRandomWithContext(filtered, context, 'collections', widgetId);
                    console.log('[widgetRandomizer] Selected collection:', collection);

                    if (collection) {
                        newConfig.collectionId = collection.id;
                        newConfig.collectionSlug = collection.slug || null;
                        randomizedValues.collectionId = collection.id;
                        randomizedValues.collectionSlug = collection.slug || null;

                        // Auto-enable dynamic title
                        newConfig.autogenerateTitle = true;
                        randomizedValues.autogenerateTitle = true;
                    } else {
                        console.warn('[widgetRandomizer] No collections available, falling back to "all"');
                        // Fallback to 'all' if no collections available
                        newConfig.sourceType = 'all';
                        randomizedValues.sourceType = 'all';
                    }
                    break;
                }
                case 'clause': {
                    // Build attribute-clause pairs for context-aware selection
                    let attributesFiltered = data.attributes || [];
                    if (randomize.allowedAttributes && randomize.allowedAttributes.length > 0) {
                        attributesFiltered = attributesFiltered.filter(a => randomize.allowedAttributes.includes(a.code));
                    }

                    // Filter to only attributes with clauses
                    attributesFiltered = attributesFiltered.filter(a => {
                        const clauses = a.clauses || [];
                        return Array.isArray(clauses) && clauses.length > 0;
                    });

                    // Build all possible attribute-clause pairs
                    const pairs = [];
                    for (const attr of attributesFiltered) {
                        const clauses = attr.clauses || [];
                        for (const clause of clauses) {
                            pairs.push({ attribute: attr, clause });
                        }
                    }

                    // Use context-aware selection
                    const result = pickRandomWithContext(pairs, context, 'attributeClauses', widgetId);
                    console.log('[widgetRandomizer] Selected attribute clause:', result);

                    if (result) {
                        newConfig.attributeClause = `${result.attribute.code}:${result.clause.name}`;
                        randomizedValues.attributeClause = newConfig.attributeClause;

                        // Auto-enable dynamic title
                        newConfig.autogenerateTitle = true;
                        randomizedValues.autogenerateTitle = true;
                    } else {
                        console.warn('[widgetRandomizer] No attributes/clauses available, falling back to "all"');
                        // Fallback to 'all' if no attributes/clauses available
                        newConfig.sourceType = 'all';
                        randomizedValues.sourceType = 'all';
                    }
                    break;
                }
                case 'all':
                    // No additional config needed
                    break;
            }
        }
    }

    // Randomize sort (ONLY if enabled)
    if (randomize.randomizeSort) {
        const sort = pickRandom(randomize.allowedSorts || []);
        if (sort) {
            newConfig.sort = sort;
            randomizedValues.sort = sort;
        }
    }

    // Randomize limit (ONLY if enabled)
    if (randomize.randomizeLimit && randomize.limitRange) {
        const { min, max } = randomize.limitRange;
        const limit = Math.floor(Math.random() * (max - min + 1)) + min;
        newConfig.limit = limit;
        randomizedValues.limit = limit;
    }

    // Randomize featured (ONLY if enabled)
    if (randomize.randomizeFeatured) {
        const showFeaturedOnly = Math.random() > 0.5;
        newConfig.showFeaturedOnly = showFeaturedOnly;
        randomizedValues.showFeaturedOnly = showFeaturedOnly;
    }

    // Store selection for interval-based caching
    if (Object.keys(randomizedValues).length > 0) {
        storeRandomSelection(widgetId, randomizedValues, randomize.interval);
    }

    return newConfig;
}

/**
 * Apply randomization to category widget config
 * @param {Object} config - Widget config
 * @param {Object} data - { categories }
 * @param {Object} context - RandomizationContext for collision prevention (optional)
 * @returns {Object} - New config with randomized values applied
 */
export function applyCategoryRandomization(config, data, context = null) {
    // If randomization is disabled, return config as-is
    if (!config.randomize?.enabled) {
        return config;
    }

    const newConfig = { ...config };
    const widgetId = config.id || `widget_${Date.now()}`;
    const randomize = config.randomize;

    // Check if we should randomize (based on interval)
    const shouldRandomizeNow = shouldRandomize(widgetId, randomize.interval);

    // Try to get cached selection first
    let cached = null;
    if (!shouldRandomizeNow) {
        cached = getCachedRandomSelection(widgetId, randomize.interval);
        if (cached) {
            return { ...newConfig, ...cached.selection };
        }
    }

    const randomizedValues = {};

    // Randomize category source type (ONLY if enabled)
    if (randomize.randomizeCategorySource) {
        const sourceType = pickRandom(randomize.allowedCategorySourceTypes || []);
        if (sourceType) {
            newConfig.sourceType = sourceType;
            randomizedValues.sourceType = sourceType;

            // If 'subcategories' selected, pick random parent category
            if (sourceType === 'subcategories') {
                // Find categories that have children
                const parentsWithChildren = data.categories.filter(cat => {
                    return data.categories.some(child => child.parent_id === cat.id);
                });

                if (parentsWithChildren.length > 0) {
                    const parent = pickRandom(parentsWithChildren);
                    newConfig.parentCategoryId = parent.id;
                    randomizedValues.parentCategoryId = parent.id;
                } else {
                    // Fallback to 'top-level' if no parents with children
                    newConfig.sourceType = 'top-level';
                    randomizedValues.sourceType = 'top-level';
                }
            }
        }
    }

    // Store selection for interval-based caching
    if (Object.keys(randomizedValues).length > 0) {
        storeRandomSelection(widgetId, randomizedValues, randomize.interval);
    }

    return newConfig;
}
