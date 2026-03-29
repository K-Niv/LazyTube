import React from 'react';

export default function Player({ video, isShort, isNotFound }) {
  if (isNotFound) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔍</div>
        <h2 className="empty-state__title">No videos found.</h2>
        <p className="empty-state__subtitle">
          We couldn't find any random videos matching those filters. Try changing the category, duration, or clearing your search query.
        </p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🎬</div>
        <h2 className="empty-state__title">Ready to explore?</h2>
        <p className="empty-state__subtitle">
          Pick your preferences above and hit the dice button to discover a random YouTube video!
        </p>
      </div>
    );
  }

  const videoId = video.videoId || video.id?.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="player animate-fadeIn">
      <div className={`player__wrapper ${isShort ? 'player__wrapper--shorts' : 'player__wrapper--video'}`}>
        <iframe
          className="player__iframe"
          src={embedUrl}
          title={video.title || 'YouTube Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {video.title && (
        <div className="player__info">
          <h3 className="player__title">{video.title}</h3>
          {video.channel && (
            <p className="player__channel">{video.channel}</p>
          )}
        </div>
      )}
    </div>
  );
}
