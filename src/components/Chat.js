import React, { useState, useEffect } from 'react';
import './Chat.css';

const PREFERENCE_OPTIONS = [
  { value: '0', label: 'Harry Potter' },
  { value: '1', label: 'into Crypto' },
  { value: '2', label: 'Hate travelling' },
  { value: '3', label: 'Vegetarian' },
  { value: '4', label: 'Vaccinated' },
  { value: '5', label: 'Hate reading' },
  { value: '6', label: 'Politically left leaning' },
  { value: '7', label: 'Politically right leaning' },
  { value: '8', label: 'Hate fitness' },
  { value: '9', label: 'Hate cooking' }
];

const Chat = ({ match, onClose, onUnseal }) => {
  const [unsealed, setUnsealed] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);
  const [shareAge, setShareAge] = useState(false);
  const [shareWeirdThing, setShareWeirdThing] = useState(false);
  const [weirdThings, setWeirdThings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // FOR TESTING Load from local
    const storedPreferences = JSON.parse(localStorage.getItem('userPreferences') || '[]');
    setWeirdThings(storedPreferences.map(pref => PREFERENCE_OPTIONS[Number(pref)]?.label || 'Unknown'));
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

  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      setMessages([...messages, { text: inputMessage, sent: true }]);
      setInputMessage('');
      // Here you would typically send the message to your backend or smart contract
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat with {match.address.slice(0, 6)}...{match.address.slice(-4)}</h3>
        <button className="close-chat" onClick={onClose}>&times;</button>
      </div>
      <div className="chat-content">
        <div className="matched-interests">
          <h3>Matched Interests:</h3>
          <ul>
            {weirdThings.slice(0, 2).map((thing, index) => (
              <li key={index}>{thing}</li>
            ))}
          </ul>
        </div>

        {!unsealed ? (
          <div className="share-options">
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
            <button onClick={handleShare} className="share-button">Share Selected Data</button>
          </div>
        ) : (
          <div className="shared-data">
            <h3>Shared Additional Data:</h3>
            {shareAge && <p>Age: {additionalData?.age || 'Unknown'}</p>}
            {shareWeirdThing && weirdThings.length > 2 && (
              <p>Additional Interest: {weirdThings[2]}</p>
            )}
          </div>
        )}
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sent ? 'sent' : 'received'}`}>
              {message.text}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;