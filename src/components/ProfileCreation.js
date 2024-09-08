import React, { useState, useEffect } from 'react';
import { checkExistingProfile, getUserProfile, setUserProfile, setupContractInteraction } from './contractInteraction';
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

const ProfileCreation = ({ setProfileStep, setIsSubmitting, hasProfile, profileStep, isSubmitting }) => {
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
  const [weirdThing1, setWeirdThing1] = useState('');
  const [weirdThing2, setWeirdThing2] = useState('');
  const [weirdThing3, setWeirdThing3] = useState('');

  useEffect(() => {
    const setupMatchListener = async () => {
      console.log('Setting up match listener...');
      const { contract, signer } = await setupContractInteraction();
      const address = await signer.getAddress();
      setUserAddress(address);
      console.log('User address:', address);

      // Listen for NewMatch events
      contract.on("NewMatch", (user1, user2, event) => {
        console.log(`New match event received: ${user1} and ${user2}`);
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
    console.log("ProfileCreation: isSubmitting changed to", isSubmitting);
  }, [isSubmitting]);

  useEffect(() => {
    console.log("ProfileCreation: profileStep changed to", profileStep);
  }, [profileStep]);

  useEffect(() => {
    checkProfile();
  }, []);

  useEffect(() => {
    console.log("ProfileCreation: Header text updated to", getHeaderText());
  }, [isSubmitting, profileStep]);

  const checkProfile = async () => {
    setIsLoading(true);
    try {
      const hasProfile = await checkExistingProfile();
      if (hasProfile) {
        const userProfile = await getUserProfile();
        console.log('Raw unsealed profile data:', userProfile);
        setProfile(userProfile);
        // TODO: Fetch matches
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setErrorMessage('Failed to check profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetProfile = async () => {
    console.log("ProfileCreation: Starting profile submission");
    setIsSubmitting(true);
    try {
      const genderValue = GENDER_OPTIONS.findIndex(option => option.value === gender);
      const locationValue = CONTINENT_OPTIONS.findIndex(option => option.value === location);
      const genderPrefValue = GENDER_PREFERENCE_OPTIONS.findIndex(option => option.value === genderPreference);

      console.log('Sending to contract:', { age, genderValue, locationValue, genderPrefValue });

      setIsLoading(true);
      try {
        const success = await setUserProfile(age, genderValue, locationValue, genderPrefValue);
        if (success) {
          const userProfile = await getUserProfile();
          setProfile(userProfile);
          
          setProfileStep(2); // Move to the next step (matches view)
        } else {
          setErrorMessage('Failed to set profile. Please try again.');
        }
      } catch (error) {
        console.error('Error setting profile:', error);
        setErrorMessage('An error occurred while setting your profile. Please try again.');
      } finally {
        console.log("ProfileCreation: Ending profile submission");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error setting profile:', error);
      setErrorMessage('An error occurred while setting your profile. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setFormStep(2);
    setProfileStep(2);
  };

  const getHeaderText = () => {
    if (isSubmitting) {
      console.log("ProfileCreation: Returning 'looking for your perfect match'");
      return "looking for your perfect match";
    }
    if (profileStep === 1) {
      return "hey you... just need the basics for now";
    }
    return "say something weird, noone will know, not even us!";
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
      <div>
        <h2>Your Profile</h2>
        <p>Age: {profile.age}</p>
        <p>Gender: {genderNames[Number(profile.gender)] || `Unknown (${profile.gender})`}</p>
        <p>Location: {locationNames[Number(profile.location)] || `Unknown (${profile.location})`}</p>
        <p>Gender Preference: {genderPrefNames[Number(profile.genderPreference)] || `Unknown (${profile.genderPreference})`}</p>
        
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
      </div>
    );
  }

  return (
    <div className="fhenix-container">
      <h2 key={isSubmitting ? 'submitting' : 'not-submitting'} className="fhenix-title">
        {getHeaderText()}
      </h2>
      {!profile ? (
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
              <input 
                type="text" 
                value={weirdThing1}
                onChange={(e) => setWeirdThing1(e.target.value)}
                placeholder="What's your weird thing?" 
                className="fhenix-input"
              />
              <input 
                type="text" 
                value={weirdThing2}
                onChange={(e) => setWeirdThing2(e.target.value)}
                placeholder="What's your weird thing?" 
                className="fhenix-input"
              />
              <input 
                type="text" 
                value={weirdThing3}
                onChange={(e) => setWeirdThing3(e.target.value)}
                placeholder="What's your weird thing?" 
                className="fhenix-input"
              />
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
              <button onClick={handleSetProfile} className="fhenix-button">Create Profile</button>
            </>
          )}
        </div>
      ) : (
        <div className="fhenix-card">
          <h2 className="fhenix-subtitle">Your Profile</h2>
          <p>Age: {profile.age}</p>
          <p>Gender: {GENDER_OPTIONS[Number(profile.gender)]?.label || 'Unknown'}</p>
          <p>Location: {CONTINENT_OPTIONS[Number(profile.location)]?.label || 'Unknown'}</p>
          <p>Gender Preference: {GENDER_PREFERENCE_OPTIONS[Number(profile.genderPreference)]?.label || 'Unknown'}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileCreation;