import { supabase } from "./supabase";

/**
 * Fetches a configuration value from the library_settings table in Supabase.
 * Falls back to local storage, and then to a default string.
 */
export async function getLibrarySetting(key: string, defaultValue: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('library_settings')
      .select('value')
      .eq('id', key)
      .maybeSingle();

    if (error) throw error;
    if (data?.value) {
      // Keep local storage updated
      if (typeof window !== 'undefined') {
        localStorage.setItem(`krishna_cached_${key}`, data.value);
      }
      return data.value;
    }
  } catch (err) {
    console.warn(`Failed to fetch setting "${key}" from Supabase. Trying local cache.`, err);
  }

  // Fallback to local storage cache
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`krishna_cached_${key}`) || localStorage.getItem(`krishna_${key}`);
    if (cached) return cached;
  }

  return defaultValue;
}
