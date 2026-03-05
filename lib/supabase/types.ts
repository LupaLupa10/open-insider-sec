export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      filings: {
        Row: {
          filing_id: string;
          accession_no: string;
          issuer_cik: string;
          issuer_ticker: string | null;
          issuer_name: string;
          reporting_owner_cik: string;
          reporting_owner_name: string;
          filing_date: string;
          accepted_at: string | null;
          sec_url: string | null;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          filing_id: string;
          accession_no: string;
          issuer_cik: string;
          issuer_ticker?: string | null;
          issuer_name: string;
          reporting_owner_cik: string;
          reporting_owner_name: string;
          filing_date: string;
          accepted_at?: string | null;
          sec_url?: string | null;
          raw_payload?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["filings"]["Insert"]>;
      };
      form4_transactions: {
        Row: {
          id: string;
          filing_id: string;
          accession_no: string;
          issuer_cik: string;
          issuer_ticker: string | null;
          issuer_name: string;
          reporting_owner_cik: string;
          reporting_owner_name: string;
          reporting_owner_street1: string | null;
          reporting_owner_street2: string | null;
          reporting_owner_city: string | null;
          reporting_owner_state: string | null;
          reporting_owner_zip: string | null;
          reporting_owner_title: string | null;
          is_director: boolean;
          is_officer: boolean;
          is_ten_percent_owner: boolean;
          is_other: boolean;
          officer_title: string | null;
          security_title: string | null;
          transaction_date: string;
          filing_date: string;
          transaction_code: string;
          transaction_shares: string | null;
          transaction_price_per_share: string | null;
          acquired_disposed_code: string | null;
          shares_owned_following: string | null;
          ownership_type: string | null;
          form_type: string;
          sec_url: string | null;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          filing_id: string;
          accession_no: string;
          issuer_cik: string;
          issuer_ticker?: string | null;
          issuer_name: string;
          reporting_owner_cik: string;
          reporting_owner_name: string;
          reporting_owner_street1?: string | null;
          reporting_owner_street2?: string | null;
          reporting_owner_city?: string | null;
          reporting_owner_state?: string | null;
          reporting_owner_zip?: string | null;
          reporting_owner_title?: string | null;
          is_director?: boolean;
          is_officer?: boolean;
          is_ten_percent_owner?: boolean;
          is_other?: boolean;
          officer_title?: string | null;
          security_title?: string | null;
          transaction_date: string;
          filing_date: string;
          transaction_code: string;
          transaction_shares?: string | null;
          transaction_price_per_share?: string | null;
          acquired_disposed_code?: string | null;
          shares_owned_following?: string | null;
          ownership_type?: string | null;
          form_type?: string;
          sec_url?: string | null;
          raw_payload?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["form4_transactions"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
        };
        Update: {
          email?: string;
          display_name?: string | null;
        };
      };
      saved_filters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          filters: Json;
        };
        Update: {
          name?: string;
          filters?: Json;
        };
      };
    };
  };
};
