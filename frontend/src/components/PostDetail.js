import React, { useState } from "react";
import "./PostDetail.css";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaHeart, FaRegHeart, FaComment, FaEllipsisH, FaTrash } from 'react-icons/fa';
import config from "../config";

export default function PostDetail({ item, toggleDetails }) {
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(item.likes.includes(JSON.parse(localStorage.getItem("user"))._id));
  const [likesCount, setLikesCount] = useState(item.likes.length);
  
  // Default profile pic if user doesn't have one
  const defaultPic = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";

  // Toast functions
  const notifyError = (msg) => toast.error(msg);
  const notifySuccess = (msg) => toast.success(msg);

  // Handle like/unlike
  const handleLike = () => {
    const endpoint = liked ? 'unlike' : 'like';
    
    fetch(`${config.apiUrl}/${endpoint}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        postId: item._id,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      })
      .catch(err => {
        console.log(err);
        notifyError("Error updating like status");
      });
  };

  // Add comment
  const makeComment = () => {
    if (!comment.trim()) return;
    
    fetch(`${config.apiUrl}/comment`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        postId: item._id,
        text: comment,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        setComment("");
        // Update the item with new comment
        item.comments = result.comments;
        notifySuccess("Comment added successfully");
      })
      .catch(err => {
        console.log(err);
        notifyError("Error adding comment");
      });
  };

  // Remove post
  const removePost = (postId) => {
    if (window.confirm("Do you really want to delete this post?")) {
      fetch(`${config.apiUrl}/deletePost/${postId}`, {
        method: "delete",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
      })
        .then((res) => res.json())
        .then((result) => {
          toggleDetails();
          navigate("/");
          notifySuccess(result.message);
        })
        .catch(err => {
          console.log(err);
          notifyError("Error deleting post");
        });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="post-detail-modal">
      <div className="modal-content">
        <div className="modal-body">
          <div className="modal-media">
            {item.media && item.media.type === 'video' ? (
              <video 
                src={item.media.url} 
                controls 
                autoPlay 
                className="modal-video"
                alt="Video post"
              />
            ) : (
              <img 
                src={item.media ? item.media.url : item.photo} 
                alt="Post"
                className="modal-image"
              />
            )}
          </div>
          <div className="modal-details">
            {/* Modal header with user info */}
            <div className="modal-header">
              <div className="modal-user">
                <Link to={`/profile/${item.postedBy._id}`}>
                  <img 
                    src={item.postedBy.Photo ? item.postedBy.Photo : defaultPic} 
                    alt={item.postedBy.name}
                    className="modal-user-pic"
                  />
                </Link>
                <div className="user-info">
                  <Link to={`/profile/${item.postedBy._id}`} className="modal-username-link">
                    <span className="modal-username">{item.postedBy.name}</span>
                  </Link>
                  {item.createdAt && (
                    <span className="post-date">{formatDate(item.createdAt)}</span>
                  )}
                </div>
              </div>
              
              {/* Show delete option only if post belongs to current user */}
              {item.postedBy._id === JSON.parse(localStorage.getItem("user"))._id && (
                <div className="post-actions">
                  <button 
                    className="delete-btn"
                    onClick={() => removePost(item._id)}
                    aria-label="Delete post"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>

            {/* Post caption */}
            <div className="modal-caption-container">
              <div className="modal-caption-user">
                <Link to={`/profile/${item.postedBy._id}`}>
                  <img 
                    src={item.postedBy.Photo ? item.postedBy.Photo : defaultPic} 
                    alt={item.postedBy.name}
                    className="caption-user-pic"
                  />
                </Link>
                <div className="caption-content">
                  <Link to={`/profile/${item.postedBy._id}`} className="caption-username-link">
                    <span className="caption-username">{item.postedBy.name}</span>
                  </Link>
                  <p className="modal-caption">{item.body}</p>
                </div>
              </div>
            </div>
            
            {/* Comments section */}
            <div className="comment-section">
              {item.comments && item.comments.length > 0 ? (
                item.comments.map((comment, index) => {
                  return (
                    <div className="comm" key={index}>
                      <div className="comment-pic">
                        <img
                          src={comment.postedBy.Photo ? comment.postedBy.Photo : defaultPic}
                          alt={comment.postedBy.name}
                          loading="lazy"
                        />
                      </div>
                      <div className="comment-content">
                        <Link to={`/profile/${comment.postedBy._id}`} className="commenter-link">
                          <span className="commenter">{comment.postedBy.name}</span>
                        </Link>
                        <span className="commentText">{comment.comment}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-comments">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Interaction section */}
            <div className="modal-interactions">
              <div className="modal-interaction-buttons">
                <button 
                  className="interaction-btn" 
                  onClick={handleLike}
                  aria-label={liked ? "Unlike post" : "Like post"}
                >
                  {liked ? 
                    <FaHeart className="interaction-icon liked" /> : 
                    <FaRegHeart className="interaction-icon" />}
                </button>
                <button 
                  className="interaction-btn"
                  aria-label="Comment"
                >
                  <FaComment className="interaction-icon" />
                </button>
              </div>
              <div className="modal-stats">
                <p>{likesCount} likes</p>
              </div>
            </div>

            {/* Add comment */}
            <div className="modal-comment-input">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && makeComment()}
              />
              <button
                className="modal-post-btn"
                onClick={makeComment}
                disabled={!comment.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="close-modal"
        onClick={toggleDetails}
        aria-label="Close modal"
      >
        <span className="close-icon">&times;</span>
      </div>
    </div>
  );
}
