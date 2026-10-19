/**
 * =================================================================
 * ZONE 1: GAME STATE & CHARACTER CREATION (TRẠNG THÁI & TẠO NHÂN VẬT)
 * =================================================================
 */

// Biến toàn cục lưu trữ trạng thái game
let gameState = null;
// BỘ TỪ ĐIỂN 10 LOẠI BỆNH PHỔ BIẾN & MỨC ĐỘ TRỪ SỨC KHỎE HÀNG THÁNG
const DISEASES_DB = {
    "Cảm cúm": { name: "Cảm cúm", drain: 7 },
    "Rối loạn tiền đình": { name: "Rối loạn tiền đình", drain: 8 },
    "Đau dạ dày": { name: "Đau dạ dày", drain: 10 },
    "Bệnh Gout": { name: "Bệnh Gout", drain: 10 },
    "Sốt xuất huyết": { name: "Sốt xuất huyết", drain: 12 },
    "Sỏi thận": { name: "Sỏi thận", drain: 12 },
    "Viêm phổi": { name: "Viêm phổi", drain: 15 },
    "Tiểu đường": { name: "Tiểu đường", drain: 15 },
    "Viêm gan": { name: "Viêm gan", drain: 18 },
    "Bệnh tim mạch": { name: "Bệnh tim mạch", drain: 20 }
};

/**
 * Khởi tạo nhân vật mới và thiết lập gameState ban đầu
 * @param {string} name Tên nhân vật
 * @param {string} gender Giới tính ("Nam" | "Nữ" | "Khác")
 */
function createCharacter(name, gender = "Nam") {
        // Nếu người chơi bỏ trống, mặc định là "Kẻ Vô Danh" thay vì "Charlie"
    const characterName = name && name.trim() !== "" ? name.trim() : "Kẻ Vô Danh";

    
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
 * ĐÃ TÍCH HỢP HỆ THỐNG CHIỈ SỐ ẨN (HIDDEN MECHANICS)
 */
function ensureBaseRelationships() {
    if (!gameState) return;
    if (!gameState.relationships) gameState.relationships = [];
    
    // Đảm bảo lấy được danh sách cung từ file npcs.js (fallback nếu chưa load kịp)
    const zodiacKeys = typeof ZODIAC_DATA !== 'undefined' ? Object.keys(ZODIAC_DATA) : 
        ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    
    // Khởi tạo Bố
    let father = gameState.relationships.find(r => r.id === "father");
    if (!father) {
        const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
        gameState.relationships.push({ 
            id: "father", 
            name: "Bố", 
            relation: "Bố", 
            icon: "👨", 
            level: 2, 
            xp: 0,
            // Các chỉ số ẨN - Người chơi không được thấy
            _zodiac: randomZodiac,
            intrinsic_stats: { 
                happiness: 70, 
                wealth: getFamilyBackground().allowance * 2, // Quỹ đen của bố
                generosity: Math.floor(Math.random() * 50) + 30 // Rộng lượng ngẫu nhiên
            }
        });
    }
    
    // Khởi tạo Mẹ
    let mother = gameState.relationships.find(r => r.id === "mother");
    if (!mother) {
        const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
        gameState.relationships.push({ 
            id: "mother", 
            name: "Mẹ", 
            relation: "Mẹ", 
            icon: "👩", 
            level: 2, 
            xp: 0,
            // Các chỉ số ẨN - Người chơi không được thấy
            _zodiac: randomZodiac,
            intrinsic_stats: { 
                happiness: 80, 
                wealth: getFamilyBackground().allowance, // Quỹ của mẹ
                generosity: Math.floor(Math.random() * 50) + 50 // Mẹ thường hay cho tiền hơn
            }
        });
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
 * TỐI ƯU CƠ CHẾ: Hàm xử lý tăng/giảm chỉ số tập trung, tự động chặn ở 0 và max
 * Tránh lỗi toán học và việc code lặp lại dài dòng ở các file khác.
 */
function modifyStat(statKey, amount, maxLimit = 100) {
    if (!gameState) return;
    
    // Nếu là tiền bạc, nợ nần thì không có giới hạn trên/dưới
    if (statKey === 'money' || statKey === 'debt') {
        gameState[statKey] = (gameState[statKey] ?? 0) + amount;
        return;
    }

    // Lấy giá trị hiện tại (Dùng ?? để bảo toàn số 0)
    let current = gameState[statKey];
    if (current === undefined || current === null) {
        // Giá trị khởi tạo dự phòng nếu lỗi save/load
        if (statKey === 'stress') current = 0;
        else if (statKey === 'hunger') current = 80;
        else if (statKey === 'health') current = 100;
        else current = 50; 
    }

    // Tính toán và giới hạn trong khoảng 0 -> maxLimit
    gameState[statKey] = Math.max(0, Math.min(maxLimit, current + amount));
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
    

    // 4. CƠ CHẾ SỨC KHỎE, DINH DƯỠNG & BỆNH TẬT MỚI
    
    // 4.1. Trừ dinh dưỡng (Hunger) hàng tháng
    modifyStat('hunger', -20);
    
    // Sức khỏe giảm 10 nếu Dinh dưỡng dưới 50%
    if ((gameState.hunger ?? 80) < 50) {
        modifyStat('health', -10);
        if (typeof addDailyLog === 'function') addDailyLog("Cơ thể suy nhược do thiếu dinh dưỡng (-10 Sức khỏe).");
    }
    
    // Hạnh phúc giảm tùy theo độ đói
    if ((gameState.hunger ?? 80) === 0) {
        modifyStat('happiness', -20);
    } else {
        modifyStat('happiness', -3);
    }

    // 4.2. Khởi phát Bệnh tật (<2% mỗi tháng)
    if (!gameState.ailments) gameState.ailments = [];
    if (Math.random() < 0.02) {
        const diseaseKeys = Object.keys(DISEASES_DB);
        const randomDisease = diseaseKeys[Math.floor(Math.random() * diseaseKeys.length)];
        
        // Tránh mắc trùng một bệnh
        if (!gameState.ailments.includes(randomDisease)) {
            gameState.ailments.push(randomDisease);
            if (typeof triggerScreenShake === 'function') triggerScreenShake();
            alert(`🦠 Cảnh báo: Bạn vừa mắc phải bệnh ${randomDisease}! Hãy đến bệnh viện chữa trị ngay kẻo tụt sức khỏe mỗi tháng.`);
            if (typeof addDailyLog === 'function') addDailyLog(`Phát bệnh: ${randomDisease}.`);
        }
    }

    // 4.3. Suy giảm sức khỏe do Bệnh tật đang mang
    if (gameState.ailments.length > 0) {
        let totalDamage = 0;
        gameState.ailments.forEach(disease => {
            if (DISEASES_DB[disease]) totalDamage += DISEASES_DB[disease].drain;
        });
        if (totalDamage > 0) {
            modifyStat('health', -totalDamage);
            if (typeof addDailyLog === 'function') addDailyLog(`Bệnh tật tàn phá cơ thể (-${totalDamage} Sức khỏe).`);
        }
    }

    // 4.4. Suy giảm sức khỏe do Lão hóa (Tuổi già)
    const currentAge = gameState.age ?? 16;
    let ageDamage = 0;
    
    if (currentAge > 90) {
        ageDamage = Math.floor(Math.random() * (80 - 50 + 1)) + 50; // Giảm 50-80
    } else if (currentAge > 80) {
        ageDamage = Math.floor(Math.random() * (30 - 10 + 1)) + 10; // Giảm 10-30
    } else if (currentAge > 50 && gameState.ailments.length === 0) {
        ageDamage = Math.floor(Math.random() * (5 - 2 + 1)) + 2; // Giảm 2-5 (chỉ khi không có bệnh)
    }
    
    if (ageDamage > 0) {
        modifyStat('health', -ageDamage);
        if (typeof addDailyLog === 'function') addDailyLog(`Dấu hiệu sinh lão bệnh tử (-${ageDamage} Sức khỏe).`);
    }

    // 4.5. Xử lý Sinh - Tử & Buộc Nhập Viện
    const currentHealth = gameState.health ?? 100;
    
    if (currentHealth <= 0) {
        // 💀 Tử vong
        gameState.health = 0;
        if (typeof triggerGameOver === 'function') {
            triggerGameOver("Sức khỏe cạn kiệt, cơ thể không thể chịu đựng thêm. Cuộc đời của Charlie đã chính thức khép lại.");
        }
        return; // Dừng tiến trình tháng tại đây
        
    } else if (currentHealth < 20) {
        // 🚨 Nguy kịch (<20%) -> Buộc nhập viện
        const hospitalBill = 500; // Tiền viện phí bắt buộc
        const currentMoney = gameState.money ?? 0;
        
        // Bệnh viện tuyến cuối sẽ kéo máu lên 40 và xóa sạch bệnh tật
        gameState.health = 40;
        gameState.ailments = []; 

        if (currentMoney >= hospitalBill) {
            modifyStat('money', -hospitalBill);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Viện phí cấp cứu khẩn cấp", -hospitalBill);
            if (typeof addDailyLog === 'function') addDailyLog(`🚨 Nguy kịch! Bị ép nhập viện cấp cứu (-${hospitalBill}$).`);
            alert(`🚨 Sức khỏe rơi xuống mức NGUY KỊCH (<20%)! Bạn buộc phải nhập viện cấp cứu, tốn ${hospitalBill}$ viện phí. Bệnh viện đã chữa khỏi các bệnh tật hiện tại.`);
        } else {
            // Không đủ tiền -> Ghi nợ
            const shortfall = hospitalBill - currentMoney;
            gameState.money = 0;
            modifyStat('debt', shortfall);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Viện phí nợ (Cấp cứu)", -currentMoney);
            if (typeof addDailyLog === 'function') addDailyLog(`🚨 Nguy kịch! Bị ép nhập viện nhưng thiếu tiền, ghi nợ ${shortfall}$.`);
            alert(`🚨 Sức khỏe rơi xuống mức NGUY KỊCH (<20%)! Bệnh viện đã cấp cứu và chữa trị cho bạn. Phần viện phí thiếu được ghi vào sổ nợ (+${shortfall}$ nợ mới)!`);
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
 * ZONE 6: HEALTH, FITNESS & MEDICAL VIEW HANDLERS (SỨC KHỎE & Y TẾ)
 * =================================================================
 */

function renderHealthView() {
    if (!gameState) return;
    
    // Cập nhật Ví tiền trong View Sức khỏe
    setElementText('health-view-money', (gameState.money ?? 0).toLocaleString());
    
    // Dùng ?? để đảm bảo số 0 không bị render lỗi thành 100 hoặc 80
    const healthVal = Math.max(0, Math.min(100, gameState.health ?? 100));
    const hungerVal = Math.max(0, Math.min(100, gameState.hunger ?? 80));
    const stressVal = Math.max(0, Math.min(100, gameState.stress ?? 0));
    
    setElementText('hv-health', healthVal);
    setElementText('hv-hunger', hungerVal);
    setElementText('hv-stress', stressVal);
    
    const healthBar = document.getElementById('hv-health-bar');
    if (healthBar) healthBar.style.width = `${healthVal}%`;
    
    const hungerBar = document.getElementById('hv-hunger-bar');
    if (hungerBar) hungerBar.style.width = `${hungerVal}%`;
    
    const stressBar = document.getElementById('hv-stress-bar');
    if (stressBar) stressBar.style.width = `${stressVal}%`;
    
    // Khung Chẩn Đoán Thông Minh
    const advisoryEl = document.getElementById("health-advisory-box");
    if (advisoryEl) {
        let adviceText = "🟢 Thể trạng hoàn hảo. Hãy tiếp tục duy trì lối sống điều độ!";
        let adviceBg = "bg-emerald-100/80 border-emerald-300 text-emerald-950";
        
        if (hungerVal < 30) {
            adviceText = "⚠️ Đói khát trầm trọng! Hãy ăn ngay để tránh tụt sức khỏe.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950 animate-pulse";
        } else if (stressVal >= 60) {
            adviceText = "🧠 Căng thẳng đỉnh điểm! Cần đi chạy bộ hoặc tập gym ngay lập tức.";
            adviceBg = "bg-amber-100/80 border-amber-300 text-amber-950 animate-pulse";
        } else if (healthVal < 50) {
            adviceText = "🩺 Sức khỏe báo động! Nên mua thuốc hoặc đến bệnh viện khám tổng quát.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950";
        }
        
        advisoryEl.className = `glass-card-inner-light p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${adviceBg}`;
        advisoryEl.innerHTML = `<span>💡</span><span>${adviceText}</span>`;
    }
    
    // Trạng thái bệnh tật
    const ailments = gameState.ailments || [];
    const statusEl = document.getElementById("health-view-status");
    if (statusEl) {
        if (ailments.length === 0) {
            statusEl.className = "text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300";
            statusEl.innerText = "🟢 Khỏe mạnh";
        } else {
            statusEl.className = "text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300";
            statusEl.innerText = `🔴 Đang bị bệnh: ${ailments.join(', ')}`;
        }
    }
}

function handleEatMeal(type) {
    if (!gameState) return;
    
    if (type === 'fastfood') {
        if ((gameState.money ?? 0) < 15) return alert("❌ Bạn không đủ 15 $!");
        modifyStat('money', -15);
        modifyStat('hunger', 30);
        
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Cơm bình dân / Đồ ăn nhanh", -15);
        if (typeof addDailyLog === 'function') addDailyLog("Ăn cơm bình dân (+30 Dinh dưỡng).");
        
        alert("🍜 Ăn cơm bình dân (+30 Độ no)!");
    } else if (type === 'healthy') {
        if ((gameState.money ?? 0) < 50) return alert("❌ Bạn không đủ 50 $!");
        modifyStat('money', -50);
        modifyStat('hunger', 60);
        modifyStat('health', 10);
        
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Bữa ăn dinh dưỡng cao cấp", -50);
        if (typeof addDailyLog === 'function') addDailyLog("Thưởng thức bữa ăn dinh dưỡng cao cấp (+60 Dinh dưỡng, +10 Sức khỏe).");
        
        alert("🥗 Bữa ăn dinh dưỡng (+60 Độ no, +10 Sức khỏe)!");
    }
    
    if (typeof saveGameState === 'function') saveGameState();
    renderHealthView();
}

function handleMedicalCare(type) {
    if (!gameState) return;
    
    if (type === 'pharmacy') {
        if ((gameState.money ?? 0) < 30) return alert("❌ Bạn không đủ 30 $!");
        modifyStat('money', -30);
        modifyStat('health', 15);
        gameState.ailments = [];
        
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Mua thuốc cảm sốt", -30);
        if (typeof addDailyLog === 'function') addDailyLog("Mua thuốc tiệm tây (+15 Sức khỏe, chữa hết bệnh nhẹ).");
        
        alert("💊 Đã uống thuốc. Chữa sạch bệnh vặt (+15 Sức khỏe)!");
    } else if (type === 'hospital') {
        if ((gameState.money ?? 0) < 150) return alert("❌ Bạn không đủ 150 $!");
        modifyStat('money', -150);
        modifyStat('health', 40);
        modifyStat('stress', -20);
        gameState.ailments = [];
        
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Khám & Chữa bệnh tổng quát Bệnh viện", -150);
        if (typeof addDailyLog === 'function') addDailyLog("Nhập viện điều trị tổng quát (+40 Sức khỏe, giảm Stress).");
        
        alert("🏥 Đã điều trị tại bệnh viện (+40 Sức khỏe, giảm Stress)!");
    }
    
    if (typeof saveGameState === 'function') saveGameState();
    renderHealthView();
}

function handleFitness(type) {
    if (!gameState) return;
    
    if (type === 'park') {
        modifyStat('stress', -10);
        modifyStat('strength', 2);
        
        if (typeof addDailyLog === 'function') addDailyLog("Chạy bộ ở công viên (-10 Stress, +2 Sức mạnh).");
        
        alert("🏃 Đã chạy bộ công viên (-10 Stress, +2 Sức mạnh)!");
    } else if (type === 'gym') {
        if ((gameState.money ?? 0) < 60) return alert("❌ Bạn không đủ 60 $!");
        modifyStat('money', -60);
        modifyStat('stress', -30);
        modifyStat('strength', 5);
        modifyStat('looks', 5);
        
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Giải trí: Đăng ký tập Gym / Yoga", -60);
        if (typeof addDailyLog === 'function') addDailyLog("Đăng ký tập Gym/Yoga (-30 Stress, +5 Sức mạnh, +5 Ngoại hình).");
        
        alert("🏋️ Tập Gym hăng say (-30 Stress, +5 Sức mạnh, +5 Ngoại hình)!");
    }
    
    if (typeof saveGameState === 'function') saveGameState();
    renderHealthView();
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

/**
 * Hành động: Rủ NPC đi ăn / Cafe
 * Tốn tiền, giảm stress và tăng thiện cảm an toàn
 */
function handleHangoutWithNPC(npcId) {
    if (!gameState || (gameState.money || 0) < 30) {
        return alert("❌ Bạn không đủ 30$ để rủ rê người khác đi ăn uống!");
    }

    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    // Trừ tiền, giảm stress
    gameState.money -= 30;
    gameState.stress = Math.max(0, (gameState.stress || 0) - 15);

    // Cộng điểm thiện cảm (10 - 20 điểm)
    const xpGain = Math.floor(Math.random() * 11) + 10; 
    interactWithNPC(npcId, {}, xpGain);

    if (typeof addTransactionHistory === 'function') {
        addTransactionHistory(`☕ Mời ${npc.name} đi ăn uống`, -30);
    }
    if (typeof addDailyLog === 'function') {
        addDailyLog(`Đi ăn cùng ${npc.name} (-30$, giảm stress, tăng tình cảm).`);
    }

    alert(`☕ Bạn đã mời ${npc.name} đi ăn uống!\nNhờ bữa ăn vui vẻ, Stress giảm và hai người trở nên thân thiết hơn (+${xpGain} điểm thiện cảm).`);
    
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * Hành động: Xin tiền Bố / Mẹ / Người thân
 * Tính toán dựa trên độ rộng lượng (generosity) và tiền họ có (wealth)
 */
function handleAskForMoney(npcId) {
    if (!gameState) return;
    
    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    // Chỉ cho xin tiền nếu là Bố hoặc Mẹ (tạm thời)
    if (npc.id !== 'father' && npc.id !== 'mother') {
        return alert(`❌ Chà, bạn không thể xin tiền ${npc.name} được đâu. Mất mặt lắm!`);
    }

    // Kiểm tra điểm thiện cảm (XP và Level)
    const currentLevel = npc.level || 0;
    if (currentLevel < 0) {
        return alert(`🤬 ${npc.name} đang giận bạn! Còn khuya mới cho tiền nhé. Hãy làm lành trước đi!`);
    }

    // 🚀 SỬA LỖI: Khởi tạo intrinsic_stats nếu NPC chưa có (dành cho file save cũ)
    if (!npc.intrinsic_stats) {
        npc.intrinsic_stats = {
            happiness: 70,
            wealth: 50,
            generosity: 50
        };
    }

    // Lấy chỉ số ẩn an toàn
    const wealth = npc.intrinsic_stats.wealth;
    const generosity = npc.intrinsic_stats.generosity;

    // Tỷ lệ cho tiền phụ thuộc vào Generosity (độ rộng lượng)
    const chance = generosity / 100; 
    const isSuccess = Math.random() < chance;

    if (isSuccess && wealth > 10) {
        // Tính số tiền cho (10% đến 40% quỹ wealth của NPC)
        const giveAmount = Math.floor(wealth * (0.1 + Math.random() * 0.3));
        
        // NPC bị trừ tiền, nhân vật chính được cộng tiền
        npc.intrinsic_stats.wealth -= giveAmount;
        gameState.money = (gameState.money || 0) + giveAmount;

        // Trừ nhẹ điểm thiện cảm vì thói hay xin xỏ (-5 XP)
        if (typeof interactWithNPC === 'function') interactWithNPC(npcId, {}, -5);

        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory(`💸 Xin tiền ${npc.name}`, giveAmount);
        }
        
        alert(`🥰 ${npc.name} đã thở dài và cho bạn ${giveAmount}$ tiêu vặt.\n(Lưu ý: Xin tiền nhiều sẽ làm giảm nhẹ điểm thiện cảm nhé!)`);
    } else {
        // Xin thất bại -> Bị la mắng, trừ điểm thiện cảm nặng hơn
        if (typeof interactWithNPC === 'function') interactWithNPC(npcId, {}, -15);
        alert(`😤 ${npc.name} từ chối thẳng thừng: "Tiêu pha cho lắm vào rồi giờ ngửa tay xin à? Không có đồng nào đâu!"\n(-15 điểm thiện cảm)`);
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * =================================================================
 * TƯƠNG TÁC & CẬP NHẬT ĐIỂM THIỆN CẢM NPC (INTERACT WITH NPC)
 * =================================================================
 * @param {string} npcId - ID của NPC (vd: 'father', 'mother', 'boss'...)
 * @param {object} options - Các tùy chọn bổ sung (nếu có)
 * @param {number} xpChange - Số điểm thiện cảm (XP) cộng hoặc trừ
 */
function interactWithNPC(npcId, options = {}, xpChange = 0) {
    if (!gameState || !gameState.relationships) return;

    // Tìm NPC trong danh sách mối quan hệ
    let npc = gameState.relationships.find(r => r.id === npcId);

    // Nếu chưa có NPC này trong danh sách, tạo mới ngẫu nhiên
    if (!npc) {
        npc = {
            id: npcId,
            name: npcId === 'mother' ? 'Mẹ' : (npcId === 'father' ? 'Bố' : 'Người Quen'),
            relation: 'Người Quen',
            icon: '👤',
            level: 0,
            xp: 0,
            intrinsic_stats: { happiness: 50, wealth: 50, generosity: 50 }
        };
        gameState.relationships.push(npc);
    }

    if (xpChange === 0) return;

    // Khởi tạo XP & Level nếu chưa có
    if (typeof npc.xp === 'undefined') npc.xp = 0;
    if (typeof npc.level === 'undefined') npc.level = 0;

    // Cập nhật XP
    npc.xp += xpChange;

    // Logic Tăng / Giảm Cấp độ quan hệ (Level) dựa trên XP (Mỗi Level = 100 XP)
    if (npc.xp >= 100) {
        const levelUp = Math.floor(npc.xp / 100);
        npc.level += levelUp;
        npc.xp = npc.xp % 100;
        
        if (typeof showFloatingText === 'function') {
            showFloatingText('relation', `❤️ Mối quan hệ với ${npc.name} tăng cấp!`, 'pos');
        }
    } else if (npc.xp < 0) {
        if (npc.level > -3) { // Giới hạn mức thù hằn thấp nhất là -3
            npc.level -= 1;
            npc.xp = 100 + npc.xp; // XP dư chuyển sang level dưới
            
            if (typeof showFloatingText === 'function') {
                showFloatingText('relation', `💔 Mối quan hệ với ${npc.name} giảm cấp!`, 'neg');
            }
        } else {
            npc.xp = 0;
        }
    }

    // Hiển thị thông báo Floating Text ngắn nếu có điểm thay đổi
    if (typeof showFloatingText === 'function') {
        const sign = xpChange > 0 ? '+' : '';
        const type = xpChange > 0 ? 'pos' : 'neg';
        showFloatingText('relation', `${npc.name}: ${sign}${xpChange} XP`, type);
    }

    // Lưu lại trạng thái & Render lại UI nếu cần
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}
