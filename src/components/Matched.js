import React, { useState, useEffect } from 'react';
import { setupContractInteraction, getMatchedUserProfile } from './contractInteraction';

const Eros1Component = () => {
  const [matches, setMatches] = useState([]);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  // localPreferences is used for demo purposes only
  const [localPreferences, setLocalPreferences] = useState([]);

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

  return (
    <div>
      <h1>Eros1 Matching</h1>
      <h2>Your Matches:</h2>
      <ul>
        {matches.map((match, index) => (
          <li key={index}>
            Match with: {match.address}
            {match.userData ? (
              <div>
                Location: {getLocationString(match.userData.location) || 'Unknown'}, 
                Gender: {getGenderString(match.userData.gender) || 'Unknown'}
              </div>
            ) : (
              <div>Unable to fetch match data. (Address: {match.address})</div>
            )}
          </li>
        ))}
      </ul>
      {/* NOTE: This section is for demo purposes only */}
      <h2>Matched Interests (Demo only):</h2>
      <ul>
        {localPreferences.map((pref, index) => (
          <li key={index}>{pref}</li>
        ))}
      </ul>
    </div>
  );
};

export default Eros1Component;
