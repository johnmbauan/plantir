-- Create the plant-images storage bucket (public, so URLs are accessible without auth)
insert into storage.buckets (id, name, public)
values ('plant-images', 'plant-images', true)
on conflict do nothing;

-- Authenticated users can upload to their own folder (<user_id>/*)
create policy "Users can upload own plant images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can overwrite their own files
create policy "Users can update own plant images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'plant-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can delete their own files
create policy "Users can delete own plant images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'plant-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read access so image URLs work without auth headers
create policy "Public read access for plant images"
on storage.objects for select
to public
using (bucket_id = 'plant-images');
