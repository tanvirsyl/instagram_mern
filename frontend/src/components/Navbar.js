import React, { useContext, useState } from "react";
import logo from "../img/logo.png";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import { FaHome, FaPlus, FaUser, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaHeart } from 'react-icons/fa';

export default function Navbar({ login }) {
  const { setModalOpen } = useContext(LoginContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt");
  
  const loginStatus = () => {
    const token = localStorage.getItem("jwt");
    if (login || token) {
      return (
        <>
          <Link to="/" className="nav-links" key="home">
            <li><FaHome /> Home</li>
          </Link>
          <Link to="/profile" className="nav-links" key="profile">
            <li><FaUser /> Profile</li>
          </Link>
          <Link to="/createPost" className="nav-links" key="createPost">
            <li><FaPlus /> Create</li>
          </Link>
          <Link to="/followingpost" className="nav-links" key="following">
            <li><FaHeart /> Following</li>
          </Link>
          <Link to={""} className="nav-links" key="logout">
            <li onClick={() => setModalOpen(true)}><FaSignOutAlt /> Logout</li>
          </Link>
        </>
      );
    } else {
      return (
        <>
          <Link to="/signup" className="nav-links" key="signup">
            <li><FaUserPlus /> Sign Up</li>
          </Link>
          <Link to="/signin" className="nav-links" key="signin">
            <li><FaSignInAlt /> Sign In</li>
          </Link>
        </>
      );
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="navbar">
      <div className="navbar-container">
        <Link to={token ? "/" : "/signin"} className="navbar-logo">
          <img src={logo} alt="Instagram" />
        </Link>
        
        {/* Mobile menu toggle */}
        <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <i className={isMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
        </div>
        
        <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          {loginStatus()}
        </ul>
      </div>
    </div>
  );
}