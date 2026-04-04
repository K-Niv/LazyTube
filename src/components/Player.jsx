import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';

export default function Player({ video, isShort, isNotFound, onEnd, showAutoRollCountdown, autoRollCountdownValue }) {
  const playerRef = useRef(null);

  if (isNotFound) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="empty-state__icon"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🔍
        </motion.div>
        <h2 className="empty-state__title">No videos found</h2>
        <p className="empty-state__subtitle">
          We couldn't find any videos matching those filters. Try changing the category, duration, or clearing your search query.
        </p>
      </motion.div>
    );
  }

  if (!video) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="empty-state__icon"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎬
        </motion.div>
        <h2 className="empty-state__title">Ready to explore?</h2>
        <p className="empty-state__subtitle">
          Pick your preferences and hit the dice button to discover a random YouTube video!
        </p>
      </motion.div>
    );
  }

  const videoId = video.videoId || video.id?.videoId;

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0,
      modestbranding: 1
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={videoId}
        className="player"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className={`player__wrapper ${isShort ? 'player__wrapper--shorts' : 'player__wrapper--video'}`}>
          <YouTube
            videoId={videoId}
            opts={opts}
            className="player__iframe"
            onEnd={onEnd}
            onReady={(e) => { playerRef.current = e.target; }}
          />

          {/* Auto-Roll Countdown Overlay */}
          <AnimatePresence>
            {showAutoRollCountdown && (
              <motion.div
                className="player__autoroll-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="player__autoroll-circle"
                  key={autoRollCountdownValue}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="player__autoroll-number">{autoRollCountdownValue}</span>
                </motion.div>
                <div className="player__autoroll-text">Playing next video in {autoRollCountdownValue}...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {video.title && (
          <motion.div
            className="player__info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h3 className="player__title">{video.title}</h3>
            {video.channel && (
              <p className="player__channel">{video.channel}</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
