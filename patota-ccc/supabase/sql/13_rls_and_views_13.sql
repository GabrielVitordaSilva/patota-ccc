-- Admins: Todos podem ver quem são os admins
CREATE POLICY "Todos podem ver admins"
  ON admins FOR SELECT
  USING (true);

-- Admins: Ninguém pode modificar via app (configuração manual no banco)
