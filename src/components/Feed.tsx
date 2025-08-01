"use client";

import React, { useState, useEffect } from 'react';
import videosData from '@/data/videos.json';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import api from "@/lib/axios";
import {ProgressBar} from "primereact/progressbar";
import {formatDateTimeIntoReadableString} from "@/lib/conversions";
import {Prisma} from "@prisma/client";

type VideoItem = {
  id: string;
  videoId: string,
  kind?: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
};

type Message = Prisma.feed_messagesGetPayload<{
  include: {
    updated_by_ref_value: {
      select: {
        name: true,
      };
    }
    url: string
  };
}>;

export default function Feed() {
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [spotlightVideo, setSpotlightVideo] = useState<VideoItem | null>(null);
  const [postText, setPostText] = useState('');
  //const [postImage, setPostImage] = useState<File | null>(null);
  const [postMedia, setPostMedia] = useState<File | null>(null);
  const [postMediaPreview, setPostMediaPreview] = useState<string | null>(null);
  const [postIsAnonymous, setPostIsAnonymous] = useState(false);
  const [posts, setPosts] = useState([]);

  async function getFeedPosts() {
    try {
      setInProgress(true);
      const res = await api.get('/feed');
      if (res.data.success && res.data.messages && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
        setPosts(res.data.messages);
        // if (res.data.messages[0].media_file_id) {
        //   setTimeout(() => loadFile(res.data.messages[0].media_file_id), 2000);
        // }
      }
    } catch (err) {
      console.error('Failed to post message to our Feed:', err);
    } finally {
      setInProgress(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPostMedia(file);
    if (file) {
      const preview = URL.createObjectURL(file);
      setPostMediaPreview(preview);
    }
  };

  async function postPost() {
    if (!postText && !postMedia) return alert('Message or media required');
    try {
      const formData = new FormData();
      formData.append('text', postText);
      if (postMedia) formData.append('media', postMedia);
      setInProgress(true);
      const res = await api.post('/feed', formData);
      if (res.data.success) {
        alert("Success");
        setPostText('');
        setPostMedia(null);
        setPostMediaPreview(null);
        getFeedPosts();
      }
    } catch (err) {
      console.error('Failed to post message to our Feed:', err);
    } finally {
      setInProgress(false);
    }
  }

  async function loadFile(fileId: string) {
    try {
      setInProgress(true);
      const res: {data : { success: boolean, url: string}} = await api.get(`/feed?fileId=${fileId}`);
      if (res.data.success && res.data.url) {
        posts.forEach((post: Message) => {
          if (post.media_file_id && post.media_file_id === fileId) {
            post.url = res.data.url as never;
          }
        });
      }
    } catch (err) {
      console.error('Failed to post message to our Feed:', err);
    } finally {
      setInProgress(false);
    }
  }

  useEffect(() => {
    const data = videosData as VideoItem[];
    const random = data[Math.floor(Math.random() * data.length)];
    setSpotlightVideo(random);
    getFeedPosts();
  }, []);

  return (
      <div className="min-h-screen max-w-screen">
        <div className='p-3'>
          <strong className="text-general">Hare Krishna!</strong>
          {
            inProgress ?
                <ProgressBar mode="indeterminate" style={{height: '2px'}} className="pt-1"></ProgressBar>
                :
                <hr/>
          }
        </div>
        <div className="m-2 sm:m-6">
          <div className="p-4 bg-primary/10 border border-primary rounded-xl shadow-md cursor-pointer">
            <textarea
                placeholder="What's on your mind, dear Devotee?"
                className="w-full p-2 rounded border focus:outline-none"
                rows={3}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
            />
            <br/><br/>
            <input className="text-wrap" type="file" accept="image/*,video/*,image/gif"
                   onChange={handleFileChange}/>
            {postMediaPreview && (
                <div className="rounded overflow-hidden">
                  {postMedia?.type.startsWith('video') ? (
                      <video
                          src={postMediaPreview}
                          controls
                          playsInline
                          muted
                          autoPlay
                          preload="metadata"
                          className="rounded-md max-w-[80vw] max-h-64"
                      ></video>
                  ) : (
                      <img src={postMediaPreview} className="rounded-md max-w-[80vw] max-h-64 object-contain"
                           alt={postText}/>
                  )}
                </div>
            )}
            <br/><br/>
            <div className="grid grid-cols-12">
              <label className="col-span-9 sm:col-span-11 flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={postIsAnonymous}
                    onChange={() => setPostIsAnonymous(!postIsAnonymous)}
                />
                <span className="text-sm">Post Anonymously</span>
              </label>
              <Button
                  className="col-span-3 sm:col-span-1"
                  disabled={inProgress || !postText}
                  onClick={() => postPost()}
              >
                {inProgress ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>

          {/* Spotlight Section */}
          {spotlightVideo && (
              <div
                  className="my-6 p-4 border border-primary rounded-xl shadow-md cursor-pointer"
                  onClick={() => setSelectedVideo(spotlightVideo)}>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <iframe
                      src={`https://www.youtube.com/embed/${spotlightVideo.videoId}?autoplay=1&mute=1&controls=0`}
                      width="300"
                      height="170"
                      allow="autoplay"
                      className="rounded-lg"
                  />
                  <div>
                    <h3 title={spotlightVideo.title}
                        className="text-lg font-bold line-clamp-2 overflow-hidden text-ellipsis">
                      {spotlightVideo.title}
                    </h3>
                    <small title={spotlightVideo.description} className="line-clamp-2 overflow-hidden text-ellipsis">
                      {spotlightVideo.description}
                    </small>
                    <br/>
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

          {
              posts && Array.isArray(posts) && posts.length > 0 &&
              <div className="space-y-4">
                {posts.map((post: Message) => (
                    <div key={post.id} className="bg-white p-4 rounded-2xl shadow">
                      <div className="text-sm text-gray-500 mb-1">
                        🙏 {post.updated_by_ref_value?.name || 'Devotee'} • {formatDateTimeIntoReadableString(new Date(post.updated_at!))}
                      </div>
                      <div className="text-lg mb-2 whitespace-pre-wrap">{post.text}</div>
                      {
                        post.media_type && post.url ? (
                            post.media_type.startsWith('video') ? (
                                    <video
                                        src={post.url}
                                        controls
                                        playsInline
                                        muted
                                        autoPlay
                                        preload="metadata"
                                        className="rounded-md shadow-md max-w-[80vw] max-h-64"
                                    ></video>
                                )
                                : (
                                    <img
                                        src={post.url}
                                        className="rounded-md shadow-md max-w-[80vw] max-h-64 object-contain"
                                        alt={post.text!}
                                    />
                                )
                        ) : (
                            <button
                                className="bg-emerald-600 text-white px-4 py-1 rounded hover:bg-emerald-700"
                                disabled={inProgress}
                                onClick={() => loadFile(post.media_file_id!)}
                            >
                              {inProgress ? 'Loading...' : 'Load Media'}
                            </button>
                        )
                      }
                      {/*<div className="flex items-center gap-4 mt-3 text-gray-600 text-sm">
                        ❤️ {post.likes} 💬 {post.comments} 🔄 Share
                      </div>*/}
                    </div>
                ))}
              </div>
          }

          {/* Dialog Player */}
          {
              selectedVideo &&
              <Dialog
                  visible={!!selectedVideo}
                  style={{width: '90vw', maxWidth: '800px'}}
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
      </div>
  );
}