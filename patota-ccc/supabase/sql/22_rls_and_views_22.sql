-- Points: Cada um vê seus próprios pontos, mas ranking é público
CREATE POLICY "Ver próprios pontos"
  ON points_ledger FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Points: Só admin pode lançar pontos
CREATE POLICY "Só admin pode lançar pontos"
  ON points_ledger FOR INSERT
  WITH CHECK (is_admin());
