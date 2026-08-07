'use client';

import { ExternalLink, RefreshCw, Send, Unlink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../lib/api';
import {
  createTelegramLink,
  disconnectTelegram,
  getTelegramStatus,
} from '../dashboardApi';
import type { TelegramStatus } from '../types';

type TelegramSettingsProps = {
  isDemoMode: boolean;
  onUnauthorized: () => void;
};

export function TelegramSettings({ isDemoMode, onUnauthorized }: TelegramSettingsProps) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemoMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    if (isDemoMode) return;
    setIsLoading(true);
    setError('');

    try {
      setStatus(await getTelegramStatus());
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setError(requestError instanceof ApiError ? requestError.message : 'Could not load Telegram settings.');
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, onUnauthorized]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadStatus]);

  const handleConnect = async () => {
    setIsSaving(true);
    setError('');
    try {
      const connection = await createTelegramLink();
      window.location.assign(connection.link);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setError(requestError instanceof ApiError ? requestError.message : 'Could not create a Telegram connection link.');
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSaving(true);
    setError('');
    try {
      await disconnectTelegram();
      setStatus((current) => current ? {
        ...current,
        connected: false,
        username: null,
        linkedAt: null,
      } : current);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setError(requestError instanceof ApiError ? requestError.message : 'Could not disconnect Telegram.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isDemoMode) {
    return (
      <section className="border-2 border-black bg-[#f2f0e8] p-5" aria-labelledby="telegram-settings-title">
        <h4 id="telegram-settings-title" className="font-black text-[#11110f]">Telegram alerts</h4>
        <p className="mt-2 text-sm text-slate-700">Sign in to connect Telegram and receive incident and recovery alerts.</p>
      </section>
    );
  }

  return (
    <section className="border-2 border-black bg-[#f2f0e8] p-5" aria-labelledby="telegram-settings-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Send size={18} aria-hidden="true" />
            <h4 id="telegram-settings-title" className="font-black text-[#11110f]">Telegram alerts</h4>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">
            Get one alert when an endpoint is confirmed down and another when it recovers.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || isSaving}
          onClick={() => void loadStatus()}
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-slate-700" role="status">Loading Telegram status…</p>
      ) : status?.connected ? (
        <div className="mt-5 flex flex-col gap-4 border-2 border-black bg-[#b7ff3c] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-black">Connected</p>
            <p className="mt-1 text-sm text-slate-800">
              {status.username ? `@${status.username}` : 'Private Telegram chat'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2.5 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void handleDisconnect()}
          >
            <Unlink size={16} aria-hidden="true" />
            {isSaving ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#3155ff] px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving || !status?.configured}
            onClick={() => void handleConnect()}
          >
            <ExternalLink size={16} aria-hidden="true" />
            {isSaving ? 'Opening Telegram…' : 'Connect Telegram'}
          </button>
          {status && !status.configured && (
            <p className="mt-3 text-sm text-amber-800">Telegram is not configured on the PulseGuard server.</p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm font-bold text-red-700" role="alert">{error}</p>}
    </section>
  );
}
