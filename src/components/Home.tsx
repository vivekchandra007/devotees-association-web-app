"use client";

import React, { useState, useEffect } from 'react';
import videosData from '@/data/videos.json';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

type VideoItem = {
  id: string;
  videoId: string,
  kind?: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
};

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [spotlightVideo, setSpotlightVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    const data = videosData as VideoItem[];
    const random = data[Math.floor(Math.random() * data.length)];
    setSpotlightVideo(random);
  }, []);

  return (
    <div className="p-2">
      {/* Spotlight Section */}
      {spotlightVideo && (
        <div
          className="mb-6 p-4 bg-primary/10 border border-primary rounded-xl shadow-md cursor-pointer"
          onClick={() => setSelectedVideo(spotlightVideo)}>
          <h2 className="text-lg font-semibold mb-2 text-primary">🎯 Spotlight Video, especially for You</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <iframe
              src={`https://www.youtube.com/embed/${spotlightVideo.videoId}?autoplay=1&mute=1&controls=0`}
              width="300"
              height="170"
              allow="autoplay"
              className="rounded-lg"
            />
            <div>
              <h3 title={spotlightVideo.title} className="text-lg font-bold line-clamp-2 overflow-hidden text-ellipsis">
                {spotlightVideo.title}
              </h3>
              <small title={spotlightVideo.description} className="line-clamp-2 overflow-hidden text-ellipsis">
                {spotlightVideo.description}
              </small>
              <br />
              <Button
                label="Play Now"
                icon="pi pi-play"
                onClick={() => setSelectedVideo(spotlightVideo)}
                className="mt-2"
                severity="warning"
              />
            </div>
          </div>
        </div>
      )}

      {/* Dialog Player */}

      {
        selectedVideo &&
        <Dialog
          visible={!!selectedVideo}
          style={{ width: '90vw', maxWidth: '800px' }}
          onHide={() => setSelectedVideo(null)}
          header={selectedVideo?.title}
          dismissableMask
          className="w-[90vw] max-w-3xl"
        >
          {selectedVideo && (
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              frameBorder="0"
              allowFullScreen
            />
          )}
        </Dialog>
      }
    </div>
  );
}