import React from 'react';
import './App.css';
// import ConnectWallet from './components/SignIn';
import ProfileCreation from './components/ProfileCreation';
// import MyProfile from './components/MyProfile';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Simple React dApp</h1>
      <ProfileCreation/>
      </header>
      <div>
      <p>Block explorer: https://explorer.helium.fhenix.zone/</p>
    </div>
    </div>
 
  );
}

export default App;

