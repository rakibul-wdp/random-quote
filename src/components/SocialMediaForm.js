import React, { useState, useEffect } from 'react';
import { FiSend, FiImage, FiX, FiPlusSquare, FiGrid, FiPaperclip, FiZoomIn, FiRefreshCw, FiCommand } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './SocialMediaForm.css';
import { useUser } from '@clerk/clerk-react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { RiImageLine, RiVideoLine, RiLayoutGridLine } from 'react-icons/ri';
import ReactPlayer from 'react-player';

const SocialMediaForm = () => {
  const [activeTab, setActiveTab] = useState('create');
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    contentType: '',
    description: '',
    image: { file: null, fileName: '' },
    imageVariation: '',
    text_to_image_description: ''
  });

  const [errors, setErrors] = useState({
    contentType: '',
    description: '',
    image: '',
    text_to_image_description: ''
  });

  const [generatedContent, setGeneratedContent] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mediaType, setMediaType] = useState('image');

  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  const fieldHelp = {
    contentType: { title: 'Content Type', description: "Select the type of content you want to generate" },
    description: { title: 'Description', description: "Provide detailed information about your content" },
    image: { title: 'Image', description: "Upload an image to enhance your content (JPG, PNG up to 5MB)" }
  };

  // Enhanced validation messages
  const validationMessages = {
    contentType: {
      required: 'Please select a content type to continue',
      invalid: 'Invalid content type selected'
    },
    description: {
      required: 'Please provide a description of your content',
      tooShort: 'Description should be at least 10 characters',
      tooLong: 'Description cannot exceed 500 characters'
    },
    image: {
      required: 'Please upload an image',
      invalidType: 'Only JPG and PNG images are allowed',
      tooLarge: 'Image size must be less than 5MB',
      invalidDimensions: 'Image dimensions should be at least 400x400 pixels'
    },
    imageVariation: {
      required: 'Please select an image variation type',
      invalid: 'Invalid image variation selected'
    },
    text_to_image_description: {
      required: 'Please provide a description for image generation',
      tooShort: 'Description should be at least 10 characters',
      tooLong: 'Description cannot exceed 500 characters'
    }
  };

  // Enhanced validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      contentType: '',
      description: '',
      image: '',
      text_to_image_description: ''
    };

    // Content Type validation
    if (!formData.contentType) {
      newErrors.contentType = validationMessages.contentType.required;
      isValid = false;
    } else if (!['post', 'story', 'reels'].includes(formData.contentType)) {
      newErrors.contentType = validationMessages.contentType.invalid;
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = validationMessages.description.required;
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = validationMessages.description.tooShort;
      isValid = false;
    } else if (formData.description.length > 500) {
      newErrors.description = validationMessages.description.tooLong;
      isValid = false;
    }

    // Image validation
    if (!formData.image.file) {
      newErrors.image = validationMessages.image.required;
      isValid = false;
    }

    // Text to image description validation
    if (formData.contentType === 'post' && formData.imageVariation === 'text_to_image' && !formData.text_to_image_description.trim()) {
      newErrors.text_to_image_description = validationMessages.text_to_image_description.required;
      isValid = false;
    } else if (formData.text_to_image_description.length < 10 || formData.text_to_image_description.length > 500) {
      newErrors.text_to_image_description = validationMessages.text_to_image_description.tooShort || validationMessages.text_to_image_description.tooLong;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Enhanced image validation function
  const handleImageChange = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Reset previous errors
    setErrors(prev => ({ ...prev, image: '' }));

    // File type validation
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        image: validationMessages.image.invalidType
      }));
      toast.error(validationMessages.image.invalidType);
      return;
    }

    // File size validation
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        image: validationMessages.image.tooLarge
      }));
      toast.error(validationMessages.image.tooLarge);
      return;
    }

    // Image dimensions validation
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width < 400 || dimensions.height < 400) {
        setErrors(prev => ({
          ...prev,
          image: validationMessages.image.invalidDimensions
        }));
        toast.error(validationMessages.image.invalidDimensions);
        return;
      }
    } catch (error) {
      console.error('Error checking image dimensions:', error);
      toast.error('Error validating image. Please try again.');
      return;
    }

    // If all validations pass, update form data
    setFormData(prev => ({
      ...prev,
      image: { file, fileName: file.name }
    }));
    toast.success('Image uploaded successfully!');
  };

  // Helper function to get image dimensions
  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Real-time description validation
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      description: value
    }));

    // Real-time validation feedback
    if (value.length < 10 && value.length > 0) {
      setErrors(prev => ({
        ...prev,
        description: `${10 - value.length} more characters needed`
      }));
    } else if (value.length >= 10) {
      setErrors(prev => ({
        ...prev,
        description: ''
      }));
    }
  };

  // Add handler for text-to-image description
  const handleTextToImageDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      text_to_image_description: value
    }));

    // Real-time validation feedback
    if (value.length < 10 && value.length > 0) {
      setErrors(prev => ({
        ...prev,
        text_to_image_description: `${10 - value.length} more characters needed`
      }));
    } else if (value.length >= 10) {
      setErrors(prev => ({
        ...prev,
        text_to_image_description: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('contentType', formData.contentType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('imageVariation', formData.imageVariation);
      formDataToSend.append('email', user.primaryEmailAddress.emailAddress);
      if (formData.image.file) {
        formDataToSend.append('image', formData.image.file);
      }
      if (formData.text_to_image_description) {
        formDataToSend.append('text_to_image_description', formData.text_to_image_description);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/generate_social_media_content`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.status}`);
      }

      const responseData = await response.json();
      setGeneratedContent(responseData);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error(`Failed to generate content: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaUrls = (content) => {
    if (!content) return [];
    const urls = Object.keys(content)
      .filter(key => key.startsWith('prompt'))
      .map(key => {
        const url = content[key];
        const isVideo = url.match(/\.(mp4|mov|avi)$/i);
        console.log('Media URL:', url, 'Is Video:', !!isVideo);
        return {
          url: url,
          type: isVideo ? 'video' : 'image'
        };
      });
    console.log('Processed Media URLs:', urls);
    return urls;
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => 
      prev === (generatedContent ? getMediaUrls(generatedContent[0]).length - 1 : 0) ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? (generatedContent ? getMediaUrls(generatedContent[0]).length - 1 : 0) : prev - 1
    );
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    const mediaUrls = getMediaUrls(generatedContent[0]);
    const content = generatedContent[1];

    return (
      <div className="generated-content-section">
        <div className="instagram-post">
          <div className="post-header">
            <div className="post-user-info">
              <div className="post-avatar">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.username?.[0]?.toUpperCase() || 'B'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <span className="username">{user?.username || 'Your Business'}</span>
                {/* <span className="location">Your Location</span> */}
              </div>
            </div>
            <button className="more-options-button" aria-label="More options">
              <svg viewBox="0 0 24 24" className="more-icon">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
              </svg>
            </button>
          </div>

          <div className="post-media-container">
            {mediaUrls.length > 0 && (
              <div className="media-slider">
                <div 
                  className="slider-track" 
                  style={{ 
                    transform: `translateX(-${currentImageIndex * 100}%)`,
                    width: `${mediaUrls.length * 100}%`
                  }}
                >
                  {mediaUrls.map((media, index) => {
                    console.log('Rendering media:', media, 'Current Index:', index, 'Is Current:', index === currentImageIndex);
                    return (
                      <div key={index} className="slide">
                        {media.type === 'video' ? (
                          <>
                            {mediaLoading && <div className="media-loading">Loading video...</div>}
                            {mediaError && <div className="media-error">Error loading video: {mediaError}</div>}
                            <ReactPlayer
                              url={media.url}
                              className="post-video"
                              width="100%"
                              height="100%"
                              controls
                              playing={index === currentImageIndex}
                              playsinline
                              fallback={<div>Loading video...</div>}
                              onError={(e) => {
                                console.error('Video playback error:', e);
                                setMediaError(e?.message || 'Failed to load video');
                              }}
                              onReady={() => {
                                console.log('Video ready to play');
                                setMediaLoading(false);
                                setMediaError(null);
                              }}
                              onBuffer={() => setMediaLoading(true)}
                              onBufferEnd={() => setMediaLoading(false)}
                              config={{
                                file: {
                                  attributes: {
                                    controlsList: 'nodownload',
                                    disablePictureInPicture: true
                                  },
                                  forceVideo: true
                                }
                              }}
                            />
                          </>
                        ) : (
                          <img 
                            src={media.url} 
                            alt={`Generated content ${index + 1}`}
                            className="post-image"
                            loading="lazy"
                            onError={(e) => console.error('Image loading error:', e)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {mediaUrls.length > 1 && (
                  <>
                    <button 
                      className="slider-button prev" 
                      onClick={prevImage}
                      aria-label="Previous media"
                    >
                      <ChevronLeftIcon className="slider-icon" />
                    </button>
                    <button 
                      className="slider-button next" 
                      onClick={nextImage}
                      aria-label="Next media"
                    >
                      <ChevronRightIcon className="slider-icon" />
                    </button>
                    <div className="image-dots">
                      {mediaUrls.map((_, index) => (
                        <span 
                          key={index}
                          className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="post-content">
            <div className="post-actions">
              <div className="action-icons-left">
                <button className="action-button" aria-label="Like">
                  <svg className="action-icon" viewBox="0 0 24 24">
                    <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.792 1.972 4.21 4.21 0 013.792-1.972z"/>
                  </svg>
                </button>
                <button className="action-button" aria-label="Comment">
                  <svg className="action-icon" viewBox="0 0 24 24">
                    <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z"/>
                  </svg>
                </button>
                <button className="action-button" aria-label="Share">
                  <svg className="action-icon" viewBox="0 0 24 24">
                    <path d="M22 3L9.218 10.083M11.698 20.334L22 3.001H2l7.218 7.083 2.48 10.25z"/>
                  </svg>
                </button>
              </div>
              <button className="action-button save-button" aria-label="Save">
                <svg className="action-icon" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </button>
            </div>

            <div className="engagement-info">
              <span className="likes-count">1.2k likes</span>
            </div>

            <div className="post-caption">
              {/* <span className="username">{user?.username || 'Your Business'}</span> */}
              <span className="caption-text">{content.caption}</span>
            </div>

            <div className="post-cta">
              {content.call_to_action}
            </div>

            <div className="post-hashtags">
              {content.hashtags.split(' ').map((hashtag, index) => (
                <span key={index} className="hashtag">
                  {hashtag}
                </span>
              ))}
            </div>

            <div className="post-time">
              <span className="timestamp">Just now</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Clean up function to reset state when component unmounts
    return () => {
      setGeneratedContent(null);
      setCurrentImageIndex(0);
    };
  }, []);

  // Add this to display content type errors
  const renderContentTypeError = () => {
    if (errors.contentType) {
      return (
        <div className="error-message content-type-error">
          {errors.contentType}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="social-media-container">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <FiPlusSquare className="tab-icon" />
          Create
        </button>
        <button 
          className={`tab-button ${activeTab === 'previous' ? 'active' : ''}`}
          onClick={() => setActiveTab('previous')}
        >
          <FiGrid className="tab-icon" />
          Posts
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="social-media-form-container">
          {/* <div className="create-header">
            <h1>Create New Post</h1>
          </div> */}

          <form className="social-media-form" onSubmit={handleSubmit}>
            <div className="content-creation-area">
              {/* Content Creation Section */}
              <div className="content-input-section">
              <h3 className="section-title">What content do you want to create?</h3>
                <div className="content-type-grid">
                  <label className={`content-type-option ${formData.contentType === 'post' ? 'selected' : ''} ${errors.contentType ? 'error' : ''}`}>
                    <input
                      type="radio"
                      name="contentType"
                      value="post"
                      checked={formData.contentType === 'post'}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          contentType: e.target.value
                        }));
                        // Clear error when user selects an option
                        setErrors(prev => ({
                          ...prev,
                          contentType: ''
                        }));
                      }}
                    />
                    <RiImageLine className="content-type-icon" />
                    <span>Post</span>
                  </label>
                  
                  <label className={`content-type-option ${formData.contentType === 'story' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="contentType"
                      value="story"
                      checked={formData.contentType === 'story'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contentType: e.target.value
                      }))}
                    />
                    <RiLayoutGridLine className="content-type-icon" />
                    <span>Story</span>
                  </label>
                  
                  <label className={`content-type-option ${formData.contentType === 'reels' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="contentType"
                      value="reels"
                      checked={formData.contentType === 'reels'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contentType: e.target.value
                      }))}
                    />
                    <RiVideoLine className="content-type-icon" />
                    <span>Reel</span>
                  </label>
                </div>

                {renderContentTypeError()}

                {/* Only show image variation section when content type is 'post' */}
                {formData.contentType === 'post' && (
                  <div className="image-variation-section">
                    <h3 className="section-title">Tell us how to generate your image</h3>
                    <div className="image-variation-grid">
                      <label className={`variation-option ${formData.imageVariation === 'upscale' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="imageVariation"
                          value="upscale"
                          checked={formData.imageVariation === 'upscale'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            imageVariation: e.target.value
                          }))}
                        />
                        <FiZoomIn className="variation-icon" />
                        <div className="variation-text">
                          <span>Upscale</span>
                          <small>Enhance image quality to HD resolution</small>
                        </div>
                      </label>

                      <label className={`variation-option ${formData.imageVariation === 'background_replace' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="imageVariation"
                          value="background_replace"
                          checked={formData.imageVariation === 'background_replace'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            imageVariation: e.target.value
                          }))}
                        />
                        <FiRefreshCw className="variation-icon" />
                        <div className="variation-text">
                          <span>Background Replace</span>
                          <small>Keep your product, change the background</small>
                        </div>
                      </label>

                      <label className={`variation-option ${formData.imageVariation === 'text_to_image' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="imageVariation"
                          value="text_to_image"
                          checked={formData.imageVariation === 'text_to_image'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            imageVariation: e.target.value
                          }))}
                        />
                        <FiCommand className="variation-icon" />
                        <div className="variation-text">
                          <span>Text to Image</span>
                          <small>Generate image from your description</small>
                        </div>
                      </label>

                      <label className={`variation-option ${formData.imageVariation === 'image_to_image' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="imageVariation"
                          value="image_to_image"
                          checked={formData.imageVariation === 'image_to_image'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            imageVariation: e.target.value
                          }))}
                        />
                        <FiImage className="variation-icon" />
                        <div className="variation-text">
                          <span>Image to Image</span>
                          <small>Generate variations based on your image</small>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Show image upload and chat input for post type and specific image variations */}
                {formData.contentType === 'post' && 
                  (formData.imageVariation === 'image_to_image' || 
                   formData.imageVariation === 'upscale' || 
                   formData.imageVariation === 'background_replace') && (
                  <>
                    <div className="image-upload-section">
                      <h3 className="section-title">Upload your image and describe your image in detail</h3>
                      <label htmlFor="image" className={`upload-icon-label ${errors.image ? 'error' : ''}`}>
                        {formData.image.file ? (
                          <div className="attachment-indicator">
                            <FiPaperclip className="attached-icon" />
                            <FiX 
                              className="remove-attachment"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFormData(prev => ({
                                  ...prev,
                                  image: { file: null, fileName: '' }
                                }));
                              }}
                            />
                          </div>
                        ) : (
                          <FiImage className="upload-icon" />
                        )}
                      </label>
                      <input
                        type="file"
                        id="image"
                        onChange={(e) => handleImageChange(e.target.files[0])}
                        accept="image/jpeg,image/png"
                        className="hidden-input"
                      />
                      {errors.image && (
                        <div className="error-message image-error">
                          {errors.image}
                        </div>
                      )}
                    </div>

                    <div className="chat-style-input">
                      <textarea
                        className={`content-textarea ${errors.description ? 'error' : ''}`}
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Image description..."
                        rows="2"
                        maxLength={500}
                        aria-label="Content description"
                      />
                      {errors.description && (
                        <div className="error-message description-error">
                          {errors.description}
                        </div>
                      )}
                      <div className="textarea-footer">
                        <div className="textarea-footer-left">
                          <span className="character-count">
                            {formData.description.length}/500
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Add text-to-image description input */}
                {formData.contentType === 'post' && formData.imageVariation === 'text_to_image' && (
                  <div className="chat-style-input">
                    <h3 className="section-title">Describe the image you want to generate</h3>
                    <textarea
                      className={`content-textarea ${errors.text_to_image_description ? 'error' : ''}`}
                      value={formData.text_to_image_description}
                      onChange={handleTextToImageDescriptionChange}
                      placeholder="Describe in detail the image you want to generate..."
                      rows="2"
                      maxLength={500}
                      aria-label="Text to image description"
                    />
                    {errors.text_to_image_description && (
                      <div className="error-message description-error">
                        {errors.text_to_image_description}
                      </div>
                    )}
                    <div className="textarea-footer">
                      <div className="textarea-footer-left">
                        <span className="character-count">
                          {formData.text_to_image_description.length}/500
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Separate Submit Button - always visible */}
                <div className="submit-button-container">
                  <motion.button
                    type="submit"
                    className="submit-button"
                    disabled={isLoading || !formData.description.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={isLoading ? "Generating content..." : "Generate Content"}
                  >
                    {isLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <>
                        <FiSend className="submit-icon" />
                        <span>Generate Content</span>
                      </>
                    )}
                  </motion.button>
                </div>

              </div>
            </div>
          </form>

          {/* Generated Content Display */}
          {generatedContent && renderGeneratedContent()}
        </div>
      ) : (
        <PreviousContent />
      )}
    </div>
  );
};

const PreviousContent = () => {
  const [content, setContent] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get_previous_content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress.emailAddress,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load previous content');
      }
    };

    if (user?.primaryEmailAddress?.emailAddress) {
      fetchContent();
    }
  }, [user]);

  const renderContent = (contentData) => {
    if (!contentData?.data) return null;

    // Extract dates and sort them in descending order
    const dates = Object.keys(contentData.data).sort((a, b) => b.localeCompare(a));

    return dates.map(date => {
      const timeSlots = contentData.data[date];
      
      return Object.entries(timeSlots).map(([timeSlot, data]) => {
        const { images, metadata, timestamp } = data;

        return (
          <div key={timestamp} className="instagram-post">
            <div className="post-header">
              <div className="post-user-info">
                <div className="post-avatar">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.username?.[0]?.toUpperCase() || 'B'}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <span className="username">{user?.username || 'Your Business'}</span>
                </div>
              </div>
            </div>

            <div className="post-image-container">
              {images && images.length > 0 && (
                <div className="image-slider">
                  <div 
                    className="slider-track" 
                    style={{ 
                      transform: `translateX(-${currentImageIndex * 100}%)`,
                      width: `${images.length * 100}%`
                    }}
                  >
                    {images.map((image, index) => (
                      <div key={index} className="slide">
                        <img 
                          src={image.url} 
                          alt={`Content ${index + 1}`}
                          className="post-image"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        className="slider-button prev" 
                        onClick={() => setCurrentImageIndex(prev => 
                          prev === 0 ? images.length - 1 : prev - 1
                        )}
                        aria-label="Previous image"
                      >
                        <ChevronLeftIcon className="slider-icon" />
                      </button>
                      <button 
                        className="slider-button next" 
                        onClick={() => setCurrentImageIndex(prev => 
                          prev === images.length - 1 ? 0 : prev + 1
                        )}
                        aria-label="Next image"
                      >
                        <ChevronRightIcon className="slider-icon" />
                      </button>
                      <div className="image-dots">
                        {images.map((_, index) => (
                          <span 
                            key={index}
                            className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="post-content">
              <div className="post-actions">
                {/* ... existing post actions ... */}
              </div>
              
              <div className="post-caption">
                {metadata && (
                  <React.Suspense fallback={<div>Loading content...</div>}>
                    <AsyncContent fetchFunction={() => fetch(metadata.url).then(res => res.json())} />
                  </React.Suspense>
                )}
              </div>

              <div className="post-time">
                <span className="timestamp">{formatTimestamp(timestamp)}</span>
              </div>
            </div>
          </div>
        );
      });
    });
  };

  return (
    <div className="previous-content-container">
      {content && renderContent(content)}
    </div>
  );
};

// Update AsyncContent component to handle the new data structure
const AsyncContent = ({ fetchFunction }) => {
  const [contentData, setContentData] = useState(null);

  useEffect(() => {
    fetchFunction().then(data => {
      if (data) {
        setContentData(data);
      }
    });
  }, [fetchFunction]);

  if (!contentData) return <div>Loading...</div>;

  return (
    <>
      <span className="caption-text">{contentData.caption}</span>
      <div className="post-cta">{contentData.call_to_action}</div>
      {contentData.hashtags && (
        <div className="post-hashtags">
          {contentData.hashtags.split(' ').map((hashtag, index) => (
            <span key={index} className="hashtag">{hashtag}</span>
          ))}
        </div>
      )}
    </>
  );
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  try {
    // Split timestamp into date and time parts
    const [date, time] = timestamp.split('-');
    
    // Parse date (YYYYMMDD)
    const year = date.slice(0, 4);
    const month = parseInt(date.slice(4, 6)) - 1; // Months are 0-based
    const day = date.slice(6, 8);
    
    // Parse time (HHMMSSffffff)
    const hours = time.slice(0, 2);
    const minutes = time.slice(2, 4);
    const seconds = time.slice(4, 6);
    
    const formattedDate = new Date(year, month, day, hours, minutes, seconds);
    
    // Calculate time difference
    const now = new Date();
    const diffInSeconds = Math.floor((now - formattedDate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    // For older posts, return the actual date
    return formattedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

export default SocialMediaForm;
