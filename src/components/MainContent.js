import React from "react";
import ChatInterface from "./ChatInterface";
import RagForm from "./RagForm";
import EvaluateRag from "./EvaluateRag";
import SocialMediaForm from "./SocialMediaForm";

const MainContent = ({ activeTab, setActiveTab, handleUserAction, NavBar }) => {
  return (
    <div className="app-container">
      <NavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleUserAction={handleUserAction}
      />
      <main className="main-content">
        <header className="content-header">
          <h2>
            {activeTab === "chat"
              ? "Chat Interface"
              : activeTab === "rag"
              ? "RAG Configuration"
              : activeTab === "evaluate-rag"
              ? "Evaluate RAG"
              : activeTab === "social-media"
              ? "Media Content"
              : ""}
          </h2>
        </header>

        <div className="content-container">
          {activeTab === "chat" ? (
            <ChatInterface />
          ) : activeTab === "rag" ? (
            <RagForm />
          ) : activeTab === "evaluate-rag" ? (
            <EvaluateRag />
          ) : activeTab === "social-media" ? (
            <SocialMediaForm />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default MainContent;
