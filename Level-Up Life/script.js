let level = 1;
let exp = 0;
let expToNext = 50;
let streak = 0;
let lastChoreDate = null;
let totalExpEarned = 0;
let totalChores = 0;
let maxStreak = 0;
let prestigeLevel = 0;

let chores = [
  { name: "Make Bed", exp: 5 },
  { name: "Do Dishes", exp: 10 },
  { name: "Vacuum", exp: 15 },
  { name: "Clean Bathroom", exp: 25 },
  { name: "Deep Clean Fridge", exp: 30 }
];

// Quest variables
let totalChoresToday = 0;
let didEarlyChore = false;
let didLateChore = false;
let focusedChoreUsedTwice = false;
let choreHistory = [];

const questData = [
  { id: "quickClean", desc: "Complete 3 chores", check: () => totalChoresToday >= 3, reward: 20 },
  { id: "focusTask", desc: "Do the same chore twice", check: () => focusedChoreUsedTwice, reward: 15 },
  { id: "earlyBird", desc: "Do a chore before 9 AM", check: () => didEarlyChore, reward: 25 },
  { id: "nightOwl", desc: "Do a chore after 9 PM", check: () => didLateChore, reward: 25 },
  { id: "streakSaver", desc: "Maintain a streak", check: () => streak > 1, reward: 30 }
];

let dailyQuestStatus = {};
let lastQuestReset = null;

const badgeData = [
  { id: "firstChore", desc: "Complete your first chore", condition: () => totalChores >= 1, reward: 10 },
  { id: "streak5", desc: "Hit a 5-day streak", condition: () => streak >= 5, reward: 25 },
  { id: "level10", desc: "Reach level 10", condition: () => level >= 10, reward: 50 },
  { id: "chore100", desc: "Complete 100 chores", condition: () => totalChores >= 100, reward: 100 },
  { id: "prestige1", desc: "Prestige once", condition: () => prestigeLevel >= 1, reward: 200 }
];

let unlockedBadges = {};

// --- QUEST RESET ---
function resetDailyQuestsIfNeeded() {
  const today = new Date().toDateString();
  if (lastQuestReset !== today) {
    dailyQuestStatus = {};
    totalChoresToday = 0;
    didEarlyChore = false;
    didLateChore = false;
    focusedChoreUsedTwice = false;
    lastQuestReset = today;
    localStorage.setItem("lvlup_lastQuestReset", lastQuestReset);
  }
}

// --- ADD EXP & TRACKING ---
function addExp(amount, choreName = null) {
  exp += amount;
  totalExpEarned += amount;
  totalChores++;

  const now = new Date();
  const hour = now.getHours();

  // Track daily quest progress
  totalChoresToday++;
  if (hour < 9) didEarlyChore = true;
  if (hour >= 21) didLateChore = true;

  if (choreName) {
    choreHistory.push({ time: now.getTime(), name: choreName });
    // Check if chore done twice today
    const choresToday = choreHistory.filter(c =>
      new Date(c.time).toDateString() === now.toDateString() && c.name === choreName);
    if (choresToday.length >= 2) focusedChoreUsedTwice = true;
  }

  // Streak tracking & reset if day missed
  const todayStr = now.toDateString();
  if (lastChoreDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastChoreDate && new Date(lastChoreDate).toDateString() === yesterday.toDateString()) {
      streak++;
    } else {
      streak = 1;
    }
    if (streak > maxStreak) maxStreak = streak;
    lastChoreDate = todayStr;
  }

  // Bonus EXP for every 5-day streak
  if (streak % 5 === 0 && streak > 0) {
    exp += 25;
    alert(`🔥 5-day streak! Bonus +25 EXP!`);
  }

  // Level up loop
  while (exp >= expToNext) {
    exp -= expToNext;
    level++;
    expToNext = getExpToNext(level);
    checkMilestone();
  }

  // Check quests and badges
  checkQuests();
  checkBadges();

  saveData();
  updateUI();
}

function checkQuests() {
  questData.forEach(q => {
    if (!dailyQuestStatus[q.id] && q.check()) {
      dailyQuestStatus[q.id] = true;
      addExp(q.reward);
      alert(`✅ Daily Quest Complete: ${q.desc} (+${q.reward} EXP)`);
    }
  });
}

function checkBadges() {
  badgeData.forEach(b => {
    if (!unlockedBadges[b.id] && b.condition()) {
      unlockedBadges[b.id] = true;
      addExp(b.reward);
      alert(`🏅 Achievement Unlocked: ${b.desc} (+${b.reward} EXP)`);
    }
  });
}

function getExpToNext(level) {
  return 50 + (level - 1) * 10;
}

function checkMilestone() {
  const milestoneDiv = document.getElementById("milestone");
  const rewards = {
    5: "🎉 Treat yourself to something sweet!",
    10: "🛍️ Small gift unlocked!",
    20: "🍽️ Takeout night!",
    50: "💰 $50 splurge time!",
    100: "🏆 Prestige Unlocked!"
  };
  milestoneDiv.textContent = rewards[level] || "";
}

function renderChoreButtons() {
  const container = document.getElementById("choreButtons");
  container.innerHTML = "";
  chores.forEach((chore, idx) => {
    const btn = document.createElement("button");
    btn.textContent = `${chore.name} (+${chore.exp})`;
    btn.onclick = () => addExp(chore.exp, chore.name);
    container.appendChild(btn);
  });
}

function renderCustomChores() {
  const list = document.getElementById("customChores");
  list.innerHTML = "<h3>Your Custom Chores</h3>";
  chores.slice(5).forEach((chore, index) => {
    const div = document.createElement("div");
    div.textContent = `${chore.name} (${chore.exp} EXP) `;
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.onclick = () => deleteCustomChore(index + 5);
    div.appendChild(delBtn);
    list.appendChild(div);
  });
}

function addCustomChore() {
  const name = document.getElementById("choreName").value.trim();
  const expVal = parseInt(document.getElementById("choreExp").value);
  if (name && !isNaN(expVal)) {
    chores.push({ name, exp: expVal });
    saveData();
    updateUI();
    document.getElementById("choreName").value = "";
    document.getElementById("choreExp").value = "";
  }
}

function deleteCustomChore(index) {
  chores.splice(index, 1);
  saveData();
  updateUI();
}

function prestige() {
  if (level < 100) return alert("Reach level 100 to prestige!");
  if (!confirm("Are you sure you want to prestige? Level and EXP will reset, but streak, badges, and chores will be kept.")) return;

  prestigeLevel++;
  level = 1;
  exp = 0;
  expToNext = getExpToNext(level);

  localStorage.setItem("lvlup_prestigeLevel", prestigeLevel);
  document.getElementById("prestigeMessage").textContent = `🎖️ Prestige #${prestigeLevel} achieved! Started fresh with more respect.`;

  saveData();
  updateUI();
}

function updateUI() {
  document.getElementById("level").textContent = level;
  document.getElementById("exp").textContent = exp;
  document.getElementById("expToNext").textContent = expToNext;
  document.getElementById("streak").textContent = streak;
  document.getElementById("totalExp").textContent = totalExpEarned;
  document.getElementById("totalChores").textContent = totalChores;
  document.getElementById("maxStreak").textContent = maxStreak;
  document.getElementById("prestigeLevel").textContent = prestigeLevel;

  if (level >= 100) {
    document.getElementById("prestigeBtn").style.display = "inline-block";
  } else {
    document.getElementById("prestigeBtn").style.display = "none";
  }

  renderChoreButtons();
  renderCustomChores();
  updateBadgesUI();
  updateDailyQuestsUI();
}

function updateBadgesUI() {
  const ul = document.getElementById("badgesList");
  ul.innerHTML = "";
  badgeData.forEach(b => {
    const li = document.createElement("li");
    li.textContent = `${b.desc} ${unlockedBadges[b.id] ? "✅" : "🔒"}`;
    ul.appendChild(li);
  });
}

function updateDailyQuestsUI() {
  const ul = document.getElementById("dailyQuests");
  ul.innerHTML = "";
  questData.forEach(q => {
    const li = document.createElement("li");
    li.textContent = `${q.desc} ${dailyQuestStatus[q.id] ? "✅" : "🔒"}`;
    ul.appendChild(li);
  });
}

// --- LOCAL STORAGE ---
function saveData() {
  localStorage.setItem("lvlup_level", level);
  localStorage.setItem("lvlup_exp", exp);
  localStorage.setItem("lvlup_streak", streak);
  localStorage.setItem("lvlup_lastDate", lastChoreDate);
  localStorage.setItem("lvlup_chores", JSON.stringify(chores));
  localStorage.setItem("lvlup_totalExp", totalExpEarned);
  localStorage.setItem("lvlup_totalChores", totalChores);
  localStorage.setItem("lvlup_maxStreak", maxStreak);
  localStorage.setItem("lvlup_prestigeLevel", prestigeLevel);
  localStorage.setItem("lvlup_lastQuestReset", lastQuestReset);
  localStorage.setItem("lvlup_dailyQuestStatus", JSON.stringify(dailyQuestStatus));
  localStorage.setItem("lvlup_badgesList", JSON.stringify(unlockedBadges));
}

function loadData() {
  level = parseInt(localStorage.getItem("lvlup_level")) || 1;
  exp = parseInt(localStorage.getItem("lvlup_exp")) || 0;
  streak = parseInt(localStorage.getItem("lvlup_streak")) || 0;
  lastChoreDate = localStorage.getItem("lvlup_lastDate") || null;
  const savedChores = localStorage.getItem("lvlup_chores");
  totalExpEarned = parseInt(localStorage.getItem("lvlup_totalExp")) || 0;
  totalChores = parseInt(localStorage.getItem("lvlup_totalChores")) || 0;
  maxStreak = parseInt(localStorage.getItem("lvlup_maxStreak")) || 0;
  prestigeLevel = parseInt(localStorage.getItem("lvlup_prestigeLevel")) || 0;
  lastQuestReset = localStorage.getItem("lvlup_lastQuestReset") || null;
  dailyQuestStatus = JSON.parse(localStorage.getItem("lvlup_dailyQuestStatus") || "{}");
  unlockedBadges = JSON.parse(localStorage.getItem("lvlup_badgesList") || "{}");

  if (savedChores) {
    chores = JSON.parse(savedChores);
  }
  expToNext = getExpToNext(level);
}

// --- INIT ---
loadData();
resetDailyQuestsIfNeeded();
updateUI();
