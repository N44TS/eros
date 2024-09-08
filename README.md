# EROS 

**programmable privacy blind dating**

Eros is a decentralized, privacy-preserving dating application built on the Fhenix protocol built for ETHonline 2024. It leverages fully homomorphic encryption (FHE) to ensure user data privacy while enabling secure matchmaking.

To use please make sure you are on Fhenix testnet and have some testnet ETH in your wallet.

## Features

- Encrypted profile creation
- Privacy-preserving matchmaking
- Secure preference sharing
- Decentralized architecture
- Stay anonymous until matched, or forever if you choose
- Secure sharing of likes and dislikes 

# Stack

- React.js
- Ethers.js
- Fhenix Protocol
- Solidity

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## How It Works

Users can create encrypted profiles with their age, gender, location, and any other information they want to share about themselves. The smart contract performs matchmaking on this encrypted data, revealing matches only when both parties express interest.

1. User profiles are encrypted and stored on-chain
2. Matchmaking occurs using homomorphic operations
3. Only matched users can decrypt each other's information

## Future Improvements

- Implement a chat feature with XMTP
- Implement Kinto wallet for some degree of safety
- Add more detailed preference matching once I figure out how to make it less gas intensive
- add 'poke feature