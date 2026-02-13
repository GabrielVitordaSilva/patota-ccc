export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          nome: string
          email: string
          ativo: boolean
          created_at?: string | null
        }
        Insert: {
          id?: string
          nome: string
          email: string
          ativo?: boolean
          created_at?: string | null
        }
        Update: {
          nome?: string
          email?: string
          ativo?: boolean
          created_at?: string | null
        }
      }

      exemptions: {
        Row: {
          id: string
          member_id: string
          competencia: string
          motivo: "LESAO" | "TRABALHO"
          aprovado_por?: string | null
          created_at?: string | null
        }
        Insert: {
          id?: string
          member_id: string
          competencia: string
          motivo: "LESAO" | "TRABALHO"
          aprovado_por?: string | null
          created_at?: string | null
        }
        Update: {
          member_id?: string
          competencia?: string
          motivo?: "LESAO" | "TRABALHO"
          aprovado_por?: string | null
          created_at?: string | null
        }
      }
    }

    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
