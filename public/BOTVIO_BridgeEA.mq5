//+------------------------------------------------------------------+
//|                                             BOTVIO_BridgeEA.mq5 |
//|                                        Copyright 2024, BOTVIO   |
//|                                         https://botvio.live     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, BOTVIO"
#property link      "https://botvio.live"
#property version   "1.00"
#property strict

//--- Input parameters
input string   InpTerminalUID = "";           // Your BOTVIO Terminal UID
input string   InpBridgeSecret = "";          // Bridge Shared Secret
input string   InpBridgeURL = "https://tqqkzeblmjapgbnsbtgw.supabase.co/functions/v1";
input int      InpHeartbeatInterval = 10;     // Heartbeat interval (seconds)
input int      InpCommandPollInterval = 2;    // Command poll interval (seconds)
input int      InpStatePushInterval = 10;     // State push interval (seconds)

//--- Global variables
datetime g_lastHeartbeat = 0;
datetime g_lastCommandPoll = 0;
datetime g_lastStatePush = 0;
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
            "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"price\":%.5f,\"profit\":%.2f,\"sl\":%.5f,\"tp\":%.5f}",
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
   // Extract symbol
   int symStart = StringFind(response, "\"symbol\":\"");
   if(symStart < 0) { errorMsg = "Symbol not found"; return false; }
   symStart += 10;
   int symEnd = StringFind(response, "\"", symStart);
   string symbol = StringSubstr(response, symStart, symEnd - symStart);
   
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
   
   // Execute trade
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = volume;
   request.type = orderType;
   request.price = (orderType == ORDER_TYPE_BUY) ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
   request.deviation = 10;
   request.magic = 123456;
   request.comment = "BOTVIO";
   
   if(OrderSend(request, result))
   {
      ticket = result.deal;
      return true;
   }
   else
   {
      errorMsg = StringFormat("OrderSend failed. Error: %d", GetLastError());
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
   
   if(OrderSend(request, result))
   {
      return true;
   }
   else
   {
      errorMsg = StringFormat("Modify failed. Error: %d", GetLastError());
      return false;
   }
}

//+------------------------------------------------------------------+
//| Escape a string for safe JSON embedding                          |
//+------------------------------------------------------------------+
string EscapeJson(string input)
{
   string output = input;
   // Must escape backslash first, then quotes
   StringReplace(output, "\\", "\\\\");
   StringReplace(output, "\"", "\\\"");
   StringReplace(output, "\n", "\\n");
   StringReplace(output, "\r", "\\r");
   StringReplace(output, "\t", "\\t");
   return output;
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
      "{\"command_id\":\"%s\",\"status\":\"%s\",\"ticket\":%d,\"result\":%s}",
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
