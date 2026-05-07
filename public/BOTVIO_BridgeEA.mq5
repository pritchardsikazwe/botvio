//+------------------------------------------------------------------+
//|                                             BOTVIO_BridgeEA.mq5 |
//|                                        Copyright 2024, BOTVIO   |
//|                                         https://botvio.live     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, BOTVIO"
#property link      "https://botvio.live"
#property version   "1.31"
#property strict

//--- Input parameters
input string   InpTerminalUID = "";           // Your BOTVIO Terminal UID
input string   InpBridgeSecret = "";          // Bridge Shared Secret
input string   InpBridgeURL = "https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1";
input int      InpHeartbeatInterval = 10;     // Heartbeat interval (seconds)
input int      InpCommandPollInterval = 3;    // Command poll interval (seconds)
input int      InpStatePushInterval = 10;     // State push interval (seconds)
input int      InpTickPushInterval = 15;      // Tick push interval (seconds, 0=off)
input int      InpMaxSymbolsPerTickPush = 4;  // Max symbols per tick push (prevents backend overload)

//--- Broker preset (auto-fills the symbol list below)
enum ENUM_BROKER_PRESET { PRESET_WELTRADE, PRESET_EXNESS, PRESET_DERIV_MT5, PRESET_CUSTOM };
input ENUM_BROKER_PRESET InpBrokerPreset = PRESET_WELTRADE; // Broker preset
input string   InpTickSymbols = ""; // Custom symbols (used only when preset=Custom)

// Resolved symbol list (filled in OnInit based on preset)
string g_tickSymbols = "";
int g_tickCursor = 0;

//--- Global variables
datetime g_lastHeartbeat = 0;
datetime g_lastCommandPoll = 0;
datetime g_lastStatePush = 0;
datetime g_lastTickPush = 0;
bool g_registered = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(InpTerminalUID) == 0)
   {
      Print("ERROR: Terminal UID is required. Get it from botvio.live/connections");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   // Validate UID doesn't contain characters that break JSON
   if(StringFind(InpTerminalUID, "\"") >= 0 || StringFind(InpTerminalUID, "\\") >= 0)
   {
      Print("ERROR: Terminal UID contains invalid characters");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   if(StringLen(InpBridgeSecret) == 0)
   {
      Print("ERROR: Bridge Shared Secret is required");
      return INIT_PARAMETERS_INCORRECT;
   }

   // Resolve broker preset → symbol list
   if(InpBrokerPreset == PRESET_WELTRADE)
   {
      g_tickSymbols = "GainX 400,GainX 600,GainX 800,PainX 400,PainX 600,PainX 800,"
                      "FlipX 1,FlipX 2,FlipX 3,FlipX 4,FlipX 5,"
                      "SwitchX 600,SwitchX 1200,SwitchX 1800,"
                      "FX VOL 20,FX VOL 40,FX VOL 80";
      Print("Broker preset: WELTRADE — streaming SyntX (GainX/PainX/FlipX/SwitchX/FX VOL)");
   }
   else if(InpBrokerPreset == PRESET_EXNESS)
   {
      g_tickSymbols = "XAUUSD,XAGUSD,EURUSD,GBPUSD,USDJPY,USDCHF,AUDUSD,NZDUSD,USDCAD,"
                      "BTCUSD,ETHUSD,US30,US500,USTEC";
      Print("Broker preset: EXNESS — streaming FX, metals, crypto and indices");
   }
   else if(InpBrokerPreset == PRESET_DERIV_MT5)
   {
      g_tickSymbols = "Boom 300 Index,Boom 500 Index,Boom 600 Index,Boom 900 Index,Boom 1000 Index,"
                      "Crash 300 Index,Crash 500 Index,Crash 600 Index,Crash 900 Index,Crash 1000 Index,"
                      "Volatility 10 Index,Volatility 25 Index,Volatility 75 Index,Volatility 75 (1s) Index,"
                      "Step Index";
      Print("Broker preset: DERIV MT5 — streaming Boom/Crash/Volatility/Step");
   }
   else
   {
      g_tickSymbols = InpTickSymbols;
      Print("Broker preset: CUSTOM — using InpTickSymbols");
   }

   // Register terminal on startup
   if(!RegisterTerminal())
   {
      Print("WARNING: Failed to register terminal. Will retry...");
   }
   
   EventSetTimer(1); // Timer every second
   
   Print("BOTVIO Bridge EA initialized. Terminal UID: ", InpTerminalUID);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("BOTVIO Bridge EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Main logic handled by timer
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   datetime now = TimeCurrent();
   
   // Registration retry
   if(!g_registered)
   {
      if(RegisterTerminal())
         g_registered = true;
      return;
   }
   
   // Heartbeat
   if(now - g_lastHeartbeat >= InpHeartbeatInterval)
   {
      SendHeartbeat();
      g_lastHeartbeat = now;
   }
   
   // Poll commands
   if(now - g_lastCommandPoll >= InpCommandPollInterval)
   {
      PollCommands();
      g_lastCommandPoll = now;
   }
   
   // Push state
   if(now - g_lastStatePush >= InpStatePushInterval)
   {
      PushState();
      g_lastStatePush = now;
   }

   // Push live ticks for SyntX/configured symbols
   if(InpTickPushInterval > 0 && now - g_lastTickPush >= InpTickPushInterval)
   {
      PushTicks();
      g_lastTickPush = now;
   }
}

//+------------------------------------------------------------------+
//| Register terminal with BOTVIO                                    |
//+------------------------------------------------------------------+
bool RegisterTerminal()
{
   string url = InpBridgeURL + "/bridge-register-terminal";
   string headers = "Content-Type: application/json\r\nx-bridge-secret: " + InpBridgeSecret;
   
   // Escape JSON-unsafe characters in broker strings
   string brokerName = EscapeJson(AccountInfoString(ACCOUNT_COMPANY));
   string serverName = EscapeJson(AccountInfoString(ACCOUNT_SERVER));
   string currency = EscapeJson(AccountInfoString(ACCOUNT_CURRENCY));
   
   string body = StringFormat(
      "{\"terminal_uid\":\"%s\",\"user_id\":\"%s\",\"broker_name\":\"%s\",\"server\":\"%s\",\"login\":\"%s\",\"account_currency\":\"%s\",\"leverage\":%d}",
      InpTerminalUID,
      InpTerminalUID,
      brokerName,
      serverName,
      IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)),
      currency,
      (int)AccountInfoInteger(ACCOUNT_LEVERAGE)
   );
   
   Print("Register body: ", body);
   
   char data[];
   char result[];
   string resultHeaders;
   
   int len = StringToCharArray(body, data, 0, -1, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);
   
   int res = WebRequest("POST", url, headers, 5000, data, result, resultHeaders);
   
   if(res == 200)
   {
      Print("Terminal registered successfully");
      return true;
   }
   else
   {
      Print("Registration failed. HTTP code: ", res);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Send heartbeat                                                   |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
   string url = InpBridgeURL + "/bridge-heartbeat";
   string headers = "Content-Type: application/json\r\nx-bridge-secret: " + InpBridgeSecret;
   
   string body = StringFormat(
      "{\"terminal_uid\":\"%s\",\"status\":\"ONLINE\",\"timestamp\":\"%s\"}",
      InpTerminalUID,
      TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS)
   );
   
   char data[];
   char result[];
   string resultHeaders;
   
   int len = StringToCharArray(body, data, 0, -1, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);
   
   int res = WebRequest("POST", url, headers, 3000, data, result, resultHeaders);
   
   if(res != 200)
   {
      Print("Heartbeat failed. HTTP code: ", res);
   }
}

//+------------------------------------------------------------------+
//| Push account state                                               |
//+------------------------------------------------------------------+
void PushState()
{
   string url = InpBridgeURL + "/bridge-push-state";
   string headers = "Content-Type: application/json\r\nx-bridge-secret: " + InpBridgeSecret;
   
   // Build positions array
   string positions = "[";
   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
   {
      if(PositionSelectByTicket(PositionGetTicket(i)))
      {
         if(i > 0) positions += ",";
         positions += StringFormat(
            "{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"price\":%.5f,\"profit\":%.2f,\"sl\":%.5f,\"tp\":%.5f}",
            PositionGetInteger(POSITION_TICKET),
            PositionGetString(POSITION_SYMBOL),
            PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL",
            PositionGetDouble(POSITION_VOLUME),
            PositionGetDouble(POSITION_PRICE_OPEN),
            PositionGetDouble(POSITION_PROFIT),
            PositionGetDouble(POSITION_SL),
            PositionGetDouble(POSITION_TP)
         );
      }
   }
   positions += "]";
   
   string body = StringFormat(
      "{\"terminal_uid\":\"%s\",\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"free_margin\":%.2f,\"positions\":%s}",
      InpTerminalUID,
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      AccountInfoDouble(ACCOUNT_MARGIN),
      AccountInfoDouble(ACCOUNT_MARGIN_FREE),
      positions
   );
   
   char data[];
   char result[];
   string resultHeaders;
   
   int len = StringToCharArray(body, data, 0, -1, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);
   
   int res = WebRequest("POST", url, headers, 5000, data, result, resultHeaders);
   
   if(res != 200)
   {
      Print("State push failed. HTTP code: ", res);
   }
}

//+------------------------------------------------------------------+
//| Push live ticks for configured symbols (SyntX/Weltrade etc.)     |
//+------------------------------------------------------------------+
void PushTicks()
{
   if(StringLen(g_tickSymbols) == 0) return;

   // Parse comma-separated symbols
   string symbols[];
   int count = StringSplit(g_tickSymbols, ',', symbols);
   if(count <= 0) return;

   string ticks = "[";
   bool firstTick = true;
   string brokerName = EscapeJson(AccountInfoString(ACCOUNT_COMPANY));

    int maxPush = InpMaxSymbolsPerTickPush;
    if(maxPush <= 0 || maxPush > count) maxPush = count;

    for(int pushed = 0; pushed < maxPush; pushed++)
   {
       int i = (g_tickCursor + pushed) % count;
       string sym = symbols[i];
      // Trim whitespace
      StringTrimLeft(sym);
      StringTrimRight(sym);
      if(StringLen(sym) == 0) continue;

      // Ensure symbol is in MarketWatch so quotes update
      if(!SymbolSelect(sym, true))
      {
         continue; // symbol not available on this broker
      }

      double bid = SymbolInfoDouble(sym, SYMBOL_BID);
      double ask = SymbolInfoDouble(sym, SYMBOL_ASK);
      if(bid <= 0.0 && ask <= 0.0) continue;

      double last = (bid > 0.0 && ask > 0.0) ? (bid + ask) / 2.0 : (bid > 0.0 ? bid : ask);

      if(!firstTick) ticks += ",";
      firstTick = false;

      ticks += StringFormat(
         "{\"symbol\":\"%s\",\"bid\":%.5f,\"ask\":%.5f,\"last\":%.5f}",
         EscapeJson(sym), bid, ask, last
      );
   }
   ticks += "]";

    g_tickCursor = (g_tickCursor + maxPush) % count;
    if(firstTick) return; // no usable symbols in this rotation

   string url = InpBridgeURL + "/bridge-push-ticks";
   string headers = "Content-Type: application/json\r\nx-bridge-secret: " + InpBridgeSecret;

   string body = StringFormat(
      "{\"terminal_uid\":\"%s\",\"broker\":\"%s\",\"ticks\":%s}",
      InpTerminalUID, brokerName, ticks
   );

   char data[];
   char result[];
   string resultHeaders;
   int len = StringToCharArray(body, data, 0, -1, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);

   int res = WebRequest("POST", url, headers, 3000, data, result, resultHeaders);
   if(res != 200)
   {
      Print("Tick push failed. HTTP code: ", res);
   }
}

//+------------------------------------------------------------------+
//| Poll and execute commands                                        |
//+------------------------------------------------------------------+
void PollCommands()
{
   string url = InpBridgeURL + "/bridge-pull-commands";
   string headers = "Content-Type: application/json\r\nx-bridge-secret: " + InpBridgeSecret;
   
   string body = StringFormat("{\"terminal_uid\":\"%s\"}", InpTerminalUID);
   
   char data[];
   char result[];
   string resultHeaders;
   
   int len = StringToCharArray(body, data, 0, -1, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);
   
   int res = WebRequest("POST", url, headers, 5000, data, result, resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      // Parse and execute commands
      // Simple JSON parsing for commands array
      if(StringFind(response, "\"commands\":[") >= 0)
      {
         // Extract commands and execute them
         // This is simplified - production would need proper JSON parsing
         ProcessCommandsResponse(response);
      }
   }
}

//+------------------------------------------------------------------+
//| Process commands from response                                   |
//+------------------------------------------------------------------+
void ProcessCommandsResponse(string response)
{
   // Basic command processing - expand as needed
   // Look for command patterns in response
   
   int cmdStart = StringFind(response, "\"command\":{");
   if(cmdStart < 0) return;
   
   // Extract action
   int actionStart = StringFind(response, "\"action\":\"", cmdStart);
   if(actionStart < 0) return;
   
   actionStart += 10;
   int actionEnd = StringFind(response, "\"", actionStart);
   string action = StringSubstr(response, actionStart, actionEnd - actionStart);
   
   // Extract command ID
   int idStart = StringFind(response, "\"id\":\"");
   if(idStart < 0) return;
   
   idStart += 6;
   int idEnd = StringFind(response, "\"", idStart);
   string commandId = StringSubstr(response, idStart, idEnd - idStart);
   
   // Execute based on action
   bool success = false;
   ulong ticket = 0;
   string errorMsg = "";
   
   if(action == "OPEN")
   {
      success = ExecuteOpenCommand(response, ticket, errorMsg);
   }
   else if(action == "CLOSE")
   {
      success = ExecuteCloseCommand(response, errorMsg);
   }
   else if(action == "CLOSE_ALL")
   {
      success = ExecuteCloseAllCommand(errorMsg);
   }
   else if(action == "MODIFY")
   {
      success = ExecuteModifyCommand(response, errorMsg);
   }
   
   // Acknowledge command
   AckCommand(commandId, success ? "SUCCESS" : "FAILED", ticket, errorMsg);
}

//+------------------------------------------------------------------+
//| Execute OPEN command                                             |
//+------------------------------------------------------------------+
bool ExecuteOpenCommand(string response, ulong &ticket, string &errorMsg)
{
   PrintFormat("[BOTVIO] OPEN cmd payload: %s", StringSubstr(response, 0, 400));
   // Extract symbol
   int symStart = StringFind(response, "\"symbol\":\"");
   if(symStart < 0) { errorMsg = "Symbol not found"; return false; }
   symStart += 10;
   int symEnd = StringFind(response, "\"", symStart);
   string symbol = StringSubstr(response, symStart, symEnd - symStart);

   // Ensure symbol exists in Market Watch (auto-add if missing)
   if(!SymbolSelect(symbol, true))
   {
      errorMsg = StringFormat("Symbol '%s' not in Market Watch (SymbolSelect failed). Add it manually in MT5.", symbol);
      PrintFormat("[BOTVIO] %s", errorMsg);
      return false;
   }
   // Force a refresh so SymbolInfoDouble has fresh prices
   MqlTick lastTick;
   if(!SymbolInfoTick(symbol, lastTick))
   {
      errorMsg = StringFormat("No tick data for '%s'. Open a chart of this symbol in MT5.", symbol);
      PrintFormat("[BOTVIO] %s", errorMsg);
      return false;
   }
   
   // Extract type (BUY/SELL)
   int typeStart = StringFind(response, "\"type\":\"");
   if(typeStart < 0) { errorMsg = "Type not found"; return false; }
   typeStart += 8;
   int typeEnd = StringFind(response, "\"", typeStart);
   string typeStr = StringSubstr(response, typeStart, typeEnd - typeStart);
   ENUM_ORDER_TYPE orderType = (typeStr == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   
   // Extract volume
   int volStart = StringFind(response, "\"volume\":");
   if(volStart < 0) { errorMsg = "Volume not found"; return false; }
   volStart += 9;
   int volEnd = StringFind(response, ",", volStart);
   if(volEnd < 0) volEnd = StringFind(response, "}", volStart);
   double volume = StringToDouble(StringSubstr(response, volStart, volEnd - volStart));

   // Extract optional SL/TP from the OPEN command so MT5 receives the full trade plan.
   double sl = 0, tp = 0;
   int slStart = StringFind(response, "\"sl\":");
   if(slStart >= 0)
   {
      slStart += 5;
      int slEnd = StringFind(response, ",", slStart);
      if(slEnd < 0) slEnd = StringFind(response, "}", slStart);
      sl = StringToDouble(StringSubstr(response, slStart, slEnd - slStart));
   }

   int tpStart = StringFind(response, "\"tp\":");
   if(tpStart >= 0)
   {
      tpStart += 5;
      int tpEnd = StringFind(response, ",", tpStart);
      if(tpEnd < 0) tpEnd = StringFind(response, "}", tpStart);
      tp = StringToDouble(StringSubstr(response, tpStart, tpEnd - tpStart));
   }

   // Normalise volume to broker step + min/max
   double minVol  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxVol  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double stepVol = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   if(stepVol > 0) volume = MathRound(volume / stepVol) * stepVol;
   if(volume < minVol) volume = minVol;
   if(maxVol > 0 && volume > maxVol) volume = maxVol;

   // Auto-detect supported filling mode for this symbol (Weltrade/Exness use IOC, Deriv MT5 uses FOK, others RETURN)
   long fillingFlags = SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   ENUM_ORDER_TYPE_FILLING fillingMode = ORDER_FILLING_RETURN;
   if((fillingFlags & SYMBOL_FILLING_FOK) != 0)      fillingMode = ORDER_FILLING_FOK;
   else if((fillingFlags & SYMBOL_FILLING_IOC) != 0) fillingMode = ORDER_FILLING_IOC;

   double askPx = lastTick.ask;
   double bidPx = lastTick.bid;
   double price = (orderType == ORDER_TYPE_BUY) ? askPx : bidPx;

   // Validate SL/TP against broker stop level
   long stopsLevel = SymbolInfoInteger(symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double point    = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double minDist  = stopsLevel * point;
   if(sl > 0 && minDist > 0)
   {
      if(orderType == ORDER_TYPE_BUY  && (price - sl) < minDist) sl = price - minDist;
      if(orderType == ORDER_TYPE_SELL && (sl - price) < minDist) sl = price + minDist;
   }
   if(tp > 0 && minDist > 0)
   {
      if(orderType == ORDER_TYPE_BUY  && (tp - price) < minDist) tp = price + minDist;
      if(orderType == ORDER_TYPE_SELL && (price - tp) < minDist) tp = price - minDist;
   }

   PrintFormat("[BOTVIO] Sending OPEN: %s %s vol=%.2f price=%.5f sl=%.5f tp=%.5f filling=%d",
               symbol, EnumToString(orderType), volume, price, sl, tp, fillingMode);

   // Execute trade
   MqlTradeRequest request; ZeroMemory(request);
   MqlTradeResult result;   ZeroMemory(result);

   request.action       = TRADE_ACTION_DEAL;
   request.symbol       = symbol;
   request.volume       = volume;
   request.type         = orderType;
   request.price        = price;
   request.deviation    = 50;       // wider slippage tolerance
   request.magic        = 123456;
   request.comment      = "BOTVIO";
   request.type_filling = fillingMode;
   request.type_time    = ORDER_TIME_GTC;
   if(sl > 0) request.sl = NormalizeDouble(sl, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS));
   if(tp > 0) request.tp = NormalizeDouble(tp, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS));

   bool sent = OrderSend(request, result);
   PrintFormat("[BOTVIO] OrderSend → sent=%s retcode=%d order=%I64u deal=%I64u comment=%s",
               sent ? "true" : "false", result.retcode, result.order, result.deal, result.comment);

   // Retry once with a different filling mode if rejected with "Unsupported filling mode" (10030)
   if((!sent || result.retcode == 10030) && fillingMode != ORDER_FILLING_RETURN)
   {
      ENUM_ORDER_TYPE_FILLING alt = (fillingMode == ORDER_FILLING_FOK) ? ORDER_FILLING_IOC : ORDER_FILLING_FOK;
      if((fillingFlags & (alt == ORDER_FILLING_FOK ? SYMBOL_FILLING_FOK : SYMBOL_FILLING_IOC)) != 0)
      {
         request.type_filling = alt;
         PrintFormat("[BOTVIO] Retrying OPEN with filling=%d", alt);
         sent = OrderSend(request, result);
         PrintFormat("[BOTVIO] Retry → sent=%s retcode=%d", sent ? "true" : "false", result.retcode);
      }
   }

   if(sent && (result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_PLACED))
   {
      ticket = 0;
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong posTicket = PositionGetTicket(i);
         if(PositionSelectByTicket(posTicket)
            && PositionGetString(POSITION_SYMBOL) == symbol
            && PositionGetInteger(POSITION_MAGIC) == 123456)
         {
            ticket = posTicket;
            break;
         }
      }
      if(ticket == 0)
      {
         for(int i = PositionsTotal() - 1; i >= 0; i--)
         {
            ulong posTicket = PositionGetTicket(i);
            if(PositionSelectByTicket(posTicket)
               && PositionGetString(POSITION_SYMBOL) == symbol
               && PositionGetInteger(POSITION_TYPE) == (orderType == ORDER_TYPE_BUY ? POSITION_TYPE_BUY : POSITION_TYPE_SELL))
            {
               ticket = posTicket;
               break;
            }
         }
      }
      if(ticket == 0) ticket = result.order;
      return true;
   }
   else
   {
      errorMsg = StringFormat("OrderSend failed. Retcode=%d Error=%d Comment=%s", result.retcode, GetLastError(), result.comment);
      PrintFormat("[BOTVIO] %s", errorMsg);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Execute CLOSE command                                            |
//+------------------------------------------------------------------+
bool ExecuteCloseCommand(string response, string &errorMsg)
{
   // Extract ticket
   int ticketStart = StringFind(response, "\"ticket\":");
   if(ticketStart < 0) { errorMsg = "Ticket not found"; return false; }
   ticketStart += 9;
   int ticketEnd = StringFind(response, ",", ticketStart);
   if(ticketEnd < 0) ticketEnd = StringFind(response, "}", ticketStart);
   ulong ticket = (ulong)StringToInteger(StringSubstr(response, ticketStart, ticketEnd - ticketStart));
   
   if(!PositionSelectByTicket(ticket))
   {
      errorMsg = "Position not found";
      return false;
   }
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.position = ticket;
   request.symbol = PositionGetString(POSITION_SYMBOL);
   request.volume = PositionGetDouble(POSITION_VOLUME);
   request.type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   request.price = (request.type == ORDER_TYPE_BUY) ? 
                   SymbolInfoDouble(request.symbol, SYMBOL_ASK) : 
                   SymbolInfoDouble(request.symbol, SYMBOL_BID);
   request.deviation = 10;
   
   if(OrderSend(request, result))
   {
      return true;
   }
   else
   {
      errorMsg = StringFormat("Close failed. Error: %d", GetLastError());
      return false;
   }
}

//+------------------------------------------------------------------+
//| Execute CLOSE_ALL command                                        |
//+------------------------------------------------------------------+
bool ExecuteCloseAllCommand(string &errorMsg)
{
   int closed = 0;
   int failed = 0;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(PositionSelectByTicket(PositionGetTicket(i)))
      {
         MqlTradeRequest request = {};
         MqlTradeResult result = {};
         
         request.action = TRADE_ACTION_DEAL;
         request.position = PositionGetInteger(POSITION_TICKET);
         request.symbol = PositionGetString(POSITION_SYMBOL);
         request.volume = PositionGetDouble(POSITION_VOLUME);
         request.type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
         request.price = (request.type == ORDER_TYPE_BUY) ? 
                         SymbolInfoDouble(request.symbol, SYMBOL_ASK) : 
                         SymbolInfoDouble(request.symbol, SYMBOL_BID);
         request.deviation = 10;
         
         if(OrderSend(request, result))
            closed++;
         else
            failed++;
      }
   }
   
   if(failed > 0)
   {
      errorMsg = StringFormat("Closed %d, Failed %d", closed, failed);
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| Execute MODIFY command                                           |
//+------------------------------------------------------------------+
bool ExecuteModifyCommand(string response, string &errorMsg)
{
   // Extract ticket
   int ticketStart = StringFind(response, "\"ticket\":");
   if(ticketStart < 0) { errorMsg = "Ticket not found"; return false; }
   ticketStart += 9;
   int ticketEnd = StringFind(response, ",", ticketStart);
   ulong ticket = (ulong)StringToInteger(StringSubstr(response, ticketStart, ticketEnd - ticketStart));
   
   if(!PositionSelectByTicket(ticket))
   {
      errorMsg = "Position not found";
      return false;
   }
   
   // Extract SL/TP
   double sl = 0, tp = 0;
   
   int slStart = StringFind(response, "\"sl\":");
   if(slStart >= 0)
   {
      slStart += 5;
      int slEnd = StringFind(response, ",", slStart);
      if(slEnd < 0) slEnd = StringFind(response, "}", slStart);
      sl = StringToDouble(StringSubstr(response, slStart, slEnd - slStart));
   }
   
   int tpStart = StringFind(response, "\"tp\":");
   if(tpStart >= 0)
   {
      tpStart += 5;
      int tpEnd = StringFind(response, ",", tpStart);
      if(tpEnd < 0) tpEnd = StringFind(response, "}", tpStart);
      tp = StringToDouble(StringSubstr(response, tpStart, tpEnd - tpStart));
   }
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_SLTP;
   request.position = ticket;
   request.symbol = PositionGetString(POSITION_SYMBOL);
   request.sl = sl;
   request.tp = tp;
   
   if(OrderSend(request, result) && (result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_PLACED))
   {
      return true;
   }
   else
   {
      errorMsg = StringFormat("Modify failed. Retcode: %d Error: %d", result.retcode, GetLastError());
      return false;
   }
}

//+------------------------------------------------------------------+
//| Escape a string for safe JSON embedding                          |
//+------------------------------------------------------------------+
string EscapeJson(string str)
{
   string result = str;
   StringReplace(result, "\\", "\\\\");
   StringReplace(result, "\"", "\\\"");
   return result;
}

//+------------------------------------------------------------------+
//| Acknowledge command completion                                   |
//+------------------------------------------------------------------+
void AckCommand(string commandId, string status, ulong ticket, string errorMsg)
{
   string url = InpBridgeURL + "/bridge-ack-command";
   string headers = "Content-Type: application/json\r\nx-bridge-secret: " + InpBridgeSecret;
   
   string result_json = StringFormat(
      "{\"error\":\"%s\"}",
      errorMsg
   );
   
    string body = StringFormat(
       "{\"command_id\":\"%s\",\"status\":\"%s\",\"ticket\":%I64u,\"result\":%s}",
      commandId,
      status,
      ticket,
      result_json
   );
   
   char data[];
   char result[];
   string resultHeaders;
   
   int len = StringToCharArray(body, data, 0, -1, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);
   
   WebRequest("POST", url, headers, 3000, data, result, resultHeaders);
}
//+------------------------------------------------------------------+
