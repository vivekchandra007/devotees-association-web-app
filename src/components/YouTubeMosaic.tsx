"use client";

import React, { useState, useRef, useEffect } from 'react';
import videosData from '@/data/videos.json';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dialog } from 'primereact/dialog';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

type VideoItem = {
  id: string;
  videoId: string,
  kind?: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
};

export default function YouTubeMosaic() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [spotlightVideo, setSpotlightVideo] = useState<VideoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const overlayRef = useRef<OverlayPanel>(null);

  const [hoverVideo, setHoverVideo] = useState<VideoItem | null>(null);

  const handleHover = (event: React.SyntheticEvent, video: VideoItem) => {
    setHoverVideo(video);
    overlayRef.current?.show(event, event.currentTarget);
  };

  useEffect(() => {
    const data = videosData as VideoItem[];
    setVideos(data);
    setFilteredVideos(data);
    const random = data[Math.floor(Math.random() * data.length)];
    setSpotlightVideo(random);
  }, []);

  useEffect(() => {
    const filtered = videos.filter((v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVideos(filtered);
  }, [searchQuery, videos]);

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
                severity="danger"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative w-full md:w-1/2">
        <InputText
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full pr-10"
        />
        {searchQuery && (
          <Button
            onClick={() => setSearchQuery('')}
            icon="pi pi-times-circle"
            rounded
            text
            severity="contrast"
            tooltip="Clear Search"
            className="flex float-right bottom-[48px] text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          />
        )}
      </div>

      {/* Shorts Strip */}
      <div className="overflow-x-auto whitespace-nowrap flex gap-2 mb-6">
        {videos.filter(v => v.type === 'short' || v.kind?.includes("short") || v.title.includes("shorts") || v.description?.includes("shorts")).map((short) => (
          <Image
            key={short.id}
            src={short.thumbnail}
            alt={short.title}
            width={120}
            height={90}
            className="rounded-lg cursor-pointer"
            onClick={() => setSelectedVideo(short)}
          />
        ))}
      </div>

      {/* Mosaic Grid */}

      {filteredVideos.length === 0 &&
        <small>
          <span className="p-error">No videos found with above Search Query.</span>
          <br />
          Try <strong>Ashtami</strong>, <strong>Chaturdashi</strong>, <strong>Poornima</strong>, etc.
        </small>
      }
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1 w-full">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="relative cursor-pointer hover:scale-200 hover:z-2 transition"
            onMouseEnter={(e) => {
              overlayRef.current?.show(e, e.currentTarget);
              handleHover(e, video);
            }}
            onClick={() => setSelectedVideo(video)}
          >
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={100}
              height={60}
              className="rounded"
            />
          </div>
        ))}
      </div>

      {/* On Hover Overlay Player */}

      {
        hoverVideo &&
        <OverlayPanel ref={overlayRef} showCloseIcon>
          <div className="max-w-[300px] max-h-[300px]">
            <div className="grid grid-cols-12 mb-1">
              <span className="col-span-6 text-sm">Quick Preview</span>
              <div className="col-span-6 text-right">
                <Button
                  text label="Expand"
                  icon="pi pi-window-maximize" severity="secondary" aria-label="Expand"
                  size="small" iconPos="right" className="paddingless-button hover:underline"
                  onClick={() => setSelectedVideo(hoverVideo)}
                />
              </div>
            </div>
            <iframe
              src={`https://www.youtube.com/embed/${hoverVideo.videoId}?autoplay=1&mute=1`}
              width="300"
              height="170"
              allow="autoplay"
            />
            <span className="text-sm mt-2 font-semibold">{hoverVideo.title}</span>
          </div>
        </OverlayPanel>
      }

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