// Main Widget Renderer - Routes to specific widget components
import HeroWidget from './HeroWidget';
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
import HeaderNavWidget from './HeaderNavWidget';
import HeaderIconsWidget from './HeaderIconsWidget';
import FooterColumnWidget from './FooterColumnWidget';

// New Primitives
import HeadingWidget from './primitive/HeadingWidget';
import TextWidget from './primitive/TextWidget';
import ImageWidget from './primitive/ImageWidget';
import ContainerWidget from './primitive/ContainerWidget';
import DividerWidget from './primitive/DividerWidget';
import SpacerWidget from './primitive/SpacerWidget';
import ColumnsWidget from './primitive/ColumnsWidget';

// New Engaging Widgets (Batch 2)
import CountdownTimerWidget from './CountdownTimerWidget';
import BeforeAfterSliderWidget from './BeforeAfterSliderWidget';
import PricingTableWidget from './PricingTableWidget';

// Advanced Interactive Widgets (Batch 3)
import AccordionWidget from './AccordionWidget';
import TabsWidget from './TabsWidget';
import AnnouncementBarWidget from './AnnouncementBarWidget';

const WIDGET_MAP = {
    hero: HeroWidget,
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
    header_nav: HeaderNavWidget,
    header_actions: HeaderIconsWidget,
    footer_column: FooterColumnWidget,

    // Primitives
    heading: HeadingWidget,
    text: TextWidget,
    image: ImageWidget,
    container: ContainerWidget,
    divider: DividerWidget,
    spacer: SpacerWidget,
    columns: ColumnsWidget,

    // New Engaging Widgets
    countdown_timer: CountdownTimerWidget,
    before_after_slider: BeforeAfterSliderWidget,
    pricing_table: PricingTableWidget,

    // Advanced Interactive Widgets
    accordion: AccordionWidget,
    tabs: TabsWidget,
    announcement_bar: AnnouncementBarWidget,
};



export default function WidgetRenderer({ widget, widgets = [] }) {
    const WidgetComponent = WIDGET_MAP[widget.widget_type];

    if (!WidgetComponent) {
        console.warn(`Unknown widget type: ${widget.widget_type}`);
        return null;
    }

    // Find children
    const children = widgets
        .filter(w => w.parent_id === widget.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <WidgetComponent config={widget.config}>
            {children.length > 0 && children.map(child => (
                <WidgetRenderer key={child.id} widget={child} widgets={widgets} />
            ))}
        </WidgetComponent>
    );
}
