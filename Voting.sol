// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Blockchain-Based Voting System — College Election Demo
/// @notice Easy–Medium mini project (Solidity + Remix IDE + HTML/CSS/JS).
///
/// Problem: in a normal online voting demo, votes sit in one database
/// that an admin can quietly edit. Here every vote is a transaction
/// recorded by this smart contract, so the vote record is
/// TAMPER-EVIDENT: any change would be visible and the stored
/// history can be verified by anyone.
///
/// Rules (enforced by the contract, not just the web page):
///  1. Only the Election Officer (account that deployed the contract)
///     can add candidates and start / end the election.
///  2. One wallet address = one vote. Voting twice always fails.
///  3. Voting works only while the election is open.
contract Voting {
    address public electionOfficer;
    string public electionName;
    bool public votingOpen;

    struct Candidate {
        uint256 id;
        string name;
        string party;     // class / panel / symbol — e.g. "Final Year Panel"
        uint256 voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    uint256 public totalVotes;

    // Events are written permanently into the transaction log —
    // this log is the tamper-evident record.
    event CandidateAdded(uint256 id, string name);
    event ElectionStarted();
    event ElectionEnded();
    event VoteCast(address indexed voter, uint256 candidateId);

    modifier onlyOfficer() {
        require(msg.sender == electionOfficer, "Only Election Officer can do this");
        _;
    }

    constructor(string memory _electionName) {
        electionOfficer = msg.sender;
        electionName = _electionName;
        votingOpen = false;
    }

    function addCandidate(string memory _name, string memory _party) public onlyOfficer {
        require(!votingOpen, "Cannot add candidates after voting starts");
        candidates.push(Candidate(candidates.length, _name, _party, 0));
        emit CandidateAdded(candidates.length - 1, _name);
    }

    function startElection() public onlyOfficer {
        require(candidates.length >= 2, "Add at least 2 candidates first");
        require(!votingOpen, "Election is already open");
        votingOpen = true;
        emit ElectionStarted();
    }

    function endElection() public onlyOfficer {
        require(votingOpen, "Election is not open");
        votingOpen = false;
        emit ElectionEnded();
    }

    function vote(uint256 _candidateId) public {
        require(votingOpen, "Voting is not open");
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
        totalVotes += 1;
        emit VoteCast(msg.sender, _candidateId);
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getWinner() public view returns (Candidate memory) {
        require(!votingOpen, "Election is still open");
        require(totalVotes > 0, "No votes cast yet");
        uint256 best = 0;
        uint256 bestVotes = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > bestVotes) {
                bestVotes = candidates[i].voteCount;
                best = i;
            }
        }
        return candidates[best];
    }
}
