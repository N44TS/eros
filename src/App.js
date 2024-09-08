import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ProfileCreation from './components/ProfileCreation';
import { checkExistingProfile } from './components/contractInteraction';

function App() {
  const [currentView, setCurrentView] = useState('initial');
  const [profileStep, setProfileStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const profileExists = await checkExistingProfile();
      setHasProfile(profileExists);
    };
    checkProfile();
  }, []);

  useEffect(() => {
    console.log("App: isSubmitting changed to", isSubmitting);
  }, [isSubmitting]);

  useEffect(() => {
    console.log("App: profileStep changed to", profileStep);
  }, [profileStep]);

  const getHeaderText = () => {
    if (isSubmitting) {
      return "looking for your perfect match";
    }
    if (profileStep === 1) {
      return "hey you... just need the basics for now";
    }
    return "say something weird, noone will know, not even us!";
  };

  const handleButtonClick = () => {
    setCurrentView('createProfile');
  };

  return (
    <div className="App">
      <Header />
      {currentView === 'initial' && (
        <button className="chaos-button" onClick={handleButtonClick}>
          {hasProfile ? "Log in" : "Create Profile"}
        </button>
      )}
      {currentView === 'createProfile' && (
        <div className="profile-creation-container">
          <ProfileCreation 
            setProfileStep={setProfileStep}
            setIsSubmitting={setIsSubmitting}
            hasProfile={hasProfile}
            profileStep={profileStep}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}

export default App;

