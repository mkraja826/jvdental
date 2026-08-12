update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','application/pdf',
      'application/zip','application/x-zip-compressed','application/dicom','application/octet-stream'
    ]::text[]
where id = 'patient-documents';

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4']::text[]
where id = 'public-content';

alter policy "patient documents object read" on storage.objects
  using (
    bucket_id = 'patient-documents'
    and (((storage.foldername(name))[1] = (select auth.uid())::text) or private.is_active_staff())
  );

alter policy "patient documents object upload" on storage.objects
  with check (
    bucket_id = 'patient-documents'
    and (((storage.foldername(name))[1] = (select auth.uid())::text) or private.is_active_staff())
    and lower(storage.extension(name)) = any(array['jpg','jpeg','png','webp','pdf','zip','dcm'])
  );

alter policy "content staff upload public content" on storage.objects
  with check (
    bucket_id = 'public-content'
    and private.has_staff_role(array['owner','admin','implantologist','doctor'])
    and lower(storage.extension(name)) = any(array['jpg','jpeg','png','webp','mp4'])
  );
