'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeGithubUsername } from '@/lib/github-utils';

type GithubSettingsState = {
  username: string;
  avatarUrl: string;
  displayName: string;
  setUsername: (raw: string) => { ok: true } | { ok: false; error: string };
  clearUsername: () => void;
  setProfileMeta: (payload: { avatarUrl: string; displayName: string }) => void;
};

export const useGithubSettingsStore = create<GithubSettingsState>()(
  persist(
    (set) => ({
      username: '',
      avatarUrl: '',
      displayName: '',

      setUsername: (raw) => {
        const normalized = normalizeGithubUsername(raw);
        if (!normalized) {
          return {
            ok: false,
            error: 'Enter a valid GitHub username (letters, numbers, hyphens).',
          };
        }

        set({
          username: normalized,
          avatarUrl: '',
          displayName: normalized,
        });

        return { ok: true };
      },

      clearUsername: () =>
        set({
          username: '',
          avatarUrl: '',
          displayName: '',
        }),

      setProfileMeta: ({ avatarUrl, displayName }) =>
        set((state) => ({
          avatarUrl,
          displayName: displayName.trim() || state.username,
        })),
    }),
    {
      name: 'jnote-github-settings-v1',
      partialize: (state) => ({
        username: state.username,
        avatarUrl: state.avatarUrl,
        displayName: state.displayName,
      }),
    }
  )
);
