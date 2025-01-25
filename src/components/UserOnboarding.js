import { useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import Tooltip from "@mui/material/Tooltip";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const UserOnboarding = ({ setLastJobId, setUserExists, isLoading }) => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [expandedSections, setExpandedSections] = useState({});
  const [formData, setFormData] = useState({
    business_name: "",
    assistant_name: "",
    about_me: "",
    language: "",
    website: "",
    documents: {
      about: { file: null, fileName: "" },
      policies: { file: null, fileName: "" },
      trainingmanual: { file: null, fileName: "" },
      inventory: { file: null, fileName: "" },
    },
  });

  // Add validation state
  const [errors, setErrors] = useState({
    business_name: "",
    assistant_name: "",
    about_me: "",
    language: "",
    website: "",
    documents: {
      about: "",
      policies: "",
      trainingmanual: "",
      inventory: "",
    },
  });

  const handleSignOut = () => {
    signOut();
  };

  const handleToggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Add validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      ...errors,
      business_name: "",
      assistant_name: "",
      website: "",
      documents: {
        ...errors.documents,
        about: "",
      },
    };

    // Validate business name
    if (!formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
      isValid = false;
    } else if (formData.business_name.length < 2) {
      newErrors.business_name = "Business name must be at least 2 characters";
      isValid = false;
    }

    // Validate assistant name
    if (!formData.assistant_name.trim()) {
      newErrors.assistant_name = "Assistant name is required";
      isValid = false;
    } else if (formData.assistant_name.length < 2) {
      newErrors.assistant_name = "Assistant name must be at least 2 characters";
      isValid = false;
    }

    // Make website mandatory
    if (!formData.website.trim()) {
      newErrors.website = "Website URL is required";
      isValid = false;
    } else if (
      !formData.website.match(
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
      )
    ) {
      newErrors.website = "Please enter a valid URL";
      isValid = false;
    }

    // Make document upload mandatory
    if (!formData.documents.about.file) {
      newErrors.documents.about =
        "Please upload a document about your business";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Update handleSubmit function to add console logs for debugging
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please correct the errors before submitting");
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Add business_name and assistant_name to formData
      formDataToSend.append("business_name", formData.business_name);
      formDataToSend.append("assistant_name", formData.assistant_name);

      // Rest of the existing form data
      formDataToSend.append("email", user.primaryEmailAddress.emailAddress);
      formDataToSend.append("username", user.username);
      formDataToSend.append("fullName", user.fullName);
      formDataToSend.append("firstname", user.firstName);
      formDataToSend.append("lastname", user.lastName);
      formDataToSend.append("lastSignInAt", user.lastSignInAt);
      formDataToSend.append("about_me", formData.about_me);
      formDataToSend.append("language", formData.language);
      formDataToSend.append("website", formData.website);

      // Log the form data being sent for debugging
      console.log("Form data being sent:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Log which documents are being appended
      Object.entries(formData.documents).forEach(([docType, { file }]) => {
        console.log(
          `Document ${docType}:`,
          file ? "Being uploaded" : "Not present"
        );
        if (file) {
          formDataToSend.append(docType, file);
        }
      });

      console.log("API URL:", process.env.REACT_APP_API_URL);
      console.log("Sending API request");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/update_user_details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setLastJobId(data.job_id);
        setUserExists(true);
        toast.loading(
          "We are setting up all your data. You can get going in few minutes...",
          {
            duration: Infinity,
          }
        );
      } else {
        throw new Error(data.error || "Failed to start setup process");
      }
    } catch (error) {
      console.error("Error updating user details:", error);
      toast.error(`Failed to complete setup: ${error.message}`);
    }
  };

  const handleFileChange = (section, file) => {
    const allowedFileTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    if (file) {
      if (!allowedFileTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          documents: {
            ...prev.documents,
            [section]:
              "Invalid file type. Please upload PDF, DOC, DOCX, or TXT",
          },
        }));
        return;
      }

      if (file.size > maxFileSize) {
        setErrors((prev) => ({
          ...prev,
          documents: {
            ...prev.documents,
            [section]: "File size must be less than 10MB",
          },
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [section]: "",
        },
      }));
    }

    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [section]: { file, fileName: file ? file.name : "" },
      },
    }));
  };

  const fieldHelp = {
    business_name: {
      title: "Business Name",
      description: "Enter your company or organization name",
    },
    assistant_name: {
      title: "AI Assistant Name",
      description: "Choose a name for your AI assistant",
    },
    about_me: {
      title: "About",
      description:
        "Describe your business, products, services, and target audience. This helps your AI assistant better understand your business context.",
    },
    language: {
      title: "Preferred Language",
      description:
        "Select the primary language you'd like your AI assistant to communicate in.",
    },
    website: {
      title: "Website URL",
      description:
        "Add your company website URL to help the AI learn about your online presence and offerings.",
    },
    about: {
      title: "About",
      description:
        "Upload documents about your company history, mission, vision, and general information.",
    },
    policies: {
      title: "Policies",
      text: "Upload company policies, procedures, guidelines, and compliance documents.",
    },
    trainingmanual: {
      title: "Training Manual",
      text: "Upload employee handbooks, training materials, and operational guides.",
    },
    inventory: {
      title: "Inventory",
      text: "Upload product catalogs, inventory lists, and product specifications.",
    },
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="page-header">
          <h1 className="page-title">Welcome to Mitrrs!</h1>
          <p className="page-description">
            Let's set up your AI assistant by providing some basic information
            about your business. This will help create a more personalized
            experience.
          </p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="scrollable-content">
            <div className="form-sections">
              <div className="form-group">
                <div className="field-header">
                  <label htmlFor="business_name">
                    Business Name<span className="required-asterisk">*</span>
                  </label>
                  <Tooltip
                    title={fieldHelp.business_name.description}
                    arrow
                    placement="top"
                  >
                    <QuestionMarkCircleIcon className="help-icon" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  id="business_name"
                  maxLength={50}
                  placeholder="Enter your business name"
                  className={`form-input ${
                    errors.business_name ? "error" : ""
                  }`}
                  value={formData.business_name}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      business_name: e.target.value,
                    }));
                    if (errors.business_name) {
                      setErrors((prev) => ({ ...prev, business_name: "" }));
                    }
                  }}
                  required
                  aria-invalid={errors.business_name ? "true" : "false"}
                  aria-describedby={
                    errors.business_name ? "business_name-error" : undefined
                  }
                />
                {errors.business_name && (
                  <div
                    className="error-container"
                    role="alert"
                    id="business_name-error"
                  >
                    <span className="error-icon">⚠</span>
                    <span className="error-message">
                      {errors.business_name}
                    </span>
                  </div>
                )}
                <small className="field-hint">
                  {50 - formData.business_name.length} characters remaining
                </small>
              </div>

              <div className="form-group">
                <div className="field-header">
                  <label htmlFor="assistant_name">
                    AI Assistant Name
                    <span className="required-asterisk">*</span>
                  </label>
                  <Tooltip
                    title={fieldHelp.assistant_name.description}
                    arrow
                    placement="top"
                  >
                    <QuestionMarkCircleIcon className="help-icon" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  id="assistant_name"
                  maxLength={20}
                  placeholder="Name your AI assistant"
                  className={`form-input ${
                    errors.assistant_name ? "error" : ""
                  }`}
                  value={formData.assistant_name}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      assistant_name: e.target.value,
                    }));
                    if (errors.assistant_name) {
                      setErrors((prev) => ({ ...prev, assistant_name: "" }));
                    }
                  }}
                  required
                  aria-invalid={errors.assistant_name ? "true" : "false"}
                  aria-describedby={
                    errors.assistant_name ? "assistant_name-error" : undefined
                  }
                />
                {errors.assistant_name && (
                  <div
                    className="error-container"
                    role="alert"
                    id="assistant_name-error"
                  >
                    <span className="error-icon">⚠</span>
                    <span className="error-message">
                      {errors.assistant_name}
                    </span>
                  </div>
                )}
                <small className="field-hint">
                  {20 - formData.assistant_name.length} characters remaining
                </small>
              </div>

              <div className="form-group">
                <div className="field-header">
                  <label htmlFor="about_me">Business Description</label>
                  <Tooltip
                    title={fieldHelp.about_me.description}
                    arrow
                    placement="top"
                  >
                    <QuestionMarkCircleIcon className="help-icon" />
                  </Tooltip>
                </div>
                <textarea
                  id="about_me"
                  placeholder="What does your business do? What are your main products or services?"
                  className={`form-input form-textarea ${
                    errors.about_me ? "error" : ""
                  }`}
                  value={formData.about_me}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      about_me: e.target.value,
                    }));
                    if (errors.about_me) {
                      setErrors((prev) => ({ ...prev, about_me: "" }));
                    }
                  }}
                  rows="4"
                  required
                  aria-invalid={errors.about_me ? "true" : "false"}
                  aria-describedby={
                    errors.about_me ? "about_me-error" : undefined
                  }
                />
                {errors.about_me && (
                  <div
                    className="error-container"
                    role="alert"
                    id="about_me-error"
                  >
                    <span className="error-icon">⚠</span>
                    <span className="error-message">{errors.about_me}</span>
                  </div>
                )}
                <small className="field-hint">
                  Minimum 50 characters required. Currently:{" "}
                  {formData.about_me.length} characters
                </small>
              </div>

              <div className="form-group">
                <div className="field-header">
                  <label htmlFor="language">Preferred Language</label>
                  <Tooltip
                    title={fieldHelp.language.description}
                    arrow
                    placement="top"
                  >
                    <QuestionMarkCircleIcon className="help-icon" />
                  </Tooltip>
                </div>
                <select
                  id="language"
                  className="form-input form-select"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select a language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="French">Français</option>
                  <option value="German">Deutsch</option>
                  <option value="Chinese">中文</option>
                </select>
              </div>
              {/* DO NOT DELETE - This is the original code for the Website URL section */}
              {/* <div className="form-group">
                <div 
                  className="section-header"
                  onClick={() => handleToggleSection('website')}
                >
                  <div className="header-content">
                    <LinkIcon className="section-icon" />
                    <span className="section-title">Website URL</span>
                    <span className="optional-text">(Optional)</span>
                    <Tooltip title={fieldHelp.website.description} arrow placement="top">
                      <QuestionMarkCircleIcon className="help-icon" />
                    </Tooltip>
                  </div>
                  <div className="icon-container">
                    {expandedSections['website'] ? 
                      <ChevronUpIcon className="chevron-icon" /> : 
                      <ChevronDownIcon className="chevron-icon" />
                    }
                  </div>
                </div>
                
                {expandedSections['website'] && (
                  <div className="section-content">
                    <input
                      type="url"
                      placeholder="https://www.yourcompany.com"
                      className="form-input"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                )}
              </div> */}

              <div className="form-group">
                <div className="field-header">
                  <label htmlFor="website">
                    Website URL<span className="required-asterisk">*</span>
                  </label>
                  <Tooltip
                    title={fieldHelp.website.description}
                    arrow
                    placement="top"
                  >
                    <QuestionMarkCircleIcon className="help-icon" />
                  </Tooltip>
                </div>
                <input
                  type="url"
                  id="website"
                  placeholder="https://www.yourcompany.com"
                  className={`form-input ${errors.website ? "error" : ""}`}
                  value={formData.website}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }));
                    if (errors.website) {
                      setErrors((prev) => ({ ...prev, website: "" }));
                    }
                  }}
                  required
                  aria-invalid={errors.website ? "true" : "false"}
                  aria-describedby={
                    errors.website ? "website-error" : undefined
                  }
                />
                {errors.website && (
                  <div
                    className="error-container"
                    role="alert"
                    id="website-error"
                  >
                    <span className="error-icon">⚠</span>
                    <span className="error-message">{errors.website}</span>
                  </div>
                )}
              </div>

              {/* Generic Document Section Component - Including About section */}
              <div className="form-group">
                <div className="field-header">
                  <label htmlFor="about-file">
                    Business Document
                    <span className="required-asterisk">*</span>
                  </label>
                  <Tooltip
                    title={fieldHelp.about.description}
                    arrow
                    placement="top"
                  >
                    <QuestionMarkCircleIcon className="help-icon" />
                  </Tooltip>
                </div>
                {["about"].map((section) => (
                  <div key={section} className="document-section">
                    <div
                      className={`section-content ${
                        errors.documents[section] ? "error" : ""
                      }`}
                    >
                      {/* Show dropzone only when no file is uploaded */}
                      {!formData.documents[section].fileName && (
                        <div
                          className={`upload-dropzone ${
                            errors.documents[section] ? "error" : ""
                          }`}
                        >
                          <input
                            type="file"
                            id={`${section}-file`}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const allowedTypes = [
                                  "application/pdf",
                                  "application/msword",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                  "text/plain",
                                ];
                                const maxSize = 10 * 1024 * 1024; // 10MB

                                if (!allowedTypes.includes(file.type)) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      [section]:
                                        "Invalid file type. Please upload PDF, DOC, DOCX, or TXT",
                                    },
                                  }));
                                  return;
                                }

                                if (file.size > maxSize) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      [section]:
                                        "File size must be less than 10MB",
                                    },
                                  }));
                                  return;
                                }

                                handleFileChange(section, file);
                                setErrors((prev) => ({
                                  ...prev,
                                  documents: {
                                    ...prev.documents,
                                    [section]: "",
                                  },
                                }));
                              }
                            }}
                            className="hidden-input"
                            name={`${section}_document`}
                            accept=".pdf,.doc,.docx,.txt"
                            aria-invalid={
                              errors.documents[section] ? "true" : "false"
                            }
                            aria-describedby={
                              errors.documents[section]
                                ? `${section}-file-error`
                                : undefined
                            }
                          />
                          <label
                            htmlFor={`${section}-file`}
                            className={`dropzone-area ${
                              errors.documents[section] ? "error-border" : ""
                            }`}
                          >
                            <CloudArrowUpIcon className="upload-icon" />
                            <div className="upload-text">
                              <span className="primary-text">
                                Drop your file here or{" "}
                              </span>
                              <span className="secondary-text">
                                Browse files
                              </span>
                            </div>
                            <span className="file-hint">
                              PDF, DOC, DOCX, or TXT up to 10MB
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Show uploaded file info if exists */}
                      {formData.documents[section].fileName && (
                        <div className="uploaded-file-card">
                          <div className="file-info">
                            <DocumentIcon className="file-type-icon" />
                            <div className="file-details">
                              <span className="file-name">
                                {formData.documents[section].fileName}
                              </span>
                              <span className="upload-date">
                                {new Date().toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  [section]: { file: null, fileName: "" },
                                },
                              }));
                            }}
                            className="action-button delete-button"
                          >
                            <TrashIcon className="action-icon" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}

                      {/* Error message display */}
                      {errors.documents[section] && (
                        <div
                          className="error-container"
                          role="alert"
                          id={`${section}-file-error`}
                        >
                          <span className="error-icon">⚠</span>
                          <span className="error-message">
                            {errors.documents[section]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions-container">
            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleSignOut}
              >
                Cancel and Logout
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserOnboarding;
