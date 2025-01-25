import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { saveAs } from 'file-saver'; // Import file-saver for downloading files
import * as XLSX from 'xlsx'; // Import xlsx for Excel file creation
import { useEvaluation } from '../context/EvaluationContext'; // Import the context
import './EvaluateRag.css'; // Ensure you have a CSS file for styling

const toastConfig = {
  duration: 5000, // 5 seconds
  style: {
    padding: '16px',
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
  },
};

const successToastConfig = {
  ...toastConfig,
  icon: '✅',
  duration: 10000,
};

const errorToastConfig = {
  ...toastConfig,
  icon: '❌',
  duration: 10000, // 7 seconds for errors
};

const EvaluateRag = () => {
  const { user } = useUser();
  const { evalData, setEvalData } = useEvaluation(); // Use context
  const [sampleSize, setSampleSize] = useState(1);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvalConfirmModal, setShowEvalConfirmModal] = useState(false);

  const handleEvaluateRAG = async () => {
    setShowEvalConfirmModal(true);
  };

  const confirmEvaluateRAG = async () => {
    setShowEvalConfirmModal(false);
    setIsEvaluating(true);
    const loadingToast = toast.loading('Evaluating RAG...', toastConfig);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', user.primaryEmailAddress.emailAddress);
      formDataToSend.append('sample_size', sampleSize);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/eval_rag`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json(); // Assuming the response is JSON
      if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);

      setEvalData(data); // Set the data in context
      toast.success('RAG evaluated successfully!', {
        id: loadingToast,
        ...successToastConfig,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error(error.message || 'Failed to evaluate RAG', {
        id: loadingToast,
        ...errorToastConfig,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Function to render the evaluation results as a table
  const renderTable = (data) => {
    if (!data || !Array.isArray(data)) return null;

    return (
      <div>
        <button className="download-button" onClick={downloadExcel}>
          <span role="img" aria-label="download">📥</span> Download report
        </button>
        <table className="evaluation-table">
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, idx) => (
                  <td key={idx}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const downloadExcel = () => {
    // Convert evalData to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(evalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluation Data');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Use file-saver to save the file
    saveAs(blob, 'evaluation_data.xlsx'); // Save as .xlsx
  };

  return (
    <>
      <Toaster position="top-right" />
      
      <motion.div 
        className="evaluate-rag-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-description">
          <p>This screen is used to evaluate a RAG pipeline by running an evaluation dataset and showing the output of the evaluation data.</p>
        </div>

        <div className="input-group">
          <label htmlFor="sampleSize">Sample Size:</label>
          <input
            type="number"
            id="sampleSize"
            value={sampleSize}
            onChange={(e) => setSampleSize(e.target.value)}
            min="1"
            disabled={isEvaluating}
          />
          <motion.button
            type="button"
            className="submit-button"
            onClick={handleEvaluateRAG}
            disabled={isEvaluating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isEvaluating ? (
              <div className="spinner"></div>
            ) : (
              'Evaluate RAG'
            )}
          </motion.button>
        </div>

        {evalData && (
          <div className="evaluation-results">
            <h3>Evaluation Results:</h3>
            {renderTable(evalData)} {/* Render the evaluation data as a table */}
          </div>
        )}
      </motion.div>

      {/* Evaluation Confirmation Modal */}
      <AnimatePresence>
        {showEvalConfirmModal && (
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
              <h3>Confirm Evaluation</h3>
              <p>Are you sure you want to evaluate the RAG system?</p>
              <div className="modal-actions">
                <button 
                  onClick={() => setShowEvalConfirmModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmEvaluateRAG}
                  className="confirm-button"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EvaluateRag; 