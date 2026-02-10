-- Allow authenticated users to DELETE their own files in the 'memories' bucket
create policy "Users can delete own files 1ih_0"
on storage.objects for delete
to authenticated
using ( bucket_id = 'memories' and auth.uid() = owner );
