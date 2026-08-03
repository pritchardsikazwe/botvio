-- 1. partner_links: update the Deriv entry
UPDATE public.partner_links
SET url = 'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
WHERE url LIKE 'https://deriv.partners/rx?sidi=F9C8D3BF%'
   OR url LIKE 'https://track.deriv.com/_h8%'
   OR url = 'https://deriv.com/signup/?utm_source=botvio&utm_medium=affiliate&utm_campaign=CU23827';

-- 2. posts: replace old Deriv affiliate URLs inside content_html
UPDATE public.posts
SET content_html = replace(
  content_html,
  'https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827',
  'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
)
WHERE content_html LIKE '%https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827%';

UPDATE public.posts
SET content_html = replace(
  content_html,
  'https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804UC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827',
  'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
)
WHERE content_html LIKE '%https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804UC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827%';

UPDATE public.posts
SET content_html = replace(
  content_html,
  'https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC',
  'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
)
WHERE content_html LIKE '%https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC%';

UPDATE public.posts
SET content_html = replace(
  content_html,
  'https://deriv.com/signup/?utm_source=botvio&utm_medium=affiliate&utm_campaign=CU23827',
  'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
)
WHERE content_html LIKE '%https://deriv.com/signup/?utm_source=botvio&utm_medium=affiliate&utm_campaign=CU23827%';

UPDATE public.posts
SET content_html = replace(
  content_html,
  'https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/',
  'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
)
WHERE content_html LIKE '%https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/%';

UPDATE public.posts
SET content_html = replace(
  content_html,
  'https://track.deriv.com/_h8vu88Fmx9LFzOFRkVlag/1/3/',
  'https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/'
)
WHERE content_html LIKE '%https://track.deriv.com/_h8vu88Fmx9LFzOFRkVlag/1/3/%';