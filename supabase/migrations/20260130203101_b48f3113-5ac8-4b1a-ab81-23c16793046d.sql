-- Add category and broker fields to trading_signals for filtering
ALTER TABLE public.trading_signals 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'forex',
ADD COLUMN IF NOT EXISTS broker text[] DEFAULT ARRAY['deriv', 'weltrade', 'exness'];

-- Add admin_posted flag to differentiate manual signals
ALTER TABLE public.trading_signals 
ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES auth.users(id);

-- Allow admins to insert/update/delete trading signals
CREATE POLICY "Admins can manage signals" 
ON public.trading_signals 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Enable realtime for trading_signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;