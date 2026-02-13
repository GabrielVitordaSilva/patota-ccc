export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          email: string
          nome: string
          telefone: string | null
          ativo: boolean
          criado_em: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          telefone?: string | null
          ativo?: boolean
          criado_em?: string
          updated_at?: string
        }
        Update: {
          email?: string
          nome?: string
          telefone?: string | null
          ativo?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      admins: {
        Row: { id: string; member_id: string; criado_em: string }
        Insert: { id?: string; member_id: string; criado_em?: string }
        Update: { member_id?: string }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          tipo: 'JOGO' | 'INTERNO'
          data_hora: string
          local: string
          descricao: string | null
          criado_por: string | null
          criado_em: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['events']['Row']> & {
          tipo: 'JOGO' | 'INTERNO'
          data_hora: string
          local: string
        }
        Update: Partial<Database['public']['Tables']['events']['Row']>
        Relationships: []
      }
      event_rsvp: {
        Row: {
          id: string
          event_id: string
          member_id: string
          status: 'VOU' | 'NAO_VOU' | 'TALVEZ'
          convidados: number
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['event_rsvp']['Row']> & {
          event_id: string
          member_id: string
          status: 'VOU' | 'NAO_VOU' | 'TALVEZ'
        }
        Update: Partial<Database['public']['Tables']['event_rsvp']['Row']>
        Relationships: []
      }
      event_attendance: {
        Row: {
          id: string
          event_id: string
          member_id: string
          status: 'PRESENTE' | 'AUSENTE' | 'ATRASO' | 'JUSTIFICADO'
          marcado_por: string | null
          marcado_em: string
        }
        Insert: Partial<Database['public']['Tables']['event_attendance']['Row']> & {
          event_id: string
          member_id: string
          status: 'PRESENTE' | 'AUSENTE' | 'ATRASO' | 'JUSTIFICADO'
        }
        Update: Partial<Database['public']['Tables']['event_attendance']['Row']>
        Relationships: []
      }
      dues: {
        Row: {
          id: string
          member_id: string
          competencia: string
          vencimento: string
          valor: number
          status: 'PENDENTE' | 'PAGO' | 'ISENTO'
          criado_em: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['dues']['Row']> & {
          member_id: string
          competencia: string
          vencimento: string
          valor: number
        }
        Update: Partial<Database['public']['Tables']['dues']['Row']>
        Relationships: []
      }
      exemptions: {
        Row: { id: string; member_id: string; competencia: string; motivo: string | null; criado_por: string | null; criado_em: string }
        Insert: Partial<Database['public']['Tables']['exemptions']['Row']> & { member_id: string; competencia: string }
        Update: Partial<Database['public']['Tables']['exemptions']['Row']>
        Relationships: []
      }
      fines: {
        Row: {
          id: string
          member_id: string
          event_id: string | null
          tipo: 'ATRASO' | 'FALTA_CONFIRMADA' | 'CONVIDADO'
          valor: number
          observacao: string | null
          criado_por: string | null
          criado_em: string
        }
        Insert: Partial<Database['public']['Tables']['fines']['Row']> & { member_id: string; tipo: 'ATRASO' | 'FALTA_CONFIRMADA' | 'CONVIDADO'; valor: number }
        Update: Partial<Database['public']['Tables']['fines']['Row']>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          member_id: string
          due_id: string | null
          fine_id: string | null
          valor: number
          status: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO'
          comprovante_url: string | null
          criado_em: string
          confirmado_por: string | null
          confirmado_em: string | null
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & { member_id: string; valor: number; status?: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO' }
        Update: Partial<Database['public']['Tables']['payments']['Row']>
        Relationships: []
      }
      cash_ledger: {
        Row: {
          id: string
          tipo: 'ENTRADA' | 'SAIDA'
          categoria: string
          valor: number
          descricao: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          data_lancamento: string
          lancado_por: string | null
          criado_em: string
        }
        Insert: Partial<Database['public']['Tables']['cash_ledger']['Row']> & { tipo: 'ENTRADA' | 'SAIDA'; categoria: string; valor: number }
        Update: Partial<Database['public']['Tables']['cash_ledger']['Row']>
        Relationships: []
      }
      points_ledger: {
        Row: { id: string; member_id: string; event_id: string | null; pontos: number; motivo: string; criado_em: string }
        Insert: Partial<Database['public']['Tables']['points_ledger']['Row']> & { member_id: string; pontos: number; motivo: string }
        Update: Partial<Database['public']['Tables']['points_ledger']['Row']>
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; tabela: string; acao: string; registro_id: string; dados_antes: Json | null; dados_depois: Json | null; usuario_id: string | null; criado_em: string }
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & { tabela: string; acao: string; registro_id: string }
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>
        Relationships: []
      }
    }
    Views: {
      saldo_caixa: {
        Row: { total_entradas: number | null; total_saidas: number | null; saldo_atual: number | null }
      }
      resumo_caixa_mensal: {
        Row: { mes: string | null; entradas: number | null; saidas: number | null; saldo_mes: number | null }
      }
      ranking_geral: {
        Row: { member_id: string; nome: string; total_jogos: number; total_pontos: number }
      }
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      gerar_mensalidades_mes: { Args: { p_competencia: string; p_valor: number; p_vencimento: string }; Returns: Json }
      confirmar_pagamento: { Args: { p_payment_id: string; p_admin_id: string }; Returns: Json }
      marcar_presenca: { Args: { p_event_id: string; p_member_id: string; p_status: string; p_admin_id: string }; Returns: Json }
      adicionar_convidados: { Args: { p_event_id: string; p_member_id: string; p_quantidade: number }; Returns: Json }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
