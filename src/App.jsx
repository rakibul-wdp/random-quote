import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [quote, setQuote] = useState("");
  const [savedQuotes, setSavedQuotes] = useState([]);

  const fetchQuote = async () => {
    const response = await fetch(
      "https://ron-swanson-quotes.herokuapp.com/v2/quotes"
    );
    const data = await response.json();
    setQuote(data[0]);
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const saveQuote = () => {
    if (!savedQuotes.includes(quote)) {
      setSavedQuotes((prev) => [...prev, quote]);
    } else {
      alert("This quote is already saved!");
    }
  };

  return (
    <main className="app">
      <h1>Random Ron Swanson Quote</h1>

      <div className="quote-card">
        <p>{quote}</p>
        <button onClick={fetchQuote}>Get New Quote</button>
        <button onClick={saveQuote}>Save to List</button>
      </div>

      {savedQuotes.length > 0 && (
        <div className="saved-quotes">
          <h2>Saved Quotes</h2>
          <ul>
            {savedQuotes.map((q, index) => (
              <li key={index}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default App;
