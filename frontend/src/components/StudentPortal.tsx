'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESS, VERIDEGREE_ABI } from '@/config/contract';
import { DiplomaMetadata } from '@/types';
import { useIPFS } from '@/hooks/useIPFS';

interface StudentPortalProps {
  userAddress: `0x${string}`;
}

export function StudentPortal({ userAddress }: StudentPortalProps) {
  const { getGatewayUrl } = useIPFS();
  const [metadataList, setMetadataList] = useState<DiplomaMetadata[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>(
    'loading'
  );

  const { data: totalSupply, isError: totalError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VERIDEGREE_ABI,
    functionName: 'totalSupply',
  });

  const totalSupplyNumber = Number(totalSupply || BigInt(0));
  const tokenIds = useMemo(
    () => Array.from({ length: totalSupplyNumber }, (_, i) => BigInt(i)),
    [totalSupplyNumber]
  );

  const { data: owners } = useReadContracts({
    contracts: tokenIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: VERIDEGREE_ABI,
      functionName: 'ownerOf',
      args: [id],
    })),
  });

  const userTokenIds = useMemo(() => {
    if (!owners) return [];
    return tokenIds.filter((_, index) => {
      const owner = owners[index]?.result as string | undefined;
      return owner?.toLowerCase() === userAddress.toLowerCase();
    });
  }, [owners, userAddress, tokenIds]);

  const { data: uris } = useReadContracts({
    contracts: userTokenIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: VERIDEGREE_ABI,
      functionName: 'tokenURI',
      args: [id],
    })),
    query: {
      enabled: userTokenIds.length > 0,
    },
  });

  const fetchAllMetadata = useCallback(
    async (
      urisData: readonly { result?: unknown; status: string }[],
      ids: bigint[],
      isSubscribed: () => boolean
    ) => {
      try {
        setStatus('loading');
        const loaded: DiplomaMetadata[] = [];
        for (let i = 0; i < urisData.length; i++) {
          const uriResult = urisData[i]?.result as string | undefined;
          if (!uriResult) continue;
          const gatewayUrl = getGatewayUrl(uriResult);
          const res = await fetch(gatewayUrl);
          if (!res.ok) continue;
          const data = await res.json();
          loaded.push({ ...data, tokenId: ids[i].toString() });
        }
        if (isSubscribed()) {
          setMetadataList(loaded);
          setStatus(loaded.length > 0 ? 'success' : 'empty');
        }
      } catch (e) {
        console.error(e);
        if (isSubscribed()) setStatus('error');
      }
    },
    [getGatewayUrl]
  );

  useEffect(() => {
    let isSubscribed = true;
    const checkSubscribed = () => isSubscribed;

    if (totalSupply === undefined)
      return () => {
        isSubscribed = false;
      };

    if (totalSupplyNumber === 0 || (owners && userTokenIds.length === 0)) {
      setStatus('empty');
    } else if (uris && uris.length > 0) {
      fetchAllMetadata(
        uris as readonly { result?: unknown; status: string }[],
        userTokenIds,
        checkSubscribed
      );
    }

    return () => {
      isSubscribed = false;
    };
  }, [totalSupply, owners, uris, userTokenIds, totalSupplyNumber, fetchAllMetadata]);

  if (totalError || status === 'error') {
    return (
      <article className="card" role="alert">
        <div className="status-pill">
          <span className="status-dot error" /> Synchronization failed
        </div>
      </article>
    );
  }

  if (status === 'loading') {
    return (
      <article className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="status-pill" role="status" aria-live="polite">
          <span className="status-dot pulsing" /> Verifying through IPFS...
        </div>
      </article>
    );
  }

  if (status === 'empty') {
    return (
      <article className="card locked-view animate-fade-in" style={{ animationDelay: '0s' }}>
        <div className="locked-icon" aria-hidden="true">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20"></path>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <h2>Portfolio Empty</h2>
        <p>No VeriDegree credentials detected for this wallet.</p>
      </article>
    );
  }

  return (
    <section className="card" aria-labelledby="student-portal-title">
      <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            marginBottom: '0.2rem',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <h2 id="student-portal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            Academic Portfolio
          </h2>
        </div>
        <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
          Overview of your secured academic credentials.
        </p>
      </div>

      <div className="diploma-list">
        {metadataList.map((metadata, i) => (
          <article
            key={i}
            className="compact-diploma animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {metadata.image && (
              <a
                href={getGatewayUrl(metadata.image)}
                target="_blank"
                rel="noreferrer"
                className="diploma-preview"
                title={`Open full certificate for ${metadata.name}`}
              >
                <iframe
                  src={`${getGatewayUrl(metadata.image)}#toolbar=0`}
                  title={`${metadata.name} preview`}
                  aria-hidden="true"
                />
              </a>
            )}

            <div className="diploma-info">
              <h3>{metadata.name}</h3>
              <p>{metadata.description}</p>
            </div>

            <div className="diploma-actions">
              {metadata.tokenId && (
                <span className="diploma-badge" aria-label={`Credential ID ${metadata.tokenId}`}>
                  ID: {metadata.tokenId}
                </span>
              )}
              {metadata.image && (
                <a
                  href={getGatewayUrl(metadata.image)}
                  target="_blank"
                  rel="noreferrer"
                  className="diploma-view-link"
                  title="View PDF Document"
                  aria-label={`View full PDF certificate for ${metadata.name}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
