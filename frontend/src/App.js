import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "./VideoPlayer.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Upload, Play, Image, Users, Crown, ShoppingBag, Menu, X, Star, Check, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, ChevronLeft, ChevronRight, Info } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// In-App Video Player Component
const VideoPlayer = ({ isOpen, onClose, videoSrc, title, description, poster }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const controlsTimeoutRef = useRef(null);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume;
      }
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isPlaying, currentTime, duration]);

  // Reset player state when opening
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      setIsBuffering(false);
      setShowControls(true);
      resetControlsTimeout();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
        <button className="video-player-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div 
          className="video-player-wrapper"
          onMouseMove={resetControlsTimeout}
          onMouseEnter={resetControlsTimeout}
        >
          <video
            ref={videoRef}
            className="video-player-video"
            src={videoSrc}
            poster={poster}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Loading Spinner */}
          {(isLoading || isBuffering) && (
            <div className="video-player-loading">
              <div className="loading-spinner"></div>
              <p>{isLoading ? 'Loading video...' : 'Buffering...'}</p>
            </div>
          )}

          {/* Play Button Overlay */}
          {!isPlaying && !isLoading && (
            <div className="video-player-play-overlay" onClick={togglePlay}>
              <div className="video-player-play-button">
                <Play size={48} />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className={`video-player-controls ${showControls ? 'show' : 'hide'}`}>
            <div className="video-player-progress-container">
              <div 
                className="video-player-progress-bar"
                ref={progressRef}
                onClick={handleProgressClick}
              >
                <div 
                  className="video-player-progress-filled"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            <div className="video-player-controls-bottom">
              <div className="video-player-controls-left">
                <button className="video-control-btn" onClick={togglePlay}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button className="video-control-btn" onClick={() => skipTime(-10)}>
                  <SkipBack size={20} />
                </button>

                <button className="video-control-btn" onClick={() => skipTime(10)}>
                  <SkipForward size={20} />
                </button>

                <div className="video-player-volume">
                  <button className="video-control-btn" onClick={toggleMute}>
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                </div>

                <div className="video-player-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="video-player-controls-right">
                <button className="video-control-btn" onClick={toggleFullscreen}>
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="video-player-info">
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Netflix-style Header
const NetflixHeader = ({ activeSection, setActiveSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`netflix-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-left">
        <div className="logo">
          <img 
            src="https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/ysim4ger_thumbnail_FD3537EB-E493-45C7-8E2E-1C6F4DC548FB.jpg"
            alt="Gizzle TV"
            className="logo-img"
          />
          <span className="logo-text">Gizzle TV</span>
        </div>
        
        <nav className="main-nav">
          <button 
            className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => setActiveSection('home')}
          >
            Home
          </button>
          <button 
            className={`nav-item ${activeSection === 'gizzle-tv' ? 'active' : ''}`}
            onClick={() => setActiveSection('gizzle-tv')}
          >
            Gizzle TV
          </button>
          <button 
            className={`nav-item ${activeSection === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveSection('videos')}
          >
            Videos
          </button>
          <button 
            className={`nav-item ${activeSection === 'pictures' ? 'active' : ''}`}
            onClick={() => setActiveSection('pictures')}
          >
            Pictures
          </button>
          <button 
            className={`nav-item ${activeSection === 'community' ? 'active' : ''}`}
            onClick={() => setActiveSection('community')}
          >
            Community
          </button>
        </nav>
      </div>

      <div className="header-right">
        <button 
          className={`nav-item ${activeSection === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveSection('subscriptions')}
        >
          <Crown size={16} />
          Premium
        </button>
        <button 
          className={`nav-item ${activeSection === 'store' ? 'active' : ''}`}
          onClick={() => setActiveSection('store')}
        >
          <ShoppingBag size={16} />
          Store
        </button>
        <div className="profile-menu">
          <div className="profile-avatar">
            <Users size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

// Netflix-style Hero Banner
const HeroBanner = ({ onPlayClick }) => {
  const heroContent = {
    src: "https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/hd2ztl4a_Rimmington.mp4",
    title: "Rimmington",
    description: "Experience the ultimate entertainment with Gizzle TV's exclusive content. Dive into a world of premium videos, community features, and unlimited streaming.",
    poster: "https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/ysim4ger_thumbnail_FD3537EB-E493-45C7-8E2E-1C6F4DC548FB.jpg"
  };

  return (
    <div className="hero-banner">
      <div className="hero-background">
        <img 
          src="https://images.unsplash.com/photo-1735212769704-d03b95dd1a14"
          alt="Hero Background"
          className="hero-bg-img"
        />
        <div className="hero-gradient"></div>
      </div>
      
      <div className="hero-content">
        <h1 className="hero-title">Welcome to Gizzle TV</h1>
        <p className="hero-description">
          {heroContent.description}
        </p>
        
        <div className="hero-buttons">
          <button 
            className="hero-btn primary"
            onClick={() => onPlayClick(heroContent)}
          >
            <Play size={20} />
            Play Now
          </button>
          <button className="hero-btn secondary">
            <Info size={20} />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};

// Content Row Component
const ContentRow = ({ title, items, onItemClick }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollRef.current;
    const scrollAmount = 320;
    
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="content-row">
      <h2 className="row-title">{title}</h2>
      <div className="row-container">
        <button className="scroll-btn left" onClick={() => scroll('left')}>
          <ChevronLeft size={24} />
        </button>
        
        <div className="content-slider" ref={scrollRef}>
          {items.map((item, index) => (
            <div 
              key={index} 
              className="content-card"
              onClick={() => onItemClick && onItemClick(item)}
            >
              <div className="card-image">
                <img src={item.image} alt={item.title} />
                <div className="card-overlay">
                  <button className="play-btn">
                    <Play size={24} />
                  </button>
                </div>
              </div>
              <div className="card-info">
                <h4>{item.title}</h4>
                <p>{item.category}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="scroll-btn right" onClick={() => scroll('right')}>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

// Upload Section Component
const UploadSection = ({ category }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadStatus('Uploading...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('description', `Uploaded ${category.slice(0, -1)}`);
    
    try {
      const response = await axios.post(`${API}/content/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadStatus('Upload successful!');
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed. Please try again.');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="netflix-upload-section">
      <h2>Upload Your Content</h2>
      <div 
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="file-input"
          onChange={handleFileInput}
          accept={category === 'videos' ? 'video/*' : 'image/*'}
          disabled={uploading}
        />
        <div className="upload-content">
          <Upload size={48} className="upload-icon" />
          <h3>Drag and drop your {category.slice(0, -1)} here</h3>
          <p>or click to browse files</p>
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('successful') ? 'success' : uploadStatus.includes('failed') ? 'error' : 'info'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [contentData, setContentData] = useState({
    trending: [],
    featured: [],
    community: [],
    recent: []
  });

  // Sample data for Netflix-style rows
  useEffect(() => {
    setContentData({
      trending: [
        { 
          title: "Gizzle Summer", 
          category: "Featured",
          image: "https://images.unsplash.com/photo-1735212769704-d03b95dd1a14",
          video: "https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/ttfzvpjp_GizzleSummer2.mp4"
        },
        { 
          title: "Entertainment Hub", 
          category: "Original",
          image: "https://images.unsplash.com/photo-1735212659418-715ca2ff7c20"
        },
        { 
          title: "Mobile Experience", 
          category: "Series",
          image: "https://images.unsplash.com/photo-1726935068680-73cef7e8412b"
        },
        { 
          title: "Streaming Tech", 
          category: "Documentary",
          image: "https://images.unsplash.com/photo-1685440663653-fa3e81dd109c"
        },
        { 
          title: "Platform Features", 
          category: "Original",
          image: "https://images.unsplash.com/photo-1616469829941-c7200edec809"
        }
      ],
      featured: [
        { 
          title: "Rimmington", 
          category: "Exclusive",
          image: "https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/ysim4ger_thumbnail_FD3537EB-E493-45C7-8E2E-1C6F4DC548FB.jpg",
          video: "https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/hd2ztl4a_Rimmington.mp4"
        },
        { 
          title: "Community Highlights", 
          category: "Community",
          image: "https://images.unsplash.com/photo-1735212769704-d03b95dd1a14"
        },
        { 
          title: "Live Streaming", 
          category: "Live",
          image: "https://images.unsplash.com/photo-1685440663653-fa3e81dd109c"
        }
      ]
    });
  }, []);

  const openVideoPlayer = (videoData) => {
    setCurrentVideo({
      src: videoData.video || videoData.src,
      title: videoData.title,
      description: videoData.description || `Watch ${videoData.title} on Gizzle TV`,
      poster: videoData.image || videoData.poster
    });
    setVideoPlayerOpen(true);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="netflix-home">
            <HeroBanner onPlayClick={openVideoPlayer} />
            <div className="content-rows">
              <ContentRow 
                title="Trending Now" 
                items={contentData.trending}
                onItemClick={openVideoPlayer}
              />
              <ContentRow 
                title="Gizzle TV Originals" 
                items={contentData.featured}
                onItemClick={openVideoPlayer}
              />
              <ContentRow 
                title="Continue Watching" 
                items={contentData.trending.slice(1, 4)}
                onItemClick={openVideoPlayer}
              />
            </div>
          </div>
        );
      
      case 'gizzle-tv':
        return (
          <div className="netflix-section">
            <div className="section-hero">
              <div className="section-hero-bg">
                <img src="https://customer-assets.emergentagent.com/job_media-upload-2/artifacts/ysim4ger_thumbnail_FD3537EB-E493-45C7-8E2E-1C6F4DC548FB.jpg" alt="Gizzle TV" />
                <div className="section-hero-gradient"></div>
              </div>
              <div className="section-hero-content">
                <h1>Gizzle TV Exclusives</h1>
                <p>Premium content created exclusively for our community</p>
              </div>
            </div>
            <div className="content-rows">
              <ContentRow 
                title="Featured Content" 
                items={contentData.featured}
                onItemClick={openVideoPlayer}
              />
            </div>
          </div>
        );
      
      case 'videos':
        return (
          <div className="netflix-section">
            <UploadSection category="videos" />
            <div className="content-rows">
              <ContentRow 
                title="Your Videos" 
                items={contentData.trending}
                onItemClick={openVideoPlayer}
              />
            </div>
          </div>
        );
      
      case 'pictures':
        return (
          <div className="netflix-section">
            <UploadSection category="pictures" />
            <div className="content-rows">
              <ContentRow 
                title="Your Pictures" 
                items={contentData.trending}
              />
            </div>
          </div>
        );
      
      case 'subscriptions':
        return (
          <div className="netflix-section subscription-plans">
            <div className="plans-header">
              <h1>Choose Your Plan</h1>
              <p>Unlock premium features and exclusive content</p>
            </div>
            
            <div className="plans-container">
              <div className="plan-card">
                <h3>Basic</h3>
                <div className="plan-price">$9.99<span>/month</span></div>
                <ul className="plan-features">
                  <li>Upload videos up to 100MB</li>
                  <li>5 videos per day</li>
                  <li>Basic community access</li>
                </ul>
                <button className="plan-btn">Choose Basic</button>
              </div>
              
              <div className="plan-card featured">
                <div className="popular-badge">Most Popular</div>
                <h3>Premium</h3>
                <div className="plan-price">$19.99<span>/month</span></div>
                <ul className="plan-features">
                  <li>Upload videos up to 1GB</li>
                  <li>Unlimited uploads</li>
                  <li>Premium community features</li>
                  <li>Live streaming access</li>
                </ul>
                <button className="plan-btn primary">Choose Premium</button>
              </div>
              
              <div className="plan-card">
                <h3>VIP</h3>
                <div className="plan-price">$39.99<span>/month</span></div>
                <ul className="plan-features">
                  <li>Unlimited everything</li>
                  <li>Priority support</li>
                  <li>Exclusive community access</li>
                  <li>Advanced analytics</li>
                </ul>
                <button className="plan-btn">Choose VIP</button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="netflix-section">
            <div className="coming-soon">
              <h1>Coming Soon</h1>
              <p>This section is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="netflix-app">
      <NetflixHeader 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      
      <main className="netflix-main">
        {renderContent()}
      </main>

      {/* Video Player */}
      {videoPlayerOpen && currentVideo && (
        <VideoPlayer
          isOpen={videoPlayerOpen}
          onClose={() => setVideoPlayerOpen(false)}
          videoSrc={currentVideo.src}
          title={currentVideo.title}
          description={currentVideo.description}
          poster={currentVideo.poster}
        />
      )}
    </div>
  );
}

export default App;