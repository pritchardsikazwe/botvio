export const POSTING_TARGET = "personal";

export function articleTopics(category = "", title = "") {
  const subject = `${category} ${title}`.toLowerCase();
  const keywords = ["trading education", "risk management", "market analysis"];
  const hashtags = ["#Botvio", "#TradingEducation", "#RiskManagement"];
  const topics = [
    [/forex|currency/, "forex trading", "#ForexTrading"],
    [/gold|xauusd/, "gold trading", "#GoldTrading"],
    [/crypto|bitcoin/, "cryptocurrency markets", "#Crypto"],
    [/synthetic|deriv/, "synthetic indices", "#SyntheticIndices"],
    [/chart|technical/, "technical analysis", "#TechnicalAnalysis"],
    [/nas100|us30|ger40|stock/, "stock indices", "#StockMarket"],
  ] as const;
  for (const [match, keyword, hashtag] of topics) {
    if (match.test(subject)) {
      keywords.push(keyword);
      hashtags.push(hashtag);
    }
  }
  return { keywords: keywords.join(" · "), hashtags: hashtags.join(" ") };
}