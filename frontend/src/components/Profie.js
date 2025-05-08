import React, { useEffect, useState } from "react";
import PostDetail from "./PostDetail";
import "./Profile.css";
import ProfilePic from "./ProfilePic";
import config from "../config";

export default function Profie() {
  const picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const [pic, setPic] = useState([]);
  const [show, setShow] = useState(false);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState({});
  const [changePic, setChangePic] = useState(false);

  // Toggle between showing post details or not
  const toggleDetails = (post) => {
    if (show) {
      setShow(false);
    } else {
      setShow(true);
      setPosts(post); // Set the current post for details
    }
  };

  // Toggle the profile picture change option
  const changeProfile = () => {
    setChangePic(!changePic);
  };

  useEffect(() => {
    // Fetch user and posts data from API
    fetch(`${config.apiUrl}/user/${JSON.parse(localStorage.getItem("user"))._id}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
    })
      .then((res) => res.json())
      .then((result) => {
        // Set user and posts data
        setPic(result.post);
        setUser(result.user);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, []);

  return (
    <div className="profile">
      {/* Profile frame */}
      <div className="profile-frame">
        {/* Profile picture */}
        <div className="profile-pic">
          <img
            onClick={changeProfile}
            src={user.Photo ? user.Photo : picLink}
            alt="Profile"
          />
        </div>

        {/* Profile data */}
        <div className="profile-data">
          <h1>{user.name}</h1>
          <div className="profile-info" style={{ display: "flex" }}>
            <p>{pic.length} posts</p>
            <p>{user.followers ? user.followers.length : 0} followers</p>
            <p>{user.following ? user.following.length : 0} following</p>
          </div>
        </div>
      </div>

      {/* Separator */}
      <hr style={{ width: "90%", opacity: "0.8", margin: "25px auto" }} />

      {/* Gallery */}
      <div className="gallery">
        {pic.length === 0 ? (
          <p>No posts yet!</p> // Show a message if no posts
        ) : (
          pic.map((post) => (
            <div key={post._id} className="post-item">
              {/* Check if it's an image or a video */}
              {post.media && post.media.type === 'image' ? (
                <img
                  src={post.media.url} // Render image post
                  alt="Post"
                  className="item"
                  onClick={() => toggleDetails(post)}
                />
              ) : post.media && post.media.type === 'video' ? (
                <video
                  controls
                  src={post.media.url} // Render video post
                  className="item"
                  onClick={() => toggleDetails(post)}
                  style={{ maxWidth: '100%' }}
                />
              ) : (
                // Fallback for old posts that might still use the photo field
                <img src={post.photo} alt="Legacy post" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Post Details */}
      {show && <PostDetail item={posts} toggleDetails={toggleDetails} />}

      {/* Profile Picture Change */}
      {changePic && <ProfilePic changeProfile={changeProfile} />}
    </div>
  );
}
