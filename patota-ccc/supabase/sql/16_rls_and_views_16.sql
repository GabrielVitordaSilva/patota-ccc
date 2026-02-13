-- Attendance: Todos podem ver
CREATE POLICY "Todos podem ver presenças"
  ON event_attendance FOR SELECT
  USING (true);

-- Attendance: Só admin pode marcar presença
CREATE POLICY "Só admin pode marcar presença"
  ON event_attendance FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode atualizar presença"
  ON event_attendance FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Só admin pode deletar presença"
  ON event_attendance FOR DELETE
  USING (is_admin());
