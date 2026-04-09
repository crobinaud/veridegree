import { useState, useCallback } from 'react';

const IPFS_ADD_API = 'http://127.0.0.1:5001/api/v0/add?stream-channels=true';
const IPFS_GATEWAY = 'http://127.0.0.1:8080/ipfs/';

export function useIPFS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File | Blob): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(IPFS_ADD_API, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('IPFS storage failed');
      const data = await res.json();
      return data.Hash;
    } catch (err: any) {
      const msg = 'Could not reach IPFS API (CORS issue or daemon offline).';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getGatewayUrl = useCallback((uri?: string) => {
    if (!uri) return '';
    return uri.replace('ipfs://', IPFS_GATEWAY);
  }, []);

  return { uploadFile, getGatewayUrl, loading, error };
}
