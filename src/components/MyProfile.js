import React, { useState } from 'react';
import { setupContractInteraction } from './contractInteraction';
import { getPermit } from 'fhenixjs';

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null);

  const handleViewProfile = async (address) => {
    try {
      console.log('Setting up contract interaction...');
      const { contract, fhenixClient, signer } = await setupContractInteraction();
  
      if (!contract || !fhenixClient || !signer) {
        throw new Error('Failed to set up contract interaction');
      }
      console.log('Contract interaction setup complete:', { contract, fhenixClient, signer });
  
      console.log('Getting permit...');
      const permit = await getPermit(contract.address, signer);
      if (!permit) {
        throw new Error('Failed to obtain permit');
      }
      console.log('Permit obtained:', permit);
  
      console.log('Storing permit in fhenixClient...');
      try {
        fhenixClient.storePermit(permit);
      } catch (storeError) {
        throw new Error('Error storing permit: ' + storeError.message);
      }
  
      console.log('Extracting permit permission...');
      const permission = fhenixClient.extractPermitPermission(permit);
      if (!permission) {
        throw new Error('Failed to extract permission from permit');
      }
      console.log('Permission extracted:', permission);
  
      console.log('Fetching encrypted profile data...');
      const [encryptedAge, encryptedGender, encryptedLocation] = await contract.getProfileSealed(address, permission);
      if (!encryptedAge || !encryptedGender || !encryptedLocation) {
        throw new Error('Failed to fetch encrypted profile data');
      }
      console.log('Encrypted data received:', { encryptedAge, encryptedGender, encryptedLocation });
  
      console.log('Unsealing age...');
      const age = await fhenixClient.unseal(contract.address, encryptedAge);
      if (!age) {
        throw new Error('Failed to unseal age');
      }
      console.log('Unsealed age:', age);
  
      console.log('Unsealing gender...');
      const gender = await fhenixClient.unseal(contract.address, encryptedGender);
      if (!gender) {
        throw new Error('Failed to unseal gender');
      }
      console.log('Unsealed gender:', gender);
  
      console.log('Unsealing location...');
      const location = await fhenixClient.unseal(contract.address, encryptedLocation);
      if (!location) {
        throw new Error('Failed to unseal location');
      }
      console.log('Unsealed location:', location);
  
      setProfileData({ age, gender, location });
    } catch (error) {
      console.error('Error viewing profile:', error);
    }
  };
  

  return (
    <div>
      <h2>View Profile</h2>
      <button onClick={() => handleViewProfile('USER_ADDRESS')}>View Profile</button>
      {profileData && (
        <div>
          <p>Age: {profileData.age}</p>
          <p>Gender: {profileData.gender}</p>
          <p>Location: {profileData.location}</p>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
