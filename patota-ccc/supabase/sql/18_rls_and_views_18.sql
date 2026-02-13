-- Exemptions: Cada um vê suas isenções, admin vê todas
CREATE POLICY "Ver próprias isenções"
  ON exemptions FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Exemptions: Só admin pode criar/gerenciar
CREATE POLICY "Só admin pode criar isenções"
  ON exemptions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode atualizar isenções"
  ON exemptions FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
