/**
 * =================================================================
 * ZONE 1: CHARACTER CREATION & INITIALIZATION (TẠO NHÂN VẬT & KHỞI TẠO)
 * =================================================================
 */

/**
 * Khởi tạo nhân vật mới và thiết lập gameState ban đầu
 */
function createCharacter(name, gender = "Nam") {
    const characterName = name && name.trim() !== "" ? name.trim() : "Charlie";

    gameState = {
        name: characterName,
        gender: gender,
        age: 16,
        month: 1,
        money: 0,

        health: 100,
        hunger: 80,
        happiness: 70,
        smarts: 50,

        strength: 50,
        looks: 60,
        charm: 45,
        ego: 30,
        // Bổ sung vào trong gameState của createCharacter():
stress: 0,             // Điểm căng thẳng (0 - 100)
ailments: [],          // Mảng lưu danh sách bệnh (VD: ['cam_sot'])


        job: null,
        education: "THCS",
        degrees: [],
        debt: 0,
        assets: [],
        inventory: [],
        historyLog: [
            { month: 1, age: 16, text: "Bắt đầu cuộc hành trình mới cuộc đời." }
        ],
        totalLifetimeIncome: 0,
        totalLifetimeExpense: 0,
        relationships: [],
        availableHousingPool: [],
        currentHome: {
            id: "parents_house",
            name: "Nhà Bố Mẹ",
            type: "shared",
            hostId: "parents",
            monthlyCost: 0,
            description: "Ngôi nhà ấm cúng của gia đình. Phụ thuộc vào tình cảm với Bố Mẹ."
        }
    };
    const bgTypes = [
    { type: "wealthy", label: "🏡 Gia đình khá giả", allowance: 150, contributionChance: 0.1 },
    { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 },
    { type: "poor", label: "🏚️ Gia đình khó khăn", allowance: 20, contributionChance: 0.6 }
];
// Tỉ lệ ngẫu nhiên: 20% Giàu, 50% Trung bình, 30% Nghèo
const rand = Math.random();
const selectedBg = rand < 0.2 ? bgTypes[0] : (rand < 0.7 ? bgTypes[1] : bgTypes[2]);

gameState.familyBackground = selectedBg;


    ensureBaseRelationships();
    saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}
function ensureBaseRelationships() {
    if (!gameState) return;
    if (!gameState.relationships) gameState.relationships = [];

    let father = gameState.relationships.find(r => r.id === "father");
    if (!father) {
        gameState.relationships.push({ id: "father", name: "Bố", relation: "Bố", icon: "👨", level: 2, xp: 0 });
    }

    let mother = gameState.relationships.find(r => r.id === "mother");
    if (!mother) {
        gameState.relationships.push({ id: "mother", name: "Mẹ", relation: "Mẹ", icon: "👩", level: 2, xp: 0 });
    }
}
/**
 * =================================================================
 * ZONE 2: STORAGE & PERSISTENCE (LƯU & NẠP DỮ LIỆU LOCAL/CLOUD)
 * =================================================================
 */

function saveGameState() {
    if (typeof gameState !== 'undefined' && gameState) {
        localStorage.setItem("GIA_TAI_CUA_BAN_GAME_STATE", JSON.stringify(gameState));
        if (typeof auth !== 'undefined' && auth.currentUser) {
            if (typeof saveGameStateToFirebase === 'function') saveGameStateToFirebase(auth.currentUser.uid);
        }
    }
}

function loadGameState() {
    const saved = localStorage.getItem("GIA_TAI_CUA_BAN_GAME_STATE");
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
}

function resetCharacter() {
    localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
    if (typeof auth !== 'undefined' && auth.currentUser && typeof db !== 'undefined') {
        db.collection("players").doc(auth.currentUser.uid).delete();
    }
    gameState = null;
    if (typeof showAdminPanel === 'function') showAdminPanel(false);
    if (typeof showCreateCharacterModal === 'function') showCreateCharacterModal(true);
}
/**
 * =================================================================
 * ZONE 3: MONTHLY TIME PASSAGE & HOUSING LOGIC (TIẾN TRÌNH HÀNG THÁNG & NHÀ Ở)
 * =================================================================
 */

/**
 * Xử lý tiến sang tháng tiếp theo
 */
function nextMonth() {
    if (typeof gameState === 'undefined' || !gameState) return;

    // Snapshot chỉ số cũ trước khi sang tháng
    const startMoney = gameState.money || 0;
    const startHealth = gameState.health || 100;
    const startHunger = gameState.hunger || 80;
    const startHappiness = gameState.happiness || 70;

    const currentMonthNum = gameState.month || 1;

    // 1. Tăng tháng & tuổi
    gameState.month = currentMonthNum + 1;
    if (gameState.month % 12 === 0) {
        gameState.age = (gameState.age || 16) + 1;
        addHistoryLog(`Tròn ${gameState.age} tuổi.`);
    }

    // 2. Tính toán tiền nông & các chỉ số trong tháng
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // Lương
    if (gameState.job) {
        monthlyIncome += (gameState.job.salary || 0);
    }
    
    // Học phí
    if (gameState.currentEducation) {
        monthlyExpense += (gameState.currentEducation.tuitionPerMonth || 0);
    }

    // Tiền nhà
    if (gameState.currentHome && gameState.currentHome.type === 'rented') {
        monthlyExpense += (gameState.currentHome.monthlyCost || 0);
    }

    // Ăn uống sinh tồn
    monthlyExpense += 50; // Chi phí ăn uống mặc định

    // Thực thi xử lý tháng
    if (typeof processMonthlyEducation === 'function') processMonthlyEducation();
    if (typeof processMonthlyJob === 'function') processMonthlyJob();
    if (typeof checkHousingEvents === 'function') checkHousingEvents();

    const hungerLoss = 20;
    gameState.hunger = Math.max(0, (gameState.hunger ?? 80) - hungerLoss);
    if (gameState.hunger === 0) {
        gameState.health = Math.max(0, (gameState.health ?? 100) - 25);
        gameState.happiness = Math.max(0, (gameState.happiness ?? 70) - 20);
    } else {
        gameState.happiness = Math.max(0, (gameState.happiness ?? 70) - 3);
    }

    // Tích lũy trọn đời
    gameState.totalLifetimeIncome = (gameState.totalLifetimeIncome || 0) + monthlyIncome;
    gameState.totalLifetimeExpense = (gameState.totalLifetimeExpense || 0) + monthlyExpense;

    // Lưu & Render UI
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();

    // 3. HIỂN THỊ MODAL BÁO CÁO THÁNG VỪA QUA
    const summaryData = {
        month: currentMonthNum,
        income: monthlyIncome,
        expense: monthlyExpense,
        net: monthlyIncome - monthlyExpense,
        healthDiff: (gameState.health || 0) - startHealth,
        hungerDiff: (gameState.hunger || 0) - startHunger,
        happinessDiff: (gameState.happiness || 0) - startHappiness
    };

    showMonthlySummaryModal(summaryData, () => {
        // Callback sau khi đóng modal báo cáo: MỚI KIỂM TRA EVENT CHU CẤP/BIẾN CỐ
        if (typeof checkMonthlyEvents === 'function') {
            checkMonthlyEvents();
        }
    });
}

function addHistoryLog(text) {
    if (!gameState) return;
    if (!gameState.historyLog) gameState.historyLog = [];
    gameState.historyLog.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: text
    });
}

function refreshHousingMarket() {
    if (!gameState) return;
    const hasListings = Math.random() < 0.6;
    gameState.availableHousingPool = [];

    if (hasListings) {
        const housingOptions = [
            { id: "cheap_room_" + gameState.month, name: "Phòng trọ xập xệ", type: "rented", monthlyCost: 150, description: "Phòng nhỏ 12m2 giá rẻ." },
            { id: "standard_room_" + gameState.month, name: "Căn hộ mini", type: "rented", monthlyCost: 350, description: "Phòng sạch sẽ, thoáng mát." }
        ];
        const count = Math.floor(Math.random() * housingOptions.length) + 1;
        gameState.availableHousingPool = housingOptions.slice(0, count);
    }
}

function checkHousingEvents() {
    if (!gameState || !gameState.currentHome) return;
    if (gameState.currentHome.type === "rented" && gameState.currentHome.monthlyCost > 0) {
        const cost = gameState.currentHome.monthlyCost;
        if ((gameState.money || 0) >= cost) {
            gameState.money -= cost;
        } else {
            gameState.currentHome = { id: "homeless", name: "Vô Gia Cư", type: "homeless", monthlyCost: 0, description: "Bị chủ trọ đuổi!" };
            alert("⚠️ Bạn không đủ tiền trả tiền nhà và đã bị chủ trọ siết phòng!");
        }
    }
    refreshHousingMarket();
}
function getRelationshipTier(level = 0, xp = 0) {
    const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 0;
    const safeXP = typeof xp === 'number' && !isNaN(xp) ? xp : 0;

    if (safeLevel === 0 && safeXP === 0) return { icons: "👁️", label: "Quen biết", xpText: "0/100", progressPercent: 0, barColor: "bg-gray-400" };

    if (safeLevel > 0 || (safeLevel === 0 && safeXP > 0)) {
        const displayLevel = Math.min(5, Math.max(1, safeLevel));
        return { icons: "❤️".repeat(displayLevel) + "🤍".repeat(5 - displayLevel), label: `Thiện cảm Lvl ${displayLevel}`, xpText: `${safeXP}/100`, progressPercent: Math.min(100, Math.max(0, safeXP)), barColor: "bg-gradient-to-r from-rose-400 to-pink-500" };
    }

    if (safeLevel < 0 || (safeLevel === 0 && safeXP < 0)) {
        const absLevel = Math.min(5, Math.max(1, Math.abs(safeLevel)));
        return { icons: "👊".repeat(absLevel) + "⚪".repeat(5 - absLevel), label: `Ác cảm Lvl ${absLevel}`, xpText: `${Math.abs(safeXP)}/100`, progressPercent: Math.min(100, Math.max(0, Math.abs(safeXP))), barColor: "bg-gradient-to-r from-purple-600 to-red-600" };
    }
}

function interactWithNPC(id, info = {}, xpChange = 0) {
    if (!gameState) return;
    ensureBaseRelationships();
    let target = gameState.relationships.find(r => r.id === id);
    if (!target) {
        target = { id: id, name: info.name || "Người quen", relation: info.relation || "Bạn bè", icon: info.icon || "👤", level: 0, xp: 0 };
        gameState.relationships.push(target);
    }
    target.xp = (target.xp || 0) + xpChange;
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

function getFamilyBackground() {
    if (!gameState) return { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    if (!gameState.familyBackground) {
        gameState.familyBackground = { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    }
    return gameState.familyBackground;
}

/**
 * =================================================================
 * BỘ ĐẾM THỜI GIAN LỊCH 30 NGÀY (AUTO-TICK CALENDAR COOLDOWN - 60S)
 * =================================================================
 */

let monthTimer = null;
const TOTAL_DAYS_IN_MONTH = 30;
const SECONDS_PER_MONTH = 60; // 60 giây cho 1 tháng
const TICK_INTERVAL = (SECONDS_PER_MONTH / TOTAL_DAYS_IN_MONTH) * 1000; // 2 giây = 1 ngày

/**
 * Bắt đầu đếm thời gian 30 ngày trong tháng
 */
function startMonthCalendarTimer() {
    if (!gameState) return;
    if (typeof gameState.currentDay === 'undefined') gameState.currentDay = 1;

    stopMonthCalendarTimer(); // Xóa timer cũ nếu có

    updateCalendarUI();

    monthTimer = setInterval(() => {
        if (gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
            gameState.currentDay += 1;
            updateCalendarUI();

            // Gọi thử kích hoạt Event ngẫu nhiên trong tháng nếu có
            if (typeof checkDynamicMidMonthEvents === 'function') {
                checkDynamicMidMonthEvents();
            }
        } else {
            // Đã chạm mốc 30 ngày
            stopMonthCalendarTimer();
            updateCalendarUI();
        }
    }, TICK_INTERVAL);
}

function stopMonthCalendarTimer() {
    if (monthTimer) {
        clearInterval(monthTimer);
        monthTimer = null;
    }
}

/**
 * Hàm Skip ngày khi người chơi đi làm / ăn uống / đi học
 */
function skipDays(daysToAdd) {
    if (!gameState) return;
    gameState.currentDay = Math.min(TOTAL_DAYS_IN_MONTH, (gameState.currentDay || 1) + daysToAdd);
    updateCalendarUI();
    if (gameState.currentDay >= TOTAL_DAYS_IN_MONTH) {
        stopMonthCalendarTimer();
    }
}
/**
 * Thêm Cột mốc lớn cuộc đời (Sinh nhật, Tốt nghiệp, Xin việc, Mua nhà, Kết hôn...)
 */
function addMilestoneLog(text) {
    if (!gameState) return;
    if (!gameState.milestoneLogs) gameState.milestoneLogs = [];
    gameState.milestoneLogs.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: text
    });
}

/**
 * Thêm Nhật ký biến cố & giao tiếp ngày thường
 */
function addDailyLog(text) {
    if (!gameState) return;
    if (!gameState.dailyLogs) gameState.dailyLogs = [];
    gameState.dailyLogs.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: text
    });
}
