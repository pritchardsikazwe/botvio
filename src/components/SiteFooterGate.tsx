import { useLocation } from "react-router-dom";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Pages that ship their own full-width footer (e.g. the premium
 * homepage composition) opt out of the sitewide footer to avoid
 * rendering two footers on one document.
 */
const SELF_FOOTER_ROUTES = [/^\/(?:[a-z]{2}\/)?home-preview\/?$/i];

export const SiteFooterGate = () => {
  const { pathname } = useLocation();
  if (SELF_FOOTER_ROUTES.some((re) => re.test(pathname))) return null;
  return <SiteFooter />;
};
