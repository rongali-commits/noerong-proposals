import { supabase } from '@/lib/supabase';

export type PublicBusiness = {
  name: string;
  logo_url: string;
  brand_color: string;
  contact_email: string;
  contact_phone: string;
  address: string;
};

export type PublicClient = {
  name: string;
  company: string;
} | null;

export type PublicProposal = {
  proposal_number: string;
  title: string;
  status: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  total: number;
  notes: string;
  terms: string;
  expiry_date: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
};

export type PublicItem = {
  description: string;
  detail: string;
  quantity: number;
  rate: number;
  discount: number;
  sort_order: number;
};

export type PublicComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type PublicProposalData = {
  business: PublicBusiness;
  client: PublicClient;
  proposal: PublicProposal;
  items: PublicItem[];
  comments: PublicComment[];
};

function getEdgeFunctionUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/public-proposal`;
}

export async function fetchPublicProposal(token: string): Promise<PublicProposalData | null> {
  const url = `${getEdgeFunctionUrl()}/proposal/${token}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Could not load proposal');

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data as PublicProposalData;
}

export async function submitPublicComment(
  token: string,
  authorName: string,
  body: string,
): Promise<PublicComment> {
  const url = `${getEdgeFunctionUrl()}/proposal/${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'comment', author_name: authorName, body }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Could not add comment');
  }
  return data as PublicComment;
}

export async function acceptPublicProposal(
  token: string,
  clientName: string,
  authorized: boolean,
): Promise<{ status: string; accepted_at: string }> {
  const url = `${getEdgeFunctionUrl()}/proposal/${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'accept', client_name: clientName, authorized }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Could not accept proposal');
  }
  return data;
}

export async function declinePublicProposal(
  token: string,
  clientName: string,
  reason: string,
): Promise<{ status: string; rejected_at: string }> {
  const url = `${getEdgeFunctionUrl()}/proposal/${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'decline', client_name: clientName, reason }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Could not decline proposal');
  }
  return data;
}

export async function prepareProposal(proposalId: string): Promise<{ public_token: string }> {
  const { data, error } = await supabase.rpc('prepare_proposal', {
    p_proposal_id: proposalId,
  });

  if (error) throw error;
  return data as { public_token: string };
}
