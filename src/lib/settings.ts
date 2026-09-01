import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export type ProfileInput = {
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
};

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase.rpc('update_profile', {
    p_business_name: input.business_name,
    p_logo_url: input.logo_url,
    p_brand_color: input.brand_color,
    p_contact_email: input.contact_email,
    p_contact_phone: input.contact_phone,
    p_address: input.address,
    p_default_currency: input.default_currency,
    p_default_tax_rate: input.default_tax_rate,
    p_default_terms: input.default_terms,
    p_proposal_prefix: input.proposal_prefix,
  });

  if (error) throw error;
  return data as Profile;
}
