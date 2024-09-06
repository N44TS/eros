import React, { useState, useCallback } from 'react';
import { setupContractInteraction } from './contractInteraction';
import { EncryptionTypes } from 'fhenixjs';
import { ethers } from 'ethers';

//inputs
const GENDER_OPTIONS = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Non-binary' }
];

const CONTINENT_OPTIONS = [
  { value: 1, label: 'Africa' },
  { value: 2, label: 'Asia' },
  { value: 3, label: 'Australasia' },
  { value: 4, label: 'Middle East' },
  { value: 5, label: 'Europe' },
  { value: 6, label: 'North America' },
  { value: 7, label: 'South America' }
];

const MAX_PREFERENCE_LENGTH = 32; // Maximum character length of preference input

const ProfileCreation = () => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [continent, setContinent] = useState('');
  const [preferences, setPreferences] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePreferenceChange = useCallback((index, value) => {
    if (value.length > MAX_PREFERENCE_LENGTH) {
      setErrorMessage(`Preference ${index + 1} exceeds the maximum allowed length of ${MAX_PREFERENCE_LENGTH} characters.`);
      return;
    }
    setErrorMessage('');
    setPreferences(prev => prev.map((pref, i) => i === index ? value : pref));
  }, []);

  const handleSetProfile = async () => {
    try {
      console.log('Setting up contract interaction...');
      const { contract, fhenixClient, signer } = await setupContractInteraction();

      if (!contract || !fhenixClient || !signer) {
        throw new Error('Failed to set up contract interaction');
      }
      console.log('Contract interaction setup complete:', { contract, fhenixClient, signer });

      console.log('Encrypting age...');
      const encryptedAge = await fhenixClient.encrypt(Number(age), EncryptionTypes.uint8);
      console.log('Encrypting gender...');
      const encryptedGender = await fhenixClient.encrypt(Number(gender), EncryptionTypes.uint8);
      console.log('Encrypting continent...');
      const encryptedContinent = await fhenixClient.encrypt(Number(continent), EncryptionTypes.uint32);

      console.log('Encrypting preferences...');
      const encryptedPreferences = await Promise.all(
        preferences.map(async (pref) => {
          // Convert preference to a number representation
          const prefAsNumber = preferenceToNumber(pref);
          return await fhenixClient.encrypt(prefAsNumber, EncryptionTypes.uint256);
        })
      );

      console.log('Sending transaction to set profile...');
      const tx = await contract.setProfile(encryptedAge, encryptedGender, encryptedContinent, encryptedPreferences);
      console.log('Waiting for transaction confirmation...');
      await tx.wait();
      console.log('Profile set successfully');
    } catch (error) {
      console.error('Error setting profile:', error);
      setErrorMessage('Failed to set profile. Please try again.');
    }
  };

  // Helper function to convert preference string to number
  const preferenceToNumber = (preference) => {
    const bytes = ethers.toUtf8Bytes(preference.padEnd(32, '\0'));
    return Number(ethers.toBigInt(bytes));
  };
  return (
    <div>
      <h2>Create Profile</h2>
      <input 
        type="number" 
        value={age} 
        onChange={(e) => setAge(e.target.value)} 
        placeholder="Age" 
      />
      <select 
        value={gender} 
        onChange={(e) => setGender(e.target.value)}
      >
        <option value="">Select Gender</option>
        {GENDER_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select 
        value={continent} 
        onChange={(e) => setContinent(e.target.value)}
      >
        <option value="">Location</option>
        {CONTINENT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {preferences.map((pref, index) => (
        <input
          key={index}
          type="text"
          maxLength={35}
          value={pref}
          onChange={(e) => handlePreferenceChange(index, e.target.value)}
          placeholder={`Preference ${index + 1} (e.g., 'likes hiking', 'is vegan')`}
        />
      ))}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button onClick={handleSetProfile}>Set Profile</button>
    </div>
  );
};

export default ProfileCreation;