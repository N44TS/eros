// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.9.0;

// import necessary fhenix contracts
import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

contract Eros3 is Permissioned {
    struct Profile {
        euint8 age;
        euint8 location; // Simplified: just continents
        euint8 gender;
        euint8 genderPreference;
        euint8[3] preferences; 
    }

    // mappings and arrays to store user data
    mapping(address => Profile) private profiles;
    mapping(address => mapping(address => bool)) private matches;
    address[] private userAddresses;
    mapping(address => bool) private hasProfile;

    // emit events to the frontend
    event ProfilePartOneCreated(address indexed user);
    event ProfileCompleted(address indexed user);
    event NewMatch(address indexed user1, address indexed user2);

    function setProfilePart1(
        inEuint8 calldata encryptedAge,
        inEuint8 calldata encryptedLocation,
        inEuint8 calldata encryptedGender,
        inEuint8 calldata encryptedGenderPreference
    ) public {
        profiles[msg.sender].age = FHE.asEuint8(encryptedAge);
        profiles[msg.sender].location = FHE.asEuint8(encryptedLocation);
        profiles[msg.sender].gender = FHE.asEuint8(encryptedGender);
        profiles[msg.sender].genderPreference = FHE.asEuint8(encryptedGenderPreference);
        
        emit ProfilePartOneCreated(msg.sender);
    }

    function setProfilePart2(inEuint8[3] calldata encryptedPreferences) public {
        profiles[msg.sender].preferences = [
            FHE.asEuint8(encryptedPreferences[0]),
            FHE.asEuint8(encryptedPreferences[1]),
            FHE.asEuint8(encryptedPreferences[2])
        ];
        
        if (!hasProfile[msg.sender]) {
            userAddresses.push(msg.sender);
            hasProfile[msg.sender] = true;
        }
        
        emit ProfileCompleted(msg.sender);
        findMatchesForUser(msg.sender);
    }

    // function allows decrypting and viewing a profile if permitted
     // Split the getProfileSealed function into two parts due to stack too deep errors
    function getProfileSealedPart1(address user, Permission memory permission) public view returns (string memory, string memory, string memory, string memory) {
        require(matches[msg.sender][user] || matches[user][msg.sender] || msg.sender == user, "No match exists or not the owner");
        Profile storage profile = profiles[user];
        return (
            FHE.sealoutput(profile.age, permission.publicKey),
            FHE.sealoutput(profile.location, permission.publicKey),
            FHE.sealoutput(profile.gender, permission.publicKey),
            FHE.sealoutput(profile.genderPreference, permission.publicKey)
        );
    }

    function getProfileSealedPart2(address user, Permission memory permission) public view returns (string memory, string memory, string memory) {
        require(matches[msg.sender][user] || matches[user][msg.sender] || msg.sender == user, "No match exists or not the owner");
        Profile storage profile = profiles[user];
        return (
            FHE.sealoutput(profile.preferences[0], permission.publicKey),
            FHE.sealoutput(profile.preferences[1], permission.publicKey),
            FHE.sealoutput(profile.preferences[2], permission.publicKey)
        );
    }

    // internalfunction, find matches for a user
    function findMatchesForUser(address user) internal {
        Profile storage userProfile = profiles[user];
        for (uint i = 0; i < userAddresses.length; i++) {
            address otherUser = userAddresses[i];
            if (otherUser != user && !matches[user][otherUser]) {
                Profile storage otherProfile = profiles[otherUser];
                euint8 ageDifference = FHE.sub(userProfile.age, otherProfile.age);
                ebool ageMatch = FHE.lte(ageDifference, FHE.asEuint8(3));
                ebool locationMatch = FHE.eq(userProfile.location, otherProfile.location);
                ebool genderMatch = FHE.or(
                    FHE.eq(userProfile.genderPreference, FHE.asEuint8(3)),
                    FHE.eq(userProfile.genderPreference, otherProfile.gender)
                );
                ebool otherGenderMatch = FHE.or(
                    FHE.eq(otherProfile.genderPreference, FHE.asEuint8(3)),
                    FHE.eq(otherProfile.genderPreference, userProfile.gender)
                );

                // New: Preference matching
                euint8 matchingPreferences = FHE.asEuint8(0);
                for (uint j = 0; j < 3; j++) {
                    matchingPreferences = FHE.add(
                        matchingPreferences,
                        FHE.select(
                            FHE.eq(userProfile.preferences[j], otherProfile.preferences[j]),
                            FHE.asEuint8(1),
                            FHE.asEuint8(0)
                        )
                    );
                }
                ebool preferenceMatch = FHE.gte(matchingPreferences, FHE.asEuint8(2));

                ebool isMatch = FHE.and(FHE.and(FHE.and(FHE.and(ageMatch, locationMatch), genderMatch), otherGenderMatch), preferenceMatch);
                if (FHE.decrypt(isMatch)) {
                    matches[user][otherUser] = true;
                    matches[otherUser][user] = true;
                    emit NewMatch(user, otherUser);
                }
            }
        }
    }

    function findMatchesBatch(address[] memory users) public {
        for (uint i = 0; i < users.length; i++) {
            findMatchesForUser(users[i]);
        }
    }

    // check if two users are matched function
    function getMatchStatus(address user1, address user2) public view returns (bool) {
        return matches[user1][user2];
    }

    // This function checks if a user has a profile
    function hasUserProfile(address user) public view returns (bool) {
        return hasProfile[user];
    }

    // This function allows a user to show interest in another user to enable chat
    function showInterest(address potentialMatch) public {
        require(!matches[msg.sender][potentialMatch], "Already matched or shown interest");
        matches[msg.sender][potentialMatch] = true;
        if (matches[potentialMatch][msg.sender]) {
            emit NewMatch(msg.sender, potentialMatch);
        }
    }
}