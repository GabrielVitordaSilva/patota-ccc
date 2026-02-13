export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          nome: string
          email: string
          ativo: boolean
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          ativo?: boolean
          criado_em?: string
        }
        Update: {
          nome?: string
          email?: string
          ativo?: boolean
          criado_em?: string
        }
      }

      admins: {
        Row: {
          member_id: string
        }
        Insert: {
          member_id: string
        }
        Update: {
          member_id?: string
        }
      }

      exemptions: {
        Row: {
          id: string
          member_id: string
          competencia: string
          motivo: "LESAO" | "TRABALHO"
          aprovado_por: string | null
        }
        Insert: {
          id?: string
          member_id: string
          competencia: string
          motivo: "LESAO" | "TRABALHO"
          aprovado_por?: string | null
        }
        Update: {
          member_id?: string
          competencia?: string
          motivo?: "LESAO" | "TRABALHO"
          aprovado_por?: string | null
        }
      }
    }

    Views: {}
    Functions: {
      gerar_mensalidades_mes: {
        Args: { mes_competencia: string }
        Returns: number
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
