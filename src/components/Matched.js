import React, { useState, useEffect } from 'react';
import { setupContractInteraction, getMatchedUserProfile } from './contractInteraction';
import Chat from './Chat'; 
import './Matched.css'; // Create this file for Matched component styles

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

const Eros1Component = () => {
  const [matches, setMatches] = useState([]);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  // localPreferences is used for demo purposes only
  const [localPreferences, setLocalPreferences] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { contract, signer } = await setupContractInteraction();
        const address = await signer.getAddress();
        setAccount(address);
        setContract(contract);

        // Fetch existing matches immediately
        await fetchExistingMatches(contract, address);

        // Load local preferences (for demo purposes only)
        loadLocalPreferences();

        // Listen for NewMatch events
        contract.on("NewMatch", async (user1, user2) => {
          if (user1 === address || user2 === address) {
            console.log(`New match involving current user: ${user1} and ${user2}`);
            await addNewMatch(user1 === address ? user2 : user1);
          }
        });
      } catch (error) {
        console.error("Error initializing:", error);
      }
    };

    init();

    return () => {
      if (contract) {
        contract.removeAllListeners("NewMatch");
      }
    };
  }, []);

  const fetchExistingMatches = async (contractInstance, userAddress) => {
    const filter = contractInstance.filters.NewMatch();
    const events = await contractInstance.queryFilter(filter);

    const userMatches = events
      .filter(event => event.args.user1 === userAddress || event.args.user2 === userAddress)
      .map(event => event.args.user1 === userAddress ? event.args.user2 : event.args.user1);

    console.log('Matches involving current user:', userMatches);

    for (let matchAddress of userMatches) {
      await addNewMatch(matchAddress);
    }
  };

  const addNewMatch = async (matchAddress) => {
    const userData = await getMatchedUserProfile(matchAddress);
    setMatches(prevMatches => {
      if (!prevMatches.some(match => match.address === matchAddress)) {
        console.log(`Adding new match: ${matchAddress}`, userData);
        return [...prevMatches, { address: matchAddress, userData }];
      }
      return prevMatches;
    });
  };

  const getLocationString = (locationCode) => {
    const locations = ["Africa", "America", "Asia", "Australasia", "Europe", "Latin America", "Middle East"];
    return locations[Number(locationCode)] || "Unknown";
  };

  const getGenderString = (genderCode) => {
    const genders = ["Male", "Female", "Other"];
    return genders[Number(genderCode)] || "Unknown";
  };

  // FOR TESTING ONLY! 
  // Shoud be stored on contract not local
  const loadLocalPreferences = () => {
    const storedPreferences = localStorage.getItem('userWeirdThings');
    if (storedPreferences) {
      setLocalPreferences(JSON.parse(storedPreferences));
    } else {
      console.log('No local preferences found');
    }
  };

  const openChat = (match) => {
    setSelectedMatch(match);
  };

  const closeChat = () => {
    setSelectedMatch(null);
  };

  return (
    <div className="matched-container">
      <h2 className="matched-title">Your Matches</h2>
      <div className="matches-chat-container">
        <ul className="matches-list">
          {matches.map((match, index) => (
            <li key={index} className={`match-item ${selectedMatch === match ? 'selected' : ''}`}>
              <div className="match-info">
                <h3>{match.address.slice(0, 6)}...{match.address.slice(-4)}</h3>
                {match.userData ? (
                  <div className="match-details">
                    <p>Location: {getLocationString(match.userData.location) || 'Unknown'}</p>
                    <p>Gender: {getGenderString(match.userData.gender) || 'Unknown'}</p>
                  </div>
                ) : (
                  <p className="match-error">Unable to fetch match data</p>
                )}
              </div>
              <button className="chat-button" onClick={() => openChat(match)}>
                {selectedMatch === match ? 'Chatting' : 'Chat'}
              </button>
            </li>
          ))}
        </ul>
        <div className="chat-container">
          {selectedMatch ? (
            <Chat 
              match={selectedMatch} 
              onClose={closeChat} 
              onUnseal={getMatchedUserProfile}
            />
          ) : (
            <div className="no-chat-selected">
              <p>Select a match to start chatting</p>
            </div>
          )}
        </div>
      </div>
      {/* Demo section */}
      {/* <div className="demo-preferences">
        <h2>Matched Interests (Demo only)</h2>
        <ul className="preferences-list">
          {localPreferences.map((pref, index) => (
            <li key={index}>{pref}</li>
          ))}
        </ul>
      </div> */}
    </div>
  );
};

export default Eros1Component;
