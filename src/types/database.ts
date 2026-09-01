export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export type EventType = 'created' | 'sent' | 'viewed' | 'commented' | 'accepted' | 'rejected' | 'expired';

export type Profile = {
  id: string;
  business_name: string;
  logo_url: string;
  brand_color: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  default_currency: string;
  default_tax_rate: number;
  default_terms: string;
  proposal_prefix: string;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  archived: boolean;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
};

export type Proposal = {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  status: ProposalStatus;
  proposal_number: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  total: number;
  notes: string;
  terms: string;
  expiry_date: string | null;
  public_token: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
};

export type ProposalItem = {
  id: string;
  proposal_id: string;
  description: string;
  detail: string;
  quantity: number;
  rate: number;
  discount: number;
  sort_order: number;
  created_at: string;
};

export type ProposalComment = {
  id: string;
  proposal_id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  proposal_id: string;
  user_id: string | null;
  event_type: EventType;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      clients: {
        Row: Client;
        Insert: Partial<Client>;
        Update: Partial<Client>;
      };
      proposals: {
        Row: Proposal;
        Insert: Partial<Proposal>;
        Update: Partial<Proposal>;
      };
      proposal_items: {
        Row: ProposalItem;
        Insert: Partial<ProposalItem>;
        Update: Partial<ProposalItem>;
      };
      proposal_comments: {
        Row: ProposalComment;
        Insert: Partial<ProposalComment>;
        Update: Partial<ProposalComment>;
      };
      activity_events: {
        Row: ActivityEvent;
        Insert: Partial<ActivityEvent>;
        Update: Partial<ActivityEvent>;
      };
    };
  };
};
