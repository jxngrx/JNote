'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { GithubIcon } from '@/components/github-icon';
import {
  normalizeGithubUsername,
  type GithubProfilePayload,
} from '@/lib/github-utils';
import { useGithubSettingsStore } from '@/lib/github-settings-store';

export default function GithubSettingsPanel() {
  const username = useGithubSettingsStore((s) => s.username);
  const avatarUrl = useGithubSettingsStore((s) => s.avatarUrl);
  const displayName = useGithubSettingsStore((s) => s.displayName);
  const setUsername = useGithubSettingsStore((s) => s.setUsername);
  const clearUsername = useGithubSettingsStore((s) => s.clearUsername);
  const setProfileMeta = useGithubSettingsStore((s) => s.setProfileMeta);

  const [draft, setDraft] = useState(username);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GithubProfilePayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraft(username);
  }, [username]);

  const handleSave = async () => {
    const result = setUsername(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const normalized = normalizeGithubUsername(draft);
      if (!normalized) return;

      const response = await fetch(
        `/api/github?username=${encodeURIComponent(normalized)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'Could not verify GitHub user.');
        clearUsername();
        return;
      }

      const profile = payload as GithubProfilePayload;
      setPreview(profile);
      setProfileMeta({
        avatarUrl: profile.avatarUrl,
        displayName: profile.name,
      });
    } catch {
      setError('Network error while verifying GitHub user.');
      clearUsername();
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    clearUsername();
    setDraft('');
    setPreview(null);
    setError(null);
  };

  const activeProfile = preview ?? (username ? { username, avatarUrl, name: displayName } : null);

  return (
    <div className="widgets-settings-panel">
      <div className="widgets-setting-card">
        <div className="widgets-setting-card-head">
          <span className="widgets-setting-card-icon widgets-setting-card-icon--green">
            <GithubIcon size={16} />
          </span>
          <div>
            <h3 className="widgets-setting-card-title">GitHub profile</h3>
            <p className="widgets-setting-card-desc">
              Add your username to show an avatar tab in the dock with your contribution
              chart.
            </p>
          </div>
        </div>

        <div className="widgets-setting-row">
          <label className="widgets-setting-label" htmlFor="github-username">
            Username
          </label>
          <div className="github-settings-input-row">
            <input
              id="github-username"
              className="widgets-setting-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="jxngrx"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              type="button"
              className="widgets-setting-btn"
              onClick={() => void handleSave()}
              disabled={!draft.trim() || loading}
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {error ? <p className="widgets-setting-error">{error}</p> : null}

        {activeProfile?.username ? (
          <div className="github-settings-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="github-settings-preview-avatar"
              src={
                activeProfile.avatarUrl ||
                `https://github.com/${activeProfile.username}.png?size=80`
              }
              alt=""
            />
            <div className="github-settings-preview-copy">
              <p className="github-settings-preview-name">
                {activeProfile.name || activeProfile.username}
              </p>
              <p className="github-settings-preview-handle">@{activeProfile.username}</p>
              <p className="github-settings-preview-hint">
                Dock tab appears after Settings. Hover or click to open your chart.
              </p>
            </div>
            <button
              type="button"
              className="github-settings-clear-btn"
              onClick={handleClear}
              aria-label="Remove GitHub profile"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
