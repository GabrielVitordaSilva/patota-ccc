-- Members: Todos podem ler membros ativos
CREATE POLICY "Todos podem ver membros ativos"
  ON members FOR SELECT
  USING (ativo = true);

-- Members: Só admin pode inserir
CREATE POLICY "Só admin pode criar membros"
  ON members FOR INSERT
  WITH CHECK (is_admin());

-- Members: Só admin pode atualizar
CREATE POLICY "Só admin pode atualizar membros"
  ON members FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Members: Ninguém pode deletar (usar soft delete com ativo=false)
