import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export interface ServiceDataState<T> {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  error: string | null;
}

/**
 * Loads data from a service-layer function once on mount.
 *
 * `loader` must be a stable reference (e.g. `inventoryService.getMaterials`),
 * so it can safely be used as the effect dependency. State updates only happen
 * inside the promise callbacks, never synchronously within the effect.
 */
export function useServiceData<T>(loader: () => Promise<T>): ServiceDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loader()
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loader]);

  return { data, setData, loading, error };
}
