import { Link } from "react-router-dom";
import { SocialShareButtons } from "@/components/social/SocialShareButtons";

/**
 * Sitewide semantic <footer> with grouped navigation. Satisfies
 * AdSense "Breadcrumbs or footer nav" + "HTML sitemap or clear
 * sidebar links" requirements and adds keyword-rich internal links.
 */
export const SiteFooter = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      className="border-t border-border/50 bg-card/40 mt-12"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
          <nav aria-label="Trading hubs">
            <h2 className="font-semibold mb-3 text-foreground">Trading Hubs</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/gold" className="hover:text-primary">Gold (XAUUSD)</Link></li>
              <li><Link to="/silver" className="hover:text-primary">Silver (XAGUSD)</Link></li>
              <li><Link to="/bitcoin" className="hover:text-primary">Bitcoin (BTCUSD)</Link></li>
              <li><Link to="/us30" className="hover:text-primary">US30 (Dow Jones)</Link></li>
              <li><Link to="/nas100" className="hover:text-primary">NAS100 (Nasdaq)</Link></li>
              <li><Link to="/ger40" className="hover:text-primary">GER40 (DAX)</Link></li>
            </ul>
          </nav>
          <nav aria-label="Signals and analysis">
            <h2 className="font-semibold mb-3 text-foreground">Signals & Analysis</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/signals" className="hover:text-primary">Live Signals</Link></li>
              <li><Link to="/market-analysis" className="hover:text-primary">Daily Market Analysis</Link></li>
              <li><Link to="/chart/XAUUSD" className="hover:text-primary">AI Chart Analyzer</Link></li>
              <li><Link to="/news-calendar" className="hover:text-primary">Economic Calendar</Link></li>
              <li><Link to="/strategies" className="hover:text-primary">Strategy Library</Link></li>
            </ul>
          </nav>
          <nav aria-label="Learn">
            <h2 className="font-semibold mb-3 text-foreground">Learn</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/learning-paths" className="hover:text-primary">Start Here — Learning Paths</Link></li>
              <li><Link to="/learn" className="hover:text-primary">Free Course</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Trading Blog</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link to="/testimonials" className="hover:text-primary">Testimonials</Link></li>
              <li><Link to="/case-studies" className="hover:text-primary">Case Studies</Link></li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <h2 className="font-semibold mb-3 text-foreground">Company</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/press" className="hover:text-primary">Press</Link></li>
              <li><Link to="/affiliate" className="hover:text-primary">Affiliate</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary">Marketplace</Link></li>
            </ul>
          </nav>
          <nav aria-label="Trust and legal">
            <h2 className="font-semibold mb-3 text-foreground">Trust & Legal</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/trust" className="hover:text-primary">Trust Center</Link></li>
              <li><Link to="/methodology" className="hover:text-primary">Methodology</Link></li>
              <li><Link to="/performance-transparency" className="hover:text-primary">Performance Transparency</Link></li>
              <li><Link to="/editorial-policy" className="hover:text-primary">Editorial Policy</Link></li>
              <li><Link to="/fact-checking" className="hover:text-primary">Fact-Checking</Link></li>
              <li><Link to="/corrections" className="hover:text-primary">Corrections</Link></li>
              <li><Link to="/affiliate-disclosure" className="hover:text-primary">Affiliate Disclosure</Link></li>
              <li><Link to="/ai-content-policy" className="hover:text-primary">AI Content Policy</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary">Risk Disclosure</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><a href="/sitemap.xml" className="hover:text-primary">Sitemap</a></li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {year} Botvio — Independent financial education, market
            analysis & trading technology. All rights reserved.
          </p>
          <nav aria-label="Social media" className="flex items-center gap-4">
            <a href="https://youtube.com/@botvio" target="_blank" rel="noopener me" className="hover:text-primary">YouTube</a>
            <a href="https://www.facebook.com/botvio" target="_blank" rel="noopener me" className="hover:text-primary">Facebook</a>
            <a href="https://www.tiktok.com/@botviohq" target="_blank" rel="noopener me" className="hover:text-primary">TikTok</a>
            <a href="https://t.me/boaborea" target="_blank" rel="noopener me" className="hover:text-primary">Telegram</a>
            <SocialShareButtons
              label="Share Botvio"
              title="Botvio — AI Forex Signals, Gold Trading & Chart Analysis"
              description="Free forex & gold signals, AI chart analysis and copy trading for Deriv, Exness and Weltrade."
            />
          </nav>
          <p className="md:text-right max-w-xl">
            Risk warning: trading forex, CFDs and synthetic indices involves
            substantial risk and may not be suitable for every investor. Past
            performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;