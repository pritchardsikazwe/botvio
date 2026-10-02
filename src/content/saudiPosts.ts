import type { BlogIndexEntry } from "./blogIndex";

type SaudiPost = { title:string; excerpt:string; category:string; readTime:string; date:string; content:string; };

const footer = `<p><strong>Risk note:</strong> This is educational content, not financial advice. Trading leveraged or derivative products can result in losses. Verify current product availability, fees, margin, leverage, eligibility and applicable rules before making account or trading decisions.</p>`;

const make = (title:string, excerpt:string, sections:[string,string][]) => ({
  title, excerpt, category:"Saudi Trading", readTime:"9 min", date:"2026-10-02",
  content: sections.map(([h,p])=>`<h2>${h}</h2><p>${p}</p>`).join("\n")+footer
});

export const SAUDI_POSTS: Record<string, SaudiPost> = {
"synthetic-indices-saudi-guide":make("Synthetic Indices in Saudi Arabia: Arabic Beginner Guide","A Saudi-focused educational guide to synthetic indices, Deriv, MT5, 24/7 availability and risk controls.",[
["What synthetic indices are","Synthetic indices are simulated markets offered by specific providers. They have different pricing mechanics from listed shares, Saudi Exchange products and traditional FX, so a strategy should be tested on the exact instrument rather than transferred from another market."],
["Why Saudi traders may research them","Round-the-clock availability can make scheduling flexible. It should not be treated as a reason to trade continuously. A Saudi trader can set a fixed Riyadh-time research window and keep a written daily risk limit."],
["Start with product facts","Check the current provider, account entity, instrument specification, minimum size, margin, leverage, order types and whether the product is available to your residence. Use official provider documentation for current conditions."],
["Use demo practice","Practise finding the symbol, placing and closing orders, reading margin and recording the trade. Demo practice teaches platform mechanics but does not prove future profitability."]
]),
"how-to-trade-synthetic-indices-saudi":make("How to Trade Synthetic Indices in Saudi Arabia","Step-by-step workflow for Saudi traders learning synthetic indices without relying on profit promises.",[
["Choose one instrument","Start with one clearly defined product such as a Volatility, Boom, Crash, Step or Range Break instrument. Read its current specification before selecting a strategy."],
["Build a fixed routine","Use Saudi local time in your journal. Define analysis time, entry condition, invalidation, maximum planned loss and exit condition before placing an order."],
["Test the rule","Record every qualifying setup, including losing and rejected setups. A small set of winning trades is not enough to establish that a strategy works."],
["Review behaviour","Measure rule adherence, execution errors, planned versus actual risk and no-trade decisions. The objective is a repeatable process, not a promise of returns."]
]),
"deriv-synthetic-indices-saudi":make("Deriv Synthetic Indices in Saudi Arabia: What Traders Should Know","A Saudi guide to Derived and Synthetic Indices, platform access, instrument differences and risk.",[
["Derived and Synthetic markets","Deriv describes Synthetic Indices as simulated instruments that can be available around the clock. Their mechanics differ from real-world markets and should be studied from current provider documentation."],
["Common categories","Saudi readers may encounter Volatility, Boom, Crash, Step and Range Break instruments. Similar names do not mean identical behaviour, minimum size or risk."],
["Platform checks","If using Deriv MT5, confirm the exact account, server and symbol. Practise on demo first and verify margin and contract information before considering live use."],
["Regulatory and eligibility checks","Do not assume that an online product is automatically available or regulated for every Saudi resident. Confirm the applicable provider entity, current terms and any local requirements before funding an account."]
]),
"synthetic-indices-vs-forex-saudi":make("Synthetic Indices vs Forex in Saudi Arabia","A neutral comparison of synthetic markets and FX for Saudi readers.",[
["Market structure","Forex prices are linked to currency markets and global economic conditions. Synthetic instruments use provider-defined pricing mechanisms. They are not interchangeable markets."],
["Trading hours","Some synthetic products can be available 24/7, while traditional FX follows global market schedules. Continuous access can increase flexibility and also increase the risk of overtrading."],
["News and analysis","Economic releases are central to many FX strategies. Provider documentation states that Synthetic Indices are not driven by real-world news in the same way. Do not import an FX news strategy without testing it."],
["Compare your use case","Consider the time you have available, product mechanics you understand, acceptable risk and platform familiarity. Compare documented results rather than searching for a universal best market."]
]),
"synthetic-indices-trading-hours-saudi":make("Synthetic Indices Trading Hours in Saudi Arabia","Understand 24/7 synthetic-market access and how to schedule research using Riyadh time.",[
["24/7 availability","Selected Synthetic Indices are described by Deriv as available around the clock, including weekends and public holidays. Availability does not mean every period is suitable for every strategy."],
["Riyadh time","Saudi Arabia uses Arabia Standard Time (UTC+3). Record analysis and execution times consistently so your journal remains comparable."],
["Create boundaries","A fixed research window, daily stop and maximum number of decisions can reduce the temptation to monitor a continuously available market."],
["Do not confuse markets","Forex and Saudi Exchange instruments have their own trading schedules. Do not apply those session assumptions to a synthetic instrument without testing."]
]),
"volatility-75-saudi-guide":make("Volatility 75 Trading in Saudi Arabia: Research Guide","An educational V75 guide for Saudi traders covering instrument checks, testing and risk.",[
["Know the instrument","Volatility 75 is a specific synthetic instrument. The number describes its product classification, not a prediction of the next move."],
["Test one method","Define a measurable setup using structure, momentum or another research rule. Keep the rule unchanged while collecting a meaningful sample."],
["Position size","Choose acceptable loss first, then calculate position size from current contract mechanics. If the required size is too large, reject the setup rather than increasing the risk budget."],
["Journal","Record Saudi local time, instrument, setup, entry, invalidation, planned risk and outcome. Review process quality separately from financial results."]
]),
"v75-scalping-saudi":make("V75 Scalping Strategy for Saudi Traders: Research Framework","A rules-based V75 scalping framework focused on measurable setups and risk limits.",[
["Define scalping","Scalping means short holding periods and requires strict execution. It should not mean opening many trades without a tested condition."],
["Build a trigger","Specify the exact chart condition that must occur before entry and the condition that invalidates the idea. Avoid hindsight definitions."],
["Control exposure","Set a maximum planned loss per setup and a daily loss boundary. Do not increase size after a losing trade to recover quickly."],
["Measure the sample","Track signal frequency, false signals, slippage or execution differences, rule violations and outcomes over a consistent sample."]
]),
"v75-swing-saudi":make("V75 Swing Trading Guide for Saudi Arabia","A higher-timeframe educational framework for studying V75 swing setups.",[
["Higher-timeframe structure","Swing research requires a clear market structure, entry condition and invalidation point. A longer holding period can expose the account to larger price changes."],
["Check holding conditions","Confirm how the provider handles margin, protective orders and open positions. Do not assume rules from stocks or conventional FX apply."],
["Use a risk budget","Calculate size from the maximum acceptable loss and current contract mechanics. Do not widen risk simply because a position has moved against you."],
["Review in Riyadh time","Log entry and exit times in Saudi local time and review whether the process was followed regardless of outcome."]
]),
"boom-500-saudi":make("Boom 500 Trading in Saudi Arabia: Research Guide","Educational framework for researching Boom 500 without treating spike patterns as guaranteed timing signals.",[
["Understand the label","Boom instruments are associated with rapid upward movements within a provider-defined market model. The label does not tell you when a spike will occur."],
["Create an objective setup","Define structure, momentum, breakout or another measurable condition before reviewing historical outcomes."],
["Include failed signals","Record every qualifying setup, including cases where the expected movement does not happen. Do not remove inconvenient observations."],
["Protect the account","Set maximum planned loss before position size. Never increase exposure because a spike feels overdue."]
]),
"boom-1000-saudi":make("Boom 1000 Trading in Saudi Arabia: Spike Research Framework","A Saudi educational framework for studying Boom 1000 setups and risk.",[
["No countdown method","A previous spike or a period without one does not create a reliable countdown to the next event."],
["Test a fixed rule","Use a predefined trigger and invalidation. Evaluate it over historical or demo data before considering live use."],
["Risk first","Determine acceptable loss and calculate size from the current contract specification. Do not chase a missed movement."],
["Review errors","Record false signals, late entries, oversized trades and rule violations so the process can be improved."]
]),
"crash-500-saudi":make("Crash 500 Trading in Saudi Arabia: Research Guide","A Saudi guide to researching Crash 500 downside setups and managing exposure.",[
["Understand the market model","Crash instruments are associated with rapid downward movements within a provider-defined model. This is a product characteristic, not a timing guarantee."],
["Define the entry","Use measurable structure, momentum or breakout conditions and a clear invalidation point."],
["Avoid overdue thinking","A period without a sharp move does not establish that a move is due. Base a decision on the tested rule."],
["Use strict limits","Set a daily loss limit and maximum planned loss before sizing. Stop for the day when the predefined boundary is reached."]
]),
"crash-1000-saudi":make("Crash 1000 Trading in Saudi Arabia: Research Framework","A rules-based Crash 1000 framework for Saudi traders.",[
["Study the exact product","Confirm the current instrument specification, platform, minimum size and margin before testing a strategy."],
["Build a sample","Record all qualifying setups and outcomes rather than selecting only successful examples."],
["Control position size","Start with acceptable loss and work backwards to position size. Do not enlarge a trade because a downward move appears overdue."],
["Review consistently","Use unchanged rules across the sample and separate execution quality from financial outcome."]
]),
"step-index-saudi":make("Step Index Trading in Saudi Arabia: Beginner Guide","A Saudi research guide to Step Index markets, chart routines and risk management.",[
["Understand fixed-step behaviour","Step Index products have their own movement mechanics. Read the current provider specification instead of assuming they behave like FX."],
["Chart routine","Select one timeframe, define structure and write the entry condition before reviewing outcomes."],
["Demo execution","Practise symbol selection, order size, margin and closing trades in a demo environment where available."],
["Risk controls","Choose maximum planned loss first. If the required position is too large, do not increase risk merely to participate."]
]),
"range-breakout-saudi":make("Synthetic Indices Range Breakout Strategy in Saudi Arabia","An educational framework for testing Range Break concepts on synthetic markets.",[
["Define the range","Specify how support and resistance are identified and how a valid break is confirmed."],
["Avoid hindsight","Record the range before the break. Do not redraw levels after the movement has already occurred."],
["Test false breaks","Include failed breakouts and no-trade cases in the sample. This is essential for measuring whether the rule adds value."],
["Saudi schedule","Use a consistent Riyadh-time research window so results are comparable across sessions."]
]),
"synthetic-trend-following-saudi":make("Synthetic Indices Trend-Following Strategy in Saudi Arabia","A Saudi framework for researching trend-following on synthetic instruments.",[
["Define trend","Choose an objective definition such as higher highs and higher lows, a tested moving-average rule or another measurable condition."],
["Confirm before entry","Specify the exact confirmation and invalidation conditions. Avoid changing them after seeing the result."],
["Risk sizing","Calculate position size from acceptable loss and current contract conditions."],
["Measure the process","Track trend qualification, late entries, false signals, exits and rule adherence."]
]),
"synthetic-mean-reversion-saudi":make("Synthetic Indices Mean-Reversion Strategy in Saudi Arabia","A research framework for testing whether defined synthetic-market moves return toward a reference.",[
["Define the reference","Use an objective reference such as a tested moving average or statistical band."],
["Define failure","A mean-reversion method needs a clear invalidation point. Otherwise a trader can keep holding while hoping for a return."],
["Test both outcomes","Record cases that revert and cases that continue away from the reference."],
["Keep risk fixed","Do not increase size because price has moved farther from the reference."]
]),
"how-to-open-deriv-account-saudi":make("How to Open a Deriv Account in Saudi Arabia","An educational onboarding guide covering eligibility, registration, verification and product checks.",[
["Check eligibility","Use the current official provider onboarding process and confirm that the relevant service and product are available for your residence."],
["Register accurately","Use accurate personal information and complete any identity or address checks requested by the provider."],
["Use demo first","A demo account can help you learn symbols, order controls and platform mechanics before funding, where available."],
["Before funding","Check the applicable provider entity, fees, deposits, withdrawals, product availability and risk conditions."]
]),
"deriv-mt5-saudi-guide":make("How to Set Up Deriv MT5 in Saudi Arabia","A practical Saudi guide to account selection, server connection, symbols and demo testing.",[
["Confirm the account","Check that the intended account supports MT5 and the product you want to research."],
["Connect securely","Use the current official instructions and verify the exact login and server. Never share credentials for setup."],
["Check symbols","Add the exact instrument and read its current minimum size, margin and trading conditions."],
["Demo test","Open a chart, verify quotes, place a demo order and practise closing it before considering live execution."]
]),
"deriv-vs-exness-saudi":make("Deriv vs Exness for Saudi Traders: Platform Differences","A neutral Saudi comparison framework covering products, platforms, fees and applicable entities.",[
["Compare the actual use case","Start with the instrument and platform you need rather than assuming one broker is universally better."],
["Check account entities","Product availability, leverage, fees and legal terms can depend on the entity and jurisdiction."],
["Compare documented fields","Record instruments, account types, spreads or fees, margin, deposits, withdrawals, platform support and regulatory information."],
["Keep the comparison factual","Use current official documentation and avoid ranking providers based on unsupported claims."]
]),
"forex-trading-saudi-guide":make("Forex Trading in Saudi Arabia: Beginner Guide","A Saudi beginner guide to FX market structure, sessions, risk and platform checks.",[
["Understand FX","Forex involves currency pairs traded across a global market. Price can react to monetary policy, economic data, geopolitical events and liquidity conditions."],
["Saudi trading time","Saudi Arabia uses UTC+3. Convert major London, New York and Asian session times using current local offsets because some markets observe seasonal clock changes."],
["Risk first","Define maximum planned loss, position size and invalidation before entry."],
["Verify the provider","Check the exact broker entity, current authorization or regulatory status relevant to your situation, fees and withdrawal terms."]
]),
"gold-xauusd-saudi":make("Gold XAUUSD Trading in Saudi Arabia: Educational Guide","A Saudi guide to XAUUSD research, macro drivers, sessions and risk management.",[
["What moves gold","Gold can respond to interest-rate expectations, the US dollar, inflation expectations, geopolitical risk and broader market conditions."],
["Use current data","Economic calendars and current market data matter for research. Avoid relying on old session tables or outdated spread assumptions."],
["Risk management","Gold can move quickly. Define acceptable loss before position size and use a tested exit rule."],
["Saudi context","Record research in Riyadh time and note the relevant London or New York session when comparing results."]
]),
"mt5-trading-saudi-beginners":make("MT5 Trading in Saudi Arabia: Beginner's Guide","A practical MT5 guide for Saudi users covering accounts, servers, symbols and order controls.",[
["Understand MT5","MT5 is a trading platform; the available products and conditions depend on the connected provider account."],
["Connect correctly","Verify the exact account, server and login details supplied by the provider."],
["Learn order controls","Practise market and pending orders, stop-loss and take-profit controls in demo mode before live use."],
["Keep security tight","Use unique credentials, enable available account security and never give passwords to another person."]
]),
"trading-risk-management-saudi":make("Trading Risk Management for Saudi Traders","A practical framework for position sizing, daily limits, drawdown control and execution discipline.",[
["Risk before entry","Choose a maximum planned loss before opening a trade. Position size should follow that budget, not the other way around."],
["Daily boundaries","A written daily loss limit can prevent one bad session from becoming a larger account problem."],
["Avoid recovery trading","Do not increase exposure simply to recover a previous loss. A loss does not create a reason to take a larger risk."],
["Review behaviour","Track planned versus actual risk, rule violations, execution errors and no-trade decisions."]
]),
};

export const SAUDI_INDEX: BlogIndexEntry[] = Object.entries(SAUDI_POSTS).map(([slug,p],i)=>[slug,p.title,p.excerpt,p.category,p.readTime,{featured:i<4,image:"🇸🇦"}] as any);