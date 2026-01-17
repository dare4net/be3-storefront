# Widget Demo - Testing Guide

## Quick Start

### 1. Start the Development Server

```bash
cd c:\Users\chatz\Downloads\eCommerce\storefront-web
npm run dev
```

### 2. Open the Demo Page

Navigate to: **http://localhost:3000/widget-demo**

---

## What You'll See

The demo page showcases **9 widgets** with full configurations:

### ✅ Enhanced Widgets (3)

1. **Hero Widget** - Particle background, multiple CTAs, fade-up animations
2. **Features Widget (Grid)** - 4 features with Lucide icons, lift hover effect
3. **Stats Widget** - Animated counters with gradient background

### ✅ New Widgets (6)

4. **Announcement Bar** - Auto-rotating messages (3 messages, 3-second interval)
5. **Countdown Timer** - Flash sale countdown to Dec 31, 2026
6. **Before/After Slider** - Drag to compare images (hover to slide enabled)
7. **Pricing Table** - 3 plans with monthly/yearly toggle, 20% discount
8. **Accordion** - FAQ with 4 items, bordered style
9. **Tabs** - 4 tabs (Features, Reviews, Pricing, Support)

### ✅ Bonus Demo

10. **Features Widget (Carousel)** - Scrollable carousel with emoji icons

---

## Testing Checklist

### Announcement Bar
- [ ] Messages auto-rotate every 3 seconds
- [ ] Rotation indicator dots work
- [ ] Links are clickable
- [ ] Dismiss button works (hides for 7 days)

### Hero Widget
- [ ] Particle animation plays smoothly
- [ ] Title and subtitle fade up with stagger
- [ ] Both CTA buttons are visible with icons
- [ ] Responsive on mobile/tablet

### Features Widget (Grid)
- [ ] Icons display correctly (Lucide icons)
- [ ] Cards lift on hover
- [ ] Animation triggers when scrolled into view
- [ ] Grid is responsive (4→2→1 columns)

### Stats Widget
- [ ] Numbers animate from 0 when scrolled into view
- [ ] Icons display for each stat
- [ ] Gradient background looks good
- [ ] Separators show between stats

### Countdown Timer
- [ ] Timer counts down in real-time
- [ ] All units (days, hours, minutes, seconds) update
- [ ] Title and subtitle display
- [ ] Responsive layout

### Before/After Slider
- [ ] Drag handle works smoothly
- [ ] Hover to slide works
- [ ] Labels show on images
- [ ] Images load correctly

### Pricing Table
- [ ] 3 plans display side by side
- [ ] Monthly/yearly toggle works
- [ ] Yearly shows "Save 20%" badge
- [ ] Price updates when toggling
- [ ] Middle plan is highlighted
- [ ] Comparison table shows below
- [ ] Feature tooltips work (hover "Priority Support")

### Accordion
- [ ] Items expand/collapse smoothly
- [ ] Only one item open at a time
- [ ] First item opens by default
- [ ] Icons rotate on open/close
- [ ] Item-specific icons show

### Tabs
- [ ] All 4 tabs are clickable
- [ ] Content changes on tab click
- [ ] Icons display in tabs
- [ ] Selected tab is highlighted
- [ ] Content fades in smoothly

### Features Carousel
- [ ] Carousel scrolls with navigation buttons
- [ ] Left/right arrows work
- [ ] Cards scale on hover
- [ ] Emoji icons display

---

## Responsive Testing

Test on different screen sizes:

```bash
Desktop: 1920px+
Tablet:  768px - 1024px
Mobile:  320px - 767px
```

### Key Breakpoints to Check:
- Hero height adjusts
- Features grid: 4→2→1 columns
- Stats: 4→2→2 columns
- Pricing table stacks vertically
- Tabs layout adapts

---

## Configuration Examples

All widgets in the demo use the configurations from `/widget-demo/page.js`. You can:

1. **Modify configs** directly in the file to test different options
2. **Copy configs** to use in your actual pages
3. **Reference schemas** in `config/widget-schemas.js` for all available options

---

## Next Steps After Testing

1. ✅ Verify all widgets work as expected
2. ✅ Test responsive behavior
3. ✅ Check animations and interactions
4. 🔜 Build more widgets (Timeline, Team Grid, Map, etc.)
5. 🔜 Create visual configuration UI components

---

## Troubleshooting

### Widgets not displaying?
- Check browser console for errors
- Verify all imports in `WidgetRenderer.jsx`
- Ensure `lucide-react` is installed: `npm install lucide-react`

### Animations not working?
- Scroll page to trigger intersection observer
- Check that animation settings are in config

### Icons not showing?
- Verify icon names match Lucide icons
- Check `toPascalCase` conversion (e.g., 'arrow-right' → 'ArrowRight')

---

## Available Configuration Options

See `config/widget-schemas.js` for complete schema definitions including:
- **20+ field types** (color, gradient, image, video, icon, font, etc.)
- **All widget schemas** with defaults
- **Template presets** for quick setup

---

## Making Changes

To customize a widget:

1. Open `/widget-demo/page.js`
2. Find the widget's `config={}` prop
3. Modify values (follow schema structure)
4. Save and refresh browser

Example - Change Hero title:
```javascript
title: {
    text: 'Your New Title Here',
    fontSize: { desktop: '5rem', tablet: '3.5rem', mobile: '2.5rem' },
    color: '#ff0000' // Now red!
}
```

---

Happy Testing! 🚀
