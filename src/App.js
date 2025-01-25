import React, { useState, useEffect } from "react";
import { ChatProvider } from "./context/ChatContext";
import { EvaluationProvider } from "./context/EvaluationContext";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useClerk,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import {
  FiMessageSquare,
  FiSettings,
  FiCheckSquare,
  FiLogOut,
  FiInstagram,
} from "react-icons/fi";
import "./App.css";
import toast from "react-hot-toast";
import UserOnboarding from "./components/UserOnboarding";
import MainContent from "./components/MainContent";

// Define LoadingSpinner component with jobStatus passed as prop
const LoadingSpinner = ({ jobStatus }) => (
  <div className="loading-container">
    <div className="loading-content">
      <div className="loading-spinner-ring"></div>
      <div className="loading-text">
        <h2>Setting up your workspace</h2>
        <p>
          This may take several minutes. Please don't close or refresh this
          window.
        </p>
        {/* {jobStatus && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{width: `${jobStatus.progress}%`}}
            ></div>
            <p className="progress-text">
              {jobStatus.status === 'queued' ? 'Waiting to start...' :
               jobStatus.status === 'processing' ? `Processing: ${jobStatus.progress}%` :
               jobStatus.status === 'completed' ? 'Setup complete!' :
               'Processing...'}
            </p>
          </div>
        )} */}
      </div>
    </div>
  </div>
);

// const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Create a separate NavBar component to use the useClerk hook
const NavBar = ({ activeTab, setActiveTab, handleUserAction }) => {
  const { signOut } = useClerk();

  const handleTabChange = (tab) => {
    handleUserAction(() => setActiveTab(tab));
  };

  const handleSignOut = () => {
    handleUserAction(() => signOut());
  };

  return (
    <nav className="sidebar">
      <div className="logo">
        <h1>Mitrrs Agent</h1>
      </div>

      <div className="nav-links">
        <button
          className={`nav-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => handleTabChange("chat")}
        >
          <FiMessageSquare className="nav-icon" />
          <span>Chat</span>
        </button>

        <button
          className={`nav-button ${activeTab === "rag" ? "active" : ""}`}
          onClick={() => handleTabChange("rag")}
        >
          <FiSettings className="nav-icon" />
          <span>Settings</span>
        </button>

        <button
          className={`nav-button ${
            activeTab === "evaluate-rag" ? "active" : ""
          }`}
          onClick={() => handleTabChange("evaluate-rag")}
        >
          <FiCheckSquare className="nav-icon" />{" "}
          {/* You can change the icon if needed */}
          <span>Evaluate RAG</span>
        </button>

        <button
          className={`nav-button ${
            activeTab === "social-media" ? "active" : ""
          }`}
          onClick={() => setActiveTab("social-media")}
        >
          <FiInstagram className="nav-icon" />
          <span>Instagram Agent</span>
        </button>
      </div>

      {/* Add logout button at the bottom of sidebar */}
      <div
        className="nav-links"
        style={{ marginTop: "auto", marginBottom: "1rem" }}
      >
        <button
          className="nav-button"
          onClick={handleSignOut}
          style={{ color: "#ef4444" }} // Red color for logout
        >
          <FiLogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [jobStatus, setJobStatus] = useState(null);
  const [lastJobId, setLastJobId] = useState(null);

  // Modified check job status function
  const checkJobStatus = async () => {
    if (!lastJobId) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/check_job_status/${lastJobId}`
      );
      const data = await response.json();

      if (data.status === "completed") {
        setLastJobId(null); // Clear the job ID
        toast.dismiss(); // Remove existing toast
      } else {
        // Still processing - show/refresh the persistent toast
        toast.dismiss();
        toast.loading(
          "We are setting up all your data. You can get going in few minutes...",
          {
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.error("Error checking job status:", error);
    }
  };

  // Modified handleUserAction to allow navigation while checking status
  const handleUserAction = async (actionCallback) => {
    // Execute the action immediately
    actionCallback();

    // Check job status after action (if there's an ongoing job)
    if (lastJobId) {
      await checkJobStatus();
    }
  };

  useEffect(() => {
    const checkUserDetails = async () => {
      if (isSignedIn && user) {
        setIsLoading(true);
        try {
          // Comment out updateUserState calls
          // await updateUserState('app', 'loading', 'processing');

          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/get_user_details`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.primaryEmailAddress.emailAddress,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data) {
            setUserExists(true);
            // await updateUserState('app', 'loading', 'success');
          } else {
            setUserExists(false);
            // await updateUserState('app', 'loading', 'error');
          }
        } catch (error) {
          console.error("Error checking user details:", error);
          setUserExists(false);
          // await updateUserState('app', 'loading', 'error');
          toast.error("Unable to fetch user details");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkUserDetails();
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <>
        <LoadingSpinner jobStatus={jobStatus} />
        {/* Comment out loading states check
        {loadingStates?.app?.loading === 'processing' && (
          <div className="loading-status">
            <p>Setting up your workspace...</p>
          </div>
        )}
        */}
      </>
    );
  }

  return (
    <ChatProvider>
      <EvaluationProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SignedIn>
                    {!isLoaded ? (
                      <LoadingSpinner />
                    ) : !userExists ? (
                      <UserOnboarding
                        setLastJobId={setLastJobId}
                        setUserExists={setUserExists}
                        isLoading={isLoading}
                      />
                    ) : (
                      <>
                        <MainContent
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          handleUserAction={handleUserAction}
                          NavBar={NavBar}
                        />
                      </>
                    )}
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </EvaluationProvider>
    </ChatProvider>
  );
}

export default App;
