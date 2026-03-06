CREATE POLICY "Guests can upload to guest folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'charts' 
  AND (storage.foldername(name))[1] = 'guest'
);