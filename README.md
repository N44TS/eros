# 💗 EROS 

**programmable privacy matchmaking dapp**

Eros is a decentralized, privacy-preserving dating app built on the Fhenix protocol built for ETHonline 2024. It uses fully homomorphic encryption (FHE) to ensure user data privacy while enabling secure matchmaking.

To use please make sure you are on [Fhenix](https://www.fhenix.io/cheat-sheet/) testnet and have some testnet ETH in your wallet.


## Features

- Encrypted profile creation
- A matchmaking smart contract, matching users based on encrypted preferences.
- Secure preference sharing
- Anonymous until matched: Users remain anonymous until they choose to reveal themselves
- Stay anonymous until matched, or forever if you choose
- Secure sharing of likes, dislikes, interests and hobbies. 
- bringing people togehter who have similar interests and may never have known it.

# Stack

- React.js
- Ethers.js
- Fhenix FHE
- Solidity

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## How It Works

TL:DR;
Key points:
1. The matchmaking contract uses encrypted user data.
2. It uses the Fhenix protocol for encrypted operations.
3. Users can create profiles with encrypted age, location, gender, and preferences.
4. The contract automatically finds matches based on compatibility.
5. Users can view matched profiles and show interest in others.
6. All sensitive data remains encrypted, enhancing privacy.

Users can create encrypted profiles with their age, gender, location, and any other information they want to share about themselves. The smart contract performs matchmaking on this encrypted data, revealing matches only when both parties express interest.

The smart contract performs matchmaking on the encrypted data without decrypting it, ensuring user privacy throughout the process.

Users can securely share their likes and dislikes without revealing this information to unmatched users or the platform itself.

1. User profiles are encrypted and stored on-chain
2. Matchmaking occurs using homomorphic operations
3. Only matched users can decrypt each other's information

## Privacy and Security
- All user data is encrypted using Fully Homomorphic Encryption (FHE)
- Matchmaking occurs on encrypted data, ensuring privacy throughout the process
- Users have full control over their data 
- The decentralized nature of the platform prevents centralized data breaches

## Future Improvements

- Implement a chat feature with XMTP
- Implement Kinto wallet for some degree of safety
- Add more detailed preference matching once I figure out how to make it less gas intensive
- add 'poke feature