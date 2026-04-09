'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, VERIDEGREE_ABI, MINTER_ROLE_HASH } from '@/config/contract';
import { AdminPortal } from '@/components/AdminPortal';
import { StudentPortal } from '@/components/StudentPortal';

/**
 * VeriDegree Home Page
 * Main entry point for the academic credential portal.
 * Handles role-based conditional rendering for Admin and Student views.
 */
export default function Home() {
  const { isConnected, address: userAddress } = useAccount();

  const { data: isMinter, isLoading: isMinterLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VERIDEGREE_ABI,
    functionName: 'hasRole',
    args: userAddress ? [MINTER_ROLE_HASH, userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  return (
    <main className="app-container">
      <header className="app-header animate-fade-in" style={{ animationDelay: '0s' }} role="banner">
        <div>
          <h1 className="app-title">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            VeriDegree
          </h1>
          <p className="app-subtitle">Secure Academic Portal</p>
        </div>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus || authenticationStatus === 'authenticated');
            const isCorrectChain = chain?.id === 1337;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: { opacity: 0, pointerEvents: 'none' },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="custom-connect-btn"
                        aria-label="Connect your cryptographical wallet"
                      >
                        <svg
                          width="18"
                          height="18"
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                        Connect Wallet
                      </button>
                    );
                  }
                  if (chain.unsupported || !isCorrectChain) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="custom-connect-btn error"
                        aria-label="Switch network to ID 1337"
                      >
                        ID: 1337 Required
                      </button>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="custom-connect-btn secondary"
                        aria-label={`Wallet connected: ${account.displayName}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        {account.displayName}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </header>

      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {!isConnected || !userAddress ? (
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
                <path d="M12 15V17M6 12V6M6 6H18M18 6V12M6 12H18M11 11V13M13 11V13" />
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Identity Required</h2>
            <p>Connect your decentralized wallet to access the academic network.</p>
          </article>
        ) : isMinterLoading ? (
          <div
            className="card"
            role="status"
            aria-live="polite"
            style={{ textAlign: 'center', padding: '3rem' }}
          >
            <div className="status-pill" style={{ display: 'inline-flex' }}>
              <span className="status-dot pulsing" /> Authorizing access...
            </div>
          </div>
        ) : isMinter ? (
          <AdminPortal />
        ) : (
          <StudentPortal userAddress={userAddress} />
        )}
      </div>
    </main>
  );
}
