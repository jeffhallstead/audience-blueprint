drop policy if exists "Users can read their own reports" on storage.objects;
drop policy if exists "Users can upload their own reports" on storage.objects;
drop policy if exists "Users can delete their own reports" on storage.objects;

create policy "Users can read their own reports"
on storage.objects for select to authenticated
using (bucket_id = 'report-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own reports"
on storage.objects for insert to authenticated
with check (bucket_id = 'report-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own reports"
on storage.objects for delete to authenticated
using (bucket_id = 'report-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);