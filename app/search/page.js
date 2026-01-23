"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { useSearch } from "@/components/providers/SearchContext";
import { DEFAULT_SEARCH_WIDGETS } from "@/lib/default-content";

function SearchMetaTags({ tenant }) {
  const { seo, q } = useSearch();

  const page = seo
    ? {
      title: seo.title,
      meta_description: seo.meta_description,
      og_title: seo.og_title,
      og_description: seo.og_description,
      og_type: seo.og_type,
      og_image: seo.og_image,
      twitter_card: seo.twitter_card,
      twitter_title: seo.twitter_title,
      twitter_description: seo.twitter_description,
      canonical_url: seo.canonical_url,
      robots: seo.robots,
      structured_data: seo.structured_data,
    }
    : {
      title: q ? `Search: ${q}` : "Search",
      meta_description: q ? `Search results for "${q}"` : "Search products",
      show_header: true,
      show_footer: true,
    };

  return <DynamicMetaTags page={page} tenant={tenant} />;
}

export default function SearchPage() {
  const tenant = useTenant();
  const { setConfig } = useStorefront();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // always show header/footer for search page (can be overridden later if you add a Page record for slug 'search')
    setConfig({ showHeader: true, showFooter: true });
  }, [setConfig]);

  useEffect(() => {
    if (!tenant?.id) return;

    const fetchWidgets = async () => {
      try {
        const res = await api.get(`/page-builder/widgets?page=search`, {
          headers: { "X-Tenant-ID": tenant.id },
        });

        if (res.data?.success && Array.isArray(res.data.widgets) && res.data.widgets.length > 0) {
          setWidgets(res.data.widgets);
        } else {
          setWidgets(DEFAULT_SEARCH_WIDGETS);
        }
      } catch (e) {
        console.error("Failed to fetch search widgets", e);
        setWidgets(DEFAULT_SEARCH_WIDGETS);
      } finally {
        setLoading(false);
      }
    };

    fetchWidgets();
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SearchMetaTags tenant={tenant} />
      <div className="min-h-screen">
        {widgets.filter((w) => !w.parent_id).map((widget) => (
          <WidgetRenderer key={widget.id} widget={widget} widgets={widgets} />
        ))}
      </div>
    </>
  );
}

