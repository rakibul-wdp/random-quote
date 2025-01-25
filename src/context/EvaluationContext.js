import React, { createContext, useContext, useState } from 'react';

const EvaluationContext = createContext();

export const EvaluationProvider = ({ children }) => {
  const [evalData, setEvalData] = useState(null);

  return (
    <EvaluationContext.Provider value={{ evalData, setEvalData }}>
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  return useContext(EvaluationContext);
}; 