"use client";

import React, { useState, useRef } from 'react';
import videos from '@/data/videos.json';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dialog } from 'primereact/dialog';
import Image from 'next/image';

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

  const handleHover = (event: React.SyntheticEvent, video: YouTubeVideo) => {
    setHoverVideo(video);
    overlayRef.current?.show(event, event.currentTarget);
  };

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1 p-2 component-transparent w-full">
        {videos.map((video, idx) => {
          return (
            <div key={idx} className="cursor-pointer" onClick={() => setSelectedVideo(video)} onMouseEnter={(e) => handleHover(e, video)}>
              <Image
                src={video.thumbnail}
                alt={`Video#${video.videoId}`}
                width="128"
                height="128"
                className="transition hover:scale-105"
              />
              <small className="block w-[111px] truncate overflow-hidden whitespace-nowrap">{video.title}</small>
            </div>
          );
        })}

        <OverlayPanel
          ref={overlayRef} showCloseIcon>
          {hoverVideo && (
            <div className="max-w-[320px] max-h-[300px]">
              <strong>{hoverVideo?.title}</strong>
              <iframe
              width="320"
              height="180"
              src={`https://www.youtube.com/embed/${hoverVideo.videoId}?autoplay=1&mute=1`}
              title="Preview"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            </div>
          )}
        </OverlayPanel>

        <Dialog
          visible={!!selectedVideo}
          style={{ width: '90vw', maxWidth: '800px' }}
          header={`Now Playing: ${selectedVideo?.title}`}
          modal
          dismissableMask
          onHide={() => setSelectedVideo(null)}
        >
          <small>{selectedVideo?.description}</small>
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