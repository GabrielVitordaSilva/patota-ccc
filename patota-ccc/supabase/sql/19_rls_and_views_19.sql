-- Fines: Cada um vê suas próprias multas, admin vê todas
CREATE POLICY "Ver próprias multas"
  ON fines FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Fines: Só admin pode criar multas
CREATE POLICY "Só admin pode criar multas"
  ON fines FOR INSERT
  WITH CHECK (is_admin());
