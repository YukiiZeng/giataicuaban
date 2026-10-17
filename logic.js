/**
 * =================================================================
 * ZONE 1: GAME STATE & CHARACTER CREATION (TRẠNG THÁI & TẠO NHÂN VẬT)
 * =================================================================
 */

// Biến toàn cục lưu trữ trạng thái game
let gameState = null;

/**
 * Khởi tạo nhân vật mới và thiết lập gameState ban đầu
 * @param {string} name Tên nhân vật
 * @param {string} gender Giới tính ("Nam" | "Nữ" | "Khác")
 */
function createCharacter(name, gender = "Nam") {
    const characterName = name && name.trim() !== "" ? name.trim() : "Charlie";
    
    // Random Gia cảnh xuất thân
    const bgTypes = [
        { type: "wealthy", label: "🏡 Gia đình khá giả", allowance: 150, contributionChance: 0.1 },
        { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 },
        { type: "poor", label: "🏚️ Gia đình khó khăn", allowance: 20, contributionChance: 0.6 }
    ];
    const rand = Math.random();
    const selectedBg = rand < 0.2 ? bgTypes[0] : (rand < 0.7 ? bgTypes[1] : bgTypes[2]);
    
    gameState = {
        name: characterName,
        gender: gender,
        age: 16,
        month: 1,
        currentDay: 1,
        money: 0,
        
        // Chỉ số sinh tồn
        health: 100,
        hunger: 80,
        happiness: 70,
        smarts: 50,
        stress: 0,
        ailments: [],
        
        // Thuộc tính năng lực
        strength: 50,
        looks: 60,
        charm: 45,
        ego: 30,
        
        // Học vấn & Nghề nghiệp
        job: null,
        education: "THCS",
        currentEducation: null,
        degrees: [],
        
        // Tài sản & Nơi ở
        debt: 0,
        assets: [],
        inventory: [],
        availableHousingPool: [],
        currentHome: {
            id: "parents_house",
            name: "Nhà Bố Mẹ",
            type: "shared",
            hostId: "parents",
            monthlyCost: 0,
            description: "Ngôi nhà ấm cúng của gia đình. Phụ thuộc vào tình cảm với Bố Mẹ."
        },
        
        // Gia cảnh & Mạng lưới quan hệ
        familyBackground: selectedBg,
        relationships: [],
        
        // Nhật ký & Thống kê trọn đời
        historyLog: [
            { month: 1, age: 16, text: "Bắt đầu cuộc hành trình mới cuộc đời." }
        ],
        transactionHistory: [],
        milestoneLogs: [],
        dailyLogs: [],
        totalLifetimeIncome: 0,
        totalLifetimeExpense: 0
    };
    
    ensureBaseRelationships();
    saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * Đảm bảo các mối quan hệ nền tảng (Bố, Mẹ) luôn tồn tại
 */
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
 * Lấy thông tin gia cảnh của nhân vật
 */
function getFamilyBackground() {
    if (!gameState) return { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    if (!gameState.familyBackground) {
        gameState.familyBackground = { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    }
    return gameState.familyBackground;
}


/**
 * =================================================================
 * ZONE 2: PERSISTENCE & STORAGE (LƯU & NẠP LOCALSTORAGE/CLOUD)
 * =================================================================
 */

/**
 * Lưu tiến trình game vào LocalStorage & Firebase Cloud
 */
function saveGameState() {
    if (typeof gameState !== 'undefined' && gameState) {
        localStorage.setItem("GIA_TAI_CUA_BAN_GAME_STATE", JSON.stringify(gameState));
        if (typeof auth !== 'undefined' && auth.currentUser) {
            if (typeof saveGameStateToFirebase === 'function') {
                saveGameStateToFirebase(auth.currentUser.uid);
            }
        }
    }
}

/**
 * Nạp tiến trình game từ LocalStorage
 */
function loadGameState() {
    const saved = localStorage.getItem("GIA_TAI_CUA_BAN_GAME_STATE");
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error("❌ Lỗi nạp dữ liệu LocalStorage:", e); }
    }
    return null;
}

/**
 * Reset nhân vật và xóa toàn bộ dữ liệu lưu trữ
 */
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
 * ZONE 3: MONTHLY PROGRESSION & LIFECYCLE (TIẾN TRÌNH THÁNG & SINH TỒN)
 * =================================================================
 */

/**
 * Chuyển sang tháng tiếp theo và tính toán chi phí / thu nhập
 */
function nextMonth() {
    if (typeof gameState === 'undefined' || !gameState) return;
    
    // Snapshot các chỉ số trước khi sang tháng
    const startMoney = gameState.money || 0;
    const startHealth = gameState.health || 100;
    const startHunger = gameState.hunger || 80;
    const startHappiness = gameState.happiness || 70;
    
    const currentMonthNum = gameState.month || 1;
    
    // 1. Tăng tháng & tuổi
    gameState.month = currentMonthNum + 1;
    if (gameState.month % 12 === 0) {
        gameState.age = (gameState.age || 16) + 1;
        addMilestoneLog(`Tròn ${gameState.age} tuổi.`);
    }
    
    // 2. Tính toán tài chính trong tháng
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    if (gameState.job) {
        monthlyIncome += (gameState.job.salary || 0);
    }
    if (gameState.currentEducation) {
        monthlyExpense += (gameState.currentEducation.tuitionPerMonth || 0);
    }
    if (gameState.currentHome && gameState.currentHome.type === 'rented') {
        monthlyExpense += (gameState.currentHome.monthlyCost || 0);
    }
    monthlyExpense += 50; // Chi phí sinh hoạt cơ bản
    
    // 3. Thực thi logic chuyên biệt hàng tháng từ các module
    if (typeof processMonthlyEducation === 'function') processMonthlyEducation();
    if (typeof processMonthlyJob === 'function') processMonthlyJob();
    if (typeof checkHousingEvents === 'function') checkHousingEvents();
    

    // 4. Trừ chỉ số sinh tồn (Độ no, Sức khỏe, Hạnh phúc)
    const hungerLoss = 20;
    gameState.hunger = Math.max(0, Math.min(100, (gameState.hunger ?? 80) - hungerLoss));
    
    if (gameState.hunger === 0) {
        gameState.health = Math.max(0, Math.min(100, (gameState.health ?? 100) - 25));
        gameState.happiness = Math.max(0, Math.min(100, (gameState.happiness ?? 70) - 20));
    } else {
        gameState.happiness = Math.max(0, Math.min(100, (gameState.happiness ?? 70) - 3));
    }
    
    // 🛡️ BƯỚC 3: KIỂM TRA NẾU SỨC KHỎE VỀ 0 -> CẤP CỨU HOẶC GAME OVER
    if ((gameState.health || 0) <= 0) {
        const hospitalBill = 300;
        const currentMoney = gameState.money || 0;
        
        if (currentMoney >= hospitalBill) {
            // Đủ tiền: Trừ viện phí, hồi máu tạm thời
            gameState.money -= hospitalBill;
            gameState.health = 10;
            
            if (typeof addTransactionHistory === 'function') {
                addTransactionHistory("Y tế: Viện phí cấp cứu khẩn cấp", -hospitalBill);
            }
            if (typeof addDailyLog === 'function') {
                addDailyLog(`🚨 Nguy kịch! Kiệt sức phải nhập viện cấp cứu (-${hospitalBill}$).`);
            }
            alert(`🚨 Sức khỏe chạm đáy 0! Bạn ngất xỉu và được đưa đi cấp cứu kịp thời, tốn mất ${hospitalBill}$ viện phí!`);
        } else if (currentMoney > 0 || (gameState.debt || 0) < 2000) {
            // Không đủ tiền hẳn, nhưng vẫn còn có thể ghi nợ thêm
            const shortfall = hospitalBill - currentMoney;
            gameState.money = 0;
            gameState.debt = (gameState.debt || 0) + shortfall;
            gameState.health = 10;
            
            if (typeof addTransactionHistory === 'function') {
                addTransactionHistory("Y tế: Viện phí nợ (Cấp cứu)", -currentMoney);
            }
            if (typeof addDailyLog === 'function') {
                addDailyLog(`🚨 Nguy kịch! Kiệt sức ngất xỉu nhưng không đủ tiền trả viện phí. Bệnh viện ghi nợ thêm ${shortfall}$.`);
            }
            alert(`🚨 Sức khỏe chạm đáy 0 và bạn không đủ tiền! Bệnh viện tuyến cuối đã cứu sống bạn qua cơn nguy kịch, nhưng khoản viện phí được ghi vào sổ nợ (+${shortfall}$ nợ mới)!`);
        } else {
            // 💀 NẾU NỢ QUÁ NẶNG HOẶC KHÔNG CÒN GÌ ĐỂ CỨU -> GỌI GAME OVER CHÍNH THỨC
            gameState.health = 0;
            if (typeof triggerGameOver === 'function') {
                triggerGameOver("Do kiệt sức hoàn toàn khi sức khỏe chạm đáy 0 và gánh khoản nợ ngập đầu không thể chi trả, cuộc đời của Charlie đã chính thức khép lại tại đây.");
            }
            return;
        }
    }
    
    
    // 5. Tích lũy tài chính trọn đời
    gameState.totalLifetimeIncome = (gameState.totalLifetimeIncome || 0) + monthlyIncome;
    gameState.totalLifetimeExpense = (gameState.totalLifetimeExpense || 0) + monthlyExpense;
    
    // Lưu trạng thái & Render lại toàn bộ UI
    saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
    if (typeof renderHealthView === 'function') renderHealthView();
    
    // 6. Hiển thị Modal Tổng Kết Báo Cáo Cuối Tháng
    const summaryData = {
        month: currentMonthNum,
        income: monthlyIncome,
        expense: monthlyExpense,
        net: monthlyIncome - monthlyExpense,
        healthDiff: (gameState.health || 0) - startHealth,
        hungerDiff: (gameState.hunger || 0) - startHunger,
        happinessDiff: (gameState.happiness || 0) - startHappiness
    };
    
    if (typeof showMonthlySummaryModal === 'function') {
        showMonthlySummaryModal(summaryData, () => {
            if (typeof checkMonthlyEvents === 'function') {
                checkMonthlyEvents();
            }
        });
    }
}



/**
 * =================================================================
 * ZONE 4: WEB WORKER CALENDAR TIMER (ĐỒNG HỒ SIÊU BỌC GIÁP CHỐNG ĐỨNG 100%)
 * =================================================================
 */

let gameTimerWorker = null;
let lastWorkerTickTime = Date.now();
let workerWatchdogTimer = null;

const TOTAL_DAYS_IN_MONTH = 30;
const SECONDS_PER_MONTH = 60;
const TICK_INTERVAL = (SECONDS_PER_MONTH / TOTAL_DAYS_IN_MONTH) * 1000; // 2000ms

/**
 * Khởi tạo & Kích hoạt Web Worker với cơ chế Chó săn giám sát (Watchdog)
 */
function startMonthCalendarTimer() {
    if (!gameState) return;
    if (typeof gameState.currentDay === 'undefined') gameState.currentDay = 1;
    
    stopMonthCalendarTimer();
    lastWorkerTickTime = Date.now();
    if (typeof updateCalendarUI === 'function') updateCalendarUI();
    
    if (window.Worker) {
        try {
            gameTimerWorker = new Worker('timer-worker.js');
            
            gameTimerWorker.onmessage = function(e) {
                if (e.data.type === 'tick') {
                    lastWorkerTickTime = Date.now(); // Ghi nhận tim vẫn đập
                    handleTimerTick();
                }
            };
            
            gameTimerWorker.postMessage({ cmd: 'start', interval: TICK_INTERVAL });
            console.log("⚡ Web Worker Timer đã kích hoạt!");
            
            // 🚀 BỘ GIÁM SÁT (WATCHDOG): Tự động đánh thức nếu Worker bị đứng quá 5s
            workerWatchdogTimer = setInterval(() => {
                if (gameState && gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
                    const timeSinceLastTick = Date.now() - lastWorkerTickTime;
                    if (timeSinceLastTick > 4500) { // Quá 4.5s không nhích
                        console.warn("⚠️ Đồng hồ bị khựng! Đang kích hoạt lại Worker...");
                        startMonthCalendarTimer();
                    }
                }
            }, 3000);
            
        } catch (err) {
            console.warn("⚠️ Lỗi khởi tạo Worker, dùng bộ đếm dự phòng:", err);
            startFallbackTimer();
        }
    } else {
        startFallbackTimer();
    }
}

/**
 * Xử lý mỗi nhịp ngày trôi qua (Có bọc try-catch chống sập)
 */
function handleTimerTick() {
    if (!gameState) return;
    
    if (gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
        gameState.currentDay += 1;
        if (typeof updateCalendarUI === 'function') updateCalendarUI();
        
        // Bọc an toàn: Lỗi sự kiện không bao giờ làm dừng đồng hồ
        try {
            if (typeof checkDynamicMidMonthEvents === 'function') {
                checkDynamicMidMonthEvents();
            }
        } catch (err) {
            console.error("❌ Lỗi ngầm trong sự kiện giữa tháng:", err);
        }
    } else {
        stopMonthCalendarTimer();
        if (typeof updateCalendarUI === 'function') updateCalendarUI();
    }
}

/**
 * Dừng Web Worker & Watchdog
 */
function stopMonthCalendarTimer() {
    if (gameTimerWorker) {
        gameTimerWorker.postMessage({ cmd: 'stop' });
        gameTimerWorker.terminate();
        gameTimerWorker = null;
    }
    if (workerWatchdogTimer) {
        clearInterval(workerWatchdogTimer);
        workerWatchdogTimer = null;
    }
}

/**
 * Bỏ qua ngày
 */
function skipDays(daysToAdd) {
    if (!gameState) return;
    gameState.currentDay = Math.min(TOTAL_DAYS_IN_MONTH, (gameState.currentDay || 1) + daysToAdd);
    if (typeof updateCalendarUI === 'function') updateCalendarUI();
    if (gameState.currentDay >= TOTAL_DAYS_IN_MONTH) {
        stopMonthCalendarTimer();
    }
}

let fallbackTimer = null;

function startFallbackTimer() {
    if (fallbackTimer) clearInterval(fallbackTimer);
    fallbackTimer = setInterval(handleTimerTick, TICK_INTERVAL);
}

/**
 * =================================================================
 * ZONE 5: HOUSING MARKET & PROPERTY LOGIC (THỊ TRƯỜNG NHÀ Ở)
 * =================================================================
 */

/**
 * Làm mới tin rao vặt nhà trọ hàng tháng
 */
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

/**
 * Kiểm tra việc thu tiền nhà trọ và siết phòng nếu không đủ tiền
 */
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


/**
 * =================================================================
 * ZONE 6: RELATIONSHIPS & SOCIAL SYSTEM (MẠNG LƯỚI QUAN HỆ)
 * =================================================================
 */

/**
 * Tính toán Cấp độ Thiện cảm / Ác cảm với NPC dựa trên Level và XP
 */
function getRelationshipTier(level = 0, xp = 0) {
    const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 0;
    const safeXP = typeof xp === 'number' && !isNaN(xp) ? xp : 0;
    
    if (safeLevel === 0 && safeXP === 0) {
        return { icons: "👁️", label: "Quen biết", xpText: "0/100", progressPercent: 0, barColor: "bg-gray-400" };
    }
    
    if (safeLevel > 0 || (safeLevel === 0 && safeXP > 0)) {
        const displayLevel = Math.min(5, Math.max(1, safeLevel));
        return {
            icons: "❤️".repeat(displayLevel) + "🤍".repeat(5 - displayLevel),
            label: `Thiện cảm Lvl ${displayLevel}`,
            xpText: `${safeXP}/100`,
            progressPercent: Math.min(100, Math.max(0, safeXP)),
            barColor: "bg-gradient-to-r from-rose-400 to-pink-500"
        };
    }
    
    if (safeLevel < 0 || (safeLevel === 0 && safeXP < 0)) {
        const absLevel = Math.min(5, Math.max(1, Math.abs(safeLevel)));
        return {
            icons: "👊".repeat(absLevel) + "⚪".repeat(5 - absLevel),
            label: `Ác cảm Lvl ${absLevel}`,
            xpText: `${Math.abs(safeXP)}/100`,
            progressPercent: Math.min(100, Math.max(0, Math.abs(safeXP))),
            barColor: "bg-gradient-to-r from-purple-600 to-red-600"
        };
    }
}

/**
 * Tương tác tăng / giảm điểm mối quan hệ với NPC
 */
function interactWithNPC(id, info = {}, xpChange = 0) {
    if (!gameState) return;
    ensureBaseRelationships();
    
    let target = gameState.relationships.find(r => r.id === id);
    if (!target) {
        target = { id: id, name: info.name || "Người quen", relation: info.relation || "Bạn bè", icon: info.icon || "👤", level: 0, xp: 0 };
        gameState.relationships.push(target);
    }
    
    target.xp = (target.xp || 0) + xpChange;
    
    // Logic thăng cấp (Tăng tim) khi XP >= 100
    while (target.xp >= 100) {
        if (target.level < 5) {
            target.level++;
            target.xp -= 100;
        } else {
            target.xp = 100; // Đạt mức thân thiết tối đa (Tim level 5)
            break;
        }
    }
    
    // Logic giáng cấp (Trừ tim / Chuyển sang nấm đấm) khi XP < 0
    while (target.xp < 0) {
        if (target.level > -5) {
            target.level--;
            target.xp += 100;
        } else {
            target.xp = 0; // Đạt mức thù ghét tối đa (Đấm level 5)
            break;
        }
    }
    
    saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}



/**
 * =================================================================
 * ZONE 7: GAME LOGS & MILESTONES (NHẬT KÝ & CỘT MỐC)
 * =================================================================
 */

/**
 * Thêm Cột mốc lớn cuộc đời (Sinh nhật, Tốt nghiệp, Xin việc, Mua nhà...)
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

/**
 * Thêm Nhật ký lịch sử chung
 */
function addHistoryLog(text) {
    if (!gameState) return;
    if (!gameState.historyLog) gameState.historyLog = [];
    gameState.historyLog.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: text
    });
}

/**
 * Ghi nhận một giao dịch tài chính vào Lịch sử
 */
function addTransactionHistory(title, amount) {
    if (!gameState) return;
    if (!gameState.transactionHistory) gameState.transactionHistory = [];
    
    gameState.transactionHistory.unshift({
        month: gameState.month || 1,
        title: title,
        amount: amount
    });
}

/**
 * =================================================================
 * GAME OVER & LIFE ENDING SYSTEM (HỆ THỐNG KẾT THÚC VÒNG ĐỜI)
 * =================================================================
 */

/**
 * Kích hoạt bảng Game Over khi nhân vật kiệt sức hoặc phá sản nặng nề
 * @param {string} reason Lý do kết thúc cuộc đời
 */
function triggerGameOver(reason) {
    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();
    
    const modal = document.getElementById("game-over-modal");
    if (!modal) {
        alert("Game Over: " + reason);
        if (typeof resetCharacter === 'function') resetCharacter();
        return;
    }
    
    // Gắn thông tin tổng kết vào Modal
    setElementText('game-over-reason', reason);
    setElementText('go-final-age', `${gameState.age || 16} tuổi`);
    setElementText('go-final-month', `Tháng ${gameState.month || 1}`);
    setElementText('go-final-money', `${(gameState.money || 0).toLocaleString()} $`);
    setElementText('go-final-debt', `${(gameState.debt || 0).toLocaleString()} $`);
    
    modal.classList.remove("hidden");
}

/**
 * Xử lý khi người chơi bấm nút Tái sinh sau khi Game Over
 */
function handleRestartFromGameOver() {
    const modal = document.getElementById("game-over-modal");
    if (modal) modal.classList.add("hidden");
    
    if (typeof resetCharacter === 'function') {
        resetCharacter();
    }
}