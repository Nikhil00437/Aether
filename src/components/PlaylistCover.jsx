import React from 'react';
import { ListMusic } from 'lucide-react';

export const PlaylistCover = ({ playlist, size = 18, songs = [] }) => {
  const playlistSongs = (playlist.songIds || [])
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean);

  const trackCovers = playlistSongs.map(s => s.coverUrl).filter(Boolean);

  // If playlist has 4+ tracks and we have at least 4 cover images, render 2x2 collage
  if (playlistSongs.length >= 4 && trackCovers.length >= 4) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: '1px',
        borderRadius: size > 24 ? '8px' : '4px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        {trackCovers.slice(0, 4).map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ))}
      </div>
    );
  }

  // If we have at least one cover, render the first one
  if (trackCovers.length > 0) {
    return (
      <img
        src={trackCovers[0]}
        alt=""
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: size > 24 ? '8px' : '4px',
          objectFit: 'cover',
          flexShrink: 0
        }}
      />
    );
  }

  // Default fallback gradient
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: size > 24 ? '8px' : '4px',
      background: 'var(--accent-gradient)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: size > 24 ? 'var(--accent-glow)' : 'none'
    }}>
      <ListMusic size={size * 0.6} color="#fff" />
    </div>
  );
};

export default PlaylistCover;
