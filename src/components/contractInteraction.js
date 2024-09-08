import { ethers } from 'ethers';
import { FhenixClient, getPermit, EncryptionTypes } from 'fhenixjs';
import CONTRACT_ABI from '../utils/abi.json';

const CONTRACT_ADDRESS = "0x610f8673212a39Bd10a54a3773d65626303BBcdB";//eros1

// setup contract interaction
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

// check if user has existing profile but have to get a permit to unseal first - should probably change contract to add so
export const checkExistingProfile = async () => {
  const { contract, fhenixClient, signer } = await setupContractInteraction();
  const userAddress = await signer.getAddress();

  try {
    const permit = await getPermit(CONTRACT_ADDRESS, signer.provider);
    fhenixClient.storePermit(permit);
    const permission = fhenixClient.extractPermitPermission(permit);

    const hasProfile = await contract.hasUserProfile(userAddress);
    return hasProfile;
  } catch (error) {
    console.error('Error checking existing profile:', error);
    return false;
  }
};

export const setUserProfile = async (age, gender, location, genderPreference) => {
  const { contract, fhenixClient } = await setupContractInteraction();

  try {
    console.log('Raw input data:', { age, gender, location, genderPreference });

    const encryptedAge = await fhenixClient.encrypt(Number(age), EncryptionTypes.uint8);
    const encryptedGender = await fhenixClient.encrypt(Number(gender), EncryptionTypes.uint8);
    const encryptedLocation = await fhenixClient.encrypt(Number(location), EncryptionTypes.uint8);
    const encryptedGenderPreference = await fhenixClient.encrypt(Number(genderPreference), EncryptionTypes.uint8);

    console.log('Encrypted data:', { encryptedAge, encryptedGender, encryptedLocation, encryptedGenderPreference });

    const tx = await contract.setProfile(encryptedAge, encryptedLocation, encryptedGender, encryptedGenderPreference);
    await tx.wait();
    
    console.log('Profile set successfully');
    return true;
  } catch (error) {
    console.error('Error setting user profile:', error);
    return false;
  }
};

export const getUserProfile = async () => {
  const { contract, fhenixClient, signer } = await setupContractInteraction();
  const userAddress = await signer.getAddress();

  try {
    const permit = await getPermit(CONTRACT_ADDRESS, signer.provider);
    fhenixClient.storePermit(permit);
    const permission = fhenixClient.extractPermitPermission(permit);

    const [sealedAge, sealedLocation, sealedGender, sealedGenderPreference] = await contract.getProfileSealed(userAddress, permission);
    
    console.log('Raw sealed data from contract:', { sealedAge, sealedLocation, sealedGender, sealedGenderPreference });

    const age = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedAge);
    const location = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedLocation);
    const gender = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedGender);
    const genderPreference = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedGenderPreference);

    console.log('Decrypted profile data:', { age, location, gender, genderPreference });

    return { 
      age: age.toString(), 
      location: location.toString(),
      gender: gender.toString(),
      genderPreference: genderPreference.toString()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const findMatches = async () => {
  const { contract, fhenixClient, signer } = await setupContractInteraction();
  const userAddress = await signer.getAddress();

  try {
    console.log('Finding matches for address:', userAddress);

    // Call findMatchesBatch with the current user's address
    const tx = await contract.findMatchesBatch([userAddress]);
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');

    // Query for NewMatch events
    const filter = contract.filters.NewMatch();
    const events = await contract.queryFilter(filter);
    console.log('Events found:', events.length);

    const userMatches = events
      .filter(event => event.args.user1 === userAddress || event.args.user2 === userAddress)
      .map(event => ({
        user1: event.args.user1,
        user2: event.args.user2
      }));

    console.log('Filtered matches:', userMatches);
    return userMatches;
  } catch (error) {
    console.error('Error in findMatches:', error);
    return [];
  }
};
