import React, { useEffect, useState, useRef, useCallback } from "react";
import PostDetail from "./PostDetail";
import "./Profile.css";
import { useParams } from "react-router-dom";
import { FaUserCheck, FaUserPlus, FaImage, FaVideo, FaPlay, FaHeart, FaComment, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import config from "../config";
import { Link } from "react-router-dom";

export default function UserProfile() {
  var picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const { userid } = useParams();
  const [isFollow, setIsFollow] = useState(false);
  const [user, setUser] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePicLoaded, setProfilePicLoaded] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'videos', 'photos'
  const [joinDate, setJoinDate] = useState('');
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [imageLoadCount, setImageLoadCount] = useState(0);
  const imageObserver = useRef(null);

  // to follow user
  const followUser = (userId) => {
    fetch(`${config.apiUrl}/follow`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        followId: userId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setIsFollow(true);
      });
  };

  // to unfollow user
  const unfollowUser = (userId) => {
    fetch(`${config.apiUrl}/unfollow`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        followId: userId,
      }),
    })
      .then((res) => {
        res.json();
      })
      .then((data) => {
        console.log(data);
        setIsFollow(false);
      });
  };

  // Toast functions
  const notifyError = (msg) => toast.error(msg);
  const notifySuccess = (msg) => toast.success(msg);

  // Toggle post detail view
  const togglePostDetail = (post) => {
    setSelectedPost(post);
    setShowPostDetail(!showPostDetail);
  };

  // Filter posts by type
  const getFilteredPosts = () => {
    if (activeTab === 'videos') {
      return posts.filter(post => post.media && post.media.type === 'video');
    } else if (activeTab === 'photos') {
      return posts.filter(post => !post.media || post.media.type === 'image');
    }
    return posts;
  };

  // Setup Intersection Observer for lazy loading images
  useEffect(() => {
    imageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.current.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    return () => {
      if (imageObserver.current) {
        imageObserver.current.disconnect();
      }
    };
  }, []);

  // Handle image load completion
  const handleImageLoaded = useCallback(() => {
    setImageLoadCount(prev => prev + 1);
  }, []);

  // Check if all gallery images are loaded
  useEffect(() => {
    if (imageLoadCount >= Math.min(getFilteredPosts().length, 6)) {
      setGalleryLoading(false);
    }
  }, [imageLoadCount]);

  // Format join date
  const formatJoinDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    setLoading(true);
    setGalleryLoading(true);
    setImageLoadCount(0);
    
    fetch(`${config.apiUrl}/user/${userid}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
    })
      .then((res) => res.json())
      .then((result) => {
        console.log(result);
        setUser(result.user);
        setPosts(result.post);
        if (result.user.createdAt) {
          setJoinDate(formatJoinDate(result.user.createdAt));
        }
        if (
          result.user.followers.includes(
            JSON.parse(localStorage.getItem("user"))._id
          )
        ) {
          setIsFollow(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        notifyError("Error loading profile");
        setLoading(false);
        setGalleryLoading(false);
      });
  }, [isFollow, userid]);  // Added userid as dependency

  return (
    <div className="profile">
      {loading ? (
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Profile frame */}
          <div className="profile-frame">
            {/* profile-pic with loading state */}
            <div className="profile-pic-container">
              <div className={`profile-pic ${profilePicLoaded ? 'loaded' : ''}`}>
                {!profilePicLoaded && <div className="profile-pic-skeleton"></div>}
                <img 
                  src={user.Photo ? user.Photo : picLink} 
                  alt={user.name || 'User'} 
                  onLoad={() => setProfilePicLoaded(true)}
                  style={{ opacity: profilePicLoaded ? 1 : 0 }}
                />
              </div>
              {joinDate && (
                <div className="join-date">
                  <FaCalendarAlt className="calendar-icon" />
                  <span>Joined {joinDate}</span>
                </div>
              )}
            </div>
            
            {/* profile-data */}
            <div className="pofile-data">
              <div className="profile-header">
                <h1>{user.name}</h1>
                <button
                  className="followBtn"
                  onClick={() => {
                    if (isFollow) {
                      unfollowUser(user._id);
                    } else {
                      followUser(user._id);
                    }
                  }}
                >
                  {isFollow ? (
                    <>
                      <FaUserCheck style={{ marginRight: '5px' }} /> Unfollow
                    </>
                  ) : (
                    <>
                      <FaUserPlus style={{ marginRight: '5px' }} /> Follow
                    </>
                  )}
                </button>
              </div>
              <div className="profile-info">
                <p><span>{posts.length}</span> posts</p>
                <p><span>{user.followers ? user.followers.length : "0"}</span> followers</p>
                <p><span>{user.following ? user.following.length : "0"}</span> following</p>
              </div>
              {user.userName && (
                <p className="username">@{user.userName}</p>
              )}
              {user.bio && (
                <p className="bio">{user.bio}</p>
              )}
              
              {/* User activity stats */}
              <div className="user-activity">
                <div className="activity-stat">
                  <FaHeart className="activity-icon likes" />
                  <span>{posts.reduce((total, post) => total + post.likes.length, 0)} total likes</span>
                </div>
                <div className="activity-stat">
                  <FaComment className="activity-icon comments" />
                  <span>{posts.reduce((total, post) => total + (post.comments ? post.comments.length : 0), 0)} comments</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Tabs */}
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              All Posts
            </button>
            <button 
              className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              <FaImage style={{ marginRight: '5px' }} /> Photos
            </button>
            <button 
              className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              <FaVideo style={{ marginRight: '5px' }} /> Videos
            </button>
          </div>
          
          {/* Gallery with loading state */}
          <div className={`gallery-container ${galleryLoading ? 'loading' : 'loaded'}`}>
            {galleryLoading && (
              <div className="gallery-loading">
                <div className="gallery-spinner"></div>
                <p>Loading gallery...</p>
              </div>
            )}
            
            <div className="gallery" style={{ opacity: galleryLoading ? 0 : 1 }}>
              {getFilteredPosts().length > 0 ? (
                getFilteredPosts().map((post, index) => {
                  const isVideo = post.media && post.media.type === 'video';
                  const mediaUrl = post.media ? post.media.url : post.photo;
                  const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg==';
                  
                  return (
                    <div 
                      key={post._id} 
                      className="gallery-item"
                      onClick={() => togglePostDetail(post)}
                    >
                      <div className="gallery-item-content">
                        {isVideo ? (
                          <div className="video-thumbnail">
                            <img 
                              src={placeholderUrl}
                              data-src={mediaUrl} 
                              alt="Video post"
                              className="item"
                              ref={el => {
                                if (el && imageObserver.current) {
                                  imageObserver.current.observe(el);
                                }
                              }}
                              onLoad={handleImageLoaded}
                            />
                            <div className="video-overlay">
                              <FaPlay className="play-icon" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={placeholderUrl}
                            data-src={mediaUrl}
                            alt="Post"
                            className="item"
                            ref={el => {
                              if (el && imageObserver.current) {
                                imageObserver.current.observe(el);
                              }
                            }}
                            onLoad={handleImageLoaded}
                          />
                        )}
                        
                        {/* Post info overlay */}
                        <div className="gallery-item-info">
                          <div className="gallery-item-likes">
                            <FaHeart /> <span>{post.likes.length}</span>
                          </div>
                          <div className="gallery-item-comments">
                            <FaComment /> <span>{post.comments ? post.comments.length : 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-posts">
                  {activeTab === 'videos' ? (
                    <>
                      <FaVideo className="no-content-icon" />
                      <p>No videos yet</p>
                    </>
                  ) : activeTab === 'photos' ? (
                    <>
                      <FaImage className="no-content-icon" />
                      <p>No photos yet</p>
                    </>
                  ) : (
                    <p>No posts yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Post Detail Modal with enhanced content */}
          {showPostDetail && selectedPost && (
            <div className="post-detail-modal">
              <div className="modal-content">
                <span className="close-modal" onClick={() => setShowPostDetail(false)}>&times;</span>
                <div className="modal-body">
                  <div className="modal-media">
                    {selectedPost.media && selectedPost.media.type === 'video' ? (
                      <video 
                        src={selectedPost.media.url} 
                        controls 
                        autoPlay 
                        className="modal-video"
                      />
                    ) : (
                      <img 
                        src={selectedPost.media ? selectedPost.media.url : selectedPost.photo} 
                        alt="Post"
                        className="modal-image"
                      />
                    )}
                  </div>
                  <div className="modal-details">
                    <div className="modal-header">
                      <div className="modal-user">
                        <Link to={`/profile/${user._id}`}>
                          <img 
                            src={user.Photo ? user.Photo : picLink} 
                            alt={user.name}
                            className="modal-user-pic"
                          />
                        </Link>
                        <Link to={`/profile/${user._id}`} className="modal-username-link">
                          <span className="modal-username">{user.name}</span>
                        </Link>
                      </div>
                      <div className="post-date">
                        {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    <div className="modal-caption-container">
                      <div className="modal-caption-user">
                        <Link to={`/profile/${user._id}`}>
                          <img 
                            src={user.Photo ? user.Photo : picLink} 
                            alt={user.name}
                            className="caption-user-pic"
                          />
                        </Link>
                        <div className="caption-content">
                          <Link to={`/profile/${user._id}`} className="caption-username-link">
                            <span className="caption-username">{user.name}</span>
                          </Link>
                          <p className="modal-caption">{selectedPost.body}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modal-interactions">
                      <div className="modal-interaction-buttons">
                        <button className="interaction-btn">
                          {selectedPost.likes.includes(JSON.parse(localStorage.getItem("user"))._id) ? 
                            <FaHeart className="interaction-icon liked" /> : 
                            <FaHeart className="interaction-icon" />}
                        </button>
                        <button className="interaction-btn">
                          <FaComment className="interaction-icon" />
                        </button>
                      </div>
                      <div className="modal-stats">
                        <p>{selectedPost.likes.length} likes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
