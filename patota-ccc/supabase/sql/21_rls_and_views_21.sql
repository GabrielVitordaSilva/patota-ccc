-- Cash Ledger: Todos podem ver (transparência total)
CREATE POLICY "Todos podem ver lançamentos do caixa"
  ON cash_ledger FOR SELECT
  USING (true);

-- Cash Ledger: Só admin pode lançar
CREATE POLICY "Só admin pode lançar no caixa"
  ON cash_ledger FOR INSERT
  WITH CHECK (is_admin());

-- Cash Ledger: Admin pode atualizar (correções)
CREATE POLICY "Só admin pode atualizar caixa"
  ON cash_ledger FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
