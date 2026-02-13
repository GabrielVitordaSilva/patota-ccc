-- Índices para melhor performance
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_ativo ON members(ativo);

CREATE INDEX idx_events_data_hora ON events(data_hora DESC);
CREATE INDEX idx_events_tipo ON events(tipo);

CREATE INDEX idx_event_rsvp_event ON event_rsvp(event_id);
CREATE INDEX idx_event_rsvp_member ON event_rsvp(member_id);

CREATE INDEX idx_event_attendance_event ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_member ON event_attendance(member_id);

CREATE INDEX idx_dues_member ON dues(member_id);
CREATE INDEX idx_dues_competencia ON dues(competencia);
CREATE INDEX idx_dues_status ON dues(status);

CREATE INDEX idx_fines_member ON fines(member_id);
CREATE INDEX idx_fines_event ON fines(event_id);

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_cash_ledger_data ON cash_ledger(data_lancamento DESC);
CREATE INDEX idx_cash_ledger_tipo ON cash_ledger(tipo);

CREATE INDEX idx_points_member ON points_ledger(member_id);
CREATE INDEX idx_points_event ON points_ledger(event_id);
