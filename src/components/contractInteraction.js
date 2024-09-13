import { ethers } from 'ethers';
import { FhenixClient, getPermit, EncryptionTypes } from 'fhenixjs';
// import CONTRACT_ABI from '../utils/abi.json';
// import CONTRACT_ABI from '../utils/eros2abi.json';
import CONTRACT_ABI from '../utils/eros3abi.json';

// const CONTRACT_ADDRESS = "0x90AAB0CC76E736F8F9b9Fde97B5B6BDd9970a39B";//eros1
// const CONTRACT_ADDRESS = "0x523daeCe51B6988f18C58aE8857C96C1296Cf1D9";//eros2
const CONTRACT_ADDRESS = "0x5C72D6B9594a71eDA76f9476134337F59037A39a";//eros3

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

// check if user has existing profile but have to get a permit to unseal first? - should probably change contract to add so
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

export const setUserProfile = async (age, gender, location, genderPreference, preferences, statusCallback) => {
  const { contract, fhenixClient } = await setupContractInteraction();

  try {
    statusCallback('encrypting');
    const encryptedAge = await fhenixClient.encrypt_uint8(Number(age));
    const encryptedGender = await fhenixClient.encrypt_uint8(Number(gender));
    const encryptedLocation = await fhenixClient.encrypt_uint8(Number(location));
    const encryptedGenderPreference = await fhenixClient.encrypt_uint8(Number(genderPreference));
    const encryptedPreferences = await Promise.all(preferences.map(pref => 
      fhenixClient.encrypt_uint8(Number(pref))
    ));

    statusCallback('sending');
    const tx1 = await contract.setProfilePart1(
      encryptedAge, 
      encryptedLocation, 
      encryptedGender, 
      encryptedGenderPreference,
    );
    statusCallback('confirming');
    await tx1.wait();

    const tx2 = await contract.setProfilePart2(
      encryptedPreferences,
    );
    await tx2.wait();
    
    statusCallback('completed');
    return true;
  } catch (error) {
    console.error('Error setting user profile:', error);
    statusCallback('error');
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

    const [sealedAge, sealedLocation, sealedGender, sealedGenderPreference] = await contract.getProfileSealedPart1(userAddress, permission);
    const [sealedPref1, sealedPref2, sealedPref3] = await contract.getProfileSealedPart2(userAddress, permission);
    
    const age = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedAge);
    const location = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedLocation);
    const gender = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedGender);
    const genderPreference = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedGenderPreference);
    const pref1 = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedPref1);
    const pref2 = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedPref2);
    const pref3 = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedPref3);

    return { 
      age: age.toString(), 
      location: location.toString(),
      gender: gender.toString(),
      genderPreference: genderPreference.toString(),
      preferences: [pref1.toString(), pref2.toString(), pref3.toString()]
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const findMatches = async () => {
  const { contract, signer } = await setupContractInteraction();
  const userAddress = await signer.getAddress();
  try {
    const tx = await contract.findMatchesBatch([userAddress]);
    await tx.wait();
    console.log("Matches found and processed");
  } catch (error) {
    console.error("Error finding matches:", error);
  }
};

export const getMatchedUserProfile = async (matchedUserAddress) => {
  const { contract, fhenixClient, signer } = await setupContractInteraction();
  const currentUserAddress = await signer.getAddress();

  try {
    const isMatch = await contract.getMatchStatus(currentUserAddress, matchedUserAddress);
    
    if (!isMatch) {
      console.error('No match found for this profile');
      return null;
    }

    const permit = await getPermit(CONTRACT_ADDRESS, signer.provider);
    fhenixClient.storePermit(permit);
    const permission = fhenixClient.extractPermitPermission(permit);

    const [sealedAge, sealedLocation, sealedGender, sealedGenderPreference] = await contract.getProfileSealedPart1(matchedUserAddress, permission);
    const [sealedPref1, sealedPref2, sealedPref3] = await contract.getProfileSealedPart2(matchedUserAddress, permission);
    
    const age = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedAge);
    const location = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedLocation);
    const gender = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedGender);
    const genderPreference = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedGenderPreference);
    const pref1 = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedPref1);
    const pref2 = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedPref2);
    const pref3 = await fhenixClient.unseal(CONTRACT_ADDRESS, sealedPref3);

    return { 
      age: age.toString(), 
      location: location.toString(),
      gender: gender.toString(),
      genderPreference: genderPreference.toString(),
      preferences: [pref1.toString(), pref2.toString(), pref3.toString()]
    };
  } catch (error) {
    console.error('Error getting matched user profile:', error);
    return null;
  }
};