import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
console.log("Manesh is in Content History");

const PreviousContent = () => {
  const { user } = useUser();
  const [contents, setContents] = useState({ data: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [imageUrls, setImageUrls] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const dataFetchedRef = useRef(false);
  

  useEffect(() => {
    const fetchPreviousContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get_previous_content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress.emailAddress
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        console.log('Content data:', data);
        setContents(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching content history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.primaryEmailAddress?.emailAddress) {
      fetchPreviousContent();
    }
  }, [user]);

  const toggleSection = (date, time) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${date}-${time}`]: !prev[`${date}-${time}`]
    }));
  };

  const nextImage = (date, time) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [`${date}-${time}`]: (prev[`${date}-${time}`] || 0) + 1
    }));
  };

  const prevImage = (date, time) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [`${date}-${time}`]: (prev[`${date}-${time}`] || 0) - 1
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Extract date part from timestamp if it contains a hyphen
    if (dateString.includes('-')) {
      dateString = dateString.split('-')[0];
    }
    try {
      const date = new Date(
        dateString.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
      );
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Handle timestamp format like '20250110-114705002900'
    if (timeString.includes('-')) {
      timeString = timeString.split('-')[1];
    }
    try {
      // Extract hours, minutes, seconds from the timestamp
      const hours = timeString.substring(0, 2);
      const minutes = timeString.substring(2, 4);
      const seconds = timeString.substring(4, 6);
      return `${hours}:${minutes}:${seconds}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  };

  const handleImageLoad = (date, time, index) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [`${date}-${time}-${index}`]: 'loaded'
    }));
  };

  const handleImageError = (date, time, index, imgUrl) => {
    console.error(`Failed to load image: ${imgUrl}`);
    setImageLoadingStates(prev => ({
      ...prev,
      [`${date}-${time}-${index}`]: 'error'
    }));
  };

  const renderInstagramPost = (date, time, contentObj) => {
    console.log('Rendering post with content:', contentObj);
    
    const images = contentObj.images || [];
    const currentIndex = currentImageIndex[`${date}-${time}`] || 0;
    const metadata = contentObj.metadata || {};
    console.log('metadata 3');
    return (
      <div className="instagram-post" key={`${date}-${time}`}>
        <div className="post-header">
          <div className="post-user-info">
            <div className="post-avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <span className="username">{user?.username || 'User'}</span>
              <span className="timestamp">{formatTime(time)}</span>
            </div>
          </div>
        </div>

        <div className="post-image-container">
          {images && images.length > 0 ? (
            <div className="image-slider">
              <div 
                className="slider-track" 
                style={{ 
                  transform: `translateX(-${currentIndex * 100}%)`,
                  width: `${images.length * 100}%`
                }}
              >
                {images.map((img, index) => (
                  <div key={index} className="slide">
                    {imageLoadingStates[`${date}-${time}-${index}`] !== 'error' ? (
                      <img 
                        src={img.url}
                        alt={`Generated content ${index + 1}`}
                        className={`post-image ${imageLoadingStates[`${date}-${time}-${index}`] === 'loaded' ? '' : 'loading'}`}
                        loading="lazy"
                        onLoad={() => handleImageLoad(date, time, index)}
                        onError={() => handleImageError(date, time, index, img.url)}
                      />
                    ) : (
                      <div className="image-error-placeholder">
                        <p>Failed to load image</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <>
                  <button 
                    className="slider-button prev" 
                    onClick={() => prevImage(date, time)}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeftIcon className="slider-icon" />
                  </button>
                  <button 
                    className="slider-button next" 
                    onClick={() => nextImage(date, time)}
                    disabled={currentIndex === images.length - 1}
                  >
                    <ChevronRightIcon className="slider-icon" />
                  </button>
                  <div className="image-dots">
                    {images.map((_, index) => (
                      <span 
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(prev => ({
                          ...prev,
                          [`${date}-${time}`]: index
                        }))}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="no-images-placeholder">
              <p>No images available</p>
            </div>
          )}
        </div>

        {metadata && (
          <div className="post-content">
            {metadata.caption && (
              <div className="post-caption">
                <p className="caption-text">{metadata.caption}</p>
              </div>
            )}
            
            {metadata.call_to_action && (
              <div className="post-cta">
                <p className="cta-text">{metadata.call_to_action}</p>
              </div>
            )}
            
            {metadata.hashtags && (
              <div className="post-hashtags">
                {metadata.hashtags.split(' ').map((hashtag, index) => (
                  <span key={index} className="hashtag">
                    {hashtag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading-state"><p>Loading content history...</p></div>;
  if (error) return <div className="error-state"><p>Error: {error}</p></div>;

  return (
    <div className="history-container">
      {Object.entries(contents.data || {}).map(([date, dateData]) => (
        <div key={date} className="date-section">
          <h2 className="date-header">{formatDate(date)}</h2>
          <div className="time-sections">
            {Object.entries(dateData || {}).map(([time, contentObj]) => (
              <div key={`${date}-${time}`} className="time-section">
                <button 
                  className="time-header"
                  onClick={() => toggleSection(date, time)}
                >
                  <span>{formatTime(time)}</span>
                  {expandedSections[`${date}-${time}`] ? 
                    <ChevronUpIcon className="chevron-icon" /> : 
                    <ChevronDownIcon className="chevron-icon" />
                  }
                </button>
                {expandedSections[`${date}-${time}`] && (
                  <div className="post-container">
                    {renderInstagramPost(date, time, contentObj)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

PreviousContent.propTypes = {
  contents: PropTypes.shape({
    status: PropTypes.string,
    data: PropTypes.object
  })
};

PreviousContent.defaultProps = {
  contents: {
    status: '',
    data: {}
  }
};

const styles = `
.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.post-image.loading {
  opacity: 0.5;
}

.slide {
  width: 100%;
  flex-shrink: 0;
  position: relative;
}

.image-slider {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1;
}

.slider-track {
  display: flex;
  transition: transform 0.3s ease;
}

.post-content {
  padding: 12px 16px;
}

.post-caption {
  margin-bottom: 8px;
}

.caption-text {
  font-size: 14px;
  line-height: 1.5;
  color: #262626;
}

.post-cta {
  margin: 12px 0;
}

.cta-text {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.post-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.hashtag {
  color: #00376b;
  font-size: 14px;
}

.hashtag:hover {
  text-decoration: underline;
  cursor: pointer;
}

.image-error-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  color: #666;
  font-size: 14px;
}

.post-image.loading {
  opacity: 0.5;
  background-color: #f0f0f0;
}
`;

export default PreviousContent; 