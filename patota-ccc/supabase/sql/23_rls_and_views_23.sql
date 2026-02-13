-- Audit: Só admin pode ver logs
CREATE POLICY "Só admin pode ver logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- Audit: Sistema insere automaticamente (via triggers)
