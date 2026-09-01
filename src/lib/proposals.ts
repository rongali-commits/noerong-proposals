import { supabase } from '@/lib/supabase';
import type { Proposal, ProposalItem, ActivityEvent, Client } from '@/types/database';

export type ProposalWithClient = Proposal & {
  clients: Pick<Client, 'name' | 'company' | 'is_sample'> | null;
};

export type ProposalDetail = {
  proposal: Proposal;
  items: ProposalItem[];
  client: Pick<Client, 'name' | 'company' | 'email' | 'phone' | 'address'> | null;
  activity: ActivityEvent[];
};

export type ItemInput = {
  description: string;
  detail: string;
  quantity: number;
  rate: number;
  discount: number;
  sort_order: number;
};

export type ProposalInput = {
  client_id: string;
  title: string;
  currency: string;
  expiry_date: string | null;
  discount_amount: number;
  tax_rate: number;
  notes: string;
  terms: string;
  items: ItemInput[];
};

export async function fetchProposals(): Promise<ProposalWithClient[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*, clients(name, company, is_sample)')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchProposalDetail(id: string): Promise<ProposalDetail | null> {
  const [proposalRes, itemsRes, activityRes] = await Promise.all([
    supabase
      .from('proposals')
      .select('*, clients(name, company, email, phone, address)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('proposal_items')
      .select('*')
      .eq('proposal_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('activity_events')
      .select('*')
      .eq('proposal_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (proposalRes.error) throw proposalRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (activityRes.error) throw activityRes.error;

  if (!proposalRes.data) return null;

  const { clients, ...proposal } = proposalRes.data;
  return {
    proposal,
    items: itemsRes.data ?? [],
    client: clients,
    activity: activityRes.data ?? [],
  };
}

export async function createProposal(input: ProposalInput): Promise<Proposal> {
  const { data, error } = await supabase.rpc('create_proposal_with_items', {
    p_client_id: input.client_id,
    p_title: input.title,
    p_currency: input.currency,
    p_expiry_date: input.expiry_date,
    p_discount_amount: input.discount_amount,
    p_tax_rate: input.tax_rate,
    p_notes: input.notes,
    p_terms: input.terms,
    p_items: input.items,
  });

  if (error) throw error;
  return data as Proposal;
}

export async function updateProposal(proposalId: string, input: ProposalInput): Promise<Proposal> {
  const { data, error } = await supabase.rpc('update_proposal_with_items', {
    p_proposal_id: proposalId,
    p_client_id: input.client_id,
    p_title: input.title,
    p_currency: input.currency,
    p_expiry_date: input.expiry_date,
    p_discount_amount: input.discount_amount,
    p_tax_rate: input.tax_rate,
    p_notes: input.notes,
    p_terms: input.terms,
    p_items: input.items,
  });

  if (error) throw error;
  return data as Proposal;
}

export async function duplicateProposal(proposalId: string): Promise<Proposal> {
  const { data, error } = await supabase.rpc('duplicate_proposal', {
    p_proposal_id: proposalId,
  });

  if (error) throw error;
  return data as Proposal;
}
