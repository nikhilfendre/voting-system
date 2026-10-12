// ============================================================
//  VoteChain — Blockchain-Based Voting System (standalone)
//  No Ganache, no MetaMask, no server. The blockchain lives
//  in this file: every vote is mined into a block whose hash
//  links to the previous block (SHA-256 + proof-of-work),
//  and the whole chain can be verified at any time.
//  Data persists in the browser (localStorage) on this device.
// ============================================================

const LS_KEY = "votechain_standalone_v1";
const ADMIN_PIN = "1234";
const DIFFICULTY = "00"; // proof-of-work: block hash must start with this

// ---------------- Demo seed data ----------------
function seedState() {
  const s = {
    electionName: "College Student Council Election 2026",
    phase: "open", // setup | open | closed  (seeded open so the demo works instantly)
    candidates: [
      { id: 0, name: "Nikhil Fendre", party: "Final Year Panel" },
      { id: 1, name: "Sneha Patil", party: "Second Year Panel" },
      { id: 2, name: "Ganesh Naik", party: "Third Year Panel" },
    ],
    voters: [
      { id: "CS101", name: "Aarav Desai", hasVoted: false, blockIndex: null },
      { id: "CS102", name: "Priya Sharma", hasVoted: false, blockIndex: null },
      { id: "CS103", name: "Rohit Verma", hasVoted: false, blockIndex: null },
      { id: "CS104", name: "Meera Joshi", hasVoted: false, blockIndex: null },
      { id: "CS105", name: "Kunal Pawar", hasVoted: false, blockIndex: null },
    ],
    chain: [],
  };
  s.chain.push(makeGenesis());
  return s;
}
function makeGenesis() {
  const b = { index: 0, timestamp: new Date().toLocaleString("en-IN"), voterId: "SYSTEM", candidateId: -1, candidateName: "GENESIS — Election Created", prevHash: "0", nonce: 0 };
  b.hash = blockHash(b);
  return b;
}

// ---------------- Blockchain core ----------------
function blockHash(b) {
  return sha256([b.index, b.timestamp, b.voterId, b.candidateId, b.candidateName, b.prevHash, b.nonce].join("|"));
}
function mineBlock(b) {
  b.nonce = 0;
  b.hash = blockHash(b);
  while (!b.hash.startsWith(DIFFICULTY)) {
    b.nonce++;
    b.hash = blockHash(b);
  }
  return b;
}
function verifyChain(chain) {
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    if (blockHash(b) !== b.hash) return { ok: false, at: i, reason: "Hash mismatch — this block's data was changed after it was recorded." };
    if (i > 0 && b.prevHash !== chain[i - 1].hash) return { ok: false, at: i, reason: "Broken link — previous-hash does not match the block before it." };
    if (i > 0 && !b.hash.startsWith(DIFFICULTY)) return { ok: false, at: i, reason: "Proof-of-work missing on this block." };
  }
  return { ok: true };
}

// ---------------- State ----------------
let state = load();
let selectedCandidate = null;
let checkedVoter = null;
let tamperBackup = null;

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.chain && s.chain.length) return s; }
  } catch (e) { /* corrupted storage -> reseed */ }
  const s = seedState();
  localStorage.setItem(LS_KEY, JSON.stringify(s));
  return s;
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

const $ = (id) => document.getElementById(id);
function toast(text, kind) {
  const t = $("toast");
  t.className = "toast " + (kind || "info");
  t.textContent = text;
  t.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (kind === "ok") setTimeout(() => { t.style.display = "none"; }, 8000);
}
function votesFor(cid) { return state.chain.filter((b) => b.candidateId === cid).length; }
function totalVotes() { return state.voters.filter((v) => v.hasVoted).length; }
function winner() {
  if (!state.candidates.length || totalVotes() === 0) return null;
  return state.candidates.reduce((a, b) => (votesFor(b.id) > votesFor(a.id) ? b : a), state.candidates[0]);
}

// ---------------- Rendering ----------------
const PHASE_LABEL = { setup: "Setup", open: "Voting Open", closed: "Closed — Result Declared" };
const TAB_TITLES = { overview: "Election Overview", vote: "Cast Your Vote", results: "Election Results", admin: "Admin Panel", chain: "Blockchain Explorer" };

function renderAll() {
  const tv = totalVotes();
  $("sideElection").textContent = state.electionName;
  $("sideStatus").textContent = PHASE_LABEL[state.phase];
  const v = verifyChain(state.chain);
  $("sideChain").textContent = v.ok ? "Valid ✓" : "TAMPERED ✗ (Block " + v.at + ")";
  const badge = $("phaseBadge");
  badge.textContent = PHASE_LABEL[state.phase];
  badge.className = "phase-badge" + (state.phase === "open" ? " open" : state.phase === "closed" ? " closed" : "");

  $("statVoters").textContent = String(state.voters.length);
  $("statVotes").textContent = String(tv);
  $("statTurnout").textContent = "Turnout " + (state.voters.length ? Math.round((tv / state.voters.length) * 100) : 0) + "%";
  $("statCandidates").textContent = String(state.candidates.length);
  $("statBlocks").textContent = String(state.chain.length);

  const order = ["setup", "open", "closed"];
  document.querySelectorAll("#phaseSteps .step").forEach((s) => {
    const mine = order.indexOf(s.dataset.phase), cur = order.indexOf(state.phase);
    s.classList.toggle("done", mine < cur);
    s.classList.toggle("now", mine === cur);
  });

  const w = state.phase === "closed" ? winner() : null;
  for (const id of ["winnerBanner", "winnerBanner2"]) {
    $(id).style.display = w ? "block" : "none";
    if (w) $(id).textContent = "Winner: " + w.name + " (" + w.party + ") — " + votesFor(w.id) + " votes";
  }
  if (tv > 0) {
    const lead = state.candidates.reduce((a, b) => (votesFor(b.id) > votesFor(a.id) ? b : a), state.candidates[0]);
    $("leaderBox").innerHTML = "";
    const bEl = document.createElement("b"); bEl.textContent = lead.name;
    $("leaderBox").append(bEl, document.createElement("br"), document.createTextNode(lead.party + " · " + votesFor(lead.id) + " of " + tv + " votes (" + Math.round((votesFor(lead.id) / tv) * 100) + "%)"));
  } else $("leaderBox").textContent = "No votes cast yet.";

  renderBallot();
  renderDemoVoters();
  renderResults();
  renderAdmin();
  renderChain();
}

function renderBallot() {
  const list = $("ballotList");
  list.innerHTML = "";
  state.candidates.forEach((c) => {
    const div = document.createElement("div");
    div.className = "ballot" + (selectedCandidate === c.id ? " selected" : "");
    const initials = c.name.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
    div.innerHTML = '<div class="avatar"></div><div><h3></h3><p></p></div><div class="radio"></div>';
    div.querySelector(".avatar").textContent = initials;
    div.querySelector("h3").textContent = c.name;
    div.querySelector("p").textContent = c.party;
    div.onclick = () => { selectedCandidate = c.id; renderBallot(); updateCastBtn(); };
    list.appendChild(div);
  });
  updateCastBtn();
}
function updateCastBtn() {
  const btn = $("castVoteBtn");
  if (state.phase !== "open") { btn.disabled = true; btn.textContent = state.phase === "closed" ? "Voting is closed" : "Voting is not open yet"; return; }
  if (!checkedVoter) { btn.disabled = true; btn.textContent = "First check your Voter ID"; return; }
  if (checkedVoter.hasVoted) { btn.disabled = true; btn.textContent = "You have already voted"; return; }
  if (selectedCandidate === null) { btn.disabled = true; btn.textContent = "Select a candidate first"; return; }
  btn.disabled = false;
  btn.textContent = "Cast Vote for " + state.candidates.find((c) => c.id === selectedCandidate).name;
}

function renderDemoVoters() {
  const tb = document.querySelector("#demoVotersTable tbody");
  tb.innerHTML = "";
  state.voters.forEach((v) => {
    const tr = document.createElement("tr");
    [v.id, v.name, v.hasVoted ? "Voted (Block " + v.blockIndex + ")" : "Not voted"].forEach((x) => {
      const td = document.createElement("td"); td.textContent = x; tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}

function renderResults() {
  const tv = totalVotes();
  $("resultsNote").textContent = tv + " votes recorded in " + (state.chain.length - 1) + " vote-blocks · every count below is computed from the blockchain itself";
  const box = $("resultsList");
  box.innerHTML = "";
  [...state.candidates].sort((a, b) => votesFor(b.id) - votesFor(a.id)).forEach((c) => {
    const n = votesFor(c.id), pct = tv ? Math.round((n / tv) * 100) : 0;
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = '<div class="label"><span></span><b></b></div><div class="track"><div class="fill"></div></div>';
    row.querySelector("span").textContent = c.name + " (" + c.party + ")";
    row.querySelector("b").textContent = n + " votes · " + pct + "%";
    row.querySelector(".fill").style.width = pct + "%";
    box.appendChild(row);
  });
}

function renderAdmin() {
  const tb = document.querySelector("#adminVotersTable tbody");
  if (tb) {
    tb.innerHTML = "";
    state.voters.forEach((v) => {
      const tr = document.createElement("tr");
      [v.id, v.name, v.hasVoted ? "Yes" : "No", v.hasVoted ? "Block " + v.blockIndex : "—"].forEach((x) => {
        const td = document.createElement("td"); td.textContent = x; tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  }
  $("openBtn").disabled = state.phase === "open";
  $("closeBtn").disabled = state.phase !== "open";
  $("addCandBtn").disabled = state.phase === "closed" || totalVotes() > 0;
}

function renderChain() {
  const box = $("chainList");
  box.innerHTML = "";
  [...state.chain].reverse().forEach((b) => {
    const wrap = document.createElement("div");
    const div = document.createElement("div");
    div.className = "block" + (b.index === 0 ? " genesis" : "") + (tamperBackup && tamperBackup.index === b.index ? " tampered" : "");
    div.innerHTML =
      '<div class="block-head"><b></b><span class="tag"></span></div>' +
      '<div class="hash"><b>Hash:</b> <span class="h"></span><br><b>Previous hash:</b> <span class="p"></span></div>' +
      '<div class="block-meta"><span class="m1"></span><span class="m2"></span><span class="m3"></span></div>';
    div.querySelector(".block-head b").textContent = "Block #" + b.index + (b.index === 0 ? " — Genesis" : " — Vote");
    div.querySelector(".tag").textContent = b.candidateName;
    div.querySelector(".h").textContent = b.hash;
    div.querySelector(".p").textContent = b.prevHash;
    div.querySelector(".m1").textContent = "Voter: " + b.voterId;
    div.querySelector(".m2").textContent = "Time: " + b.timestamp;
    div.querySelector(".m3").textContent = "Nonce (PoW): " + b.nonce;
    wrap.appendChild(div);
    if (b.index > 0) { const link = document.createElement("div"); link.className = "chain-link"; link.textContent = "⛓ ↓ linked by hash"; wrap.appendChild(link); }
    box.appendChild(wrap);
  });
}

// ---------------- Actions ----------------
function checkVoter() {
  const id = $("voterIdInput").value.trim().toUpperCase();
  const info = $("voterInfo");
  const v = state.voters.find((x) => x.id.toUpperCase() === id);
  if (!id) { info.className = "voter-info muted"; info.textContent = "Enter your Voter ID first."; checkedVoter = null; updateCastBtn(); return; }
  if (!v) {
    checkedVoter = null;
    info.className = "voter-info bad";
    info.textContent = "Voter ID " + id + " is NOT registered. Ask the Admin (Election Officer) to register you first — unregistered IDs cannot vote.";
  } else if (v.hasVoted) {
    checkedVoter = v;
    info.className = "voter-info bad";
    info.textContent = v.name + " (" + v.id + ") has ALREADY voted — recorded in Block #" + v.blockIndex + ". A second vote is not possible.";
  } else {
    checkedVoter = v;
    info.className = "voter-info good";
    info.textContent = "Welcome, " + v.name + " (" + v.id + "). You are registered and eligible. Now select your candidate and cast your vote.";
  }
  updateCastBtn();
}

function castVote() {
  if (state.phase !== "open") { toast("Voting is not open right now.", "err"); return; }
  if (!checkedVoter || checkedVoter.hasVoted || selectedCandidate === null) return;
  const cand = state.candidates.find((c) => c.id === selectedCandidate);
  const prev = state.chain[state.chain.length - 1];
  const block = mineBlock({
    index: state.chain.length,
    timestamp: new Date().toLocaleString("en-IN"),
    voterId: checkedVoter.id,
    candidateId: cand.id,
    candidateName: cand.name,
    prevHash: prev.hash,
    nonce: 0,
  });
  state.chain.push(block);
  checkedVoter.hasVoted = true;
  checkedVoter.blockIndex = block.index;
  save();
  selectedCandidate = null;
  toast("Vote recorded! " + checkedVoter.name + "'s vote for " + cand.name + " was mined into Block #" + block.index + " (nonce " + block.nonce + "). See it in the Blockchain Explorer.", "ok");
  checkVoter();
  renderAll();
}

function doVerify(showToast) {
  const v = verifyChain(state.chain);
  const box = $("verifyResult");
  if (v.ok) {
    box.className = "verify-box good";
    box.textContent = "✓ CHAIN VALID — all " + state.chain.length + " blocks verified. Every hash matches its data, every block links correctly to the previous one, and proof-of-work is present. No vote has been altered.";
    if (showToast) toast("Chain verified: VALID ✓", "ok");
  } else {
    box.className = "verify-box bad";
    box.textContent = "✗ CHAIN INVALID at Block #" + v.at + " — " + v.reason + " This is exactly how tampering is caught: the record itself proves it was changed.";
    if (showToast) toast("Chain verification FAILED at Block #" + v.at, "err");
  }
  renderAll();
  // renderAll rewrites verify box? No — it doesn't touch verifyResult, safe.
  return v;
}

// ---------------- Wiring ----------------
window.addEventListener("load", () => {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      $("tab-" + btn.dataset.tab).classList.add("active");
      $("pageTitle").textContent = TAB_TITLES[btn.dataset.tab];
    };
  });

  $("checkVoterBtn").onclick = checkVoter;
  $("voterIdInput").addEventListener("keydown", (e) => { if (e.key === "Enter") checkVoter(); });
  $("castVoteBtn").onclick = castVote;

  $("adminLoginBtn").onclick = () => {
    if ($("adminPin").value === ADMIN_PIN) {
      $("adminLock").style.display = "none";
      $("adminPanel").style.display = "block";
      renderAdmin();
      toast("Welcome, Election Officer.", "ok");
    } else toast("Wrong PIN. Demo PIN is 1234.", "err");
  };
  $("addVoterBtn").onclick = () => {
    const id = $("newVoterId").value.trim().toUpperCase(), name = $("newVoterName").value.trim();
    if (!id || !name) { toast("Voter ID aur naam dono daalo.", "err"); return; }
    if (state.voters.some((v) => v.id.toUpperCase() === id)) { toast("This Voter ID is already registered.", "err"); return; }
    state.voters.push({ id, name, hasVoted: false, blockIndex: null });
    save(); $("newVoterId").value = ""; $("newVoterName").value = "";
    toast("Voter registered: " + name + " (" + id + ")", "ok");
    renderAll();
  };
  $("addCandBtn").onclick = () => {
    if (state.phase === "closed" || totalVotes() > 0) { toast("Candidates cannot be added after voting has started. Reset the election to change candidates.", "err"); return; }
    const name = $("newCandName").value.trim(), party = $("newCandParty").value.trim();
    if (!name) { toast("Candidate ka naam daalo.", "err"); return; }
    const id = state.candidates.length ? Math.max(...state.candidates.map((c) => c.id)) + 1 : 0;
    state.candidates.push({ id, name, party });
    save(); $("newCandName").value = ""; $("newCandParty").value = "";
    toast("Candidate added: " + name, "ok");
    renderAll();
  };
  $("openBtn").onclick = () => {
    if (state.candidates.length < 2) { toast("Add at least 2 candidates first.", "err"); return; }
    state.phase = "open"; save(); toast("Voting is now OPEN.", "ok"); renderAll();
  };
  $("closeBtn").onclick = () => {
    state.phase = "closed"; save();
    const w = winner();
    toast(w ? "Election closed. Winner: " + w.name + " with " + votesFor(w.id) + " votes." : "Election closed. No votes were cast.", "ok");
    renderAll();
  };
  $("resetBtn").onclick = () => {
    if (!confirm("Reset the election? All votes in this browser will be cleared and demo data restored.")) return;
    localStorage.removeItem(LS_KEY);
    state = load(); tamperBackup = null; selectedCandidate = null; checkedVoter = null;
    $("verifyResult").className = "verify-box muted";
    $("verifyResult").textContent = "Chain was reset to a fresh genesis block.";
    $("restoreBtn").style.display = "none";
    toast("Election reset with fresh demo data. Voting is open.", "ok");
    renderAll();
  };

  $("verifyBtn").onclick = () => doVerify(true);
  $("tamperBtn").onclick = () => {
    if (state.chain.length < 2) { toast("Pehle kam se kam ek vote daalo, phir tamper test chalega.", "err"); return; }
    if (tamperBackup) { toast("Tamper test already applied — pehle Restore karo.", "err"); return; }
    const target = state.chain[1];
    tamperBackup = { index: target.index, candidateName: target.candidateName };
    target.candidateName = "HACKED — vote changed by admin";
    save();
    $("restoreBtn").style.display = "inline-block";
    toast("TAMPER TEST: Block #1's vote was secretly changed (data edited, hash NOT updated). Ab Verify Chain dabao.", "err");
    renderChain();
    $("sideChain").textContent = "TAMPERED ✗ (Block 1)";
  };
  $("restoreBtn").onclick = () => {
    if (!tamperBackup) return;
    state.chain[tamperBackup.index].candidateName = tamperBackup.candidateName;
    tamperBackup = null;
    save();
    $("restoreBtn").style.display = "none";
    doVerify(true);
  };

  renderAll();
});
