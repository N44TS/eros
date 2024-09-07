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

const GENDER_PREFERENCE_OPTIONS = [
  { value: 1, label: 'Males' },
  { value: 2, label: 'Females' },
  { value: 3, label: 'Both' }
];

const ProfileCreation = ({ setProfileStep }) => {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [continent, setContinent] = useState('');
  const [preferences, setPreferences] = useState(['', '', '']);
  const [genderPreference, setGenderPreference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePreferenceChange = useCallback((index, value) => {
    if (value.length > MAX_PREFERENCE_LENGTH) {
      setErrorMessage(`Preference ${index + 1} exceeds the maximum allowed length of ${MAX_PREFERENCE_LENGTH} characters.`);
      return;
    }
    setErrorMessage('');
    setPreferences(prev => prev.map((pref, i) => i === index ? value : pref));
  }, []);

  const handleNextStep = () => {
    if (age && gender && continent) {
      setStep(2);
      setProfileStep(2);
    } else {
      setErrorMessage('Please fill in all fields');
    }
  };

  const handleSetProfile = async () => {
    if (!genderPreference) {
      setErrorMessage('Please select a gender preference');
      return;
    }

    setIsLoading(true);
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
      const encryptedPreferences = await Promise.all([
        ...preferences.map(async (pref) => {
          const prefAsNumber = preferenceToNumber(pref);
          return await fhenixClient.encrypt(prefAsNumber, EncryptionTypes.uint256);
        }),
        fhenixClient.encrypt(Number(genderPreference), EncryptionTypes.uint256)
      ]);

      console.log('Sending transaction to set profile...');
      const tx = await contract.setProfile(encryptedAge, encryptedGender, encryptedContinent, encryptedPreferences);
      console.log('Waiting for transaction confirmation...');
      await tx.wait();
      console.log('Profile set successfully');
      // Here we'll add logic to move to the next step (matching or profile view)
    } catch (error) {
      console.error('Error setting profile:', error);
      setErrorMessage('Failed to set profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert preference string to number
  const preferenceToNumber = (preference) => {
    const bytes = ethers.toUtf8Bytes(preference.padEnd(32, '\0'));
    return Number(ethers.toBigInt(bytes));
  };

  const renderBasicInfo = () => (
    <div>
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
      <button onClick={handleNextStep}>Next</button>
    </div>
  );

  const renderPreferences = () => (
    <div>
      <p>These will be encrypted and kept totally private. Only you can see them unless you choose to share with your match</p>
      {preferences.map((pref, index) => (
        <input
          key={index}
          type="text"
          maxLength={MAX_PREFERENCE_LENGTH}
          value={pref}
          onChange={(e) => handlePreferenceChange(index, e.target.value)}
          placeholder={`1 thing about me (e.g., 'I hate hiking' or 'obsessed with eggs')`}
        />
      ))}
      <div className="gender-preference">
        <label htmlFor="gender-preference">I like:</label>
        <select 
          id="gender-preference"
          value={genderPreference} 
          onChange={(e) => setGenderPreference(e.target.value)}
        >
          <option value="">Select Preferred Gender</option>
          {GENDER_PREFERENCE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <button onClick={handleSetProfile}>Set Profile</button>
    </div>
  );

  return (
    <div>
      {step === 1 ? renderBasicInfo() : renderPreferences()}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {isLoading && <p>Setting up your profile...</p>}
    </div>
  );
};

export default ProfileCreation;