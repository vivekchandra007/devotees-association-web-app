import React, { useState, useRef } from 'react';
import videos from '@/data/videos.json';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dialog } from 'primereact/dialog';

type YouTubeVideo = {
  id: string;
  videoId: string,
  kind?: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
};

export default function YouTubeMosaic() {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const overlayRef = useRef<OverlayPanel>(null);
  const [hoverVideo, setHoverVideo] = useState<YouTubeVideo | null>(null);

  const handleHover = (event: any, video: YouTubeVideo) => {
    setHoverVideo(video);
    overlayRef.current?.show(event, event.currentTarget);
  };

  return (
    <>
      <small><strong>Note:</strong>&nbsp;Click or Hover over on any thumbnail to take Holy Dip in this Sāgar of videos, which will inspire you to the soul.</small>
      <div className="grid grid-cols-12 gap-1 p-2 component-transparent w-full">
        {videos.map((video, idx) => {
          return (
            <div key={idx} className="cursor-pointer" onClick={() => setSelectedVideo(video)} onMouseEnter={(e) => handleHover(e, video)}>
              <img
                src={video.thumbnail}
                alt="Thumbnail"
                width="128px"
                height="128px"
                className="transition hover:scale-105"
              />
            </div>
          );
        })}

        <OverlayPanel ref={overlayRef}>
          {hoverVideo && (
            <iframe
              width="320"
              height="180"
              src={`https://www.youtube.com/embed/${hoverVideo.videoId}?autoplay=1&mute=1`}
              title="Preview"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
        </OverlayPanel>

        <Dialog
          visible={!!selectedVideo}
          style={{ width: '90vw', maxWidth: '800px' }}
          header="Now Playing"
          modal
          dismissableMask
          onHide={() => setSelectedVideo(null)}
        >
          {selectedVideo && (
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
        </Dialog>
      </div>
    </>
  );
}