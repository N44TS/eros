//address: 0x610f8673212a39Bd10a54a3773d65626303BBcdB

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.9.0;

// import necessary fhenix contracts
import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

contract Eros1 is Permissioned {
    struct Profile {
        euint8 age;
        euint8 location; // Simplified: just continents
        euint8 gender;
        euint8 genderPreference;
    }

    // mappings and arrays to store user data
    mapping(address => Profile) private profiles;
    mapping(address => mapping(address => bool)) private matches;
    address[] private userAddresses;
    mapping(address => bool) private hasProfile;

    // emit events to the frontend
    event ProfileCreated(address indexed user);
    event NewMatch(address indexed user1, address indexed user2);

    // function to set the user's profile
    function setProfile(
        inEuint8 calldata encryptedAge,
        inEuint8 calldata encryptedLocation,
        inEuint8 calldata encryptedGender,
        inEuint8 calldata encryptedGenderPreference
    ) public {
        profiles[msg.sender] = Profile({
            age: FHE.asEuint8(encryptedAge),
            location: FHE.asEuint8(encryptedLocation),
            gender: FHE.asEuint8(encryptedGender),
            genderPreference: FHE.asEuint8(encryptedGenderPreference)
        });
        if (!hasProfile[msg.sender]) {
            userAddresses.push(msg.sender);
            hasProfile[msg.sender] = true;
        }
        emit ProfileCreated(msg.sender);
        findMatchesForUser(msg.sender);
    }

    // function allows decrypting and viewing a profile if permitted
    function getProfileSealed(address user, Permission memory permission) public view returns (string memory, string memory, string memory, string memory) {
        require(matches[msg.sender][user] || matches[user][msg.sender] || msg.sender == user, "No match exists or not the owner");
        Profile storage profile = profiles[user];
        return (
            FHE.sealoutput(profile.age, permission.publicKey),
            FHE.sealoutput(profile.location, permission.publicKey),
            FHE.sealoutput(profile.gender, permission.publicKey),
            FHE.sealoutput(profile.genderPreference, permission.publicKey)
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
                ebool isMatch = FHE.and(FHE.and(FHE.and(ageMatch, locationMatch), genderMatch), otherGenderMatch);
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
}}
