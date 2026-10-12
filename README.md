# VoteChain — Blockchain-Based Voting System (Standalone)

**No Ganache. No MetaMask. No server. No installation.**
Just open the file and the complete voting system runs in your browser.

## How to run (only this)
1. Extract the zip.
2. Double-click **`index.html`** — that's it. (If your browser blocks local files, open the folder in VS Code and use Live Server instead.)
3. The election is already set up: **3 candidates, 5 registered voters, voting OPEN.**

## Demo credentials & data
- **Admin PIN:** `1234` (Admin Panel tab — register voters, add candidates, close election, reset)
- **Demo Voter IDs:** `CS101` Aarav · `CS102` Priya · `CS103` Rohit · `CS104` Meera · `CS105` Kunal
- Seeded candidates: Nikhil Fendre (Final Year Panel) · Sneha Patil (Second Year Panel) · Ganesh Naik (Third Year Panel)

## 2-minute demo flow
1. **Cast Your Vote** → enter `CS102` → Check (eligible) → pick a candidate → Cast Vote. Watch: a new block is *mined* and your vote is recorded.
2. Try the **same Voter ID again** → rejected: already voted (Block # shown).
3. **Blockchain Explorer** → see every vote as a block with its hash linked to the previous block → **Verify Chain** → VALID.
4. **Tamper Test** (Explorer) → secretly changes Block #1's vote → **Verify Chain** → **INVALID at Block #1**. Then **Restore Original** → VALID again. This is the tamper-evident property, live.
5. **Admin Panel** (PIN 1234) → **Close Voting** → **Results** shows the final chart and winner.

Data is stored in the browser (localStorage) on the same computer, so votes survive a page refresh. Admin → Reset restores fresh demo data.

## How the blockchain works here (for viva)
- **Block** = one vote: index, time, voter ID, candidate, previous block's hash, nonce, and its own hash.
- **Hash** = SHA-256 of the block's data (`sha256.js`, pure JavaScript — tested against the standard SHA-256 test vectors).
- **Proof-of-work** = the block is mined: nonce is varied until the hash starts with `00`.
- **Linking** = each block stores the previous block's hash, forming a chain.
- **Tamper-evident** = editing any old vote changes its hash, breaks the link, and **Verify Chain** catches it instantly. Nobody can quietly change a recorded vote.
- **One voter, one vote** = a registered voter's `hasVoted` flag is set in the same action that mines their vote block; a second attempt is rejected.

## Files
```
index.html   Dashboard (Overview · Vote · Results · Admin · Blockchain Explorer)
style.css    Professional flat navy/white design
app.js       All logic: state, blockchain (mine / verify), voting, admin
sha256.js    Pure-JS SHA-256 implementation
Voting.sol   The Solidity smart-contract version (for the subject's
             Solidity + Remix requirement — already demonstrated in Remix)
README.md    This file
```

## Honest scope note (say this if the teacher asks)
This standalone app is a **working model of a blockchain** built into the web page itself — the same concepts (hash-linked blocks, proof-of-work, verification) that a network like Ethereum uses, running locally in one browser instead of across many computers. That is why it needs no Ganache or MetaMask. The production form of the same idea is the included `Voting.sol` smart contract, deployed on a real chain where many independent nodes hold copies of the chain.
