import React, { useState, useEffect, useRef } from "react";
import "./Createpost.css";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import config from "../config";
import { FaImage, FaVideo, FaUpload } from 'react-icons/fa';

export default function Createpost() {
  const [body, setBody] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // Default to image
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [uploadType, setUploadType] = useState("image"); // To toggle between image and video upload
  const [user, setUser] = useState({}); // User data from localStorage
  const mediaPreviewRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate()

  // Toast functions
  const notifyA = (msg) => toast.error(msg)
  const notifyB = (msg) => toast.success(msg)


  // Load user data from localStorage when component mounts
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    // saving post to mongodb
    if (mediaUrl) {

      fetch(`${config.apiUrl}/createPost`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        body: JSON.stringify({
          body,
          mediaUrl,
          mediaType
        })
      }).then(res => res.json())
        .then(data => {
          if (data.error) {
            notifyA(data.error)
          } else {
            notifyB("Successfully Posted")
            navigate("/")
          }
        })
        .catch(err => console.log(err))
    }

  }, [mediaUrl])


  // posting media to cloudinary
  const postDetails = () => {
    if (!media) {
      notifyA("Please select an image or video")
      return;
    }

    if (!body) {
      notifyA("Please add a caption")
      return;
    }
    
    // Show loading toast
    const loadingToast = toast.loading("Uploading your post...");

    console.log(body, media, mediaType)
    const data = new FormData()
    data.append("file", media)
    data.append("upload_preset", "insta-clone")
    data.append("cloud_name", "cantacloud2")
    
    // Use the appropriate Cloudinary API endpoint based on media type
    const resourceType = mediaType === 'video' ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/cantacloud2/${resourceType}/upload`;
    
    fetch(uploadUrl, {
      method: "post",
      body: data
    }).then(res => res.json())
      .then(data => {
        toast.dismiss(loadingToast);
        console.log("Cloudinary response:", data);
        if (data.error) {
          notifyA(data.error.message || "Upload failed")
        } else {
          setMediaUrl(data.url);
          notifyB("Media uploaded successfully");
        }
      })
      .catch(err => {
        toast.dismiss(loadingToast);
        console.log(err);
        notifyA("Upload failed. Please try again.");
      })
  }


  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Determine if the file is an image or video based on its type
    const fileType = file.type.split('/')[0];
    const isVideo = fileType === 'video';
    const isImage = fileType === 'image';
    
    if (!isImage && !isVideo) {
      notifyA("Please select an image or video file");
      return;
    }
    
    setMedia(file);
    setMediaType(isVideo ? 'video' : 'image');
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
    
    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(previewUrl);
  };
  return (
    <div className="createPost">
      {/* //header */}
      <div className="post-header">
        <h4 style={{ margin: "3px auto" }}>Create New Post</h4>
        <button 
          id="post-btn" 
          onClick={() => { postDetails() }}
          disabled={!media || !body}
        >
          Share
        </button>
      </div>
      {/* Media preview */}
      <div className="main-div">
        {!mediaPreviewUrl ? (
          <img
            id="placeholder"
            src="https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-image-512.png"
            alt="Upload media"
          />
        ) : mediaType === 'image' ? (
          <img
            id="output"
            src={mediaPreviewUrl}
            alt="Preview"
          />
        ) : (
          <video
            id="video-output"
            src={mediaPreviewUrl}
            controls
            style={{ maxWidth: '100%', maxHeight: '300px' }}
            ref={mediaPreviewRef}
          />
        )}
        
        {/* Upload type selector */}
        <div className="upload-type-selector">
          <button 
            onClick={() => setUploadType('image')} 
            className={`upload-type-btn ${uploadType === 'image' ? 'active' : ''}`}
          >
            <FaImage /> Image
          </button>
          <button 
            onClick={() => setUploadType('video')} 
            className={`upload-type-btn ${uploadType === 'video' ? 'active' : ''}`}
          >
            <FaVideo /> Video
          </button>
        </div>
        
        <div className="file-upload-container">
          <button 
            className="file-upload-btn" 
            onClick={() => fileInputRef.current.click()}
          >
            <FaUpload /> {uploadType === 'image' ? 'Select Image' : 'Select Video'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={uploadType === 'image' ? "image/*" : "video/*"}
            onChange={handleMediaChange}
            style={{ display: 'none' }}
          />
        </div>
        
        {/* Helper text */}
        <p style={{ fontSize: '12px', color: '#8e8e8e', marginTop: '5px' }}>
          {uploadType === 'image' ? 
            "Select an image to share with your followers" : 
            "Select a video to share with your followers"}
        </p>
      </div>
      {/* details */}
      <div className="details">
        <div className="card-header">
          <div className="card-pic">
            <img
              src={user.Photo || "https://cdn-icons-png.flaticon.com/128/3177/3177440.png"}
              alt={user.name || "User"}
            />
          </div>
          <h5>{user.name || "User"}</h5>
        </div>
        <textarea 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          placeholder="Write a caption...."
          maxLength="2200"
        ></textarea>
        <div className="character-count">
          {body.length}/2200
        </div>
      </div>
    </div>
  );
}
