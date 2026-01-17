# Quick Copy-Paste Configs for Enhanced Widgets

Use these pre-configured JSON snippets in the admin panel's "Advanced JSON Config" tab.

## Hero Widget - Particle Background

```json
{
  "layout": "centered",
  "backgroundType": "particles",
  "particles": {
    "count": 80,
    "color": "#ffffff",
    "speed": 2
  },
  "overlay": {
    "enabled": true,
    "color": "#1e40af",
    "opacity": 0.8
  },
  "title": {
    "text": "Welcome to Our Amazing Store",
    "fontSize": { "desktop": "4.5rem", "tablet": "3rem", "mobile": "2rem" },
    "color": "#ffffff",
    "fontWeight": "700",
    "animation": { "type": "fade-up", "duration": 800, "delay": 0 }
  },
  "subtitle": {
    "text": "Discover the best products with unbeatable prices",
    "fontSize": { "desktop": "1.5rem", "tablet": "1.25rem", "mobile": "1rem" },
    "color": "#ffffff",
    "animation": { "type": "fade-up", "duration": 800, "delay": 200 }
  },
  "ctas": [
    {
      "text": "Shop Now",
      "link": "/products",
      "style": "primary",
      "icon": "shopping-cart",
      "animation": { "type": "fade-up", "duration": 800, "delay": 400 }
    },
    {
      "text": "Learn More",
      "link": "/about",
      "style": "outline",
      "icon": "arrow-right",
      "animation": { "type": "fade-up", "duration": 800, "delay": 500 }
    }
  ],
  "height": { "desktop": "600px", "tablet": "500px", "mobile": "400px" },
  "parallax": { "enabled": true, "speed": 0.5 }
}
```

## Features Widget - Grid with Icons

```json
{
  "layout": "grid",
  "columns": { "desktop": 4, "tablet": 2, "mobile": 1 },
  "gap": { "x": "2rem", "y": "2rem" },
  "features": [
    {
      "iconType": "lucide",
      "iconName": "zap",
      "iconColor": "#3b82f6",
      "iconBackground": "#eff6ff",
      "iconSize": 48,
      "title": "Lightning Fast",
      "description": "Optimized for speed and performance"
    },
    {
      "iconType": "lucide",
      "iconName": "shield",
      "iconColor": "#10b981",
      "iconBackground": "#d1fae5",
      "iconSize": 48,
      "title": "Secure & Safe",
      "description": "Bank-level security for your data"
    },
    {
      "iconType": "lucide",
      "iconName": "heart",
      "iconColor": "#ef4444",
      "iconBackground": "#fee2e2",
      "iconSize": 48,
      "title": "Made with Love",
      "description": "Crafted with attention to detail"
    },
    {
      "iconType": "lucide",
      "iconName": "star",
      "iconColor": "#f59e0b",
      "iconBackground": "#fef3c7",
      "iconSize": 48,
      "title": "Top Rated",
      "description": "5-star reviews from customers"
    }
  ],
  "cardStyle": {
    "backgroundColor": "#ffffff",
    "padding": "2rem",
    "borderRadius": 16,
    "shadow": "medium",
    "border": { "width": "1px", "color": "#e5e7eb", "style": "solid" }
  },
  "hoverEffect": "lift",
  "entranceAnimation": "slide-up",
  "staggerDelay": 100
}
```

## Stats Widget - Gradient Background

```json
{
  "layout": "horizontal",
  "columns": { "desktop": 4, "tablet": 2, "mobile": 2 },
  "stats": [
    {
      "value": 10000,
      "label": "Happy Customers",
      "suffix": "+",
      "icon": "users",
      "iconColor": "#ffffff",
      "format": "number",
      "decimals": 0,
      "animationDuration": 2000
    },
    {
      "value": 500,
      "label": "Products",
      "suffix": "+",
      "icon": "package",
      "iconColor": "#ffffff",
      "format": "number",
      "decimals": 0,
      "animationDuration": 2000
    },
    {
      "value": 50,
      "label": "Countries",
      "icon": "globe",
      "iconColor": "#ffffff",
      "format": "number",
      "decimals": 0,
      "animationDuration": 2000
    },
    {
      "value": 99.9,
      "label": "Satisfaction",
      "suffix": "%",
      "icon": "star",
      "iconColor": "#ffffff",
      "format": "number",
      "decimals": 1,
      "animationDuration": 2000
    }
  ],
  "textColor": "#ffffff",
  "valueSize": { "desktop": "4rem", "tablet": "3rem", "mobile": "2.5rem" },
  "labelSize": { "desktop": "1.25rem", "tablet": "1rem", "mobile": "0.875rem" },
  "background": {
    "type": "gradient",
    "gradient": {
      "type": "linear",
      "angle": 45,
      "stops": [
        { "color": "#3b82f6", "position": 0 },
        { "color": "#8b5cf6", "position": 100 }
      ]
    }
  },
  "separator": {
    "enabled": true,
    "color": "rgba(255,255,255,0.2)",
    "width": 1
  }
}
```

## How to Use:

1. In the admin panel, click on a widget (Hero, Features, or Stats)
2. Look for the "Advanced JSON Config" button/tab
3. Copy the JSON above and paste it into the editor
4. Save and publish
5. Customize values as needed!

## Available Lucide Icons:

For Features widget, you can use any of these icon names:
- `zap`, `shield`, `heart`, `star`, `check`, `x`, `arrow-right`, `arrow-left`
- `shopping-cart`, `package`, `truck`, `globe`, `users`, `user`, `mail`
- `phone`, `map-pin`, `clock`, `calendar`, `search`, `settings`, `help-circle`
- And 1000+ more at https://lucide.dev/icons/
