'use client';

import './github-dock-avatar.css';

type GithubDockAvatarProps = {
  username: string;
  avatarUrl?: string;
};

export default function GithubDockAvatar({
  username,
  avatarUrl,
}: GithubDockAvatarProps) {
  const src = avatarUrl || `https://github.com/${username}.png?size=64`;

  return (
    <span className="github-dock-avatar" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="github-dock-avatar-img" src={src} alt="" loading="lazy" />
      <span className="github-dock-avatar-ring" />
    </span>
  );
}
