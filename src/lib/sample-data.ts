import { supabase } from '@/lib/supabase';

export async function loadSampleWorkspace(): Promise<void> {
  const { error } = await supabase.rpc('load_sample_workspace');
  if (error) throw error;
}

export async function removeSampleWorkspace(): Promise<void> {
  const { error } = await supabase.rpc('remove_sample_workspace');
  if (error) throw error;
}

export async function hasSampleData(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_sample_data');
  if (error) throw error;
  return data as boolean;
}
