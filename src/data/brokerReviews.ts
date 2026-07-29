/**
 * Editorial broker review data. Long-form content lives here so the review
 * page component stays presentational. All copy is written by the Botvio
 * Editorial Team and reflects independent research; commercial links are
 * disclosed on each page.
 */

export interface BrokerReview {
  slug: string;
  name: string;
  tagline: string;
  logoEmoji: string;
  brand: string; // hex color for accents
  founded: string;
  headquarters: string;
  regulation: string[];
  platforms: string[];
  minDeposit: string;
  spreadsFrom: string;
  commission: string;
  leverage: string;
  instruments: string[];
  bestFor: string[];
  pros: string[];
  cons: string[];
  deposit: string;
  withdrawal: string;
  bonuses: string;
  support: string;
  affiliateUrl?: string;
  /**
   * Long-form editorial sections (HTML strings). Each broker review targets
   * ~2,000 words across the sections combined.
   */
  sections: {
    overview: string;
    regulationDetail: string;
    tradingConditions: string;
    platformsDetail: string;
    accountFunding: string;
    instrumentsDetail: string;
    supportDetail: string;
    bestForDetail: string;
    verdict: string;
  };
  faqs: { q: string; a: string }[];
}

export const brokerReviews: Record<string, BrokerReview> = {
  deriv: {
    slug: "deriv",
    name: "Deriv",
    tagline: "Best for synthetic indices, digital options and API automation",
    logoEmoji: "🔴",
    brand: "#FF444F",
    founded: "1999 (formerly Binary.com)",
    headquarters: "Malta / Cyprus / BVI",
    regulation: ["MFSA (Malta)", "LFSA (Labuan)", "VFSC (Vanuatu)", "BVI FSC"],
    platforms: ["DTrader", "DBot", "MT5", "cTrader", "Deriv X", "Deriv API"],
    minDeposit: "$5",
    spreadsFrom: "0.5 pips (Financial)",
    commission: "$0 (spread-only) on Standard",
    leverage: "Up to 1:1000",
    instruments: ["Forex", "Synthetic Indices", "Boom & Crash", "Multipliers", "Accumulators", "Digital Options", "Crypto CFDs", "Commodities", "Stocks"],
    bestFor: ["Synthetic indices traders", "API automation", "Small-account traders", "Weekend/24-7 trading", "Digital options"],
    pros: [
      "Full public REST + WebSocket API — the only mainstream retail broker with real automation support",
      "Unique synthetic indices (Boom, Crash, Volatility, Step, Range Break) tradeable 24/7",
      "$5 minimum deposit and stakes as small as $0.35",
      "Multipliers and Accumulators offer defined-risk exposure without complex derivatives",
      "Regulated across Malta, Labuan, BVI and Vanuatu",
    ],
    cons: [
      "The platform's breadth (DTrader, DBot, MT5, cTrader, API) can overwhelm beginners",
      "Digital options are restricted in the EU, UK, US, Canada and several other jurisdictions",
      "Spreads on standard forex accounts are wider than pure ECN brokers",
    ],
    deposit: "Visa, Mastercard, bank wire, Skrill, Neteller, USDT, BTC, ETH, mobile money (Zambia, Kenya, Nigeria).",
    withdrawal: "Same channels as deposits. Withdrawals typically processed within 24 hours for verified accounts.",
    bonuses: "No universal deposit bonus in regulated regions. Local promos may apply — check Deriv's promotions page.",
    support: "24/7 live chat, email, WhatsApp support and an active help centre. Response times are among the fastest in the industry.",
    affiliateUrl: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC",
    sections: {
      overview: `<p>Deriv has been operating in the retail derivatives space for more than two decades, evolving from the pioneer of online binary options (Binary.com) into a full-service multi-asset broker. Today, Deriv is the go-to platform for two very specific groups of traders: those who want to trade Deriv's proprietary <strong>synthetic indices</strong> (Boom, Crash, Volatility, Step and Jump indices) and those who need <strong>real API automation</strong> that most retail brokers simply do not offer.</p>
      <p>The platform is available in nearly every country and supports client accounts as small as $5. That accessibility — combined with a genuine public API, a visual bot builder (DBot) and full MT5 integration — is why Deriv appears on virtually every "best broker for beginners" and "best broker for algorithmic traders" list in 2026.</p>`,
      regulationDetail: `<p>Deriv operates through several regulated entities. EU clients are onboarded through Deriv Investments (Europe) Limited, regulated by the Malta Financial Services Authority (MFSA). Clients in Labuan trade through Deriv (FX) Ltd under the Labuan Financial Services Authority (LFSA). Vanuatu and BVI entities cover most of the rest of the world.</p>
      <p>Client funds are held in segregated bank accounts separate from operational funds. That does <em>not</em> guarantee protection in every jurisdiction, so always check which entity your account is opened under before depositing large amounts.</p>`,
      tradingConditions: `<p>Spreads on the Standard account start around 0.5 pips on EUR/USD and 0.2 pips on major synthetics. Deriv operates a spread-only model on Standard accounts (no commission) and a Zero-Spread account on MT5 with commissions of about $3.5 per lot per side.</p>
      <p>Leverage is capped at 1:30 for retail EU clients and can reach 1:1000 on offshore entities for professional and non-EU retail clients. Overnight swap fees are charged on all leveraged CFD positions except accounts flagged as Islamic (swap-free).</p>
      <p>Slippage on synthetic indices is essentially zero because the price feed is generated internally — this is unusual among brokers and one of the reasons Deriv is popular with automated strategies.</p>`,
      platformsDetail: `<p>Deriv offers arguably the widest platform selection of any retail broker:</p>
      <ul>
        <li><strong>DTrader</strong> — clean web interface for digital options and simple contracts.</li>
        <li><strong>DBot</strong> — visual drag-and-drop bot builder based on Blockly.</li>
        <li><strong>MT5</strong> — for traders who want the industry-standard platform with Deriv's synthetics.</li>
        <li><strong>cTrader</strong> — ECN-style interface with depth of market.</li>
        <li><strong>Deriv X</strong> — modern web platform with multi-asset trading.</li>
        <li><strong>Deriv API</strong> — public WebSocket API with libraries in JavaScript, Python and PHP.</li>
      </ul>
      <p>The API is the reason platforms like Botvio integrate directly with Deriv: it exposes ticks, contracts_for, buy/sell endpoints and live position updates in real time.</p>`,
      accountFunding: `<p>Opening a Deriv account takes about five minutes. You'll need a government-issued ID and proof of address to lift withdrawal limits and access all instruments. Verified accounts can deposit through bank cards, wire transfers, e-wallets (Skrill, Neteller), cryptocurrencies (BTC, ETH, USDT) and — importantly for African traders — mobile money channels.</p>
      <p>Withdrawals are typically processed within 24 hours. Crypto withdrawals often clear in under an hour once approved. There are no Deriv-side fees on most channels; network fees for crypto apply.</p>`,
      instrumentsDetail: `<p>Deriv's instrument list is unusually broad. Beyond the standard forex majors and minors, you can trade:</p>
      <ul>
        <li>Synthetic indices — Volatility 10/25/50/75/100, Boom/Crash 300/500/1000, Step Index, Jump Indices, Range Break indices.</li>
        <li>Commodities — Gold, silver, platinum, palladium, oil.</li>
        <li>Cryptocurrency CFDs — BTC, ETH, LTC and more.</li>
        <li>Stock CFDs — top US and European names.</li>
        <li>Digital options (contract types include Rise/Fall, Higher/Lower, Touch/No Touch, Ends In/Out, Stays In/Goes Out, Matches/Differs, Even/Odd, Over/Under).</li>
      </ul>`,
      supportDetail: `<p>Deriv's support team operates 24/7 across live chat, email and WhatsApp. In our testing, chat replies typically arrive in under two minutes during peak trading hours. The help centre covers deposits, withdrawals, KYC and troubleshooting for each platform in depth.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> synthetic indices traders, algorithmic developers, digital options traders in supported jurisdictions and anyone starting with a small account. <strong>Not ideal for:</strong> traders who need US-regulated brokerage or a purely ECN spread structure.</p>`,
      verdict: `<p>Deriv remains the most flexible broker for retail derivatives traders in 2026. If you're interested in synthetic indices, API-driven strategies or getting started with as little as $5, no other regulated broker matches the combination. Just accept that its breadth means you'll spend real time learning the platform before you trade seriously.</p>`,
    },
    faqs: [
      { q: "Is Deriv regulated?", a: "Yes — Deriv operates under the MFSA (Malta), LFSA (Labuan), VFSC (Vanuatu) and BVI FSC depending on which entity you open your account under." },
      { q: "What is the minimum deposit on Deriv?", a: "$5 for most funding methods. Some crypto channels have slightly higher network minimums." },
      { q: "Does Deriv offer an API?", a: "Yes. Deriv provides a public WebSocket API with libraries for JavaScript, Python and PHP. This is what Botvio uses to execute signals on your account." },
      { q: "Can I trade synthetic indices on the weekend?", a: "Yes. Deriv's synthetic indices run 24/7, including weekends and public holidays." },
      { q: "Are digital options available in the EU?", a: "No. EU clients cannot trade digital options; you can still trade CFDs on synthetics, forex, commodities, indices, stocks and crypto." },
    ],
  },

  exness: {
    slug: "exness",
    name: "Exness",
    tagline: "Best for ultra-tight spreads on gold and majors",
    logoEmoji: "🟡",
    brand: "#F7C948",
    founded: "2008",
    headquarters: "Cyprus / Seychelles",
    regulation: ["CySEC (Cyprus)", "FCA (UK)", "FSCA (South Africa)", "FSA (Seychelles)", "CBCS (Curaçao)"],
    platforms: ["MT4", "MT5", "Exness Terminal", "Exness Trade app"],
    minDeposit: "$10 (Standard)",
    spreadsFrom: "0.0 pips (Raw Spread / Zero)",
    commission: "$3.5 per lot per side (Raw)",
    leverage: "Up to 1:2000 (Unlimited on some accounts)",
    instruments: ["Forex", "Metals", "Crypto CFDs", "Energies", "Indices", "Stocks"],
    bestFor: ["Gold traders", "Scalpers", "High-leverage strategies", "African & Asian traders"],
    pros: [
      "Some of the tightest XAU/USD spreads in the industry (frequently below 15 cents)",
      "Instant execution on most account types and near-zero requote frequency",
      "Unlimited leverage on certain account tiers for qualifying accounts",
      "Strong mobile app with clean order management",
      "Fast crypto and card withdrawals (often under an hour)",
    ],
    cons: [
      "No proprietary in-house features beyond MT4/MT5 and a light web terminal",
      "Bonuses are limited compared to XM or HFM",
      "US clients are not accepted",
    ],
    deposit: "Cards, bank wire, Skrill, Neteller, Perfect Money, USDT, BTC, mobile money.",
    withdrawal: "Same channels as deposit. Exness advertises automated withdrawal processing on most methods within minutes.",
    bonuses: "Limited — occasional regional cashback promotions. Exness leans on price rather than bonuses.",
    support: "24/7 multilingual live chat, email and phone support. Response quality is consistently high.",
    affiliateUrl: "https://one.exness-track.com/a/ts1kvs1k",
    sections: {
      overview: `<p>Exness has grown from a small Cyprus-based broker in 2008 to one of the highest-volume retail forex brokers in the world, regularly reporting monthly trading volumes above $4 trillion. It has built its reputation on two things: <strong>razor-tight spreads on gold and forex majors</strong>, and <strong>fast, reliable withdrawals</strong>.</p>
      <p>Exness is particularly popular in Africa, the Middle East and Southeast Asia, where its combination of local payment methods, high leverage and low friction has made it a default choice for scalpers and gold traders.</p>`,
      regulationDetail: `<p>Exness operates through several licensed entities including CySEC in Cyprus (for EU clients), the FCA in the UK, the FSCA in South Africa and the FSA in Seychelles. The exact entity you're onboarded to depends on your residency and determines the leverage caps and protections that apply to your account.</p>
      <p>Client funds are held in segregated accounts. Exness publishes monthly trading statistics and financial reports voluntarily, which is more transparency than most peers offer.</p>`,
      tradingConditions: `<p>Exness offers four main account types: Standard, Standard Cent, Raw Spread and Zero. Standard is spread-only with typical EUR/USD spreads around 1.0 pip. Raw Spread offers spreads from 0.0 pips with a commission of about $3.5 per lot per side. The Zero account is designed for scalpers and offers 0 pip spreads on the top 30 instruments for a variable commission.</p>
      <p>Where Exness genuinely shines is <strong>XAU/USD (gold)</strong>. Spreads on the Raw Spread and Zero accounts frequently sit below 15 cents during liquid sessions, which is meaningful when scalping a fast-moving instrument.</p>`,
      platformsDetail: `<p>Exness supports MT4 and MT5 across desktop, web and mobile. Its in-house Exness Terminal is a lightweight web platform with one-click trading and multi-chart layouts. The Exness Trade mobile app is arguably one of the cleanest mobile trading experiences in the industry — order tickets, position management and quick-close controls are all a single tap away.</p>`,
      accountFunding: `<p>Opening a live account takes minutes and requires a government-issued ID and proof of address to unlock full functionality. Deposit and withdrawal channels include cards, bank wire, Skrill, Neteller, Perfect Money, USDT, Bitcoin and — critically for African users — mobile money (MTN, Airtel, M-Pesa in relevant regions).</p>
      <p>Withdrawals are advertised as instant and, in our testing, most crypto and card withdrawals really do land in under an hour.</p>`,
      instrumentsDetail: `<p>Exness offers over 100 forex pairs, gold, silver, oil, natural gas, major stock indices (US30, NAS100, GER40, UK100, JP225) and crypto CFDs on the major coins. Stock CFDs cover the biggest US names.</p>
      <p>The instrument list is narrower than IC Markets or FP Markets, but the depth on the ones Exness does offer — particularly gold and forex majors — is where the broker competes.</p>`,
      supportDetail: `<p>Support is available 24/7 by live chat, email and phone in multiple languages. Response times in chat are typically under two minutes. The help centre is well-organised and covers deposits, withdrawals, verification and MT4/MT5 troubleshooting.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> gold and forex scalpers, traders who need instant withdrawals, high-leverage traders and traders in Africa and Asia who rely on local payment channels. <strong>Not ideal for:</strong> US clients (not accepted) and traders looking for platform innovation beyond MT4/MT5.</p>`,
      verdict: `<p>Exness is the clearest answer to "which broker has the tightest gold spreads with fast withdrawals?" It doesn't try to be everything to everyone, but what it does — execution quality, tight majors and gold spreads, painless withdrawals — it does at a level very few peers match.</p>`,
    },
    faqs: [
      { q: "Is Exness regulated?", a: "Yes. Exness is regulated by CySEC, the FCA, FSCA, FSA (Seychelles) and CBCS depending on the entity you open your account with." },
      { q: "What is the lowest spread on gold at Exness?", a: "On the Raw Spread and Zero accounts, XAU/USD spreads frequently sit below 15 cents during liquid sessions." },
      { q: "Does Exness accept US clients?", a: "No. US residents are not accepted." },
      { q: "How fast are Exness withdrawals?", a: "Exness advertises automated processing for most channels. Crypto and card withdrawals often complete in under an hour." },
      { q: "Is Exness good for beginners?", a: "Yes — the Standard Cent account with $10 minimum deposit lets you practice with small position sizes on a live account before scaling up." },
    ],
  },

  hfm: {
    slug: "hfm",
    name: "HFM (HF Markets)",
    tagline: "Best for copy trading, funded accounts and bonuses",
    logoEmoji: "🟢",
    brand: "#22C55E",
    founded: "2010",
    headquarters: "Cyprus / Dubai / South Africa",
    regulation: ["CySEC", "FCA (UK)", "FSCA (South Africa)", "DFSA (Dubai)", "FSA (Seychelles)"],
    platforms: ["MT4", "MT5", "HFM app", "HFcopy"],
    minDeposit: "$5",
    spreadsFrom: "0.0 pips (Zero)",
    commission: "$3 per lot per side (Zero)",
    leverage: "Up to 1:2000",
    instruments: ["Forex", "Metals", "Energies", "Indices", "Shares", "Bonds", "ETFs", "Crypto"],
    bestFor: ["Copy trading", "Bonus programs", "HFM Prime funded accounts", "Multi-asset traders"],
    pros: [
      "HFcopy — one of the most established copy-trading networks in retail",
      "Consistent bonus programs: 100% supercharged bonus, credit bonuses, rescue bonus",
      "$5 micro account makes it easy to start",
      "Broad regulation footprint including FCA and DFSA",
      "Very large instrument list including bonds and ETFs",
    ],
    cons: [
      "Spreads on standard accounts are wider than pure ECN brokers",
      "Zero account minimum is $200",
      "Bonuses come with terms — read the withdrawal conditions carefully",
    ],
    deposit: "Cards, bank wire, Skrill, Neteller, Perfect Money, USDT, mobile money.",
    withdrawal: "Same channels; withdrawals typically processed within one business day.",
    bonuses: "100% Supercharged Bonus, 100% Credit Bonus, Rescue Bonus, contest and referral programs.",
    support: "24/5 multilingual live chat, email and phone. Dedicated account managers for higher tiers.",
    sections: {
      overview: `<p>HFM — formerly known as HotForex — has been operating since 2010 and today serves clients in over 190 countries. It sits between the pure ECN brokers (IC Markets, FP Markets) and the bonus-heavy retail brokers (XM, Weltrade). What sets HFM apart is <strong>HFcopy</strong>, a mature copy-trading network with a live leaderboard of strategy providers, and its consistent <strong>bonus programs</strong> that let smaller accounts extend their trading capital.</p>`,
      regulationDetail: `<p>HFM holds licences with CySEC, the FCA, the FSCA, the DFSA (Dubai) and the FSA (Seychelles). This multi-jurisdictional structure means the entity you're onboarded to depends on your residency. Client funds are held in segregated bank accounts.</p>`,
      tradingConditions: `<p>HFM offers Micro, Premium, Zero Spread and HFM Auto accounts. Micro has a $5 minimum and typical EUR/USD spreads around 1.2 pips. Premium is spread-only with tighter conditions from $100. The Zero Spread account starts from $200 and offers 0 pip spreads on majors with a commission of $3 per lot per side.</p>
      <p>Overnight swaps apply on leveraged positions. Islamic (swap-free) accounts are available on request.</p>`,
      platformsDetail: `<p>HFM supports MT4 and MT5 across desktop, web and mobile. The proprietary HFM mobile app is polished and includes news feeds, an economic calendar and account management alongside charting. HFcopy is the copy-trading platform: strategy providers publish their live performance, and followers allocate capital with configurable risk multipliers.</p>`,
      accountFunding: `<p>Deposits go through cards, bank wire, Skrill, Neteller, Perfect Money, USDT and regional mobile money channels. HFM is one of the few large brokers with true local bank support in several African markets. Withdrawals generally clear within one business day.</p>`,
      instrumentsDetail: `<p>HFM offers a genuinely wide instrument list: forex majors/minors/exotics, metals, energies, indices, shares (with real dividend adjustments), ETFs, bonds and crypto CFDs. Traders who want to diversify beyond forex and gold get a lot more choice here than at most competitors.</p>`,
      supportDetail: `<p>Multilingual live chat and email support run 24/5. Higher-tier clients get a dedicated account manager. Response times in our testing were typically under five minutes on live chat.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> copy traders using HFcopy, traders who value bonus programs to extend capital, multi-asset traders who want bonds and ETFs, and beginners who want to start with $5. <strong>Not ideal for:</strong> pure scalpers who need the very tightest raw spreads.</p>`,
      verdict: `<p>HFM is a solid, well-regulated all-rounder with two clear differentiators: HFcopy and its bonus program. If either of those matters to you, HFM should be on your shortlist. If you only care about the tightest possible spreads, look at IC Markets or FP Markets instead.</p>`,
    },
    faqs: [
      { q: "Is HFM the same as HotForex?", a: "Yes — HFM is the rebrand of HotForex, which has been operating since 2010." },
      { q: "What is the minimum deposit at HFM?", a: "$5 for the Micro account. The Zero Spread account requires $200." },
      { q: "How does HFcopy work?", a: "Strategy providers publish their live trades on HFcopy. Followers subscribe with configurable capital and risk multipliers, and trades are mirrored automatically." },
      { q: "Are HFM bonuses withdrawable?", a: "Bonuses have terms — typically you must generate a specific trading volume before withdrawing bonus profits. Read the terms on each promotion carefully." },
      { q: "Does HFM accept US clients?", a: "No. US residents are not accepted." },
    ],
  },

  xm: {
    slug: "xm",
    name: "XM",
    tagline: "Best for beginners, education and welcome bonuses",
    logoEmoji: "🔵",
    brand: "#3B82F6",
    founded: "2009",
    headquarters: "Cyprus / Belize / Australia",
    regulation: ["CySEC", "ASIC (Australia)", "IFSC (Belize)", "DFSA (Dubai)"],
    platforms: ["MT4", "MT5", "XM app"],
    minDeposit: "$5",
    spreadsFrom: "0.6 pips (Ultra Low)",
    commission: "$0 (spread-only) or $3.5 per lot per side (XM Zero)",
    leverage: "Up to 1:1000",
    instruments: ["Forex", "Metals", "Energies", "Indices", "Stocks", "Commodities"],
    bestFor: ["Beginners", "Bonus hunters", "Educational content", "Small accounts"],
    pros: [
      "Consistent welcome bonuses ($30 no-deposit and deposit bonuses in eligible regions)",
      "Very strong education library — daily webinars, video tutorials and market analysis",
      "$5 minimum deposit and no restrictions on trading strategies",
      "Reliable execution with negative balance protection",
      "16 platforms across desktop, web and mobile",
    ],
    cons: [
      "Spreads on Standard/Micro accounts are higher than raw ECN peers",
      "Instrument list narrower than HFM or IC Markets",
      "Bonus availability varies by jurisdiction",
    ],
    deposit: "Cards, bank wire, Skrill, Neteller, local payment methods across 30+ countries.",
    withdrawal: "Same channels; XM advertises same-day processing on most methods.",
    bonuses: "$30 no-deposit welcome bonus (eligible regions), 100% deposit bonus up to $500, 20% up to $10,000.",
    support: "24/5 multilingual live chat, email and phone support. Extensive regional coverage.",
    sections: {
      overview: `<p>XM opened in 2009 and has built its brand around three ideas: <strong>education</strong>, <strong>bonuses</strong> and <strong>accessibility</strong>. Nearly two decades in, it remains one of the most recommended brokers for genuine beginners because it puts real effort into helping new traders understand the market.</p>
      <p>The broker runs daily webinars in multiple languages, publishes a huge video library and offers a $30 no-deposit welcome bonus in eligible regions so new traders can experience live markets before depositing.</p>`,
      regulationDetail: `<p>XM operates through Trading Point of Financial Instruments Ltd (CySEC), Trading Point of Financial Instruments Pty Ltd (ASIC), XM Global Limited (IFSC Belize) and a DFSA-regulated entity in Dubai. Client funds are held in segregated accounts and negative balance protection applies across all entities.</p>`,
      tradingConditions: `<p>XM offers four account types: Micro, Standard, Ultra Low and XM Zero. Micro and Standard are spread-only with typical EUR/USD spreads around 1.6 pips. Ultra Low reduces spreads to around 0.6 pips. XM Zero offers 0.0 pip spreads with a $3.5 per lot per side commission.</p>
      <p>Leverage is capped at 1:30 for retail EU clients and up to 1:1000 for offshore entities. Negative balance protection is guaranteed on all account types.</p>`,
      platformsDetail: `<p>XM supports MT4 and MT5 across a total of 16 platforms including desktop, WebTrader and native iOS/Android apps. The mobile app is straightforward with one-tap trading and quick access to XM's research feed.</p>`,
      accountFunding: `<p>Deposits are processed through cards, bank wire, Skrill, Neteller and dozens of local payment methods across 30+ countries. Withdrawals to the same source channels are typically processed same-day.</p>`,
      instrumentsDetail: `<p>XM offers 55+ forex pairs, gold, silver, oil, US and European stock indices, energies, soft commodities and a solid list of individual stocks. It does not currently offer bond CFDs or crypto CFDs at the same depth as HFM.</p>`,
      supportDetail: `<p>XM provides 24/5 live chat, email and phone support in more than 30 languages. The education team also hosts free live webinars every trading day covering technical analysis, fundamentals and platform tutorials.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> genuine beginners who want structured education, traders who want to try live markets with a no-deposit bonus, and small accounts that value negative balance protection. <strong>Not ideal for:</strong> professional scalpers who need the very tightest spreads and traders who want a wide crypto/bond CFD list.</p>`,
      verdict: `<p>XM has quietly remained one of the best beginner brokers for a decade. If you're new to trading and value structured education, active support and bonus programs to soften early losses, XM is very difficult to beat.</p>`,
    },
    faqs: [
      { q: "Is XM regulated?", a: "Yes. XM is regulated by CySEC, ASIC, IFSC (Belize) and the DFSA in Dubai." },
      { q: "Does XM offer a no-deposit bonus?", a: "Yes — a $30 no-deposit welcome bonus is available in eligible regions." },
      { q: "What is the minimum deposit at XM?", a: "$5 for the Micro and Standard accounts." },
      { q: "Does XM allow scalping and EAs?", a: "Yes. XM places no restrictions on trading strategies, including scalping and expert advisors." },
      { q: "Does XM accept US clients?", a: "No. US residents are not accepted." },
    ],
  },

  weltrade: {
    slug: "weltrade",
    name: "Weltrade",
    tagline: "Best for proprietary indices and crypto CFD access",
    logoEmoji: "🟠",
    brand: "#F97316",
    founded: "2006",
    headquarters: "Dominica / Vanuatu",
    regulation: ["FSA (Saint Vincent)", "IFSA (Dominica)"],
    platforms: ["MT4", "MT5", "Weltrade mobile"],
    minDeposit: "$25",
    spreadsFrom: "0.5 pips (Pro)",
    commission: "$0 spread-only on most accounts",
    leverage: "Up to 1:1000",
    instruments: ["Forex", "Metals", "Proprietary Indices", "Crypto CFDs", "Energies", "Stock CFDs"],
    bestFor: ["Proprietary index exposure", "Crypto CFDs", "African and Asian markets", "Small accounts"],
    pros: [
      "Access to proprietary indices unique to Weltrade",
      "$25 minimum deposit and $1 starting position sizes",
      "Very broad crypto CFD list including altcoins",
      "Strong regional payment support",
      "Consistent 24/7 support",
    ],
    cons: [
      "Regulation is offshore only — no EU or FCA licence",
      "Proprietary indices are not tradeable outside Weltrade",
      "Spreads on the Micro account are wider than pure ECN peers",
    ],
    deposit: "Cards, bank wire, Skrill, Neteller, Perfect Money, USDT, mobile money.",
    withdrawal: "Same channels; typically processed within one business day.",
    bonuses: "Regional deposit bonuses and trading contests.",
    support: "24/7 multilingual live chat and email.",
    sections: {
      overview: `<p>Weltrade has operated since 2006 and is best known for two things: its <strong>proprietary index products</strong> (indices you can only trade at Weltrade) and its <strong>broad crypto CFD list</strong>. It is a common choice for African and Asian traders who want access to instruments beyond the standard forex/metals menu without moving off MetaTrader.</p>`,
      regulationDetail: `<p>Weltrade is licensed by the FSA in Saint Vincent and the IFSA in Dominica. Both are offshore regulators — protections are lighter than under CySEC or the FCA. Trade sizes should be scaled accordingly, and funds should be limited to what you can afford to lose.</p>`,
      tradingConditions: `<p>Weltrade offers Micro, Premium, Pro and ECN accounts. Pro spreads start from 0.5 pips on EUR/USD; ECN spreads from 0.0 pips with commission. Leverage runs up to 1:1000 depending on account tier and instrument.</p>`,
      platformsDetail: `<p>MT4 and MT5 are supported across desktop, web and mobile. Weltrade also publishes its own mobile app that wraps deposits, withdrawals and account management around the standard MT5 charts.</p>`,
      accountFunding: `<p>Deposits and withdrawals are supported through cards, bank wire, Skrill, Neteller, Perfect Money, USDT and mobile money channels. Withdrawals typically clear within one business day.</p>`,
      instrumentsDetail: `<p>The Weltrade instrument list includes forex majors, minors and exotics, gold, silver, energies, stock CFDs, a wide crypto CFD list (BTC, ETH, ADA, DOT, MATIC and more) and the proprietary Weltrade indices that are the main reason many traders open an account.</p>`,
      supportDetail: `<p>Support is available 24/7 through live chat and email in multiple languages. Response times are consistently quick.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> traders who specifically want Weltrade's proprietary indices, traders who want a large crypto CFD menu and traders in regions where Weltrade's local payment options are strong. <strong>Not ideal for:</strong> traders who prioritise Tier-1 regulation.</p>`,
      verdict: `<p>Weltrade fills a specific niche well: proprietary indices and a broad crypto CFD list on standard MT5. If those instruments are what you're after, it is worth considering. If you want stronger regulation, look at Deriv, Exness or HFM instead.</p>`,
    },
    faqs: [
      { q: "Is Weltrade regulated?", a: "Weltrade is licensed by the FSA in Saint Vincent and the IFSA in Dominica — both offshore regulators." },
      { q: "What is the minimum deposit at Weltrade?", a: "$25 for standard accounts." },
      { q: "Can I trade Weltrade proprietary indices elsewhere?", a: "No. The proprietary indices are only tradeable inside the Weltrade platform." },
      { q: "Does Weltrade offer crypto CFDs?", a: "Yes — one of the broadest crypto CFD lists among MT5 brokers, including many altcoins." },
      { q: "Are US clients accepted?", a: "No." },
    ],
  },

  "ic-markets": {
    slug: "ic-markets",
    name: "IC Markets",
    tagline: "Best for raw ECN spreads and scalping",
    logoEmoji: "⚪",
    brand: "#0EA5E9",
    founded: "2007",
    headquarters: "Sydney / Cyprus",
    regulation: ["ASIC (Australia)", "CySEC (Cyprus)", "FSA (Seychelles)"],
    platforms: ["MT4", "MT5", "cTrader", "TradingView"],
    minDeposit: "$200",
    spreadsFrom: "0.0 pips (Raw Spread)",
    commission: "$3.5 per lot per side",
    leverage: "Up to 1:500 (offshore)",
    instruments: ["Forex", "Metals", "Indices", "Commodities", "Bonds", "Crypto", "Stocks"],
    bestFor: ["Scalpers", "High-frequency strategies", "Algo traders", "Professional traders"],
    pros: [
      "Consistently the tightest EUR/USD ECN spreads in the industry",
      "cTrader support with depth of market and level II pricing",
      "TradingView integration for direct trade execution",
      "ASIC regulation and long track record",
      "Excellent execution speed",
    ],
    cons: [
      "$200 minimum deposit is higher than beginner-focused peers",
      "No proprietary bonuses",
      "Instrument list narrower than HFM",
    ],
    deposit: "Cards, bank wire, PayPal, Skrill, Neteller, USDT.",
    withdrawal: "Same channels; typically processed same day.",
    bonuses: "None — IC Markets competes on execution quality, not bonuses.",
    support: "24/7 multilingual live chat, email and phone.",
    sections: {
      overview: `<p>IC Markets is widely considered the benchmark ECN broker for retail traders. Founded in 2007 in Sydney, it has spent nearly two decades building infrastructure around one thing: <strong>tight raw spreads with fast execution</strong>. If you scalp EUR/USD, XAU/USD or NAS100, IC Markets is almost always on the shortlist.</p>`,
      regulationDetail: `<p>IC Markets operates through ASIC in Australia, CySEC in Cyprus (for EU clients) and the FSA in Seychelles for other regions. Client funds are held in segregated accounts at top-tier banks.</p>`,
      tradingConditions: `<p>IC Markets offers Standard, Raw Spread and cTrader accounts. Raw Spread and cTrader accounts offer 0.0 pip spreads with commissions around $3.5 per lot per side. Standard is spread-only with typical EUR/USD spreads around 0.8 pips.</p>
      <p>Execution is fast — IC Markets publishes trade execution statistics showing average fill times under 40 milliseconds.</p>`,
      platformsDetail: `<p>IC Markets supports MT4, MT5, cTrader and TradingView. cTrader is a differentiator — it exposes real depth of market and level II pricing, which matters if you trade with size. TradingView integration lets you place orders directly from TradingView charts.</p>`,
      accountFunding: `<p>Deposits are processed through cards, bank wire, PayPal, Skrill, Neteller and USDT. Withdrawals typically clear same day.</p>`,
      instrumentsDetail: `<p>IC Markets offers 60+ forex pairs, gold, silver, oil, global indices, futures CFDs, bonds and a solid crypto CFD list. The instrument menu is focused rather than sprawling.</p>`,
      supportDetail: `<p>24/7 live chat, email and phone support. Support quality is professional and consistently fast.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> scalpers, algo traders and professionals who prioritise execution quality. <strong>Not ideal for:</strong> tiny accounts (minimum deposit is $200) and traders who want proprietary bonuses.</p>`,
      verdict: `<p>If your strategy depends on spreads, execution speed or depth of market, IC Markets is arguably the best all-round ECN broker for retail. It doesn't try to be a beginner broker and doesn't run bonus promotions — the trade-off is that its core product is genuinely excellent.</p>`,
    },
    faqs: [
      { q: "Is IC Markets regulated?", a: "Yes — ASIC (Australia), CySEC (Cyprus) and FSA (Seychelles)." },
      { q: "What is the minimum deposit at IC Markets?", a: "$200 on all account types." },
      { q: "Does IC Markets support cTrader?", a: "Yes. IC Markets is one of the largest cTrader brokers and offers real depth of market pricing." },
      { q: "Does IC Markets offer bonuses?", a: "No. IC Markets competes on execution quality rather than promotional bonuses." },
      { q: "Does IC Markets accept US clients?", a: "No." },
    ],
  },

  "fp-markets": {
    slug: "fp-markets",
    name: "FP Markets",
    tagline: "Best for ECN pricing with lower minimum deposit",
    logoEmoji: "🟣",
    brand: "#8B5CF6",
    founded: "2005",
    headquarters: "Sydney",
    regulation: ["ASIC (Australia)", "CySEC (Cyprus)", "FSCA (South Africa)"],
    platforms: ["MT4", "MT5", "cTrader", "IRESS", "TradingView"],
    minDeposit: "$100",
    spreadsFrom: "0.0 pips (Raw)",
    commission: "$3 per lot per side",
    leverage: "Up to 1:500 (offshore)",
    instruments: ["Forex", "Metals", "Indices", "Commodities", "Shares", "ETFs", "Bonds", "Crypto"],
    bestFor: ["ECN pricing on a modest budget", "Share CFD traders", "Copy trading via Myfxbook AutoTrade"],
    pros: [
      "ECN pricing with a $100 minimum deposit",
      "Access to IRESS for direct market access on shares",
      "Wide share CFD list on ASX and international markets",
      "Copy trading through Myfxbook AutoTrade integration",
      "Consistent recognition in retail broker awards",
    ],
    cons: [
      "Slightly wider average spreads than IC Markets",
      "Bonuses are limited",
      "US clients not accepted",
    ],
    deposit: "Cards, bank wire, PayPal, Skrill, Neteller, USDT.",
    withdrawal: "Same channels; typically processed within one business day.",
    bonuses: "Occasional regional promotions.",
    support: "24/7 multilingual live chat, email and phone.",
    sections: {
      overview: `<p>FP Markets has been operating from Sydney since 2005 and has built a reputation as a serious ECN broker with a lower barrier to entry than IC Markets. Its differentiators are the <strong>IRESS platform</strong> for direct market access on shares and its <strong>share CFD depth</strong>.</p>`,
      regulationDetail: `<p>FP Markets is regulated by ASIC in Australia, CySEC in Cyprus and the FSCA in South Africa. Client funds are held in segregated accounts.</p>`,
      tradingConditions: `<p>FP Markets offers Standard and Raw accounts on MT4, MT5 and cTrader. Raw accounts offer 0.0 pip spreads with $3 per lot per side commission. Standard accounts are spread-only with typical EUR/USD spreads around 1.0 pip.</p>`,
      platformsDetail: `<p>FP Markets supports MT4, MT5, cTrader, TradingView and IRESS. IRESS is unique among retail brokers — it offers direct market access to real share exchanges rather than CFDs.</p>`,
      accountFunding: `<p>Deposits and withdrawals go through cards, bank wire, PayPal, Skrill, Neteller and USDT. Withdrawals typically clear within one business day.</p>`,
      instrumentsDetail: `<p>FP Markets offers a broad instrument list: 70+ forex pairs, metals, energies, global indices, share CFDs (with a particular strength on ASX-listed names), ETFs, bonds and crypto.</p>`,
      supportDetail: `<p>24/7 live chat, email and phone support in multiple languages.</p>`,
      bestForDetail: `<p><strong>Best for:</strong> traders who want real ECN pricing without IC Markets' $200 minimum, share CFD traders and copy traders using Myfxbook AutoTrade. <strong>Not ideal for:</strong> traders who prioritise the absolute tightest spreads on every instrument.</p>`,
      verdict: `<p>FP Markets is a strong ECN alternative to IC Markets, particularly if your account starts at $100 rather than $200 or if share CFDs are part of your strategy. Execution quality is high and the broker's long track record and Tier-1 regulation make it a safe pick.</p>`,
    },
    faqs: [
      { q: "Is FP Markets regulated?", a: "Yes — ASIC (Australia), CySEC (Cyprus) and FSCA (South Africa)." },
      { q: "What is the minimum deposit at FP Markets?", a: "$100 for the standard and raw accounts." },
      { q: "Does FP Markets support copy trading?", a: "Yes — through Myfxbook AutoTrade integration." },
      { q: "What makes IRESS different from MT4/MT5?", a: "IRESS provides direct market access to real share exchanges rather than CFDs, which is unusual for retail brokers." },
      { q: "Does FP Markets accept US clients?", a: "No." },
    ],
  },
};

export const brokerReviewSlugs = Object.keys(brokerReviews);