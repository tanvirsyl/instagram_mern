import React, { useEffect, useState, useCallback, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import config from "../config";
import { FaHeart, FaRegHeart, FaComment, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpand } from 'react-icons/fa';
import { BiTachometer } from 'react-icons/bi';

export default function Home() {
  var picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png"
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [comment, setComment] = useState("");
  const [show, setShow] = useState(false);
  const [item, setItem] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();
  const lastPostElementRef = useRef();
  
  // Video state management
  const [videoStates, setVideoStates] = useState({});
  
  // Initialize or update video state for a post
  const initVideoState = (postId) => {
    if (!videoStates[postId]) {
      setVideoStates(prev => ({
        ...prev,
        [postId]: {
          isPlaying: false,
          isMuted: true,
          playbackRate: 1,
          showControls: false
        }
      }));
    }
  };

  // Toast functions
  const notifyA = (msg) => toast.error(msg);
  const notifyB = (msg) => toast.success(msg);

  // Function to fetch posts with pagination
  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoadingMore(pageNum > 1);
      const response = await fetch(`${config.apiUrl}/allposts?page=${pageNum}&limit=5`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
      });
      const result = await response.json();
      
      if (result.length === 0) {
        setHasMore(false);
      } else {
        if (pageNum === 1) {
          setData(result);
        } else {
          setData(prevData => [...prevData, ...result]);
        }
      }
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.log(err);
      notifyA("Error loading posts");
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Intersection Observer for infinite scrolling
  const lastPostRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      navigate("./signup");
      return;
    }

    fetchPosts(1);
  }, [fetchPosts, navigate]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page, fetchPosts]);
  
  // Update video progress bars
  useEffect(() => {
    // Setup progress tracking for each video
    const updateVideoProgress = () => {
      data.forEach(post => {
        if (post.media && post.media.type === 'video') {
          const videoElement = document.getElementById(`video-${post._id}`);
          const progressElement = document.getElementById(`progress-${post._id}`);
          
          if (videoElement && progressElement) {
            const updateProgress = () => {
              if (videoElement.duration) {
                const percentage = (videoElement.currentTime / videoElement.duration) * 100;
                progressElement.style.width = `${percentage}%`;
              }
            };
            
            // Add event listener if not already added
            if (!videoElement.getAttribute('progress-listener-added')) {
              videoElement.addEventListener('timeupdate', updateProgress);
              videoElement.setAttribute('progress-listener-added', 'true');
            }
          }
        }
      });
    };
    
    updateVideoProgress();
    
    // Cleanup function to remove event listeners
    return () => {
      data.forEach(post => {
        if (post.media && post.media.type === 'video') {
          const videoElement = document.getElementById(`video-${post._id}`);
          if (videoElement && videoElement.getAttribute('progress-listener-added')) {
            videoElement.removeEventListener('timeupdate', () => {});
            videoElement.removeAttribute('progress-listener-added');
          }
        }
      });
    };
  }, [data]);

  // to show and hide comments
  const toggleComment = (posts) => {
    if (show) {
      setShow(false);
    } else {
      setShow(true);
      setItem(posts);
    }
  };

  const likePost = (id) => {
    fetch(`${config.apiUrl}/like`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        postId: id,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        const newData = data.map((posts) => {
          if (posts._id == result._id) {
            return result;
          } else {
            return posts;
          }
        });
        setData(newData);
        console.log(result);
      });
  };
  const unlikePost = (id) => {
    fetch(`${config.apiUrl}/unlike`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        postId: id,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        const newData = data.map((posts) => {
          if (posts._id == result._id) {
            return result;
          } else {
            return posts;
          }
        });
        setData(newData);
        console.log(result);
      });
  };

  // function to make comment
  const makeComment = (text, id) => {
    fetch(`${config.apiUrl}/comment`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        text: text,
        postId: id,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        const newData = data.map((posts) => {
          if (posts._id == result._id) {
            return result;
          } else {
            return posts;
          }
        });
        setData(newData);
        setComment("");
        notifyB("Comment posted");
        console.log(result);
      });
  };

  return (
    <div className="home">
      {loading ? (
        <div className="home-loading">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="no-posts-message">
          <h3>No posts yet</h3>
          <p>Follow some users or create your first post!</p>
        </div>
      ) : (
        <>
          {/* Posts */}
          {data.map((posts, index) => {
            // Check if this is the last item to observe for infinite scrolling
            const isLastItem = index === data.length - 1;
            
            return (
              <div 
                className="card" 
                key={posts._id}
                ref={isLastItem ? lastPostRef : null}
              >
                {/* card header */}
                <div className="card-header">
                  <div className="card-pic">
                    <img
                      src={posts.postedBy.Photo ? posts.postedBy.Photo : picLink}
                      alt={posts.postedBy.name || "User"}
                      loading="lazy"
                    />
                  </div>
                  <h5>
                    <Link to={`/profile/${posts.postedBy._id}`}>
                      {posts.postedBy.name}
                    </Link>
                  </h5>
                </div>
                {/* card media (image or video) */}
                <div className="card-image">
                  {posts.media && posts.media.type === 'image' ? (
                    <img 
                      src={posts.media.url} 
                      alt="Post" 
                      loading="lazy" 
                    />
                  ) : posts.media && posts.media.type === 'video' ? (
                    (() => {
                      // Initialize video state if not already done
                      initVideoState(posts._id);
                      const videoState = videoStates[posts._id] || { isPlaying: false, isMuted: true, playbackRate: 1, showControls: false };
                      
                      return (
                        <div 
                          className="video-container"
                          onMouseEnter={() => {
                            setVideoStates(prev => ({
                              ...prev,
                              [posts._id]: { ...prev[posts._id], showControls: true }
                            }));
                          }}
                          onMouseLeave={() => {
                            setVideoStates(prev => ({
                              ...prev,
                              [posts._id]: { ...prev[posts._id], showControls: false }
                            }));
                          }}
                        >
                          <video 
                            id={`video-${posts._id}`}
                            src={posts.media.url} 
                            preload="metadata"
                            className="post-video"
                            playsInline
                            muted={videoState.isMuted}
                            loop
                            playbackRate={videoState.playbackRate}
                            onPlay={() => {
                              setVideoStates(prev => ({
                                ...prev,
                                [posts._id]: { ...prev[posts._id], isPlaying: true }
                              }));
                            }}
                            onPause={() => {
                              setVideoStates(prev => ({
                                ...prev,
                                [posts._id]: { ...prev[posts._id], isPlaying: false }
                              }));
                            }}
                            onTimeUpdate={(e) => {
                              const video = e.target;
                              const progressBar = document.getElementById(`progress-${posts._id}`);
                              if (progressBar && video.duration) {
                                const percentage = (video.currentTime / video.duration) * 100;
                                progressBar.style.width = `${percentage}%`;
                              }
                            }}
                          />
                          
                          {/* Main play/pause overlay */}
                          <div 
                            className="video-overlay"
                            onClick={() => {
                              const videoId = `video-${posts._id}`;
                              const video = document.getElementById(videoId);
                              if (video) {
                                if (video.paused) {
                                  video.play();
                                } else {
                                  video.pause();
                                }
                              }
                            }}
                          >
                            {!videoState.isPlaying && (
                              <FaPlay className="play-icon" />
                            )}
                          </div>
                          
                          {/* Video controls */}
                          <div className={`video-controls ${videoState.showControls ? 'visible' : ''}`}>
                            <button 
                              className="video-control-btn"
                              onClick={() => {
                                const videoId = `video-${posts._id}`;
                                const video = document.getElementById(videoId);
                                if (video) {
                                  if (video.paused) {
                                    video.play();
                                  } else {
                                    video.pause();
                                  }
                                }
                              }}
                            >
                              {videoState.isPlaying ? <FaPause /> : <FaPlay />}
                            </button>
                            
                            <button 
                              className="video-control-btn"
                              onClick={() => {
                                const videoId = `video-${posts._id}`;
                                const video = document.getElementById(videoId);
                                if (video) {
                                  video.muted = !video.muted;
                                  setVideoStates(prev => ({
                                    ...prev,
                                    [posts._id]: { ...prev[posts._id], isMuted: video.muted }
                                  }));
                                }
                              }}
                            >
                              {videoState.isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                            </button>
                            
                            <div className="video-control-dropdown">
                              <button className="video-control-btn speed-btn">
                                <BiTachometer />
                                <span className="speed-value">{videoState.playbackRate}x</span>
                              </button>
                              <div className="speed-options">
                                {[0.5, 1, 1.5, 2].map(rate => (
                                  <button 
                                    key={rate} 
                                    className={`speed-option ${videoState.playbackRate === rate ? 'active' : ''}`}
                                    onClick={() => {
                                      const videoId = `video-${posts._id}`;
                                      const video = document.getElementById(videoId);
                                      if (video) {
                                        video.playbackRate = rate;
                                        setVideoStates(prev => ({
                                          ...prev,
                                          [posts._id]: { ...prev[posts._id], playbackRate: rate }
                                        }));
                                      }
                                    }}
                                  >
                                    {rate}x
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <button 
                              className="video-control-btn"
                              onClick={() => {
                                const videoId = `video-${posts._id}`;
                                const video = document.getElementById(videoId);
                                if (video && video.requestFullscreen) {
                                  video.requestFullscreen();
                                }
                              }}
                            >
                              <FaExpand />
                            </button>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="video-progress-container">
                            <div 
                              className="video-progress-bar"
                              onClick={(e) => {
                                const videoId = `video-${posts._id}`;
                                const video = document.getElementById(videoId);
                                if (video) {
                                  const progressBar = e.currentTarget;
                                  const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
                                  video.currentTime = clickPosition * video.duration;
                                }
                              }}
                            >
                              <div 
                                className="video-progress"
                                style={{ width: '0%' }}
                                id={`progress-${posts._id}`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Fallback for old posts that might still use the photo field
                    <img src={posts.photo} alt="Legacy post" loading="lazy" />
                  )}
                </div>

                {/* card content */}
                <div className="card-content">
                  <div className="card-actions">
                    <div className="action-buttons">
                      {posts.likes.includes(
                        JSON.parse(localStorage.getItem("user"))._id
                      ) ? (
                        <FaHeart
                          className="action-icon liked"
                          onClick={() => {
                            unlikePost(posts._id);
                          }}
                        />
                      ) : (
                        <FaRegHeart
                          className="action-icon"
                          onClick={() => {
                            likePost(posts._id);
                          }}
                        />
                      )}
                      <FaComment 
                        className="action-icon comment-icon"
                        onClick={() => {
                          toggleComment(posts);
                        }}
                      />
                    </div>
                    <p className="likes-count">{posts.likes.length} Likes</p>
                  </div>
                  
                  <div className="post-caption">
                    <span className="post-author">{posts.postedBy.name}</span>
                    <span className="post-text">{posts.body}</span>
                  </div>
                  
                  {posts.comments && posts.comments.length > 0 && (
                    <p
                      className="view-comments"
                      onClick={() => {
                        toggleComment(posts);
                      }}
                    >
                      View all {posts.comments.length} comments
                    </p>
                  )}
                </div>

                {/* add Comment */}
                <div className="add-comment">
                  <input
                    type="text"
                    placeholder="Add a comment"
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                    }}
                  />
                  <button
                    className="comment"
                    onClick={() => {
                      makeComment(comment, posts._id);
                    }}
                    disabled={!comment.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className="loading-more">
              <div className="loading-spinner-small"></div>
              <p>Loading more posts...</p>
            </div>
          )}
        </>
      )}

      {/* show Comment */}
      {show && (
        <div className="showComment">
          <div className="container">
            <div className="postPic">
              {item.media && item.media.type === 'image' ? (
                <img src={item.media.url} alt="Post" />
              ) : item.media && item.media.type === 'video' ? (
                <div className="modal-video-container">
                  <video 
                    id="modal-video"
                    src={item.media.url} 
                    controls
                    autoPlay
                    playsInline
                    className="modal-video"
                  />
                </div>
              ) : (
                // Fallback for old posts that might still use the photo field
                <img src={item.photo} alt="Legacy post" />
              )}
            </div>
            <div className="details">
              {/* card header */}
              <div className="modal-header">
                <div className="modal-user">
                  <img
                    src={item.postedBy.Photo ? item.postedBy.Photo : picLink}
                    alt={item.postedBy.name || "User"}
                    className="modal-user-pic"
                  />
                  <span className="modal-username">{item.postedBy.name}</span>
                </div>
              </div>

              {/* commentSection */}
              <div className="comment-section">
                {/* Post caption */}
                <div className="modal-caption">
                  <div className="caption-user">
                    <img
                      src={item.postedBy.Photo ? item.postedBy.Photo : picLink}
                      alt={item.postedBy.name || "User"}
                      className="caption-user-pic"
                    />
                    <div className="caption-content">
                      <span className="caption-username">{item.postedBy.name}</span>
                      <p className="caption-text">{item.body}</p>
                    </div>
                  </div>
                </div>
                
                {/* Comments */}
                {item.comments.map((comment) => {
                  return (
                    <div className="comm" key={comment._id}>
                      <div className="comment-pic">
                        <img
                          src={comment.postedBy.Photo ? comment.postedBy.Photo : picLink}
                          alt={comment.postedBy.name || "User"}
                          loading="lazy"
                        />
                      </div>
                      <div className="comment-content">
                        <span className="commenter">
                          {comment.postedBy.name}
                        </span>
                        <span className="commentText">{comment.comment}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* card content */}
              <div className="modal-stats">
                <p><FaHeart className="modal-heart-icon" /> {item.likes.length} likes</p>
              </div>

              {/* add Comment */}
              <div className="modal-comment-input">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                  }}
                />
                <button
                  className="modal-post-btn"
                  onClick={() => {
                    makeComment(comment, item._id);
                    setComment("");
                  }}
                  disabled={!comment.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
          <div
            className="close-comment"
            onClick={() => {
              toggleComment();
            }}
          >
            <span className="close-icon">&times;</span>
          </div>
        </div>
      )}
    </div>
  );
}
