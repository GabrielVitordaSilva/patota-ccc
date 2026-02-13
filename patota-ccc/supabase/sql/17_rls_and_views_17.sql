-- Dues: Cada um vê suas próprias mensalidades, admin vê todas
CREATE POLICY "Ver próprias mensalidades"
  ON dues FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Dues: Só admin pode criar/atualizar
CREATE POLICY "Só admin pode criar mensalidades"
  ON dues FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode atualizar mensalidades"
  ON dues FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
