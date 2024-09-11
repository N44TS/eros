// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.9.0;

import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

contract ErosMain is Permissioned {
    struct Profile {
        euint8 age;
        euint8 location; 
        euint8 gender; // 0: Male, 1: Female, 2: Other
        euint8 preferredGender; // 0: Male, 1: Female, 2: Other
        euint256[3] encodedPreferences; // 3 encoded and encrypted preferences
    }

    mapping(address => Profile) private profiles;
    mapping(address => mapping(address => bool)) public potentialMatches;
    address[] public userAddresses;

    event ProfileCreated(address indexed user);
    event NewMatch(address indexed user1, address indexed user2);

    function setProfile(
        inEuint8 calldata encryptedAge,
        inEuint8 calldata encryptedLocation,
        inEuint8 calldata encryptedGender,
        inEuint8 calldata encryptedPreferredGender,
        inEuint256[3] calldata encryptedEncodedPreferences
    ) public {
        profiles[msg.sender] = Profile({
            age: FHE.asEuint8(encryptedAge),
            location: FHE.asEuint8(encryptedLocation),
            gender: FHE.asEuint8(encryptedGender),
            preferredGender: FHE.asEuint8(encryptedPreferredGender),
            encodedPreferences: [
                FHE.asEuint256(encryptedEncodedPreferences[0]),
                FHE.asEuint256(encryptedEncodedPreferences[1]),
                FHE.asEuint256(encryptedEncodedPreferences[2])
            ]
        });

        userAddresses.push(msg.sender);
        emit ProfileCreated(msg.sender);
        findPotentialMatchesForUser(msg.sender);
    }

    function getProfileSealed(address user, Permission calldata permission) public view returns (string[] memory) {
        Profile storage profile = profiles[user];
        string[] memory sealedData = new string[](7);
        
        sealedData[0] = FHE.sealoutput(profile.age, permission.publicKey);
        sealedData[1] = FHE.sealoutput(profile.location, permission.publicKey);
        sealedData[2] = FHE.sealoutput(profile.gender, permission.publicKey);
        sealedData[3] = FHE.sealoutput(profile.preferredGender, permission.publicKey);
        sealedData[4] = FHE.sealoutput(profile.encodedPreferences[0], permission.publicKey);
        sealedData[5] = FHE.sealoutput(profile.encodedPreferences[1], permission.publicKey);
        sealedData[6] = FHE.sealoutput(profile.encodedPreferences[2], permission.publicKey);
        
        return sealedData;
    }

  function findPotentialMatchesForUser(address user) internal {
    Profile storage userProfile = profiles[user];
    
    for (uint i = 0; i < userAddresses.length; i++) {
        address potentialMatch = userAddresses[i];
        if (potentialMatch != user && !potentialMatches[user][potentialMatch]) {
            if (checkPotentialMatch(userProfile, potentialMatch)) {
                potentialMatches[user][potentialMatch] = true;
                potentialMatches[potentialMatch][user] = true;
                emit NewMatch(user, potentialMatch);
            }
        }
    }
}

   function checkPotentialMatch(Profile storage userProfile, address potentialMatch) private view returns (bool) {
    Profile storage otherProfile = profiles[potentialMatch];
    
    // Age check
    euint8 ageDifference = FHE.sub(userProfile.age, otherProfile.age);
    bool ageMatch = FHE.decrypt(FHE.lte(ageDifference, FHE.asEuint8(3)));
    if (!ageMatch) return false;

    // Location check
    bool locationMatch = FHE.decrypt(FHE.eq(userProfile.location, otherProfile.location));
    if (!locationMatch) return false;

    // Gender check
    bool genderMatch = FHE.decrypt(FHE.or(
        FHE.eq(userProfile.preferredGender, otherProfile.gender),
        FHE.eq(userProfile.preferredGender, FHE.asEuint8(3))
    ));
    if (!genderMatch) return false;

    // Preferences check
    uint matchingPrefs = 0;
    for (uint i = 0; i < 3; i++) {
        if (FHE.decrypt(FHE.eq(userProfile.encodedPreferences[i], otherProfile.encodedPreferences[i]))) {
            matchingPrefs++;
        }
    }

    return matchingPrefs >= 2;
}

    function getPotentialMatches(address user) public view returns (address[] memory) {
        uint count = 0;
        for (uint i = 0; i < userAddresses.length; i++) {
            if (potentialMatches[user][userAddresses[i]]) {
                count++;
            }
        }

        address[] memory matches = new address[](count);
        uint index = 0;
        for (uint i = 0; i < userAddresses.length; i++) {
            if (potentialMatches[user][userAddresses[i]]) {
                matches[index] = userAddresses[i];
                index++;
            }
        }

        return matches;
    }
}