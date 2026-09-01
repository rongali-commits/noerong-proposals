import { supabase } from '@/lib/supabase';
import type { ProposalStatus } from '@/types/database';

export type CurrencyTotal = {
  currency: string;
  total: number;
};

export type ExpiringProposal = {
  id: string;
  title: string;
  proposal_number: string;
  status: ProposalStatus;
  currency: string;
  total: number;
  expiry_date: string | null;
  client_name: string | null;
  is_sample: boolean;
};

export type RecentProposal = {
  id: string;
  title: string;
  proposal_number: string;
  status: ProposalStatus;
  currency: string;
  total: number;
  updated_at: string;
  client_name: string | null;
  is_sample: boolean;
};

export type RecentActivity = {
  id: string;
  event_type: string;
  created_at: string;
  proposal_title: string;
  proposal_id: string;
};

export type StatusCounts = {
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  expired: number;
};

export type DashboardData = {
  pipeline_by_currency: CurrencyTotal[];
  accepted_by_currency: CurrencyTotal[];
  acceptance_rate: number | null;
  status_counts: StatusCounts;
  active_clients: number;
  expiring_proposals: ExpiringProposal[];
  recent_proposals: RecentProposal[];
  recent_activity: RecentActivity[];
  has_sample_data: boolean;
};

export async function fetchDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabase.rpc('get_dashboard_data');
  if (error) throw error;
  return data as DashboardData;
}
