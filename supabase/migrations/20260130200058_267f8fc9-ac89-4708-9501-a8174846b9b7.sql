-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for bot_trades table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_trades;

-- Enable realtime for copied_trades table
ALTER PUBLICATION supabase_realtime ADD TABLE public.copied_trades;

-- Enable realtime for bot_instances table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_instances;