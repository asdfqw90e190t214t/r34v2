import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { PostDTO } from '../api/PostDTO';
import { MainContext } from './main';
import { useInView } from 'react-intersection-observer';

export function Post(post: PostDTO) {
  const postType = post.file_url.endsWith('.mp4') ? 'video' : 'image';
  if (postType === 'image') {
    return <Image {...post} />;
  } else {
    return <Video {...post} />;
  }
}

function Image(post: PostDTO) {
  const { setCurrentFsPost, postsRef } = useContext(MainContext);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [lastMove, setLastMove] = useState<number>(Date.now());
  const [hideControls, setHideControls] = useState<boolean>(false);

  const timeout = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    clearTimeout(timeout.current);

    timeout.current = setTimeout(() => {
      setHideControls(true);
    }, 2000);

    return () => clearTimeout(timeout.current);
  }, [lastMove]);

  return (
    <div className="post image" ref={imageContainerRef}>
      <div
        className="image_container"
        onMouseMove={() => {
          setHideControls(false);
          setLastMove(Date.now());
        }}
      >
        <img
          id={`post_${post.id}`}
          className="post_img"
          src={post.file_url}
          onClick={() => {
            setCurrentFsPost(post.id);
          }}
        />
        <div
          className={`image_fullscreen${hideControls ? ' hidden' : ' visible'}`}
          onClick={() => {
            setLastMove(Date.now());
            setHideControls(false);

            if (document.fullscreenElement === postsRef.current) {
              document.exitFullscreen();
              setCurrentFsPost(-1);
            } else {
              postsRef.current?.focus();
              postsRef.current?.requestFullscreen().finally(() => {
                setCurrentFsPost(post.id);
              });
            }
          }}
        />
      </div>
      <Tags post={post} />
    </div>
  );
}

function Video(post: PostDTO) {
  const { currentFsPost, setCurrentFsPost, postsRef, looping } = useContext(MainContext);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [volume, setVolume] = useState<number>(0.05);
  const [lastMove, setLastMove] = useState<number>(Date.now());
  const [playing, setPlaying] = useState<boolean>(false);
  const [hideControls, setHideControls] = useState<boolean>(false);

  const timeout = useRef<NodeJS.Timeout>(undefined);
  const playState = useMemo(() => (playing ? ' pause' : ' play'), [playing]);

  const setVideoContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      videoContainerRef.current = node;
      inViewRef(node);
    },
    [inViewRef],
  );

  const togglePlaying = useCallback(() => {
    setLastMove(Date.now());
    setHideControls(false);

    setPlaying(p => {
      const newPlaying = !p;
      if (!videoRef.current) {
        return p;
      }

      if (videoRef.current.paused && newPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }

      return newPlaying;
    });
  }, []);

  const getBufferedPercent = () => {
    if (!videoRef.current) {
      return 0;
    }

    if (videoRef.current.duration === 0 || videoRef.current.buffered.length === 0) return 0;
    const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
    return (bufferedEnd / videoRef.current.duration) * 100;
  };

  const handleProgressBarClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) {
      return;
    }

    setLastMove(Date.now());
    setHideControls(false);

    const targetPercent = e.nativeEvent.offsetX / e.currentTarget.clientWidth;
    const targetTime = videoRef.current.duration * targetPercent;
    videoRef.current.currentTime = Math.min(videoRef.current.duration, Math.max(0, targetTime));
  }, []);

  const handleVolumeClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) {
      return;
    }

    setLastMove(Date.now());
    setHideControls(false);

    const targetPercent = e.nativeEvent.offsetY / e.currentTarget.clientHeight;
    videoRef.current.volume = Math.min(1, Math.max(0, 1 - targetPercent));
  }, []);

  const handleVolumeChange = useCallback(
    (e: SyntheticEvent<HTMLVideoElement, Event>) => {
      const newVolume = e.currentTarget.volume;
      if (newVolume === volume) {
        return;
      }

      setVolume(prev => (prev !== newVolume ? newVolume : prev));

      setLastMove(Date.now());
      setHideControls(false);

      containerRef.current?.style.setProperty('--video-volume', `${newVolume * 100}%`);
    },
    [volume],
  );

  const handleTimeUpdate = useCallback((e: SyntheticEvent<HTMLVideoElement, Event>) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty(
        '--video-progress',
        `${(100 * e.currentTarget.currentTime) / e.currentTarget.duration}%`,
      );
    }
  }, []);

  const handleVolumeScroll = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    console.log(e.deltaY);
    setVolume(p => Math.min(1, Math.max(0, p - e.deltaY / 10000)));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ') {
      if (videoRef.current) {
        setHideControls(false);
        setLastMove(Date.now());

        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (!videoRef.current) {
        return;
      }

      setHideControls(false);
      setLastMove(Date.now());

      const direction = e.key === 'ArrowLeft' ? -1 : 1;

      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        Math.max(0, videoRef.current.currentTime + (direction * videoRef.current.duration) / 125),
      );
    }

    if (document.fullscreenElement) {
      if (e.key === 'ArrowUp') {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }

      if (e.key === 'ArrowDown') {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    }

    setLastMove(Date.now());
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);

    if (el && el.closest('.video_sound')) {
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setHideControls(false);
    setLastMove(Date.now());
  }, []);

  const getHidingControls = useCallback(
    () => (hideControls ? ' hidden' : ' visible'),
    [hideControls],
  );

  useEffect(() => {
    if (!inView && !videoRef.current?.paused) {
      videoRef.current?.pause();
    }
  }, [inView]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, Math.max(0, volume));
    }
  }, [volume]);

  useEffect(() => {
    const container = videoContainerRef?.current;

    container?.addEventListener('keydown', handleKeyDown);

    return () => {
      container?.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, videoContainerRef]);

  useEffect(() => {
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  useEffect(() => {
    if (videoRef.current?.paused) {
      setHideControls(prev => (prev ? false : prev));
      return;
    }

    clearTimeout(timeout.current);

    timeout.current = setTimeout(() => {
      setHideControls(prev => (!prev ? true : prev));
    }, 2000);

    return () => clearTimeout(timeout.current);
  }, [lastMove]);

  useEffect(() => {
    const interval = setInterval(() => {
      const percent = getBufferedPercent();
      containerRef.current?.style.setProperty('--video-preload', `${percent}%`);

      if (Math.ceil(percent) >= 100) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentFsPost === post.id) {
      videoRef.current?.play();
      setPlaying(true);
    }
  }, [currentFsPost, post.id]);

  return (
    <div className="post video" ref={containerRef}>
      <div
        className={`video_container${hideControls ? ' hiding_controls' : ''}`}
        id={`post_${post.id}`}
        tabIndex={0}
        onMouseMove={handleMouseMove}
        ref={setVideoContainerRef}
      >
        <video
          ref={videoRef}
          className="post_video"
          src={post.file_url}
          poster={post.sample_url}
          onContextMenu={e => e.preventDefault()}
          onVolumeChange={handleVolumeChange}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
          preload="metadata"
          onPause={() => setPlaying(false)}
          onPlay={() => {
            document.querySelectorAll('video').forEach(vid => {
              if (!vid.paused && videoRef.current !== vid) {
                vid.pause();
              }
            });

            setPlaying(true);
          }}
          loop={looping}
        />
        <div
          className={`video_playpause${playState}${getHidingControls()}`}
          onClick={togglePlaying}
        />
        <div className={`video_progress${getHidingControls()}`} onClick={handleProgressBarClick} />
        <div
          className={`video_sound${getHidingControls()}`}
          onClick={handleVolumeClick}
          onWheel={handleVolumeScroll}
        />
        <div
          className={`video_fullscreen${getHidingControls()}`}
          onClick={() => {
            setLastMove(Date.now());
            setHideControls(false);

            if (document.fullscreenElement === postsRef.current) {
              document.exitFullscreen();
              setCurrentFsPost(-1);
            } else {
              postsRef.current?.focus();
              postsRef.current?.requestFullscreen();
              videoRef.current?.play();
              setCurrentFsPost(post.id);
            }
          }}
        />
      </div>
      <Tags post={post} />
    </div>
  );
}

const decodeHTML = (html: string) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

function Tags({ post }: { post: PostDTO }) {
  const { includedTags, excludedTags, tryAddTag } = useContext(MainContext);

  const unfiltered = post.tags.split(' ');
  const tags = new Set(unfiltered.map(o => o.trim()));

  const [scrollDragging, setScrollDragging] = useState<boolean>(false);
  const [scrollable, setScrollable] = useState<boolean>(false);
  const showScroll = useMemo(() => (scrollable ? ' scrollable' : ''), [scrollable]);
  const tagRef = useRef<HTMLDivElement>(null);

  const getScrollDelta = () => {
    if (!tagRef.current) {
      return 0;
    }

    const tagDiv = tagRef.current;
    const delta = tagDiv.scrollHeight - tagDiv.clientHeight;
    return delta;
  };

  const handleScroll = () => {
    const el = tagRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;

    if (maxScroll <= 0) {
      el.style.setProperty('--scroll-bottom', `0px`);
      el.style.setProperty('--scroll-height', `0px`);
      return;
    }

    const thumbHeight = el.clientHeight * (el.clientHeight / el.scrollHeight);
    const scrollTop = el.clientHeight - thumbHeight + window.innerWidth / 100;
    const scrollHeight = el.clientHeight - thumbHeight;
    const scrollAmount = (scrollHeight * el.scrollTop) / maxScroll;

    el.parentElement?.style.setProperty('--scroll-bottom', `${scrollTop - scrollAmount}px`);
    el.parentElement?.style.setProperty('--scroll-height', `${thumbHeight}px`);
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!scrollDragging || !tagRef.current) {
        return;
      }

      const el = tagRef.current;
      const maxContentScroll = el.scrollHeight - el.clientHeight;
      if (maxContentScroll <= 0) {
        return;
      }

      const thumbHeight = el.clientHeight * (el.clientHeight / el.scrollHeight);
      const maxThumbTravel = el.clientHeight - thumbHeight;
      if (maxThumbTravel <= 0) {
        return;
      }

      const scrollDelta = (e.movementY / maxThumbTravel) * maxContentScroll;
      el.scrollBy({ top: scrollDelta });
    },
    [scrollDragging],
  );

  const handleMouseDown = () => {
    setScrollDragging(true);
  };

  const stopDragging = () => {
    setScrollDragging(false);
  };

  useEffect(() => {
    handleScroll();

    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('mouseleave', stopDragging);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('mouseleave', stopDragging);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    const delta = getScrollDelta();
    setScrollable(delta > 0);
  }, []);

  return (
    <>
      <div className={`tag_scroll${showScroll}`} onMouseDown={handleMouseDown} />
      <div className="post_tags" ref={tagRef} onScroll={handleScroll}>
        {Array.from(tags)
          .toSorted((a, b) => a.localeCompare(b))
          .map(o => {
            const status = includedTags.find(t => t.name === o || t.name == decodeHTML(o))
              ? ' included'
              : excludedTags.find(t => t.name === o || t.name == decodeHTML(o))
                ? ' excluded'
                : '';
            return (
              <div
                className={`post_tag${status}`}
                key={`${post.id}_${o}`}
                onClick={() => tryAddTag(o)}
              >
                {decodeHTML(o)}
              </div>
            );
          })}
      </div>
    </>
  );
}
