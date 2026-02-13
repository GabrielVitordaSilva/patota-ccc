-- Events: Todos podem ver eventos
CREATE POLICY "Todos podem ver eventos"
  ON events FOR SELECT
  USING (true);

-- Events: Só admin pode criar
CREATE POLICY "Só admin pode criar eventos"
  ON events FOR INSERT
  WITH CHECK (is_admin());

-- Events: Só admin pode atualizar
CREATE POLICY "Só admin pode atualizar eventos"
  ON events FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Events: Só admin pode deletar
CREATE POLICY "Só admin pode deletar eventos"
  ON events FOR DELETE
  USING (is_admin());
