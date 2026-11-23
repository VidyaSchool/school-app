import useSWR, { type SWRConfiguration } from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch data")
    throw error
  }
  return res.json()
}

/**
 * A reusable SWR-based data fetching hook.
 * 
 * - On first load: fetches from API (shows loading state)
 * - On re-navigation: shows cached data instantly, revalidates in background
 * - Deduplicates concurrent requests to the same URL
 * - Automatically retries on error
 * 
 * @param url - The API endpoint to fetch
 * @param config - Optional SWR configuration overrides
 */
export function useSWRFetch<T = unknown>(
  url: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,     // Don't re-fetch when tab regains focus
      dedupingInterval: 30_000,      // Dedupe same requests within 30s
      errorRetryCount: 2,           // Retry failed requests twice
      ...config,
    }
  )

  return {
    data,
    error,
    isLoading,        // true only on first load (no cached data)
    isValidating,     // true when revalidating (has cached data)
    mutate,
  }
}
