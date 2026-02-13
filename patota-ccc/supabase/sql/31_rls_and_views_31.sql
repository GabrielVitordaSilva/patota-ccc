-- Política para upload: usuário só pode fazer upload no próprio folder
CREATE POLICY "Usuários podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para leitura: usuário vê seus próprios, admin vê todos
CREATE POLICY "Ver próprios comprovantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
);

-- Política para delete: usuário pode deletar os próprios, admin todos
CREATE POLICY "Deletar próprios comprovantes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comprovantes' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
);
