// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.9.0;

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
    mapping(address => Permission) private preAuthorizedPermissions;

    // emit events to the frontend
    event ProfileCreated(address indexed user);
    event NewMatch(address indexed user1, address indexed user2, Permission permission);

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
    // Set default pre-authorized permission
    preAuthorizedPermissions[msg.sender] = Permission(msg.sender, block.timestamp, true, new string[](0));
    emit ProfileCreated(msg.sender);
    findMatchesForUser(msg.sender);
}

    // function allows decrypting and viewing a profile if permitted
    function getProfileSealed(
        address user,
        Permission memory permission
    ) public view returns (string memory, string memory, string memory, string memory) {
        require(matches[msg.sender][user] || matches[user][msg.sender] || msg.sender == user, "No match exists or not the owner");
        Profile storage profile = profiles[user];
        Permission memory userPermission = preAuthorizedPermissions[user];
        require(userPermission.isValid || permission.isValid, "No valid permission");

        Permission memory effectivePermission = userPermission.isValid ? userPermission : permission;

        return (
            FHE.sealoutput(profile.age, effectivePermission.publicKey),
            FHE.sealoutput(profile.location, effectivePermission.publicKey),
            FHE.sealoutput(profile.gender, effectivePermission.publicKey),
            FHE.sealoutput(profile.genderPreference, effectivePermission.publicKey)
        );
    }

    // internal function, find matches for a user
    function findMatchesForUser(address user) internal {
        Profile storage userProfile = profiles[user];
        uint256 length = userAddresses.length;
        for (uint i = 0; i < length; i++) {
            address otherUser = userAddresses[i];
            if (otherUser != user && !matches[user][otherUser]) {
                Profile storage otherProfile = profiles[otherUser];
                ebool isMatch = FHE.and(
                    FHE.and(
                        FHE.lte(FHE.sub(userProfile.age, otherProfile.age), FHE.asEuint8(3)),
                        FHE.eq(userProfile.location, otherProfile.location)
                    ),
                    FHE.and(
                        FHE.or(
                            FHE.eq(userProfile.genderPreference, FHE.asEuint8(3)),
                            FHE.eq(userProfile.genderPreference, otherProfile.gender)
                        ),
                        FHE.or(
                            FHE.eq(otherProfile.genderPreference, FHE.asEuint8(3)),
                            FHE.eq(otherProfile.genderPreference, userProfile.gender)
                        )
                    )
                );
                if (FHE.decrypt(isMatch)) {
                    matches[user][otherUser] = true;
                    matches[otherUser][user] = true;
                    emit NewMatch(user, otherUser, preAuthorizedPermissions[user]);
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
        if (matches[msg.sender][potentialMatch]) revert AlreadyMatched();
        matches[msg.sender][potentialMatch] = true;
        if (matches[potentialMatch][msg.sender]) {
            emit NewMatch(msg.sender, potentialMatch, preAuthorizedPermissions[msg.sender]);
        }
    }

    // Set pre-authorized permission
    function setPreAuthorizedPermission(Permission memory permission) public {
        preAuthorizedPermissions[msg.sender] = permission;
    }

    // Generate new permit for sharing information
    function generatePermit(string[] memory fields) public view returns (Permission memory) {
        return Permission(msg.sender, block.timestamp, true, fields);
    }
}