import React, { useRef, useEffect, useState } from 'react';

interface VideoBackgroundProps {
  src: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoadAttempts, setVideoLoadAttempts] = useState(0);

  // Video loading and retry logic
  useEffect(() => {
    const loadVideo = async () => {
      if (videoRef.current && !videoLoaded && !videoError && videoLoadAttempts < 3) {
        try {
          setVideoLoadAttempts(prev => prev + 1);
          
          const video = videoRef.current;
          
          // Set up event handlers
          const handleLoadedData = () => {
            setVideoLoaded(true);
            setVideoError(false);
            video.style.opacity = '1';
          };

          const handleError = (e: any) => {

            setVideoError(true);
            video.style.display = 'none';
          };

          const handleCanPlay = () => {
          };

          video.addEventListener('loadeddata', handleLoadedData);
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('error', handleError);

          // Load the video
          video.load();

          // Cleanup listeners
          return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
          };
        } catch (error) {
          
          setVideoError(true);
        }
      }
    };

    const timer = setTimeout(loadVideo, 100);
    return () => clearTimeout(timer);
  }, [videoLoaded, videoError, videoLoadAttempts]);

  // Retry video loading after delays
  useEffect(() => {
    if (videoError && videoLoadAttempts < 3) {
      const retryTimer = setTimeout(() => {
        setVideoError(false);
      }, 2000 * videoLoadAttempts); // Progressive delay
      
      return () => clearTimeout(retryTimer);
    }
  }, [videoError, videoLoadAttempts]);

  return (
    <>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in-out'
        }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        src={src}
        poster=""
      />

      {/* Video Loading Indicator */}
      {!videoLoaded && !videoError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          Loading background...
        </div>
      )}

      {/* Video Overlay - Gradient for better text contrast */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          background: `linear-gradient(
            to top,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.6) 100%
          )`,
          pointerEvents: 'none'
        }}
      />
    </>
  );
};
