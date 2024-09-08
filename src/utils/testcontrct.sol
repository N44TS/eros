// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13 <0.9.0;

import "@fhenixprotocol/contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/contracts/access/Permissioned.sol";

contract ErosTest is Permissioned {
    struct Profile {
        euint8 age;
        euint8 location; // Simplified: just continents
    }

    mapping(address => Profile) private profiles;
    mapping(address => mapping(address => bool)) private matches;
    address[] private userAddresses;

    event ProfileCreated(address indexed user);
    event NewMatch(address indexed user1, address indexed user2);

    function setProfile(
        inEuint8 calldata encryptedAge,
        inEuint8 calldata encryptedLocation
    ) public {
        profiles[msg.sender] = Profile({
            age: FHE.asEuint8(encryptedAge),
            location: FHE.asEuint8(encryptedLocation)
        });
        userAddresses.push(msg.sender);
        emit ProfileCreated(msg.sender);
        findMatchesForUser(msg.sender);
    }

    function getProfileSealed(address user, Permission memory permission) public view returns (string memory, string memory) {
        require(matches[msg.sender][user] || matches[user][msg.sender] || msg.sender == user, "No match exists or not the owner");
        Profile storage profile = profiles[user];
        return (
            FHE.sealoutput(profile.age, permission.publicKey),
            FHE.sealoutput(profile.location, permission.publicKey)
        );
    }

    function findMatchesForUser(address user) internal {
        Profile storage userProfile = profiles[user];
        for (uint i = 0; i < userAddresses.length; i++) {
            address otherUser = userAddresses[i];
            if (otherUser != user && !matches[user][otherUser]) {
                Profile storage otherProfile = profiles[otherUser];
                euint8 ageDifference = FHE.sub(userProfile.age, otherProfile.age);
                ebool ageMatch = FHE.lte(ageDifference, FHE.asEuint8(3));
                ebool locationMatch = FHE.eq(userProfile.location, otherProfile.location);
                ebool isMatch = FHE.and(ageMatch, locationMatch);
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

    function getMatchStatus(address user1, address user2) public view returns (bool) {
        return matches[user1][user2];
    }
}
