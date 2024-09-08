import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FhenixClient, getPermit } from 'fhenixjs';
import abi from '../../utils/abi.json';

const ProfileComponent = () => {
  const [profile, setProfile] = useState({ age: null, location: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define contract address and ABI
  const contractAddress = "0x74c519920DC905C64C598800deAfAA22918D9f34";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Initialize provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Initialize Fhenix client
        const client = new FhenixClient({ provider });

        // Generate permit and extract permission
        const permit = await getPermit(contractAddress, provider);
        client.storePermit(permit);
        const permission = client.extractPermitPermission(permit);

        // Initialize contract
        const contract = new ethers.Contract(contractAddress, abi, signer);

        // Get user address
        const userAddress = await signer.getAddress();

        // Fetch and decrypt profile
        const [sealedAge, sealedLocation] = await contract.getProfileSealed(userAddress, permission);
        console.log('Sealed Age:', sealedAge);
        console.log('Sealed Location:', sealedLocation);

        const age = await client.unseal(contractAddress, sealedAge);
        const location = await client.unseal(contractAddress, sealedLocation);

        console.log('Decrypted Age:', age);
        console.log('Decrypted Location:', location);

        // Convert BigInt to string
        setProfile({ age: age.toString(), location: location.toString() });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [contractAddress, abi]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Profile</h2>
      <p>Age: {profile.age}</p>
      <p>Location: {profile.location}</p>
    </div>
  );
};

export default ProfileComponent;