import React, { useState } from 'react';
import './App.css';
// import ProfileCreation from './components/ProfileCreation';
import DatingApp from './components/Matching';

function App() {
  // const [showCreateProfile, setShowCreateProfile] = useState(false);
  // const [profileStep, setProfileStep] = useState(1);

  // const headerText = profileStep === 1 
  //   ? "hey you... just need the basics for now"
  //   : "don't be embarrassed, tell us your weird things to match with other people who likethe same wierd things";

  return (
    <div className="App">
      <DatingApp/>
      {/* {!showCreateProfile ? (
        <button className="create-profile-btn" onClick={() => setShowCreateProfile(true)}>
          Create Profile
        </button>
      ) : (
        <div className="profile-creation-container">
          <h1>{headerText}</h1>
          <ProfileCreation 
            setProfileStep={setProfileStep}
          />
          
        </div>
      )} */}
    </div>
  );
}

export default App;

