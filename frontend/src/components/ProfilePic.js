import React, { useState, useEffect, useRef } from "react";
import "./ProfilePic.css";
import { toast } from 'react-toastify';
import config from "../config";
import { FaCamera, FaUpload, FaTrash } from 'react-icons/fa';

export default function ProfilePic({ changeprofile }) {
  const hiddenFileInput = useRef(null);
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");

  // Toast functions
  const notifySuccess = (msg) => toast.success(msg);
  const notifyError = (msg) => toast.error(msg);

  // posting image to cloudinary
  const postDetails = () => {
    if (!image) return;
    
    // Show loading toast
    const loadingToast = toast.loading("Uploading image...");
    
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "insta-clone");
    data.append("cloud_name", "cantacloud2");
    
    fetch("https://api.cloudinary.com/v1_1/cantacloud2/image/upload", {
      method: "post",
      body: data,
    })
      .then((res) => res.json())
      .then((data) => {
        toast.dismiss(loadingToast);
        if (data.error) {
          notifyError("Error uploading image");
        } else {
          setUrl(data.url);
          notifySuccess("Image uploaded successfully");
        }
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        notifyError("Error uploading image");
        console.log(err);
      });
  };

  const postPic = () => {
    if (!url) return;
    
    // Show loading toast
    const loadingToast = toast.loading("Updating profile picture...");
    
    // saving post to mongodb
    fetch(`${config.apiUrl}/uploadProfilePic`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        pic: url,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        toast.dismiss(loadingToast);
        if (data.error) {
          notifyError(data.error);
        } else {
          notifySuccess("Profile picture updated successfully");
          // Update user in localStorage with new profile pic
          const user = JSON.parse(localStorage.getItem("user"));
          user.Photo = url;
          localStorage.setItem("user", JSON.stringify(user));
          
          changeprofile();
          setTimeout(() => window.location.reload(), 1000);
        }
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        notifyError("Error updating profile picture");
        console.log(err);
      });
  };

  const handleClick = () => {
    hiddenFileInput.current.click();
  };
  
  const removeProfilePic = () => {
    // Show loading toast
    const loadingToast = toast.loading("Removing profile picture...");
    
    fetch(`${config.apiUrl}/removeProfilePic`, {
      method: "put",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        toast.dismiss(loadingToast);
        if (data.error) {
          notifyError(data.error);
        } else {
          notifySuccess("Profile picture removed");
          
          // Update user in localStorage with default profile pic
          const user = JSON.parse(localStorage.getItem("user"));
          user.Photo = "";
          localStorage.setItem("user", JSON.stringify(user));
          
          changeprofile();
          setTimeout(() => window.location.reload(), 1000);
        }
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        notifyError("Error removing profile picture");
        console.log(err);
      });
  };

  useEffect(() => {
    if (image) {
      postDetails();
    }
  }, [image]);
  
  useEffect(() => {
    if (url) {
      postPic();
    }
  }, [url]);
  return (
    <div className="profilePic-overlay">
      <div className="profilePic-modal">
        <div className="profilePic-header">
          <h2>Change Profile Photo</h2>
        </div>
        
        <div className="profilePic-option">
          <button
            className="profilePic-btn upload"
            onClick={handleClick}
          >
            <FaUpload className="profilePic-icon" /> Upload Photo
          </button>
          <input
            type="file"
            ref={hiddenFileInput}
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImage(e.target.files[0]);
              }
            }}
          />
        </div>
        
        <div className="profilePic-option">
          <button 
            className="profilePic-btn remove"
            onClick={removeProfilePic}
          >
            <FaTrash className="profilePic-icon" /> Remove Current Photo
          </button>
        </div>
        
        <div className="profilePic-option">
          <button
            className="profilePic-btn cancel"
            onClick={changeprofile}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
