import React, { useState, useEffect } from 'react';
import { useSocket } from '../services/ChatService';
import { getSelectiveProfileInfo } from './contractInteraction';

const ChatInterface = ({ matchAddress, currentUserAddress }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sharedInfo, setSharedInfo] = useState({});
  const [selectedFields, setSelectedFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { sendMessage, onMessageReceived } = useSocket(currentUserAddress);

  useEffect(() => {
    onMessageReceived(({ from, message }) => {
      if (from === matchAddress) {
        setMessages(prev => [...prev, { from, message }]);
        if (message.startsWith('PROFILE_INFO:')) {
          const profileInfo = JSON.parse(message.slice(13));
          setSharedInfo(prev => ({ ...prev, ...profileInfo }));
        }
      }
    });
  }, [matchAddress, onMessageReceived]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(matchAddress, newMessage);
      setMessages(prev => [...prev, { from: currentUserAddress, message: newMessage }]);
      setNewMessage('');
    }
  };

  const handleFieldSelection = (field) => {
    setSelectedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const shareProfileInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileInfo = await getSelectiveProfileInfo(currentUserAddress, { fields: selectedFields });
      const infoMessage = `PROFILE_INFO:${JSON.stringify(profileInfo)}`;
      sendMessage(matchAddress, infoMessage);
      setSelectedFields([]);
    } catch (error) {
      console.error('Error sharing profile info:', error);
      setError('Failed to share profile information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Chat with {matchAddress}</h2>
      <div>
        <h3>Shared Information:</h3>
        {Object.entries(sharedInfo).map(([key, value]) => (
          <p key={key}>{key}: {value}</p>
        ))}
      </div>
      <div>
        <h3>Select information to share:</h3>
        {['age', 'location', 'gender', 'genderPreference'].map(field => (
          <label key={field}>
            <input
              type="checkbox"
              checked={selectedFields.includes(field)}
              onChange={() => handleFieldSelection(field)}
            />
            {field}
          </label>
        ))}
        <button 
          onClick={shareProfileInfo} 
          disabled={selectedFields.length === 0 || isLoading}
        >
          {isLoading ? 'Sharing...' : 'Share Selected Information'}
        </button>
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <div>
        <h3>Chat Messages:</h3>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message.from}: {message.message}</li>
          ))}
        </ul>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatInterface;