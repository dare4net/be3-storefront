"use client";

import MenuWidget from './MenuWidget';

export default function FooterColumnWidget({ config }) {
    // Map footer_column config to MenuWidget config structure
    // footer_column: { title, menuLocation, width }
    // MenuWidget: { title, menuLocation, orientation }

    // The 'width' config (col-span-1 etc) is handled by the parent grid container (Footer.js),
    // but the widget itself sits inside that container. 
    // Wait, if WidgetRenderer renders this, does it wrap it in a div with the class?
    // No, WidgetRenderer just renders the component.
    // So this component should probably apply the width class itself?
    // BUT Footer.js grid expects direct children to be columns?
    // If Footer.js iterates widgets, it can wrap them.

    return (
        <MenuWidget config={{
            title: config.title,
            menuLocation: config.menuLocation,
            orientation: 'vertical'
        }} />
    );
}
