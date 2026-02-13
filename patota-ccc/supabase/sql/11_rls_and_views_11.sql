-- Função para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE member_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
