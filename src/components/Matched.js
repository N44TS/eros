import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FhenixClient } from 'fhenixjs';
import CONTRACT_ABI from '../utils/abi.json';

const Eros1Component = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [matches, setMatches] = useState([]);
  const [fhenixClient, setFhenixClient] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const contractAddress = "0x610f8673212a39Bd10a54a3773d65626303BBcdB";
        const eros1Contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        setContract(eros1Contract);

        // Initialize FhenixClient
        const client = new FhenixClient({ provider });
        setFhenixClient(client);

        // Fetch existing matches
        await fetchExistingMatches(eros1Contract, address);

        // Listen for NewMatch events
        eros1Contract.on("NewMatch", async (user1, user2, event) => {
          if (user1 === address || user2 === address) {
            console.log(`New match involving current user: ${user1} and ${user2}`);
            await addNewMatch(user1, user2, address);
          }
        });
      }
    };

    init();

    return () => {
      if (contract) {
        contract.removeAllListeners("NewMatch");
      }
    };
  }, [account]); // Change dependency to account

  const fetchExistingMatches = async (contract, userAddress) => {
    // Clear previous matches
    setMatches([]);

    // Fetch past NewMatch events
    const filter = contract.filters.NewMatch();
    const events = await contract.queryFilter(filter);

    // Filter events to include only those involving the current user
    const userMatches = events
      .filter(event => event.args.user1 === userAddress || event.args.user2 === userAddress)
      .map(event => ({
        user1: event.args.user1,
        user2: event.args.user2
      }));

    console.log('Matches involving current user:', userMatches);

    // Process events and add matches
    for (let match of userMatches) {
      await addNewMatch(match.user1, match.user2, userAddress);
    }
  };

  const addNewMatch = async (user1, user2, currentUser) => {
    const matchAddress = user1 === currentUser ? user2 : user1;
    const userData = await fetchUserData(matchAddress);
    setMatches(prevMatches => {
      // Check if this match already exists to avoid duplicates
      if (!prevMatches.some(match => match.address === matchAddress)) {
        console.log(`Adding new match: ${matchAddress}`);
        return [...prevMatches, { address: matchAddress, userData }];
      }
      return prevMatches;
    });
  };

  const fetchUserData = async (userAddress) => {
    if (!contract || !fhenixClient) return null;

    try {
      const permission = await fhenixClient.getPermission();
      const [ageSealedData, locationSealedData, genderSealedData, genderPreferenceSealedData] = 
        await contract.getProfileSealed(userAddress, permission);

      const age = await fhenixClient.unseal(ageSealedData);
      const location = await fhenixClient.unseal(locationSealedData);
      const gender = await fhenixClient.unseal(genderSealedData);
      const genderPreference = await fhenixClient.unseal(genderPreferenceSealedData);

      console.log(`Fetched user data for ${userAddress}: Age: ${age}, Location: ${location}, Gender: ${gender}, Gender Preference: ${genderPreference}`);

      return { age, location, gender, genderPreference };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  const getLocationString = (locationCode) => {
    const locations = ["North America", "South America", "Europe", "Africa", "Asia", "Australia", "Antarctica"];
    return locations[locationCode - 1] || "Unknown";
  };

  const getGenderString = (genderCode) => {
    const genders = ["Male", "Female", "Other"];
    return genders[genderCode - 1] || "Unknown";
  };

  const findMatches = async () => {
    if (contract && account) {
      await fetchExistingMatches(contract, account);
    }
  };

  return (
    <div>
      <h1>Eros1 Matching</h1>
      <button onClick={findMatches}>Find New Matches</button>
      <h2>Your Matches:</h2>
      <ul>
        {matches.map((match, index) => (
          <li key={index}>
            Match with: {match.address}
            {match.userData ? (
              <div>
                Age: {match.userData.age}, 
                Location: {getLocationString(match.userData.location)}, 
                Gender: {getGenderString(match.userData.gender)}
              </div>
            ) : (
              <div>Loading match data...</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Eros1Component;
