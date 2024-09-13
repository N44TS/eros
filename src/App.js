import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ProfileCreation from './components/ProfileCreation';
import { checkExistingProfile } from './components/contractInteraction';
import Matched from './components/Matched';

function App() {
  const [currentView, setCurrentView] = useState('initial');
  const [hasProfile, setHasProfile] = useState(false);
  const [profileStep, setProfileStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const profileExists = await checkExistingProfile();
      setHasProfile(profileExists);
    };
    checkProfile();
  }, []);

  const getHeaderText = () => {
    if (isSubmitting) {
      return "looking for your perfect match....";
    }
    if (profileStep === 1) {
      return "hey you... just need the basics for now";
    }
    return (
      <>
        say something weird, no-one will know, not even us!
        <br />
        <span className="subtext"> add your interests, hobbies, preferences, etc. 
          <br></br>All data is encrypted and kept completely private.</span>
      </>
    );
  };

  const handleButtonClick = () => {
    setCurrentView(hasProfile ? 'profile' : 'createProfile');
  };

  return (
    <div className="App">
      <Header />
      {currentView === 'createProfile' && !hasProfile && (
        <h2 className="fhenix-title">{getHeaderText()}</h2>
      )}
      {currentView === 'initial' && (
        <button className="chaos-button" onClick={handleButtonClick}>
          {hasProfile ? "Log In" : "Create Profile"}
        </button>
      )}
      {currentView === 'createProfile' && !hasProfile && (
        <div className="profile-creation-container">
          <ProfileCreation 
            setProfileStep={setProfileStep}
            setIsSubmitting={setIsSubmitting}
            hasProfile={hasProfile}
            profileStep={profileStep}
            isSubmitting={isSubmitting}
            onProfileCreated={() => {
              setHasProfile(true);
              setCurrentView('profile');
            }}
          />
        </div>
      )}
      {currentView === 'profile' && hasProfile && (
        <>
          <ProfileCreation 
            setProfileStep={setProfileStep}
            setIsSubmitting={setIsSubmitting}
            hasProfile={true}
            profileStep={profileStep}
            isSubmitting={isSubmitting}
          />
          <Matched />
        </>
      )}
    </div>
  );
}

export default App;