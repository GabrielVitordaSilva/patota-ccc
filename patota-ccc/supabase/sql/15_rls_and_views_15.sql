-- RSVP: Todos podem ver
CREATE POLICY "Todos podem ver RSVPs"
  ON event_rsvp FOR SELECT
  USING (true);

-- RSVP: Cada um pode inserir/atualizar seu próprio RSVP
CREATE POLICY "Membros podem gerenciar seu RSVP"
  ON event_rsvp FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Membros podem atualizar seu RSVP"
  ON event_rsvp FOR UPDATE
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- RSVP: Pode deletar o próprio
CREATE POLICY "Membros podem deletar seu RSVP"
  ON event_rsvp FOR DELETE
  USING (member_id = auth.uid());
