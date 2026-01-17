// Simple layout for widget demo - avoids Turbopack font loading issue
import '../globals.css';

export const metadata = {
    title: 'Widget Demo Gallery',
    description: 'Test page for enhanced and new widgets',
};

export default function WidgetDemoLayout({ children }) {
    return children;
}
