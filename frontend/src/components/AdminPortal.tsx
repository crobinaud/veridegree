'use client';

import { useState, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, VERIDEGREE_ABI } from '@/config/contract';
import { useIPFS } from '@/hooks/useIPFS';

export function AdminPortal() {
  const [file, setFile] = useState<File | null>(null);
  const [studentAddress, setStudentAddress] = useState('');
  const [studentName, setStudentName] = useState('');
  const [degreeName, setDegreeName] = useState('');

  const [statusText, setStatusText] = useState('');
  const [statusType, setStatusType] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { uploadFile } = useIPFS();
  const { data: hash, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !studentAddress || !studentName || !degreeName) return;

    try {
      setStatusType('loading');

      // 1. Storage PDF
      setStatusText('Storing PDF on IPFS...');
      const pdfCid = await uploadFile(file);

      // 2. Storage Metadata
      setStatusText('Securing Metadata...');
      const metadata = {
        name: `${degreeName} - ${studentName}`,
        description: `VeriDegree Soulbound Diploma for ${studentName}`,
        image: `ipfs://${pdfCid}`,
        attributes: [
          { trait_type: 'Student Name', value: studentName },
          { trait_type: 'Degree Name', value: degreeName },
        ],
      };

      const metaCid = await uploadFile(
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );

      // 3. Blockchain
      setStatusText('Awaiting Wallet Signature...');
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VERIDEGREE_ABI,
        functionName: 'mint',
        args: [studentAddress.trim() as `0x${string}`, `ipfs://${metaCid}`],
      });
      setStatusText('Confirming Mint Transaction...');
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'Minting process failed.';

      if (errorMsg.includes('AccessControl') || errorMsg.includes('missing role')) {
        errorMsg = 'Unauthorized: You do not have the MINTER_ROLE (Connect with Admin account).';
      } else if (err.shortMessage?.includes('User rejected') || errorMsg.includes('User denied')) {
        errorMsg = 'Transaction rejected by user.';
      }

      setStatusText(errorMsg);
      setStatusType('error');
    }
  };

  if (isSuccess && statusType !== 'success') {
    setStatusType('success');
    setStatusText(`Successfully Issued to ${studentName}`);
    setFile(null);
    setStudentAddress('');
    setStudentName('');
    setDegreeName(''); // reset
  }

  return (
    <section className="card" aria-labelledby="admin-portal-title">
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 id="admin-portal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            Administration Console
          </h2>
        </div>
        <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
          Full control over credential issuance & system management.
        </p>
      </div>

      <form onSubmit={handleMint} noValidate aria-busy={statusType === 'loading'}>
        <div className="form-group">
          <input
            id="student-address"
            type="text"
            className="input-field"
            placeholder=" "
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
            required
            aria-required="true"
            autoComplete="off"
            aria-label="Recipient wallet address"
          />
          <label htmlFor="student-address" className="floating-label">
            Recipient Wallet Address
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <input
              id="student-name"
              type="text"
              className="input-field"
              placeholder=" "
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              aria-required="true"
              aria-label="Full student name"
            />
            <label htmlFor="student-name" className="floating-label">
              Student Name
            </label>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <input
              id="degree-name"
              type="text"
              className="input-field"
              placeholder=" "
              value={degreeName}
              onChange={(e) => setDegreeName(e.target.value)}
              required
              aria-required="true"
              aria-label="Academic degree title"
            />
            <label htmlFor="degree-name" className="floating-label">
              Degree Name
            </label>
          </div>
        </div>

        <div
          className={`file-upload ${file ? 'active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Attach or replace diploma PDF"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <span className="animate-fade-in">📄 {file.name}</span>
          ) : (
            <span>+ Attach Diploma PDF</span>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={statusType === 'loading' || isConfirming}
        >
          {statusType === 'loading' || isConfirming ? 'Minting in progress...' : 'Issue Credential'}
        </button>
      </form>

      {statusType !== 'idle' && (
        <div style={{ textAlign: 'center' }} aria-live="polite">
          <div className="status-pill" role="status">
            <span
              className={`status-dot ${statusType === 'loading' || isConfirming ? 'pulsing' : statusType}`}
            />
            {statusText}
          </div>
        </div>
      )}
    </section>
  );
}
