import React, { useRef, useState } from 'react';
import { FiSend, FiUser } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { useChatContext } from '../context/ChatContext';
import { useUser } from '@clerk/clerk-react';
import './ChatInterface.css';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

const ChatInterface = () => {
  const { state, dispatch } = useChatContext();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useUser();
  const [jobInProgress, setJobInProgress] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_user_job_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress
        })
      });
      
      const data = await response.json();
      
      if (!data.job_id) {
        return true;
      }
      
      const statusResponse = await fetch(`${process.env.REACT_APP_API_URL}/check_job_status/${data.job_id}`);
      const statusData = await statusResponse.json();
      
      return statusData.status === 'completed';
    } catch (error) {
      console.error('Error checking setup status:', error);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const isSetupComplete = await checkSetupStatus();
      
      if (!isSetupComplete) {
        setJobInProgress(true);
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { 
            text: 'We are setting up all your data. Chat will be available in few minutes...', 
            type: 'bot' 
          }
        });
        setIsLoading(false);
        return;
      }

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { text: userMessage, type: 'user' }
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          email: user.primaryEmailAddress.emailAddress
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.text();
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { text: data, type: 'bot' }
      });
    } catch (error) {
      console.error('Error:', error);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { 
          text: 'Sorry, I encountered an error. Please try again.', 
          type: 'bot' 
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="chat-interface"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />
      
      <div className="messages-container">
        <AnimatePresence>
          {state.messages.map((message, index) => (
            <motion.div 
              key={index} 
              className={`message ${message.type}-message`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-bubble">
                {message.type === 'bot' ? (
                  <div className="message-avatar bot-avatar">
                    <RiRobot2Line className="avatar-icon" />
                  </div>
                ) : (
                  <div className="message-avatar user-avatar">
                    <FiUser className="avatar-icon" />
                  </div>
                )}
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {new Date().toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="message bot-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="message-bubble">
                <div className="message-avatar bot-avatar">
                  <RiRobot2Line className="avatar-icon" />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="chat-input-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={jobInProgress ? 
            "Chat will be available once setup is complete..." : 
            "Type your message..."}
          className="chat-input"
          disabled={isLoading || jobInProgress}
        />
        <motion.button 
          type="submit" 
          className="send-button"
          disabled={!inputMessage.trim() || isLoading || jobInProgress}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiSend className="send-icon" />
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default ChatInterface;