import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  TrashIcon, 
  LinkIcon, 
  DocumentIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  EyeIcon, 
  CloudArrowUpIcon,
  ArrowPathIcon as SpinnerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import './RagForm.css';

// Utility functions
const getFileName = (url) => {
  try {
    const urlPath = new URL(url).pathname;
    const fileName = urlPath.split('/').pop();
    return decodeURIComponent(fileName);
  } catch (e) {
    return 'File';
  }
};

const getUploadDate = (url) => {
  try {
    const urlParams = new URL(url).searchParams;
    const dateParam = urlParams.get('uploadDate');
    if (dateParam) {
      return new Date(dateParam).toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  } catch (e) {
    return new Date().toLocaleDateString();
  }
};

const sectionTitles = {
  about: 'Company document',
  policies: 'Policies',
  trainingmanual: 'Training Manuals',
  inventory: 'Product Inventory',
  website: 'Website',
};

const sectionDescriptions = {
  about: 'Upload documents about your company history, mission, vision, and general information.',
  policies: 'Upload your company policies and guidelines.',
  trainingmanual: 'Upload training manuals for your employees.',
  inventory: 'Upload your product inventory files.',
  website: 'Enter the URL of your company website.',
};

const RagForm = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    business_name: '',
    assistant_name: '',
    about_me: '',
    language: '',
    about: { file: null, url: '', fileName: '', toastMessage: '' },
    policies: { file: null, url: '', fileName: '', toastMessage: '' },
    trainingmanual: { file: null, url: '', fileName: '', toastMessage: '' },
    inventory: { file: null, url: '', fileName: '', toastMessage: '' },
    website: { url: '', toastMessage: '' },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [loadingToast, setLoadingToast] = useState(''); // State for loading toast message
  const [uploadedFiles, setUploadedFiles] = useState({
    about: '',
    policies: '',
    trainingmanual: '',
    inventory: '',
    website: ''
  });
  const [deletingStates, setDeletingStates] = useState({});
  const [uploadingStates, setUploadingStates] = useState({});
  const [fetchingFiles, setFetchingFiles] = useState({
    about: true,
    policies: true,
    trainingmanual: true,
    inventory: true,
    website: true
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    section: null
  });
  const [formLoading, setFormLoading] = useState({
    business_name: true,
    assistant_name: true,
    about_me: true,
    language: true
  });
  const [lastJobId, setLastJobId] = useState(localStorage.getItem('setupJobId'));

  const uploadFile = async (section, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', section);
      formData.append('email', user.primaryEmailAddress.emailAddress);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/create_rag`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return {
        success: true,
        fileUrl: data.fileUrl
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  useEffect(() => {
    const fetchUserStates = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get_user_states`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress.emailAddress
          })
        });

        if (!response.ok) throw new Error('Failed to fetch user states');

        const states = await response.json();
        
        // Update local state from Firebase states
        const newDeletingStates = {};
        const newUploadingStates = {};
        
        Object.entries(states).forEach(([section, sectionStates]) => {
          if (sectionStates.delete) {
            newDeletingStates[section] = sectionStates.delete;
          }
          if (sectionStates.upload) {
            newUploadingStates[section] = sectionStates.upload;
          }
        });

        setDeletingStates(newDeletingStates);
        setUploadingStates(newUploadingStates);
      } catch (error) {
        console.error('Error fetching user states:', error);
      }
    };

    fetchUserStates();
  }, [user.primaryEmailAddress.emailAddress]);

  const updateUserState = async (section, stateType, status) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/update_user_state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress,
          section,
          state_type: stateType,
          status
        })
      });
    } catch (error) {
      console.error('Error updating user state:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('deletingStates', JSON.stringify(deletingStates));
  }, [deletingStates]);

  useEffect(() => {
    localStorage.setItem('uploadingStates', JSON.stringify(uploadingStates));
  }, [uploadingStates]);

  const checkJobStatus = async () => {
    if (!lastJobId) return false;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/check_job_status/${lastJobId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        setLastJobId(null);
        localStorage.removeItem('setupJobId');
        toast.dismiss();
        return true;
      } else if (data.status === 'processing' || data.status === 'queued') {
        // Keep loading states active while processing
        setFetchingFiles({
          about: true,
          policies: true,
          trainingmanual: true,
          inventory: true,
          website: true
        });
        setFormLoading({
          business_name: true,
          assistant_name: true,
          about_me: true,
          language: true
        });
        
        toast.dismiss();
        toast.loading('We are setting up all your data. You can get going in few minutes...', {
          duration: Infinity
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error checking job status:', error);
      return false;
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      // If there's a job ID, only check status
      if (lastJobId) {
        await checkJobStatus();
        return; // Exit early, don't fetch files while job is processing
      }

      // Only proceed with fetching data if no active job
      setFetchingFiles({
        about: true,
        policies: true,
        trainingmanual: true,
        inventory: true,
        website: true
      });
      setFormLoading({
        business_name: true,
        assistant_name: true,
        about_me: true,
        language: true
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_uploaded_files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress
        })
      });

      if (!response.ok) throw new Error('Failed to fetch uploaded files');

      const data = await response.json();
      setUploadedFiles(data);
      
      // Update formData with values
      setFormData(prev => ({
        ...prev,
        business_name: data.business_name || '',
        assistant_name: data.assistant_name || '',
        about_me: data.about_me || '',
        language: data.language || '',
        about: { ...prev.about, url: data.about || '' },
        policies: { ...prev.policies, url: data.policies || '' },
        trainingmanual: { ...prev.trainingmanual, url: data.trainingmanual || '' },
        inventory: { ...prev.inventory, url: data.inventory || '' },
        website: { url: data.website || '', toastMessage: '' }
      }));

      // Clear loading states after successful fetch
      setFetchingFiles({
        about: false,
        policies: false,
        trainingmanual: false,
        inventory: false,
        website: false
      });
      setFormLoading({
        business_name: false,
        assistant_name: false,
        about_me: false,
        language: false
      });

    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      // Clear loading states on error
      setFetchingFiles({
        about: false,
        policies: false,
        trainingmanual: false,
        inventory: false,
        website: false
      });
      setFormLoading({
        business_name: false,
        assistant_name: false,
        about_me: false,
        language: false
      });
    }
  };

  // useEffect for handling initial load and polling
  useEffect(() => {
    fetchUploadedFiles();

    // Set up polling only if there's an active job
    if (lastJobId) {
      const interval = setInterval(fetchUploadedFiles, 5000);
      return () => clearInterval(interval);
    }
  }, [user.primaryEmailAddress.emailAddress, lastJobId]);

  const handleFileChange = (section, file) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], file, fileName: file.name },
    }));
  };

  const handleUrlChange = (section, url) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], url },
    }));
  };

  // Add validation state
  const [errors, setErrors] = useState({
    business_name: '',
    assistant_name: '',
    about_me: '',
    language: '',
    website: '',
    documents: {
      about: '',
      policies: '',
      trainingmanual: '',
      inventory: ''
    }
  });
  const handleToggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleUpload = async (section) => {
    try {
      setUploadingStates(prev => ({ ...prev, [section]: 'uploading' }));
      const response = await uploadFile(section, formData[section].file);
      
      if (response.success) {
        setUploadingStates(prev => ({ ...prev, [section]: 'success' }));
        // After successful upload, fetch the file URL from Google Storage
        const fileUrl = response.fileUrl; // Assuming your backend returns the file URL
        setUploadedFiles(prev => ({
          ...prev,
          [section]: fileUrl
        }));
        
        // Clear the selected file state
        setFormData(prev => ({
          ...prev,
          [section]: { ...prev[section], file: null, fileName: '' }
        }));
      } else {
        setUploadingStates(prev => ({ ...prev, [section]: 'error' }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingStates(prev => ({ ...prev, [section]: 'error' }));
    }
  };

  const handleDelete = async (section, e) => {
    if (e) e.preventDefault();
    
    if (!deleteModal.isOpen) {
      // Show confirmation modal
      setDeleteModal({
        isOpen: true,
        section: section
      });
      return;
    }

    // If we're here, user confirmed deletion
    setDeleteModal({ isOpen: false, section: null });
    
    try {
      setDeletingStates(prev => ({ ...prev, [section]: 'deleting' }));
      await updateUserState(section, 'delete', 'deleting');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/clear_rag_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/form-data',
        },
        body: new FormData().append('email', user.primaryEmailAddress.emailAddress)
                          .append('doc_type', section),
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setDeletingStates(prev => ({ ...prev, [section]: 'success' }));
      await updateUserState(section, 'delete', 'success');
      
      // Clear the uploaded file for this section
      setUploadedFiles(prev => ({
        ...prev,
        [section]: ''
      }));

      setTimeout(() => {
        setDeletingStates(prev => ({ ...prev, [section]: null }));
      }, 2000);

    } catch (error) {
      console.error('Delete error:', error);
      setDeletingStates(prev => ({ ...prev, [section]: 'error' }));
      await updateUserState(section, 'delete', 'error');
    }
  };

  // Add a function to fetch existing files when component mounts
  useEffect(() => {
    const fetchExistingFiles = async () => {
      try {
        const response = await fetch('/api/files'); // Your endpoint to get existing files
        const data = await response.json();
        
        if (data.success) {
          // Update uploadedFiles state with existing files
          setUploadedFiles(data.files);
        }
      } catch (error) {
        console.error('Error fetching existing files:', error);
      }
    };

    fetchExistingFiles();
  }, []);

  return (
    <>
      <motion.div className="rag-form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* <div className="form-header">
          <h2>Upload Files</h2>
        </div> */}

        <form className="rag-form">
          <div className="upload-section">
            <div className="form-group">
              <div className="field-header">
                <label htmlFor="business_name">Business Name</label>
              </div>
              {formLoading.business_name ? (
                <div className="loading-state">
                  <SpinnerIcon className="spinner-icon" />
                  <span>Loading business name...</span>
                </div>
              ) : (
                <>
                  <input 
                    type="text"
                    id="business_name"
                    maxLength={20}
                    placeholder="Enter your business name"
                    className={`form-input ${errors.business_name ? 'error' : ''}`}
                    value={formData.business_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, business_name: e.target.value }));
                      if (errors.business_name) {
                        setErrors(prev => ({ ...prev, business_name: '' }));
                      }
                    }}
                    required
                    readOnly
                  />
                  {/* <small className="field-hint">
                    {20 - (formData.business_name?.length || 0)} characters remaining
                  </small> */}
                </>
              )}
              {errors.business_name && <span className="error-message">{errors.business_name}</span>}
            </div>
          </div>

          <div className="upload-section">
            <div className="form-group">
              <div className="field-header">
                <label htmlFor="assistant_name">AI Assistant Name</label>
              </div>
              {formLoading.assistant_name ? (
                <div className="loading-state">
                  <SpinnerIcon className="spinner-icon" />
                  <span>Loading assistant name...</span>
                </div>
              ) : (
                <>
                  <input 
                    type="text"
                    id="assistant_name"
                    maxLength={20}
                    placeholder="Name your AI assistant"
                    className={`form-input ${errors.assistant_name ? 'error' : ''}`}
                    value={formData.assistant_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, assistant_name: e.target.value }));
                      if (errors.assistant_name) {
                        setErrors(prev => ({ ...prev, assistant_name: '' }));
                      }
                    }}
                    required
                    readOnly
                  />
                  {/* <small className="field-hint">
                    {20 - (formData.assistant_name?.length || 0)} characters remaining
                  </small> */}
                </>
              )}
              {errors.assistant_name && <span className="error-message">{errors.assistant_name}</span>}
            </div>
          </div>

          <div className="upload-section">
            <div className="form-group">
              <div className="field-header">
                <label htmlFor="about_me">Business Description</label>
              </div>
              {formLoading.about_me ? (
                <div className="loading-state">
                  <SpinnerIcon className="spinner-icon" />
                  <span>Loading business description...</span>
                </div>
              ) : (
                <textarea 
                  id="about_me" 
                  placeholder="What does your business do? What are your main products or services?"
                  className={`form-input form-textarea ${errors.about_me ? 'error' : ''}`}
                  value={formData.about_me}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, about_me: e.target.value }));
                    if (errors.about_me) {
                      setErrors(prev => ({ ...prev, about_me: '' }));
                    }
                  }}
                  rows="4"
                  required
                  readOnly
                />
              )}
              {errors.about_me && <span className="error-message">{errors.about_me}</span>}
            </div>
          </div>
          
          <div className="upload-section">
            <div className="form-group">
              <div className="field-header">
                <label htmlFor="language">Language</label>
              </div>
              {formLoading.language ? (
                <div className="loading-state">
                  <SpinnerIcon className="spinner-icon" />
                  <span>Loading language preference...</span>
                </div>
              ) : (
                <select 
                  id="language" 
                  className="form-input form-select"
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  required
                  disabled
                >
                  <option value="">Select a language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="French">Français</option>
                  <option value="German">Deutsch</option>
                  <option value="Chinese">中文</option>
                </select>
              )}
            </div>
          </div>

          {['about'].map((section) => (
          // {['about', 'policies', 'trainingmanual', 'inventory'].map((section) => (
            <div key={section} className="upload-section">
              <div className="section-header" onClick={() => handleToggleSection(section)}>
                <DocumentIcon className="section-icon" />
                <h3>{sectionTitles[section]}</h3>
                {expandedSections[section] ? (
                  <ChevronUpIcon className="expand-icon" /> // Show up arrow when expanded
                ) : (
                  <ChevronDownIcon className="expand-icon" /> // Show down arrow when collapsed
                )}
              </div>
              <AnimatePresence>
                {expandedSections[section] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* <p className="section-description">{sectionDescriptions[section]}</p> */}
                    <div className="upload-interface">
                      {fetchingFiles[section] ? (
                        <div className="loading-state">
                          <SpinnerIcon className="spinner-icon" />
                          <span>Checking uploaded files...</span>
                        </div>
                      ) : uploadedFiles[section] ? (
                        <div className="uploaded-file-card">
                          <div className="file-info">
                            <div className="file-icon-wrapper">
                              <DocumentIcon className="file-type-icon" />
                              <div className="file-status-dot"></div>
                            </div>
                            <div className="file-details">
                              <div className="file-name-row">
                                <span className="file-name">{getFileName(uploadedFiles[section])}</span>
                                <span className="file-badge">RAG Ready</span>
                              </div>
                              <div className="file-meta">
                                <span className="upload-date">
                                  <ClockIcon className="meta-icon" />
                                  {getUploadDate(uploadedFiles[section])}
                                </span>
                                <span className="file-size">
                                  <DocumentTextIcon className="meta-icon" />
                                  PDF
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="file-actions">
                            <a 
                              href={uploadedFiles[section]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="action-button view-button"
                            >
                              <EyeIcon className="action-icon" />
                              <span>Preview</span>
                            </a>
                            {/* <button
                              onClick={(e) => handleDelete(section, e)}
                              className={`action-button delete-button ${deletingStates[section] ? 'deleting' : ''}`}
                              disabled={deletingStates[section] === 'deleting'}
                            >
                              {deletingStates[section] === 'deleting' ? (
                                <>
                                  <SpinnerIcon className="action-icon animate-spin" />
                                  <span>Removing...</span>
                                </>
                              ) : deletingStates[section] === 'success' ? (
                                <>
                                  <CheckCircleIcon className="action-icon text-green-500" />
                                  <span>Removed</span>
                                </>
                              ) : deletingStates[section] === 'error' ? (
                                <>
                                  <ExclamationCircleIcon className="action-icon text-red-500" />
                                  <span>Failed</span>
                                </>
                              ) : (
                                <>
                                  <TrashIcon className="action-icon" />
                                  <span>Remove</span>
                                </>
                              )}
                            </button> */}
                          </div>
                        </div>
                      ) : (
                        <div className="upload-dropzone">
                          <input
                            type="file"
                            id={`${section}-file-input`}
                            onChange={(e) => handleFileChange(section, e.target.files[0])}
                            disabled={isLoading}
                            style={{ display: 'none' }}
                          />
                          {formData[section].file ? (
                            <div className="selected-file-preview">
                              <DocumentIcon className="file-type-icon" />
                              <div className="file-details">
                                <span className="file-name">{formData[section].fileName}</span>
                                <span className="file-status">Ready to upload</span>
                              </div>
                              <button
                                type="button"
                                className="clear-selection"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFormData((prev) => ({
                                    ...prev,
                                    [section]: { ...prev[section], file: null, fileName: '' },
                                  }));
                                }}
                              >
                                <TrashIcon className="icon" />
                              </button>
                            </div>
                          ) : (
                            <label htmlFor={`${section}-file-input`} className="dropzone-area">
                              <CloudArrowUpIcon className="upload-icon" />
                              <div className="upload-text">
                                <span className="primary-text">Drop your file here or </span>
                                <span className="secondary-text">Browse files</span>
                              </div>
                              <span className="file-hint">PDF, DOC up to 10MB</span>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="input-group">
                      {!uploadedFiles[section] && (
                        <button
                          type="button"
                          className={`upload-button ${uploadingStates[section] ? 'uploading' : ''}`}
                          onClick={() => handleUpload(section)}
                          disabled={uploadingStates[section] === 'uploading'}
                        >
                          {uploadingStates[section] === 'uploading' ? (
                            <>
                              <SpinnerIcon className="action-icon animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : uploadingStates[section] === 'success' ? (
                            <>
                              <CheckCircleIcon className="action-icon text-green-500" />
                              <span>Uploaded</span>
                            </>
                          ) : uploadingStates[section] === 'error' ? (
                            <>
                              <ExclamationCircleIcon className="action-icon text-red-500" />
                              <span>Failed</span>
                            </>
                          ) : (
                            <>
                              <CloudArrowUpIcon className="action-icon" />
                              <span>Upload File</span>
                            </>
                          )}
                        </button>
                      )}
                      {/* <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() => handleDelete(section)}
                      >
                        <TrashIcon className="icon" />
                      </button> */}
                    </div>

                    {isLoading && (
                      <div className="loading-overlay">
                        <div className="loading-content">
                          <SpinnerIcon className="spinner" />
                          <span>{loadingToast}</span>
                        </div>
                      </div>
                    )}
                    {formData[section].toastMessage && (
                    <motion.div 
                      className={`toast-message ${
                        formData[section].toastMessage.includes('success') ? 'success' : 'error'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {formData[section].toastMessage}
                    </motion.div>
                  )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <div className="upload-section">
            <div className="section-header" onClick={() => handleToggleSection('website')}>
              <LinkIcon className="section-icon" />
              <h3>{sectionTitles['website']}</h3>
              {expandedSections['website'] ? (
                <ChevronUpIcon className="expand-icon" /> // Show up arrow when expanded
              ) : (
                <ChevronDownIcon className="expand-icon" /> // Show down arrow when collapsed
              )}
            </div>
            <AnimatePresence>
              {expandedSections['website'] && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* <p className="section-description">{sectionDescriptions['website']}</p> */}
                  <input
                    type="url"
                    placeholder="Enter website URL"
                    value={formData.website.url}
                    onChange={(e) => setFormData({ ...formData, website: { ...formData.website, url: e.target.value } })}
                    disabled={isLoading}
                    required
                    readOnly
                  />
                  {formData.website.toastMessage && ( // Display the toast message for website section
                    <p className="toast-message">{formData.website.toastMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </form>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h3>Remove File</h3>
              <p>Are you sure you want to remove this file? This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, section: null })}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteModal.section)}
                  className="delete-confirm-button"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RagForm;