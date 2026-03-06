-- Update existing signal products with new pricing
UPDATE public.products SET price_usd = 19, short_description = 'Monthly premium trading signals with courses access', is_active = true, is_featured = true WHERE id = '048325ee-c379-491c-8b4f-ec80fcfc89d9';
UPDATE public.products SET name = 'Premium Signals - Lifetime', slug = 'premium-signals-lifetime', price_usd = 99, short_description = 'Lifetime premium signals with all courses access', is_active = true, is_featured = true WHERE id = 'f64b75b6-6293-49e1-9953-7130177bc8b3';

-- Create 3-month product
INSERT INTO public.products (name, slug, short_description, description, type, price_usd, is_active, is_featured)
VALUES ('Premium Signals - 3 Months', 'premium-signals-3months', '3-month premium signals bundle with courses access', 'Save with our quarterly signals package. Includes all premium signals and full course access for 3 months.', 'signal_pack', 49, true, true);

-- Update Forex Beginner Mentorship to free
UPDATE public.products SET price_usd = 0, short_description = 'Free forex mentorship — forex markets, crypto intro & personal mentor WhatsApp group' WHERE id = '041bb16e-4ba7-44d1-b2ce-6a79cc42b93f';