'use client';

/**
 * CollectionHeader
 * Renders a curated collection hero above widgets — only for collection_type !== 'vendor'.
 * Shows collection image (if available), name, and description.
 */
export default function CollectionHeader({ collection }) {
    if (!collection) return null;

    const hasImage = !!collection.image_url;

    return (
        <div className="collection-header-root">
            {/* Hero */}
            <div
                className="collection-header-hero"
                style={hasImage ? { backgroundImage: `url(${collection.image_url})` } : {}}
            >
                <div className="collection-header-overlay" />
                <div className="collection-header-content">
                    <span className="collection-header-badge">Collection</span>
                    <h1 className="collection-header-name">{collection.name}</h1>
                    {collection.description && (
                        <p className="collection-header-desc">{collection.description}</p>
                    )}
                </div>
            </div>

            <style>{`
                .collection-header-root {
                    width: 100%;
                    margin-bottom: 0;
                }

                .collection-header-hero {
                    position: relative;
                    width: 100%;
                    min-height: 260px;
                    background-color: #1a1a2e;
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: flex-end;
                }

                .collection-header-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to bottom,
                        rgba(10, 10, 20, 0.15) 0%,
                        rgba(10, 10, 20, 0.75) 100%
                    );
                }

                .collection-header-content {
                    position: relative;
                    z-index: 1;
                    padding: 40px 32px 36px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 720px;
                }

                .collection-header-badge {
                    display: inline-block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.7);
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 4px 10px;
                    border-radius: 20px;
                    width: fit-content;
                    backdrop-filter: blur(4px);
                }

                .collection-header-name {
                    font-size: clamp(1.7rem, 4vw, 2.6rem);
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0;
                    line-height: 1.15;
                    text-shadow: 0 2px 12px rgba(0,0,0,0.35);
                }

                .collection-header-desc {
                    font-size: 0.97rem;
                    color: rgba(255, 255, 255, 0.78);
                    margin: 0;
                    line-height: 1.6;
                    max-width: 560px;
                }

                @media (max-width: 640px) {
                    .collection-header-content {
                        padding: 28px 20px 24px;
                    }
                    .collection-header-hero {
                        min-height: 200px;
                    }
                }
            `}</style>
        </div>
    );
}
