// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.9.0;

import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

contract Eros is Permissioned {
    struct Profile {
        euint8 age;
        euint8 gender;
        euint32 location;
        euint256[4] preferences;
    }

    mapping(address => Profile) private profiles;
    mapping(address => mapping(address => bool)) private matches;
    mapping(address => address[]) private potentialMatches;

    event ProfileCreated(address indexed user);
    event NewMatch(address indexed user1, address indexed user2);

    function setProfile(
        inEuint8 calldata encryptedAge,
        inEuint8 calldata encryptedGender,
        inEuint32 calldata encryptedLocation,
        inEuint256[4] calldata encryptedPreferences 
    ) public {
        profiles[msg.sender] = Profile({
            age: FHE.asEuint8(encryptedAge),
            gender: FHE.asEuint8(encryptedGender),
            location: FHE.asEuint32(encryptedLocation),
            preferences: [
                FHE.asEuint256(encryptedPreferences[0]),
                FHE.asEuint256(encryptedPreferences[1]),
                FHE.asEuint256(encryptedPreferences[2]),
                FHE.asEuint256(encryptedPreferences[3])
            ]
        });

        emit ProfileCreated(msg.sender);
    }

    function findPotentialMatches() public {
        // Implementation of matching logic based on preferences
        // This would populate the potentialMatches mapping
    }

    function expressInterest(address potentialMatch) public {
        require(isInPotentialMatches(msg.sender, potentialMatch), "Not a potential match");
        if (isInPotentialMatches(potentialMatch, msg.sender)) {
            matches[msg.sender][potentialMatch] = true;
            matches[potentialMatch][msg.sender] = true;
            emit NewMatch(msg.sender, potentialMatch);
        }
    }

 function getProfileSealed(address user, Permission memory permission) public view returns (string memory, string memory, string memory) {
    require(matches[msg.sender][user] || matches[user][msg.sender] || msg.sender == user, "No match exists or not the owner");
    Profile storage profile = profiles[user];
    return (
        FHE.sealoutput(profile.age, permission.publicKey),
        FHE.sealoutput(profile.gender, permission.publicKey),
        FHE.sealoutput(profile.location, permission.publicKey)
    );
}


    function getMatchedPreferencesSealed(address matchedUser, Permission memory permission) public view returns (string memory, string memory, string memory, string memory) {
    require(matches[msg.sender][matchedUser] || matches[matchedUser][msg.sender] || msg.sender == matchedUser, "No match exists or not the owner");
    Profile storage profile = profiles[matchedUser];
    return (
        FHE.sealoutput(profile.preferences[0], permission.publicKey),
        FHE.sealoutput(profile.preferences[1], permission.publicKey),
        FHE.sealoutput(profile.preferences[2], permission.publicKey),
        FHE.sealoutput(profile.preferences[3], permission.publicKey)
    );
}

    function isInPotentialMatches(address user, address potentialMatch) internal view returns (bool) {
        address[] storage potential = potentialMatches[user];
        for (uint i = 0; i < potential.length; i++) {
            if (potential[i] == potentialMatch) {
                return true;
            }
        }
        return false;
    }
}
