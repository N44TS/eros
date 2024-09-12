import React, { useState, useEffect } from 'react';

const Chat = ({ match, onClose, onUnseal }) => {
  const [unsealed, setUnsealed] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);
  const [shareAge, setShareAge] = useState(false);
  const [shareWeirdThing, setShareWeirdThing] = useState(false);
  const [weirdThings, setWeirdThings] = useState([]);

  useEffect(() => {
    // FOR TESTING Load from local
    const storedWeirdThings = JSON.parse(localStorage.getItem('userWeirdThings') || '[]');
    setWeirdThings(storedWeirdThings);
  }, []);
  // END TESTING

  const handleUnseal = async () => {
    try {
      const fullProfile = await onUnseal(match.address);
      setAdditionalData(fullProfile);
      setUnsealed(true);
    } catch (error) {
      console.error("Error unsealing data:", error);
    }
  };

  const handleShare = () => {
    if (!shareAge && !shareWeirdThing) {
      alert("Please select at least one item to share.");
      return;
    }
    handleUnseal();
  };

  return (
    <div className="chat-modal">
      <h2>Chat with {match.address}</h2>
      <button onClick={onClose}>Close</button>
      
      {!unsealed ? (
        <div>
          <h3>Choose what to share:</h3>
          <label>
            <input 
              type="checkbox" 
              checked={shareAge} 
              onChange={() => setShareAge(!shareAge)} 
            /> Age
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={shareWeirdThing} 
              onChange={() => setShareWeirdThing(!shareWeirdThing)} 
            /> Additional Interest
          </label>
          <button onClick={handleShare}>Share Selected Data</button>
        </div>
      ) : (
        <div>
          <h3>Shared Additional Data:</h3>
          {shareAge && <p>Age: {additionalData?.age || 'Unknown'}</p>}
          {shareWeirdThing && weirdThings.length > 2 && (
            <p>Additional Interest: {weirdThings[2]}</p>
          )}
        </div>
      )}
      
      <h3>Matched Interests:</h3>
      <ul>
        {weirdThings.slice(0, 2).map((thing, index) => (
          <li key={index}>{thing}</li>
        ))}
      </ul>
      
      {/* Add chat functionality here */}
      <div className="chat-messages">
        {/* Display chat messages here */}
      </div>
      <input type="text" placeholder="Type your message..." />
      <button>Send</button>
    </div>
  );
};

export default Chat;