CREATE POLICY "Owners and admins can read their brief PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'brief-pdfs'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.project_briefs pb
      WHERE pb.pdf_path = storage.objects.name
        AND pb.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can insert brief PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brief-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brief PDFs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'brief-pdfs' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'brief-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brief PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brief-pdfs' AND public.has_role(auth.uid(), 'admin'));