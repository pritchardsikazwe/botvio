export interface CountryInfo {
  name: string;
  flag: string;
  metaDescription: string;
  heroText: string;
  whyContent: string;
  popularStrategies: { name: string; description: string }[];
  gettingStarted: string;
  localPayments?: string;
}

const defaultStrategies = [
  { name: "Boom/Crash Spike Trading", description: "Botvio detects spike droughts on Boom 1000, 500, and Crash indices for high-probability entries." },
  { name: "Digit Match/Differ", description: "Botvio's Markov transition engine predicts last-digit patterns for Match and Differ contracts." },
  { name: "Rise/Fall Scalping", description: "Botvio uses EMA 9/21 crossovers to capture short-term directional moves." },
  { name: "Accumulator Growth", description: "Botvio identifies low-volatility phases for steady accumulator contract growth." },
];

function makeCountry(name: string, flag: string, extras?: Partial<CountryInfo>): CountryInfo {
  return {
    name, flag,
    metaDescription: `Use Botvio AI trading bot in ${name} to automate Deriv synthetic indices trading. 8 trading modes, encrypted security, 24/7 execution.`,
    heroText: `${name}'s fastest-growing AI trading platform. Botvio automates Deriv synthetic indices trading with advanced algorithms, giving ${name} traders a competitive edge.`,
    whyContent: `<p>Traders in ${name} are increasingly turning to Botvio for automated trading on Deriv. Botvio's AI-powered signal engines work 24/7, analyzing tick data and executing trades even while you sleep.</p><p>Botvio is especially popular in ${name} because of its low minimum stake requirements, mobile-friendly interface, and support for local payment methods. Whether you're a beginner or experienced trader in ${name}, Botvio adapts to your style.</p><p>Botvio's Hauza Sniper strategy suite was developed with emerging market traders in mind, offering reliable performance on Deriv's synthetic indices that are available around the clock.</p>`,
    popularStrategies: defaultStrategies,
    gettingStarted: `<ol><li>Create your free Botvio account</li><li>Connect your Deriv trading account via OAuth</li><li>Choose from 8 trading modes (Digits, Multipliers, Rise/Fall, Boom/Crash, Ticks, Accumulators, Turbo, Higher/Lower)</li><li>Set your stake and risk limits in Botvio</li><li>Enable Auto Mode and let Botvio trade for you</li></ol><p>Botvio offers a free starter plan — no payment required to begin.</p>`,
    ...extras,
  };
}

export const countryData: Record<string, CountryInfo> = {
  nigeria: makeCountry("Nigeria", "🇳🇬", { localPayments: "Botvio supports payments via mobile money, crypto (USDT TRC20, Bitcoin), and bank transfer for Nigerian traders." }),
  zambia: makeCountry("Zambia", "🇿🇲", { localPayments: "Zambian traders can fund via Airtel Money, MTN Mobile Money, and crypto wallets." }),
  kenya: makeCountry("Kenya", "🇰🇪", { localPayments: "M-Pesa, Airtel Money, and crypto payments are available for Kenyan Botvio users." }),
  india: makeCountry("India", "🇮🇳", { localPayments: "UPI, bank transfer, and crypto payments supported for Indian traders." }),
  "south-africa": makeCountry("South Africa", "🇿🇦"),
  ghana: makeCountry("Ghana", "🇬🇭", { localPayments: "Mobile Money (MTN, Vodafone Cash) and crypto payments available." }),
  tanzania: makeCountry("Tanzania", "🇹🇿"),
  uganda: makeCountry("Uganda", "🇺🇬"),
  zimbabwe: makeCountry("Zimbabwe", "🇿🇼"),
  mozambique: makeCountry("Mozambique", "🇲🇿"),
  cameroon: makeCountry("Cameroon", "🇨🇲"),
  "ivory-coast": makeCountry("Ivory Coast", "🇨🇮"),
  senegal: makeCountry("Senegal", "🇸🇳"),
  ethiopia: makeCountry("Ethiopia", "🇪🇹"),
  rwanda: makeCountry("Rwanda", "🇷🇼"),
  malawi: makeCountry("Malawi", "🇲🇼"),
  botswana: makeCountry("Botswana", "🇧🇼"),
  namibia: makeCountry("Namibia", "🇳🇦"),
  madagascar: makeCountry("Madagascar", "🇲🇬"),
  "democratic-republic-of-congo": makeCountry("DR Congo", "🇨🇩"),
  angola: makeCountry("Angola", "🇦🇴"),
  pakistan: makeCountry("Pakistan", "🇵🇰"),
  bangladesh: makeCountry("Bangladesh", "🇧🇩"),
  philippines: makeCountry("Philippines", "🇵🇭"),
  indonesia: makeCountry("Indonesia", "🇮🇩"),
  malaysia: makeCountry("Malaysia", "🇲🇾"),
  vietnam: makeCountry("Vietnam", "🇻🇳"),
  thailand: makeCountry("Thailand", "🇹🇭"),
  brazil: makeCountry("Brazil", "🇧🇷"),
  mexico: makeCountry("Mexico", "🇲🇽"),
  colombia: makeCountry("Colombia", "🇨🇴"),
  argentina: makeCountry("Argentina", "🇦🇷"),
  peru: makeCountry("Peru", "🇵🇪"),
  chile: makeCountry("Chile", "🇨🇱"),
  egypt: makeCountry("Egypt", "🇪🇬"),
  morocco: makeCountry("Morocco", "🇲🇦"),
  tunisia: makeCountry("Tunisia", "🇹🇳"),
  "saudi-arabia": makeCountry("Saudi Arabia", "🇸🇦"),
  uae: makeCountry("UAE", "🇦🇪"),
  jordan: makeCountry("Jordan", "🇯🇴"),
  turkey: makeCountry("Turkey", "🇹🇷"),
  ukraine: makeCountry("Ukraine", "🇺🇦"),
  poland: makeCountry("Poland", "🇵🇱"),
  romania: makeCountry("Romania", "🇷🇴"),
  "sri-lanka": makeCountry("Sri Lanka", "🇱🇰"),
  nepal: makeCountry("Nepal", "🇳🇵"),
  myanmar: makeCountry("Myanmar", "🇲🇲"),
  cambodia: makeCountry("Cambodia", "🇰🇭"),
  jamaica: makeCountry("Jamaica", "🇯🇲"),
  "trinidad-and-tobago": makeCountry("Trinidad and Tobago", "🇹🇹"),
};
