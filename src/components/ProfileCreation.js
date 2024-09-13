import React, { useState, useEffect } from 'react';
import { checkExistingProfile, getUserProfile, setUserProfile, setupContractInteraction, findMatches } from './contractInteraction';
import './ProfileCreation.css'; 

const GENDER_OPTIONS = [
  { value: '0', label: 'Male' },
  { value: '1', label: 'Female' },
  { value: '2', label: 'Other' }
];

const CONTINENT_OPTIONS = [
  { value: '0', label: 'Africa' },
  { value: '1', label: 'America' },
  { value: '2', label: 'Asia' },
  { value: '3', label: 'Australasia' },
  { value: '4', label: 'Europe' },
  { value: '5', label: 'Latin America' },
  { value: '6', label: 'Middle East' }
];

const GENDER_PREFERENCE_OPTIONS = [
  { value: '0', label: 'Male' },
  { value: '1', label: 'Female' },
  { value: '2', label: 'Both' }
];

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

const ProfileCreation = ({ setProfileStep, setIsSubmitting, hasProfile, profileStep, isSubmitting, onProfileCreated }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [genderPreference, setGenderPreference] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [preference1, setPreference1] = useState('');
  const [preference2, setPreference2] = useState('');
  const [preference3, setPreference3] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('idle');
  // 'idle', 'encrypting', 'sending', 'confirming', 'completed', 'error'

  useEffect(() => {
    const setupMatchListener = async () => {
      console.log('Setting up match listener...');
      const { contract, signer } = await setupContractInteraction();
      const address = await signer.getAddress();
      setUserAddress(address);
      console.log('User address:', address);

      // Listen for NewMatch events
      contract.on("NewMatch", (user1, user2, event) => {
        if (user1 === address || user2 === address) {
          console.log('Match involves current user, updating matches state');
          setMatches(prevMatches => [...prevMatches, { user1, user2 }]);
        } else {
          console.log('Match does not involve current user, ignoring');
        }
      });

      // Query past NewMatch events
      const filter = contract.filters.NewMatch();
      const events = await contract.queryFilter(filter);
      console.log('Total NewMatch events found:', events.length);
      const userMatches = events
        .filter(event => event.args.user1 === address || event.args.user2 === address)
        .map(event => ({
          user1: event.args.user1,
          user2: event.args.user2
        }));
      console.log('Matches involving current user:', userMatches);
      setMatches(userMatches);
    };

    setupMatchListener();

    // Cleanup function
    return () => {
      const cleanupListener = async () => {
        console.log('Cleaning up match listener...');
        const { contract } = await setupContractInteraction();
        contract.removeAllListeners("NewMatch");
      };
      cleanupListener();
    };
  }, []);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    setIsLoading(true);
    try {
      const hasProfile = await checkExistingProfile();
      if (hasProfile) {
        const userProfile = await getUserProfile();
        console.log('Raw unsealed profile data:', userProfile);
        setProfile(userProfile);
       
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setErrorMessage('Failed to check profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTransactionStatus('encrypting');
    try {
      const success = await setUserProfile(
        age,
        gender,
        location,
        genderPreference,
        [preference1, preference2, preference3],
        setTransactionStatus
      );
      if (success) {
        setTransactionStatus('completed');
        const updatedProfile = await getUserProfile();
        setProfile(updatedProfile);
        onProfileCreated();
      } else {
        setTransactionStatus('error');
        setErrorMessage('Failed to set profile. Please try again.');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      setTransactionStatus('error');
      setErrorMessage('An error occurred while setting your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setFormStep(2);
    setProfileStep(2);
  };

  const handleSetProfile = async () => {
    setIsSubmitting(true);
    setTransactionStatus('starting');
    try {
      const success = await setUserProfile(age, gender, location, genderPreference, [preference1, preference2, preference3], setTransactionStatus);
      if (success) {
        setTransactionStatus('completed');
        onProfileCreated();
      } else {
        setTransactionStatus('error');
        setErrorMessage('Failed to set profile. Please try again.');
      }
    } catch (error) {
      console.error('Error setting profile:', error);
      setTransactionStatus('error');
      setErrorMessage('An error occurred while setting your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (profile) {
    console.log('Displaying profile:', profile);
    console.log('Current matches:', matches);
    const locationNames = ['Africa', 'America', 'Asia', 'Australasia', 'Europe', 'Latin America', 'Middle East'];
    const genderNames = ['Male', 'Female', 'Other'];
    const genderPrefNames = ['Male', 'Female', 'Both'];

    return (
      <div className="profile-container">
        <div className="profile-box">
          <h2>Your Profile</h2>
          <p>Age: {profile.age}</p>
          <p>Gender: {genderNames[Number(profile.gender)] || `Unknown (${profile.gender})`}</p>
          <p>Location: {locationNames[Number(profile.location)] || `Unknown (${profile.location})`}</p>
          <p>Gender Preference: {genderPrefNames[Number(profile.genderPreference)] || `Unknown (${profile.genderPreference})`}</p>
        </div>
        
        {/* <div className="matches-box">
          <h2>Your Matches:</h2>
          {matches.length > 0 ? (
            <ul>
              {matches.map((match, index) => (
                <li key={index}>
                  Match with: {match.user1 === userAddress ? match.user2 : match.user1}
                </li>
              ))}
            </ul>
          ) : (
            <p>No matches found yet.</p>
          )}
        </div> */}
      </div>
    );
  }

  return (
    <div className="fhenix-container">
      {!isSubmitting ? (
        <div className="fhenix-card">
          {formStep === 1 ? (
            <>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="Age" 
                className="fhenix-input"
              />
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="fhenix-select"
              >
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="fhenix-select"
              >
                <option value="">Select Location</option>
                {CONTINENT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button onClick={handleNextStep} className="fhenix-button">Next</button>
            </>
          ) : (
            <>
              <select 
                value={preference1} 
                onChange={(e) => setPreference1(e.target.value)}
                className="fhenix-select"
              >
                <option value="">Select Preference 1</option>
                {PREFERENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select 
                value={preference2} 
                onChange={(e) => setPreference2(e.target.value)}
                className="fhenix-select"
              >
                <option value="">Select Preference 2</option>
                {PREFERENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select 
                value={preference3} 
                onChange={(e) => setPreference3(e.target.value)}
                className="fhenix-select"
              >
                <option value="">Select Preference 3</option>
                {PREFERENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select 
                value={genderPreference} 
                onChange={(e) => setGenderPreference(e.target.value)}
                className="fhenix-select"
              >
                <option value="">Select Preferred Gender</option>
                {GENDER_PREFERENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button onClick={handleSubmit} className="fhenix-button" disabled={isSubmitting}>
                Create Profile
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="transaction-status">
        <div className="spinner"></div>
        <div className="status-message">
          {transactionStatus === 'encrypting' && <p>Encrypting your data...</p>}
          {transactionStatus === 'sending' && <p>Sending transaction to the blockchain...</p>}
          {transactionStatus === 'confirming' && <p>Matching and Profile creation in progress...</p>}
          {transactionStatus === 'completed' && <p>Profile created successfully!</p>}
          {transactionStatus === 'error' && <p>Error: {errorMessage}</p>}
        </div>
      </div>
      )}
    </div>
  );
};

export default ProfileCreation;