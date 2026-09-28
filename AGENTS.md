# Project architecture rules

- Classify Weltrade SyntX instruments by family before analysis; ordinary Forex, metals, crypto and stocks retain the generic market engine because SyntX mechanics are family-specific.
- Publish SyntX event or regime labels only from observable loaded market data; show “Data unavailable” when the required tick or sequence state is absent to prevent fabricated analysis.