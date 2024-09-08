import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FhenixClient, getPermit } from 'fhenixjs';
import abi from '../utils/abi.json';

const CONTRACT_ADDRESS = "0x93e0CB863EE9C067FD64745CDCE2d574Bc7cEFb5";

function ErosDatingApp() {
    const [profile, setProfile] = useState({ age: null, location: null });
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');
    const [userAddress, setUserAddress] = useState('');

    useEffect(() => {
        const initialize = async () => {
            try {
                if (!window.ethereum) {
                    throw new Error("No Ethereum provider detected. Please install MetaMask.");
                }

                const provider = new ethers.BrowserProvider(window.ethereum);
                
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setUserAddress(address);

                const client = new FhenixClient({ provider });
                const permit = await getPermit(CONTRACT_ADDRESS, provider);
                client.storePermit(permit);
                const permission = client.extractPermitPermission(permit);

                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

                // Fetch profile
                const [sealedAge, sealedLocation] = await contract.getProfileSealed(address, permission);
                const age = await client.unseal(CONTRACT_ADDRESS, sealedAge);
                const location = await client.unseal(CONTRACT_ADDRESS, sealedLocation);

                if (age && location) {
                    setProfile({ 
                        age: age.toString(), 
                        location: ['America', 'Europe', 'Asia', 'Africa'][Number(location)]
                    });
                }

                // Fetch matches
                const filter = contract.filters.NewMatch();
                const events = await contract.queryFilter(filter);
                const userMatches = events
                    .filter(event => event.args.user1 === address || event.args.user2 === address)
                    .map(event => ({
                        user1: event.args.user1,
                        user2: event.args.user2
                    }));
                setMatches(userMatches);

            } catch (err) {
                console.error('Error initializing:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    const handleCreateProfile = async () => {
        // ... (keep the existing handleCreateProfile function)
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Eros Dating App</h1>
            <p>Your address: {userAddress}</p>
            
            {profile.age && profile.location ? (
                <div>
                    <h2>Your Profile</h2>
                    <p>Age: {profile.age}</p>
                    <p>Location: {profile.location}</p>
                </div>
            ) : (
                <div>
                    <h2>Create Your Profile</h2>
                    <input 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)} 
                        placeholder="Age" 
                    />
                    <select 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        <option value="">Select Location</option>
                        <option value="0">America</option>
                        <option value="1">Europe</option>
                        <option value="2">Asia</option>
                        <option value="3">Africa</option>
                    </select>
                    <button onClick={handleCreateProfile}>Create Profile</button>
                </div>
            )}
            
            <div>
                <h2>Your Matches:</h2>
                {matches.length > 0 ? (
                    <ul>
                        {matches.map((match, index) => (
                            <li key={index}>
                                {match.user1 === userAddress ? match.user2 : match.user1}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No matches found yet.</p>
                )}
            </div>
        </div>
    );
}

export default ErosDatingApp;