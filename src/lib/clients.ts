import { supabase } from '@/lib/supabase';
import type { Client } from '@/types/database';

export type ClientInsert = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type ClientUpdate = Partial<ClientInsert> & {
  archived?: boolean;
};

function normalize(input: { name?: string; company?: string; email?: string; phone?: string; address?: string; notes?: string }): ClientInsert {
  return {
    name: (input.name ?? '').trim(),
    company: input.company?.trim() ?? '',
    email: input.email?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    address: input.address?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
  };
}

export async function fetchClients(archived: boolean): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('archived', archived)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createClient(input: ClientInsert): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(normalize(input))
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, input: ClientUpdate): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...normalize(input), archived: input.archived })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setClientArchived(id: string, archived: boolean): Promise<Client> {
  return updateClient(id, { archived });
}
