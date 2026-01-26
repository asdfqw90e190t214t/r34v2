import './main.css';

import {
  ChangeEvent,
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useToggle, useToggleValue } from '../hook/useToggle';
import { SimpleTagDTO, TagDTO } from '../api/TagDTO';
import { APIHandler } from '../api/APIHandler';
import { useArray } from '../hook/useArray';
import { Tag } from './tag';
import { PostDTO } from '../api/PostDTO';
import { Post } from './post';
import { Settings } from './settings';

export const MainContext = createContext<{
  removeTagCallback: (o: TagDTO) => void;
  excludedTags: Array<TagDTO>;
  includedTags: Array<TagDTO>;
  tryAddTag: (value: string) => Promise<void>;
  setCurrentFsPost: Dispatch<SetStateAction<number>>;
  currentFsPost: number;
  postsRef: RefObject<HTMLDivElement | null>;
  toggleSettings: () => void;
  setAutoloadEnd: Dispatch<SetStateAction<boolean>>;
  autoloadEnd: boolean;
  looping: boolean;
  setLooping: Dispatch<SetStateAction<boolean>>;
}>({
  removeTagCallback: () => {},
  excludedTags: [],
  includedTags: [],
  tryAddTag: () => new Promise<void>(() => {}),
  setCurrentFsPost: () => {},
  postsRef: { current: null },
  toggleSettings: () => {},
  setAutoloadEnd: () => {},
  autoloadEnd: true,
  currentFsPost: -1,
  looping: false,
  setLooping: () => {},
});

const api = new APIHandler();

export function Main() {
  const { array: includedTags, push: pushIncluded, filter: filterIncluded } = useArray<TagDTO>([]);
  const { array: excludedTags, push: pushExcluded, filter: filterExcluded } = useArray<TagDTO>([]);

  const [page, setPage] = useState<number>(0);
  const [postCount, setPostCount] = useState<number>(0);
  const [posts, setPosts] = useState<Array<PostDTO>>([]);
  const [showSettings, toggleSettings] = useToggle(false);
  const [addingTag, toggleAddingTag, forceAddingTag] = useToggle(true);
  const [searchValue, setSearchValue] = useState<string>('');
  const [showSearch, toggleSearch] = useToggleValue<string>('hidden', '');
  const [autocomplete, setAutocomplete] = useState<Array<SimpleTagDTO>>([]);
  const [currentFsPost, setCurrentFsPost] = useState<number>(-1);
  const [autoloadEnd, setAutoloadEnd] = useState<boolean>(true);
  const [looping, setLooping] = useState<boolean>(true);
  const showAutocomplete = useMemo(() => (autocomplete.length > 0 ? '' : 'hidden'), [autocomplete]);

  const fetchTimeout = useRef<NodeJS.Timeout>(undefined);
  const postsRef = useRef<HTMLDivElement>(null);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    const { value } = e.target;
    setSearchValue(value);

    if (!value || value.trim().length === 0) {
      setAutocomplete([]);
      return;
    }

    fetchTimeout.current = setTimeout(() => {
      (async () => {
        try {
          const result = await api.getAutocomplete(e.target.value.replaceAll(' ', '_'));
          setAutocomplete(result);
        } catch {
          // Ignored
        } finally {
          fetchTimeout.current = undefined;
        }
      })();
    }, 250);
  };

  const removeTagCallback = useCallback(
    (tag: TagDTO) => {
      filterIncluded(t => t.id !== tag.id);
      filterExcluded(t => t.id !== tag.id);
    },
    [filterExcluded, filterIncluded],
  );

  const tryAddTag = async (value: string) => {
    console.log(value);
    try {
      let tag = await api.getTag(value);

      if (!tag) {
        const testAutocomplete = await api.getAutocomplete(value);
        const first = testAutocomplete[0];
        if (!first) {
          return;
        }

        tag = await api.getTag(first.value);
        if (!tag) {
          return;
        }
      }

      filterIncluded(o => o.id !== tag.id);
      filterExcluded(o => o.id !== tag.id);

      if (addingTag) {
        pushIncluded(tag);
      } else {
        pushExcluded(tag);
      }
    } catch {
      // Ignored
    }
  };

  const fetchPosts = useCallback(async () => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const newPosts = await api.getPosts(includedTags, excludedTags, page);
    const newCount = await api.getPostCount(includedTags, excludedTags);

    setPosts(newPosts);
    setPostCount(newCount);
  }, [excludedTags, includedTags, page]);

  const decodeHTML = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const moveToNextPost = useCallback(async () => {
    const current = posts.findIndex(o => o.id === currentFsPost);
    console.log('Current: ', current);
    if (current === -1) {
      return;
    }

    if (current + 1 >= posts.length) {
      const newPosts = await api.getPosts(includedTags, excludedTags, page + 1);
      if (newPosts.length === 0) {
        return;
      }

      const newFs = newPosts[0].id;
      setCurrentFsPost(newFs);
      setPosts(newPosts);
      setPage(page + 1);
      return;
    }

    const post = posts[current + 1];
    if (!post) {
      return;
    }

    setCurrentFsPost(post.id);
  }, [currentFsPost, excludedTags, includedTags, page, posts]);

  const moveToPreviousPost = useCallback(async () => {
    const current = posts.findIndex(o => o.id === currentFsPost);
    if (current === -1) {
      return;
    }

    if (current - 1 < 0) {
      if (page === 0) {
        return;
      }

      const newPosts = await api.getPosts(includedTags, excludedTags, page - 1);
      if (newPosts.length === 0) {
        return;
      }

      const newFs = newPosts[newPosts.length - 1].id;
      setCurrentFsPost(newFs);
      setPosts(newPosts);
      setPage(page - 1);
      return;
    }

    const post = posts[current - 1];
    if (!post) {
      return;
    }

    setCurrentFsPost(post.id);
  }, [currentFsPost, excludedTags, includedTags, page, posts]);

  useEffect(() => {
    if (!document.fullscreenElement) {
      return;
    }

    const prev = document.querySelector(`#post_${currentFsPost}`);
    if (prev && prev instanceof HTMLElement) {
      prev.scrollIntoView({ behavior: 'instant' });
      prev.focus();
    }
  }, [currentFsPost]);

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (document.fullscreenElement) {
        if (e.key === 'ArrowUp') {
          moveToPreviousPost();
        }

        if (e.key === 'ArrowDown') {
          moveToNextPost();
        }
      }
    },
    [moveToNextPost, moveToPreviousPost],
  );

  const scrollToPost = useCallback((id: number) => {
    const container = postsRef.current;
    const post = document.getElementById(`post_${id}`);
    if (!container || !post) return;

    container.scrollIntoView();
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const el = postsRef.current;
      if (!el) return;

      if (document.fullscreenElement === el && currentFsPost !== -1) {
        // Let layout settle for one frame
        requestAnimationFrame(() => {
          scrollToPost(currentFsPost);
        });
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [scrollToPost, handleKeyUp, currentFsPost]);

  useEffect(() => {
    const el = postsRef.current;
    if (!el) return;

    const isFsPosts = () => document.fullscreenElement === el;

    const onWheel = (e: WheelEvent) => {
      if (isFsPosts()) {
        e.preventDefault();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isFsPosts()) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case ' ':
        case 'PageUp':
        case 'PageDown':
        case 'Home':
        case 'End':
          e.preventDefault();
          break;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isFsPosts()) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const el = postsRef.current;
      if (!el) return;

      if (document.fullscreenElement === el && currentFsPost !== -1) {
        // Let layout settle for one frame
        requestAnimationFrame(() => {
          scrollToPost(currentFsPost);
        });
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [currentFsPost, scrollToPost]);

  return (
    <MainContext.Provider
      value={{
        removeTagCallback,
        includedTags,
        excludedTags,
        tryAddTag,
        setCurrentFsPost,
        postsRef,
        toggleSettings,
        autoloadEnd,
        currentFsPost,
        setAutoloadEnd,
        looping,
        setLooping,
      }}
    >
      <div id="search" className={showSearch && 'hidden'}>
        <div id="search_toggle" onClick={toggleSearch}>
          <div id="search_toggle_pointer" />
        </div>
        <div id="include_exclude_toggle" onClick={toggleAddingTag}>
          <div className={addingTag ? 'include' : 'exclude'} />
        </div>
        <div id="send_search_secondary" onClick={fetchPosts} title="Search">
          &rarr;
        </div>
        <div id="search_content">
          <div id="search_header">
            <div>
              Posts:
              <br />
              {postCount.toLocaleString()}
            </div>
            <div>
              <a href="https://api.rule34.xxx/" target="_blank">
                R34 API
              </a>
            </div>
            <div>
              <a href="https://github.com/asdfqw90e190t214t/r34v3" target="_blank">
                Source
              </a>
            </div>
            <div>
              <div onClick={toggleSettings}>Settings</div>
            </div>
          </div>
          <div id="search_input">
            <div id="search_submit" onClick={fetchPosts} title="Search">
              &rarr;
            </div>
            <input
              name="tag_search_input"
              type="text"
              placeholder="Search for a tag..."
              onChange={handleInput}
              value={searchValue}
              onKeyUp={async e => {
                if (e.key === 'Enter') {
                  tryAddTag((e.target as HTMLInputElement).value.replaceAll(' ', '_')).finally(
                    () => {
                      setSearchValue('');
                      setAutocomplete([]);
                    },
                  );
                }
              }}
            />
            <div id="search_tags">
              <div id="included_tags" title="Included Tags">
                <div id="included_marker" onClick={() => forceAddingTag(true)} />
                {includedTags.map((tag, idx) => (
                  <Tag tag={tag} key={`${tag.id}_included_tag_${idx}`} />
                ))}
              </div>
              <br />
              <div id="excluded_tags" title="Excluded Tags">
                <div id="excluded_marker" onClick={() => forceAddingTag(false)} />
                {excludedTags.map((tag, idx) => (
                  <Tag tag={tag} key={`${tag.id}_excluded_tag_${idx}`} />
                ))}
              </div>
            </div>
            <div id="autocomplete" className={showAutocomplete}>
              {autocomplete.map(o => (
                <div className="autocomplete_entry" key={o.value}>
                  {decodeHTML(o.label)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Settings hidden={!showSettings} />

      <div id="posts" ref={postsRef}>
        {posts.map(post => (
          <Post {...post} key={post.id} />
        ))}
      </div>
    </MainContext.Provider>
  );
}
