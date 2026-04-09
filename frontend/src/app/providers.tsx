'use client';

import * as React from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { foundry } from 'wagmi/chains';
import { type Chain } from 'viem';

export const besuQBFT = {
  id: 1337,
  name: 'Besu QBFT',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BESU_RPC_URL || 'http://127.0.0.1:8546'] },
  },
} as const satisfies Chain;

import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  {
    appName: 'VeriDegree',
    projectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0123456789abcdef0123456789abcdef',
  }
);

const config = createConfig({
  connectors,
  chains: [besuQBFT],
  transports: {
    [besuQBFT.id]: http(process.env.NEXT_PUBLIC_BESU_RPC_URL || 'http://127.0.0.1:8545'),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#a855f7',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
