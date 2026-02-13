-- Payments: Cada um vê seus próprios pagamentos, admin vê todos
CREATE POLICY "Ver próprios pagamentos"
  ON payments FOR SELECT
  USING (member_id = auth.uid() OR is_admin());

-- Payments: Membros podem criar pagamentos (enviar comprovantes)
CREATE POLICY "Membros podem criar pagamentos"
  ON payments FOR INSERT
  WITH CHECK (member_id = auth.uid());

-- Payments: Só admin pode confirmar/rejeitar
CREATE POLICY "Só admin pode atualizar pagamentos"
  ON payments FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
