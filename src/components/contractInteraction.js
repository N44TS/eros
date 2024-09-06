import { ethers } from 'ethers';
import { FhenixClient, EncryptionTypes } from 'fhenixjs';
import CONTRACT_ABI from '../utils/erosabi.json';

const CONTRACT_ADDRESS = '0x6369b78557902534e9Ab0F21a109f7b8eb17D5f0';

export const setupContractInteraction = async () => {
  if (typeof window.ethereum !== 'undefined') {
    console.log('Ethereum wallet detected');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    console.log('Contract instance created');
    const fhenixClient = new FhenixClient({ provider });
    console.log('FhenixClient initialized');
    return { contract, fhenixClient, signer };
  } else {
    console.error('Ethereum wallet not detected');
    throw new Error('Ethereum wallet not detected');
  }
};
