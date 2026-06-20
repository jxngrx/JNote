'use client';

import './bookmarks-dock-icon.css';

export default function BookmarksDockIcon() {
  return (
    <span className="bookmarks-dock-icon" aria-hidden>
      <span className="bookmarks-dock-icon-sheet bookmarks-dock-icon-sheet--back" />
      <span className="bookmarks-dock-icon-sheet bookmarks-dock-icon-sheet--mid" />
      <span className="bookmarks-dock-icon-sheet bookmarks-dock-icon-sheet--front" />
    </span>
  );
}
