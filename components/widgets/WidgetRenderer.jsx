// Main Widget Renderer - Routes to specific widget components
import HeroWidget from './HeroWidget';
import InteractiveSection from './InteractiveSection';
import ProductGridWidget from './ProductGridWidget';
import ProductCarouselWidget from './ProductCarouselWidget';
import CategoryGridWidget from './CategoryGridWidget';
import PromoBannerWidget from './PromoBannerWidget';
import FeaturedProductWidget from './FeaturedProductWidget';
import TestimonialsWidget from './TestimonialsWidget';
import FeaturesWidget from './FeaturesWidget';
import NewsletterWidget from './NewsletterWidget';
import FAQWidget from './FAQWidget';
import AboutWidget from './AboutWidget';
import StatsWidget from './StatsWidget';
import VideoWidget from './VideoWidget';
import GalleryWidget from './GalleryWidget';
import TrustBadgesWidget from './TrustBadgesWidget';
import BlogGridWidget from './BlogGridWidget';
import CustomHTMLWidget from './CustomHTMLWidget';
import HeaderLogoWidget from './HeaderLogoWidget';
import HeaderIconsWidget from './HeaderIconsWidget';

// Search Widgets
import SearchBarWidget from './SearchBarWidget';
import SearchFiltersWidget from './SearchFiltersWidget';
import SearchResultsWidget from './SearchResultsWidget';
import SearchPageLayout from './SearchPageLayout';

// New Primitives
import HeadingWidget from './primitive/HeadingWidget';
import TextWidget from './primitive/TextWidget';
import ImageWidget from './primitive/ImageWidget';
import ContainerWidget from './primitive/ContainerWidget';
import DividerWidget from './primitive/DividerWidget';
import SpacerWidget from './primitive/SpacerWidget';
import ColumnsWidget from './primitive/ColumnsWidget';
import GridWidget from './primitive/GridWidget';
import CarouselWidget from './primitive/CarouselWidget';

// New Engaging Widgets (Batch 2)
import CountdownTimerWidget from './CountdownTimerWidget';
import BeforeAfterSliderWidget from './BeforeAfterSliderWidget';
import PricingTableWidget from './PricingTableWidget';

// Advanced Interactive Widgets (Batch 3)
import AccordionWidget from './AccordionWidget';
import TabsWidget from './TabsWidget';
import AnnouncementBarWidget from './AnnouncementBarWidget';
import CategoryCarouselWidget from './CategoryCarouselWidget';
import RandomizerWidget from './primitive/RandomizerWidget';

const WIDGET_MAP = {
    hero: HeroWidget,
    interactive_section: InteractiveSection,
    product_grid: ProductGridWidget,
    product_carousel: ProductCarouselWidget,
    category_grid: CategoryGridWidget,
    promo_banner: PromoBannerWidget,
    featured_product: FeaturedProductWidget,
    testimonials: TestimonialsWidget,
    features: FeaturesWidget,
    newsletter: NewsletterWidget,
    faq: FAQWidget,
    about: AboutWidget,
    stats: StatsWidget,
    video: VideoWidget,
    gallery: GalleryWidget,
    trust_badges: TrustBadgesWidget,
    blog_grid: BlogGridWidget,
    custom_html: CustomHTMLWidget,
    header_logo: HeaderLogoWidget,
    header_actions: HeaderIconsWidget,

    // Search
    search_bar: SearchBarWidget,
    search_filters: SearchFiltersWidget,
    search_results: SearchResultsWidget,
    search_page_layout: SearchPageLayout,

    // Primitives
    heading: HeadingWidget,
    text: TextWidget,
    image: ImageWidget,
    container: ContainerWidget,
    divider: DividerWidget,
    spacer: SpacerWidget,
    columns: ColumnsWidget,
    grid: GridWidget,
    carousel_container: CarouselWidget,

    // New Engaging Widgets
    countdown_timer: CountdownTimerWidget,
    before_after_slider: BeforeAfterSliderWidget,
    pricing_table: PricingTableWidget,

    // Advanced Interactive Widgets
    accordion: AccordionWidget,
    tabs: TabsWidget,
    announcement_bar: AnnouncementBarWidget,
    category_carousel: CategoryCarouselWidget,
    randomizer: RandomizerWidget,
};



export default function WidgetRenderer({ widget, widgets = [] }) {
    const WidgetComponent = WIDGET_MAP[widget.widget_type];

    if (!WidgetComponent) {
        console.warn(`Unknown widget type: ${widget.widget_type}`);
        return null;
    }

    // Ensure config is an object
    let config = widget.config || {};
    if (typeof config === 'string') {
        try {
            config = JSON.parse(config);
        } catch (e) {
            console.error(`Failed to parse config for widget ${widget.id}`, e);
            config = {};
        }
    }

    // Find children
    const children = widgets
        .filter(w => w.parent_id === widget.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Grid Placement Styling
    const parent = widgets.find(w => w.id === widget.parent_id);
    const isInsideGrid = parent?.widget_type === 'grid';
    const wrapperClass = `widget-placement-${widget.id.toString().split('-').pop()}`;

    const desktopStyle = {};
    if (isInsideGrid) {
        if (config.gridColSpan || config.gridColStart) {
            desktopStyle.gridColumn = config.gridColStart
                ? `${config.gridColStart} / span ${config.gridColSpan || 1}`
                : `span ${config.gridColSpan || 1}`;
        }
        if (config.gridRowSpan || config.gridRowStart) {
            desktopStyle.gridRow = config.gridRowStart
                ? `${config.gridRowStart} / span ${config.gridRowSpan || 1}`
                : `span ${config.gridRowSpan || 1}`;
        }
    }

    return (
        <div className={wrapperClass} style={desktopStyle}>
            {isInsideGrid && (
                <style jsx>{`
                    @media (max-width: 768px) {
                        .${wrapperClass} {
                            grid-column: ${config.mobileGridColStart ? `${config.mobileGridColStart} / span ${config.mobileGridColSpan || 1}` : `span ${config.mobileGridColSpan || 1}`} !important;
                            grid-row: ${config.mobileGridRowStart ? `${config.mobileGridRowStart} / span ${config.mobileGridRowSpan || 1}` : `span ${config.mobileGridRowSpan || 1}`} !important;
                        }
                    }
                `}</style>
            )}
            <WidgetComponent config={config}>
                {children.length > 0 && children.map(child => (
                    <WidgetRenderer key={child.id} widget={child} widgets={widgets} />
                ))}
            </WidgetComponent>
        </div>
    );
}
