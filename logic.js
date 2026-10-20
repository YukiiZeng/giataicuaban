<<<<<<< HEAD
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
 * Hàm phụ trợ gán text an toàn cho DOM (Tránh lỗi ReferenceError)
 */
function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

/**
 * Khởi tạo nhân vật mới và thiết lập gameState ban đầu
 * @param {string} name Tên nhân vật
 * @param {string} gender Giới tính ("Nam" | "Nữ" | "Khác")
 */
function createCharacter(name, gender = "Nam") {
    const characterName = name && name.trim() !== "" ? name.trim() : "Kẻ Vô Danh";

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
        currentCity: 'ung_dung',
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

        // Gói đăng ký & Cờ Y tế
        subscriptions: { gym: false, yoga: false },
        hasCheckedHealthThisMonth: false,

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
        // Data chứng khoán ban đầu
        stocks: null,
        portfolio: {},
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
/**
 * Đảm bảo các mối quan hệ nền tảng (Bố, Mẹ) luôn tồn tại và có avatar ngẫu nhiên từ bộ 1-5
 */
function ensureBaseRelationships() {
    if (!gameState) return;
    if (!gameState.relationships) gameState.relationships = [];

    const zodiacKeys = typeof ZODIAC_DATA !== 'undefined' ? Object.keys(ZODIAC_DATA) : ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

    // 1. Khởi tạo Bố nếu chưa có (chọn ngẫu nhiên dad-1 đến dad-5)
    let father = gameState.relationships.find(r => r.id === "father");
    if (!father) {
        const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
        const randomDadIndex = Math.floor(Math.random() * 5) + 1; // Từ 1 đến 5
        gameState.relationships.push({
            id: "father",
            name: "Bố",
            relation: "Bố",
            icon: "👨",
            avatarUrl: `assets/avatars/dad-${randomDadIndex}.png`, // 🌟 Tự động gán avatar Bố
            level: 2,
            xp: 0,
            _zodiac: randomZodiac,
            intrinsic_stats: {
                happiness: 70,
                wealth: getFamilyBackground().allowance * 2,
                generosity: Math.floor(Math.random() * 50) + 30
            }
        });
    }

    // 2. Khởi tạo Mẹ nếu chưa có (chọn ngẫu nhiên mom-1 đến mom-5)
    let mother = gameState.relationships.find(r => r.id === "mother");
    if (!mother) {
        const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
        const randomMomIndex = Math.floor(Math.random() * 5) + 1; // Từ 1 đến 5
        gameState.relationships.push({
            id: "mother",
            name: "Mẹ",
            relation: "Mẹ",
            icon: "👩",
            avatarUrl: `assets/avatars/mom-${randomMomIndex}.png`, // 🌟 Tự động gán avatar Mẹ
            level: 2,
            xp: 0,
            _zodiac: randomZodiac,
            intrinsic_stats: {
                happiness: 80,
                wealth: getFamilyBackground().allowance,
                generosity: Math.floor(Math.random() * 50) + 50
            }
        });
    }
}

function getFamilyBackground() {
    if (!gameState) return { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    if (!gameState.familyBackground) {
        gameState.familyBackground = { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    }
    return gameState.familyBackground;
}

function modifyStat(statKey, amount, maxLimit = 100) {
    if (!gameState) return;

    if (statKey === 'money' || statKey === 'debt') {
        gameState[statKey] = (gameState[statKey] ?? 0) + amount;
        return;
    }

    let current = gameState[statKey];
    if (current === undefined || current === null) {
        if (statKey === 'stress') current = 0;
        else if (statKey === 'hunger') current = 80;
        else if (statKey === 'health') current = 100;
        else current = 50;
    }

    gameState[statKey] = Math.max(0, Math.min(maxLimit, current + amount));
}


/**
 * =================================================================
 * ZONE 2: PERSISTENCE & STORAGE (LƯU & NẠP LOCALSTORAGE/CLOUD)
 * =================================================================
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

function loadGameState() {
    const saved = localStorage.getItem("GIA_TAI_CUA_BAN_GAME_STATE");
    if (saved) {
        try { 
            const state = JSON.parse(saved); 
            
            // 🌟 Tự động vá/bổ sung avatar cho Bố và Mẹ nếu save cũ chưa có
            if (state && state.relationships) {
                let father = state.relationships.find(r => r.id === "father");
                if (father && !father.avatarUrl) {
                    const randomDadIndex = Math.floor(Math.random() * 5) + 1;
                    father.avatarUrl = `assets/avatars/dad-${randomDadIndex}.png`;
                }

                let mother = state.relationships.find(r => r.id === "mother");
                if (mother && !mother.avatarUrl) {
                    const randomMomIndex = Math.floor(Math.random() * 5) + 1;
                    mother.avatarUrl = `assets/avatars/mom-${randomMomIndex}.png`;
                }
            }

            return state; 
        } catch (e) { 
            console.error("❌ Lỗi nạp dữ liệu LocalStorage:", e); 
        }
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
 * ZONE 3: MONTHLY PROGRESSION & LIFECYCLE (TIẾN TRÌNH THÁNG & SINH TỒN)
 * =================================================================
 */

/**
 * 🚀 HEALTH ENGINE 2.0: Tính toán biến động Sức khỏe hàng tháng tập trung & chuẩn xác
 */
function processMonthlyHealthSystem() {
    if (!gameState) return;

    let baseDrain = 0;
    const logs = [];

    // 1. Áp lực thể chất từ Công việc / Học tập cơ bản
    const hasJob = !!gameState.job;
    const hasEdu = !!gameState.currentEducation;

    if (hasJob && gameState.job.stressCost) {
        baseDrain += Math.round(gameState.job.stressCost * 0.3);
    }
    if (hasEdu && gameState.currentEducation.staminaCost) {
        baseDrain += Math.round(gameState.currentEducation.staminaCost * 0.3);
    }

    // 🌟 1.5. CƠ CHẾ PHẠT ÁP LỰC KẾP: VỪA HỌC VỪA LÀM
    if (hasJob && hasEdu) {
        const isFormalEdu = gameState.currentEducation.category === 'formal';

        if (isFormalEdu) {
            const overloadPenalty = 8;
            baseDrain += overloadPenalty;
            logs.push(`Quá tải do vừa học Chính Quy vừa đi làm (-${overloadPenalty} Sức khỏe)`);
        } else {
            const overloadPenalty = 3;
            baseDrain += overloadPenalty;
            logs.push(`Mệt mỏi do vừa học nghề vừa đi làm (-${overloadPenalty} Sức khỏe)`);
        }
    }

    // 2. Dinh dưỡng & Đói khát
    const hunger = gameState.hunger ?? 80;
    if (hunger < 20) {
        baseDrain += 15;
        logs.push("Cơ thể kiệt sức vì đói trầm trọng (-15 Sức khỏe)");
    } else if (hunger < 50) {
        baseDrain += 6;
        logs.push("Thiếu dinh dưỡng nhẹ (-6 Sức khỏe)");
    }

    // 3. Môi trường Nơi ở
    const homeType = gameState.currentHome ? gameState.currentHome.type : 'shared';
    if (homeType === 'homeless') {
        baseDrain += 15;
        logs.push("Sống lang thang xơ xác (-15 Sức khỏe)");
    } else if (homeType === 'rented' && gameState.currentHome.monthlyCost < 200) {
        baseDrain += 3;
    } else if (homeType === 'shared') {
        baseDrain -= 4; // Bố Mẹ chăm sóc: Giảm 4 điểm gánh nặng!
    }

    // 4. BÙ TRỪ: Khả năng chống chịu từ Chỉ số Sức mạnh (Strength)
    const strength = gameState.strength ?? 50;
    const resistance = Math.floor(strength * 0.25); // Strength 50 = Giảm 12 điểm gánh nặng!

    let finalDrain = Math.max(2, baseDrain - resistance); // Tối thiểu chỉ mất 2 điểm sinh hoạt phí/tháng

    // 5. Tác động Bệnh tật (Có tỷ lệ 2% phát bệnh ngẫu nhiên nếu chưa bị bệnh)
    if (Math.random() < 0.02) {
        const diseaseNames = Object.keys(DISEASES_DB);
        const randomDisease = diseaseNames[Math.floor(Math.random() * diseaseNames.length)];
        if (!gameState.ailments) gameState.ailments = [];
        if (!gameState.ailments.includes(randomDisease)) {
            gameState.ailments.push(randomDisease);
            logs.push(`⚠️ Dấu hiệu bất thường: Cơ thể xuất hiện triệu chứng của bệnh ${randomDisease}!`);
        }
    }

    if (gameState.ailments && gameState.ailments.length > 0) {
        let diseaseDamage = 0;
        gameState.ailments.forEach(disease => {
            if (DISEASES_DB[disease]) {
                diseaseDamage += Math.round(DISEASES_DB[disease].drain * 0.5);
            }
        });
        finalDrain += diseaseDamage;
        logs.push(`Bệnh tật tàn phá cơ thể (-${diseaseDamage} Sức khỏe)`);
    }

    // 6. Lão hóa (Tuổi già > 60t)
    const age = gameState.age ?? 16;
    if (age > 60) {
        const agePenalty = Math.floor((age - 60) * 0.5);
        finalDrain += agePenalty;
        logs.push(`Dấu hiệu tuổi già (-${agePenalty} Sức khỏe)`);
    }

    // 💥 Thực thi trừ sức khỏe an toàn
    modifyStat('health', -finalDrain);

    if (logs.length > 0 && typeof addDailyLog === 'function') {
        addDailyLog(`🩺 Thể trạng tháng này: -${finalDrain} Sức khỏe. (${logs.join(', ')})`);
    }
}

/**
 * Xử lý trừ tiền gói đăng ký tháng Gym/Yoga & Reset cờ y tế đầu tháng
 */
function processMonthlySubscriptions() {
    if (!gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    // 🚀 RESET SẠCH 2 CỜ Y TẾ KHI BƯỚC SANG THÁNG MỚI
    gameState.hasCheckupThisMonth = false;
    gameState.hasTreatedThisMonth = false;
    // 1. Gói Gym (60$/tháng)
    if (gameState.subscriptions.gym) {
        if ((gameState.money || 0) >= 60) {
            gameState.money -= 60;
            gameState.stress = Math.max(0, (gameState.stress || 0) - 25);
            gameState.strength = Math.min(100, (gameState.strength || 0) + 5);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Gói tháng: Thẻ tập Gym", -60);
        } else {
            gameState.subscriptions.gym = false;
        }
    }

    // 2. Gói Yoga (40$/tháng)
    if (gameState.subscriptions.yoga) {
        if ((gameState.money || 0) >= 40) {
            gameState.money -= 40;
            gameState.stress = Math.max(0, (gameState.stress || 0) - 35);
            gameState.looks = Math.min(100, (gameState.looks || 0) + 3);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Gói tháng: Lớp Yoga", -40);
        } else {
            gameState.subscriptions.yoga = false;
        }
    }
}

/**
 * Xử lý logic Y tế mới: Khám bệnh độc lập, dùng thuốc/nhập viện khóa chung nhau
 */
function handleMedicalCare(type) {
    if (!gameState) return;

    // Khởi tạo cờ nếu save cũ chưa có
    if (typeof gameState.hasCheckupThisMonth === 'undefined') gameState.hasCheckupThisMonth = false;
    if (typeof gameState.hasTreatedThisMonth === 'undefined') gameState.hasTreatedThisMonth = false;

    if (type === 'checkup') {
        if (gameState.hasCheckupThisMonth) {
            return alert("⏳ Tháng này bạn đã khám sức khỏe định kỳ rồi! Hãy chờ sang tháng sau.");
        }
        if ((gameState.money ?? 0) < 50) return alert("❌ Bạn không đủ 50 $!");

        modifyStat('money', -50);
        gameState.hasCheckupThisMonth = true;

        const ailments = gameState.ailments || [];
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Khám sức khỏe định kỳ", -50);

        if (ailments.length === 0) {
            alert("🩺 KẾT QUẢ KHÁM: Thể trạng hoàn toàn khỏe mạnh, không phát hiện bệnh lý ẩn!");
        } else {
            alert(`🔍 KẾT QUẢ KHÁM: Phát hiện cơ thể bạn đang mắc ${ailments.length} bệnh:\n- ${ailments.join('\n- ')}\n\nHãy nhập viện điều trị sớm!`);
        }

    } else {
        // Dịch vụ điều trị (Mua thuốc hoặc Nhập viện chung một hạn mức trong tháng)
        if (gameState.hasTreatedThisMonth) {
            return alert("⏳ Tháng này bạn đã sử dụng dịch vụ điều trị (Thuốc/Nhập viện) rồi! Chỉ được chọn 1 trong 2 mỗi tháng.");
        }

        if (type === 'pharmacy') {
            if ((gameState.money ?? 0) < 30) return alert("❌ Bạn không đủ 30 $!");
            modifyStat('money', -30);
            gameState.hasTreatedThisMonth = true; // Khóa cả 2 nút điều trị
            modifyStat('health', 10);

            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Mua thuốc tây", -30);
            alert("💊 Đã uống thuốc tây (+10 Sức khỏe). Bệnh nhẹ đã thuyên giảm đôi chút!");

        } else if (type === 'hospital') {
            if ((gameState.money ?? 0) < 200) return alert("❌ Bạn không đủ 200 $!");
            modifyStat('money', -200);
            gameState.hasTreatedThisMonth = true; // Khóa cả 2 nút điều trị
            modifyStat('health', 25);

            if (gameState.ailments && gameState.ailments.length > 0) {
                const cured = gameState.ailments.pop();
                alert(`🏥 Bệnh viện đã chữa khỏi triệt để bệnh: ${cured}! (+25 Sức khỏe)`);
            } else {
                alert("🏥 Đã truyền nước và điều trị chuyên sâu (+25 Sức khỏe)!");
            }

            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Nhập viện điều trị", -200);
        }
    }
    // 🚀 BỔ SUNG DÒNG NÀY
    if (typeof renderGameState === 'function') renderGameState();

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderHealthView === 'function') renderHealthView();
}


/**
 * Chuyển sang tháng tiếp theo và tính toán toàn bộ chi phí / thu nhập / sức khỏe
 */
function nextMonth() {
    if (typeof gameState === 'undefined' || !gameState) return;

    // 🚀 RESET SẠCH CỜ Y TẾ MỖI KHI SANG THÁNG MỚI
    gameState.hasCheckupThisMonth = false;
    gameState.hasTreatedThisMonth = false;

    const startMoney = gameState.money || 0;
    const startHealth = gameState.health || 100;
    const startHunger = gameState.hunger || 80;
    const startHappiness = gameState.happiness || 70;

    const currentMonthNum = gameState.month || 1;

    // 1. Tăng tháng & tuổi
    gameState.month = currentMonthNum + 1;
    if (gameState.month % 12 === 0) {
        gameState.age = (gameState.age || 16) + 1;
        if (typeof addMilestoneLog === 'function') addMilestoneLog(`Tròn ${gameState.age} tuổi.`);
    }

    // 2. Tính toán tài chính trong tháng (Thu & Chi)
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // A. Thu nhập từ công việc
    if (gameState.job) {
        let baseSalary = gameState.job.salary || 0;
        let bonusSalary = typeof calculateSecondaryStatsJobBonus === 'function' ? calculateSecondaryStatsJobBonus(gameState.job) : 0;
        let totalJobIncome = baseSalary + bonusSalary;
        
        monthlyIncome += totalJobIncome;

        // Ghi lại lịch sử giao dịch nhận lương
        if (typeof addTransactionHistory === 'function') {
            let desc = `Lương tháng: ${gameState.job.title}`;
            if (bonusSalary > 0) desc += ` (Thưởng năng suất: +${bonusSalary}$)`;
            addTransactionHistory(desc, totalJobIncome);
        }

        // Tăng kinh nghiệm làm việc lên 1 tháng
        gameState.job.monthsExperience = (gameState.job.monthsExperience || 0) + 1;
    }

    // B. Chi phí học phí
    if (gameState.currentEducation) {
        const tuition = gameState.currentEducation.tuitionPerMonth || 0;
        if (tuition > 0) {
            monthlyExpense += tuition;
            if (typeof addTransactionHistory === 'function') addTransactionHistory(`Học phí: ${gameState.currentEducation.name}`, -tuition);
        }
    }

    // C. Chi phí tiền nhà trọ
    if (gameState.currentHome && gameState.currentHome.type === 'rented') {
        const rentCost = gameState.currentHome.monthlyCost || 0;
        if (rentCost > 0) {
            monthlyExpense += rentCost;
            if (typeof addTransactionHistory === 'function') addTransactionHistory(`Tiền thuê nhà: ${gameState.currentHome.name}`, -rentCost);
        }
    }

    // D. Chi phí sinh hoạt cơ bản
    const baseLivingCost = 50;
    monthlyExpense += baseLivingCost;
    if (typeof addTransactionHistory === 'function') addTransactionHistory("Chi phí sinh hoạt cơ bản", -baseLivingCost);

    // 🌟 THỰC THI THAY ĐỔI TIỀN TRONG VÍ MỘT LẦN DUY NHẤT (Tránh lỗi cộng trừ nhiều lần lẻ tẻ)
    let netFinancialChange = monthlyIncome - monthlyExpense;
    modifyStat('money', netFinancialChange);

    // 3. Thực thi logic chuyên biệt hàng tháng từ các module
    if (typeof processMonthlyEducation === 'function') processMonthlyEducation();
    if (typeof processMonthlyJob === 'function') processMonthlyJob();
    if (typeof checkHousingEvents === 'function') checkHousingEvents();
    if (typeof processMonthlyStockMarket === 'function') processMonthlyStockMarket(); 
    processMonthlySubscriptions();

    // 4. CƠ CHẾ SINH TỒN & SỨC KHỎE TẬP TRUNG
    modifyStat('hunger', -20); // Dinh dưỡng tự nhiên trừ 20%/tháng
    processMonthlyHealthSystem();

    // 4.5. Xử lý Sinh - Tử & Buộc Nhập Viện
    const currentHealth = gameState.health ?? 100;

    if (currentHealth <= 0) {
        gameState.health = 0;
        if (typeof triggerGameOver === 'function') {
            triggerGameOver("Sức khỏe cạn kiệt, cơ thể không thể chịu đựng thêm. Cuộc đời của nhân vật đã chính thức khép lại.");
        }
        return;

    } else if (currentHealth < 20) {
        const hospitalBill = 500;
        const currentMoney = gameState.money ?? 0;

        gameState.health = 40;
        gameState.ailments = [];

        if (currentMoney >= hospitalBill) {
            modifyStat('money', -hospitalBill);
            monthlyExpense += hospitalBill; // Ghi nhận thêm vào chi phí tháng nếu phải cấp cứu
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Viện phí cấp cứu khẩn cấp", -hospitalBill);
            if (typeof addDailyLog === 'function') addDailyLog(`🚨 Nguy kịch! Bị ép nhập viện cấp cứu (-${hospitalBill}$).`);
            alert(`🚨 Sức khỏe rơi xuống mức NGUY KỊCH (<20%)! Bạn buộc phải nhập viện cấp cứu, tốn ${hospitalBill}$ viện phí.`);
        } else {
            const shortfall = hospitalBill - currentMoney;
            monthlyExpense += currentMoney;
            gameState.money = 0;
            modifyStat('debt', shortfall);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Viện phí nợ (Cấp cứu)", -currentMoney);
            if (typeof addDailyLog === 'function') addDailyLog(`🚨 Nguy kịch! Bị ép nhập viện nhưng thiếu tiền, ghi nợ ${shortfall}$.`);
            alert(`🚨 Sức khỏe rơi xuống mức NGUY KỊCH (<20%)! Phần viện phí thiếu được ghi vào sổ nợ (+${shortfall}$ nợ mới)!`);
        }
    }

    // 5. Tích lũy tài chính trọn đời
    gameState.totalLifetimeIncome = (gameState.totalLifetimeIncome || 0) + monthlyIncome;
    gameState.totalLifetimeExpense = (gameState.totalLifetimeExpense || 0) + monthlyExpense;

    // Lưu trạng thái & Render lại toàn bộ UI
    if (typeof saveGameState === 'function') saveGameState();
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

    // 🚀 Kiểm tra dọn dẹp quan hệ không tương tác sau 3 tháng (Level 0)
    if (gameState.relationships) {
        gameState.relationships = gameState.relationships.filter(npc => {
            if (typeof npc.level === 'undefined') npc.level = 0;
            if (npc.level === 0) {
                npc.inactiveMonths = (npc.inactiveMonths || 0) + 1;
                if (npc.inactiveMonths >= 3) {
                    if (!gameState.relationshipLogs) gameState.relationshipLogs = [];
                    gameState.relationshipLogs.unshift({
                        month: gameState.month,
                        age: gameState.age,
                        text: `${npc.name} (${npc.relation}) đã rời đi vì không có tương tác trong 3 tháng qua.`
                    });
                    return false;
                }
            }
            return true;
        });
    }
    updateProfileCard();
}
/**
 * =================================================================
 * ZONE 4: WEB WORKER CALENDAR TIMER & SPEED CONTROLLER
 * =================================================================
 */

let gameTimerWorker = null;
let lastWorkerTickTime = Date.now();
let workerWatchdogTimer = null;

const TOTAL_DAYS_IN_MONTH = 30;
const BASE_SECONDS_PER_MONTH = 60; // Mặc định 60 giây / tháng (2 giây / ngày ở x1)

// 🚀 Biến trạng thái tốc độ hiện tại (1 = x1, 2 = x2, 3 = x3)
let currentCalendarSpeed = 1;

/**
 * Tính toán khoảng thời gian tick (ms) dựa trên tốc độ hiện tại
 */
function getTickInterval() {
    const baseInterval = (BASE_SECONDS_PER_MONTH / TOTAL_DAYS_IN_MONTH) * 1000; // 2000ms cho x1
    return baseInterval / currentCalendarSpeed; // x2 = 1000ms, x3 ≈ 667ms
}

/**
 * 🚀 Chuyển đổi tốc độ qua ngày khi bấm nút (x1 -> x2 -> x3 -> x1)
 */
function toggleCalendarSpeed() {
    currentCalendarSpeed = currentCalendarSpeed >= 3 ? 1 : currentCalendarSpeed + 1;

    // Cập nhật nhãn hiển thị trên nút bấm
    const speedBtn = document.getElementById("calendar-speed-btn");
    if (speedBtn) {
        speedBtn.innerText = `⚡ x${currentCalendarSpeed}`;
    }

    // Khởi động lại bộ đếm ngay lập tức với tốc độ mới để áp dụng liền tay
    if (gameState && gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
        startMonthCalendarTimer();
    }

    if (typeof showToast === 'function') {
        showToast(`Đã đẩy nhanh tốc độ thời gian lên x${currentCalendarSpeed}!`, "⚡", "Tốc Độ Ngày");
    }
}

function startMonthCalendarTimer() {
    if (!gameState) return;
    if (typeof gameState.currentDay === 'undefined') gameState.currentDay = 1;

    stopMonthCalendarTimer();
    lastWorkerTickTime = Date.now();
    if (typeof updateCalendarUI === 'function') updateCalendarUI();

    const tickInterval = getTickInterval();

    if (window.Worker) {
        try {
            gameTimerWorker = new Worker('timer-worker.js');

            gameTimerWorker.onmessage = function (e) {
                if (e.data.type === 'tick') {
                    lastWorkerTickTime = Date.now();
                    handleTimerTick();
                }
            };

            gameTimerWorker.postMessage({ cmd: 'start', interval: tickInterval });
            console.log(`⚡ Web Worker Timer đã kích hoạt với tốc độ x${currentCalendarSpeed}!`);

            workerWatchdogTimer = setInterval(() => {
                if (gameState && gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
                    const timeSinceLastTick = Date.now() - lastWorkerTickTime;
                    if (timeSinceLastTick > (tickInterval * 2.5)) {
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

function handleTimerTick() {
    if (!gameState) return;

    if (gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
        gameState.currentDay += 1;
        if (typeof updateCalendarUI === 'function') updateCalendarUI();

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

let fallbackTimer = null;

function startFallbackTimer() {
    if (fallbackTimer) clearInterval(fallbackTimer);
    const tickInterval = getTickInterval();
    fallbackTimer = setInterval(handleTimerTick, tickInterval);
}


/**
 * =================================================================
 * ZONE 5: HOUSING MARKET & PROPERTY LOGIC
 * =================================================================
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
 * ZONE 6: HEALTH, FITNESS & MEDICAL VIEW HANDLERS (SỨC KHỎE & Y TẾ NEW)
 * =================================================================
 */

function renderHealthView() {
    if (!gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    setElementText('health-view-money', (gameState.money ?? 0).toLocaleString());

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

    // Nút Đăng ký tháng Gym / Yoga
    const gymBtn = document.getElementById("btn-sub-gym");
    if (gymBtn) {
        gymBtn.innerText = gameState.subscriptions.gym ? "Đã Đăng Ký (Hủy)" : "Đăng ký (60$/T)";
        gymBtn.className = gameState.subscriptions.gym ?
            "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm" :
            "py-1.5 px-3 bg-teal-600 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm";
    }

    const yogaBtn = document.getElementById("btn-sub-yoga");
    if (yogaBtn) {
        yogaBtn.innerText = gameState.subscriptions.yoga ? "Đã Đăng Ký (Hủy)" : "Đăng ký (40$/T)";
        yogaBtn.className = gameState.subscriptions.yoga ?
            "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm" :
            "py-1.5 px-3 bg-teal-600 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm";
    }

    // Cờ Giới hạn Y tế
    const checkBadge = document.getElementById("health-check-badge");
    if (checkBadge) {
        if (gameState.hasCheckedHealthThisMonth) {
            checkBadge.innerText = "Đã sử dụng tháng này";
            checkBadge.className = "text-[9px] font-bold text-rose-900 bg-rose-200 px-2 py-0.5 rounded-md";
        } else {
            checkBadge.innerText = "Chưa sử dụng";
            checkBadge.className = "text-[9px] font-bold text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-md";
        }
    }

    // Khung Chẩn Đoán Thông Minh
    const advisoryEl = document.getElementById("health-advisory-box");
    if (advisoryEl) {
        let adviceText = "🟢 Thể trạng bình thường. Hãy duy trì lối sống điều độ!";
        let adviceBg = "bg-emerald-100/80 border-emerald-300 text-emerald-950";

        if (hungerVal < 30) {
            adviceText = "⚠️ Đói khát! Hãy ăn uống ngay để tránh tổn hại sức khỏe khi sang tháng.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950 animate-pulse";
        } else if (stressVal >= 60) {
            adviceText = "🧠 Căng thẳng cao! Nên tập Thiền hoặc đăng ký Gym/Yoga để giải tỏa.";
            adviceBg = "bg-amber-100/80 border-amber-300 text-amber-950 animate-pulse";
        } else if (healthVal < 50) {
            adviceText = "🩺 Sức khỏe báo động! Hãy đi khám hoặc mua thuốc tây điều trị.";
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
            statusEl.innerText = `🔴 Bệnh mắc phải: ${ailments.length} bệnh`;
        }
    }
}

/**
 * Xử lý hành động ăn uống (Fastfood, Bình dân, Healthy)
 */
function handleEatMeal(type) {
    if (!gameState) return;

    if (type === 'fastfood') {
        if ((gameState.money ?? 0) < 10) return alert("❌ Bạn không đủ 10 $!");
        modifyStat('money', -10);
        modifyStat('hunger', 20);
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Bánh mì / Đồ ăn nhanh", -10);
        alert("🥪 Đã ăn bánh mì (+20 Dinh dưỡng)!");

    } else if (type === 'normal') {
        if ((gameState.money ?? 0) < 25) return alert("❌ Bạn không đủ 25 $!");
        modifyStat('money', -25);
        modifyStat('hunger', 45);
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Cơm phần bình dân", -25);
        alert("🍜 Đã ăn cơm phần (+45 Dinh dưỡng)!");

    } else if (type === 'healthy') {
        if ((gameState.money ?? 0) < 60) return alert("❌ Bạn không đủ 60 $!");
        modifyStat('money', -60);
        modifyStat('hunger', 70);
        modifyStat('stress', -5);

        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Bữa ăn Dinh dưỡng", -60);
        alert("🥗 Bữa ăn dinh dưỡng ngon miệng (+70 Dinh dưỡng, -5 Stress)!");
    }

    if (typeof saveGameState === 'function') saveGameState();

    // 🚀 BỔ SUNG DÒNG NÀY ĐỂ RENDER LẠI MÀN HÌNH CHÍNH
    if (typeof renderGameState === 'function') renderGameState();

    renderHealthView();
}




function toggleSubscription(type) {
    if (!gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    if (type === 'gym') {
        gameState.subscriptions.gym = !gameState.subscriptions.gym;
        alert(gameState.subscriptions.gym ? "🏋️ Đã bật đăng ký Gym (60$/tháng)!" : "🚪 Đã hủy gói tập Gym.");
    } else if (type === 'yoga') {
        gameState.subscriptions.yoga = !gameState.subscriptions.yoga;
        alert(gameState.subscriptions.yoga ? "🧘 Đã bật đăng ký Yoga (40$/tháng)!" : "🚪 Đã hủy gói tập Yoga.");
    }

    if (typeof saveGameState === 'function') saveGameState();

    // 🚀 BỔ SUNG DÒNG NÀY
    if (typeof renderGameState === 'function') renderGameState();

    renderHealthView();
}



function handleFitness(type) {
    if (!gameState) return;

    if (type === 'meditation') {
        modifyStat('stress', -15);
        modifyStat('happiness', 2);
        alert("🧘 Thiền định tĩnh lặng (-15 Stress, +2 Hạnh phúc)!");
        if (typeof addDailyLog === 'function') addDailyLog("Dành thời gian thiền định giải tỏa tâm trí.");
    }

    if (typeof saveGameState === 'function') saveGameState();

    // 🚀 BỔ SUNG DÒNG NÀY
    if (typeof renderGameState === 'function') renderGameState();

    renderHealthView();
}

/**
 * =================================================================
 * ZONE 7: GAME LOGS & MILESTONES (NHẬT KÝ & CỘT MỐC)
 * =================================================================
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

function addDailyLog(text) {
    if (!gameState) return;
    if (!gameState.dailyLogs) gameState.dailyLogs = [];
    gameState.dailyLogs.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: text
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
 * GAME OVER & INTERACTION SYSTEM (TƯƠNG TÁC NPC & GAME OVER)
 * =================================================================
 */

function triggerGameOver(reason) {
    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    const modal = document.getElementById("game-over-modal");
    if (!modal) {
        alert("Game Over: " + reason);
        if (typeof resetCharacter === 'function') resetCharacter();
        return;
    }

    setElementText('game-over-reason', reason);
    setElementText('go-final-age', `${gameState.age || 16} tuổi`);
    setElementText('go-final-month', `Tháng ${gameState.month || 1}`);
    setElementText('go-final-money', `${(gameState.money || 0).toLocaleString()} $`);
    setElementText('go-final-debt', `${(gameState.debt || 0).toLocaleString()} $`);

    modal.classList.remove("hidden");
}

function handleRestartFromGameOver() {
    const modal = document.getElementById("game-over-modal");
    if (modal) modal.classList.add("hidden");

    if (typeof resetCharacter === 'function') {
        resetCharacter();
    }
}

function handleHangoutWithNPC(npcId) {
    if (!gameState || (gameState.money || 0) < 30) {
        return alert("❌ Bạn không đủ 30$ để rủ rê người khác đi ăn uống!");
    }

    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    gameState.money -= 30;
    gameState.stress = Math.max(0, (gameState.stress || 0) - 15);

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

function handleAskForMoney(npcId) {
    if (!gameState) return;

    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    if (npc.id !== 'father' && npc.id !== 'mother') {
        return alert(`❌ Chà, bạn không thể xin tiền ${npc.name} được đâu. Mất mặt lắm!`);
    }

    const currentLevel = npc.level || 0;
    if (currentLevel < 0) {
        return alert(`🤬 ${npc.name} đang giận bạn! Còn khuya mới cho tiền nhé. Hãy làm lành trước đi!`);
    }

    if (!npc.intrinsic_stats) {
        npc.intrinsic_stats = { happiness: 70, wealth: 50, generosity: 50 };
    }

    const wealth = npc.intrinsic_stats.wealth;
    const generosity = npc.intrinsic_stats.generosity;

    const chance = generosity / 100;
    const isSuccess = Math.random() < chance;

    if (isSuccess && wealth > 10) {
        const giveAmount = Math.floor(wealth * (0.1 + Math.random() * 0.3));

        npc.intrinsic_stats.wealth -= giveAmount;
        gameState.money = (gameState.money || 0) + giveAmount;

        if (typeof interactWithNPC === 'function') interactWithNPC(npcId, {}, -5);

        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory(`💸 Xin tiền ${npc.name}`, giveAmount);
        }

        alert(`🥰 ${npc.name} đã thở dài và cho bạn ${giveAmount}$ tiêu vặt.\n(Lưu ý: Xin tiền nhiều sẽ làm giảm nhẹ điểm thiện cảm nhé!)`);
    } else {
        if (typeof interactWithNPC === 'function') interactWithNPC(npcId, {}, -15);
        alert(`😤 ${npc.name} từ chối thẳng thừng: "Tiêu pha cho lắm vào rồi giờ ngửa tay xin à? Không có đồng nào đâu!"\n(-15 điểm thiện cảm)`);
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

function interactWithNPC(npcId, options = {}, xpChange = 0) {
    if (!gameState || !gameState.relationships) return;
    // Reset bộ đếm 3 tháng không tương tác vì người chơi vừa tương tác

    let npc = gameState.relationships.find(r => r.id === npcId);

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

    if (typeof npc.xp === 'undefined') npc.xp = 0;
    if (typeof npc.level === 'undefined') npc.level = 0;

    npc.xp += xpChange;
    npc.inactiveMonths = 0;
    if (npc.xp >= 100) {
        const levelUp = Math.floor(npc.xp / 100);
        npc.level += levelUp;
        npc.xp = npc.xp % 100;

        if (typeof showFloatingText === 'function') {
            showFloatingText('relation', `❤️ Mối quan hệ với ${npc.name} tăng cấp!`, 'pos');
        }
    } else if (npc.xp < 0) {
        if (npc.level > -3) {
            npc.level -= 1;
            npc.xp = 100 + npc.xp;

            if (typeof showFloatingText === 'function') {
                showFloatingText('relation', `💔 Mối quan hệ với ${npc.name} giảm cấp!`, 'neg');
            }
        } else {
            npc.xp = 0;
        }
    }

    // 🚀 Ghi nhận Log biến động quan hệ
    if (!gameState.relationshipLogs) gameState.relationshipLogs = [];
    const changeSymbol = xpChange >= 0 ? `+${xpChange}` : `${xpChange}`;
    gameState.relationshipLogs.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: `Tương tác với ${npc.name}: ${changeSymbol} XP (Cấp hiện tại: Lvl ${npc.level})`
    });

    if (typeof showFloatingText === 'function') {
        const sign = xpChange > 0 ? '+' : '';
        const type = xpChange > 0 ? 'pos' : 'neg';
        showFloatingText('relation', `${npc.name}: ${sign}${xpChange} XP`, type);
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

// 🚀 ÉP GÁN HÀM VÀO WINDOW ĐỂ NÚT HTML ONCLICK LÚC NÀO CŨNG BẤM ĐƯỢC
if (typeof window !== 'undefined') {
    window.toggleSubscription = toggleSubscription;
    window.handleEatMeal = handleEatMeal;
    window.handleFitness = handleFitness;
    window.handleMedicalCare = handleMedicalCare;
    window.renderHealthView = renderHealthView;
}

// =================================================================
// ZONE 8: HỆ THỐNG CHỈ SỐ PHỤ 2.0 (DECAY, EGO STRESS & BONUS TIP)
// =================================================================

/**
 * 1. Tự động tính toán suy hao & biến động chỉ số phụ hàng tháng
 */
function processSecondaryStatsMonthly() {
    if (typeof gameState === 'undefined' || !gameState) return;
    const age = gameState.age || 16;

    // A. Suy hao Sức mạnh (strength) & Ngoại hình (looks) theo tuổi
    if (age > 35) gameState.strength = Math.max(10, (gameState.strength || 50) - 0.5);
    if (age > 50) gameState.strength = Math.max(10, (gameState.strength || 50) - 0.5); // Giảm thêm khi > 50 tuổi
    if (age > 30) gameState.looks = Math.max(10, (gameState.looks || 50) - 0.5);

    // B. Xuống sắc do Stress quá cao (>80)
    if (gameState.stress > 80) {
        gameState.looks = Math.max(10, (gameState.looks || 50) - 1);
    }

    // C. Tác động của Cái tôi (ego) cao khi làm việc Part-time / Lao động Level 1
    const currentJob = typeof getCurrentJobObject === 'function' ? getCurrentJobObject() : null;
    if (currentJob && currentJob.is_part_time && (gameState.ego || 50) > 60) {
        // Cái tôi cao (>60) mà làm việc vặt -> Bất mãn, tăng thêm Stress hàng tháng
        gameState.stress = Math.min(100, (gameState.stress || 0) + 5);
    }
}

/**
 * 2. Tính tiền Tip / Thưởng năng suất dựa trên Ngoại hình & Sức mạnh
 */
function calculateSecondaryStatsJobBonus(job) {
    if (!job || typeof gameState === 'undefined' || !gameState) return 0;
    let bonus = 0;

    // Nghề Dịch vụ / F&B / Beauty: Ngoại hình càng cao nhận Tip càng nhiều (tối đa +20% lương)
    if (['manual_fnb', 'creative_beauty'].includes(job.track_id)) {
        const looksRatio = (gameState.looks || 50) / 100;
        bonus += Math.floor(looksRatio * (job.salary_per_month * 0.20));
    }

    // Nghề Xây dựng / Vận tải: Sức mạnh cao thưởng năng suất (tối đa +15% lương)
    if (['construction', 'logistics_driver'].includes(job.track_id)) {
        const strengthRatio = (gameState.strength || 50) / 100;
        bonus += Math.floor(strengthRatio * (job.salary_per_month * 0.15));
    }

    return bonus;
}

/**
 * 3. Tương tác Rèn Luyện Bản Thân (Tập Gym, Spa, Đọc sách, Tiệc tùng)
 */
function doSelfImprovementAction(type) {
    if (typeof gameState === 'undefined' || !gameState) return;

    // Quy đổi chi phí tập luyện trực tiếp vào Tiền ($) và Sức khỏe (%)
    const actions = {
        gym: {
            name: 'Tập Gym / Thể Thao',
            cost: 20,
            health_cost: 5, // Tốn 5% Sức khỏe để tập
            stats: { strength: 2, health: 3, stress: -5 } // Tập xong phục hồi thể chất, giảm stress
        },
        spa: {
            name: 'Đi Spa / Skincare',
            cost: 50,
            health_cost: 0,
            stats: { looks: 3, stress: -15 }
        },
        reading: {
            name: 'Đọc Sách Kỹ Năng',
            cost: 15,
            health_cost: 2,
            stats: { charm: 1.5, smarts: 1, stress: -2 }
        },
        party: {
            name: 'Tiệc Tùng / Giao Lưu',
            cost: 100,
            health_cost: 8, // Thức khuya tốn sức khỏe
            stats: { ego: 4, happiness: 5 }
        }
    };

    const act = actions[type];
    if (!act) return;

    // 1. Kiểm tra Tiền
    if ((gameState.money || 0) < act.cost) {
        if (typeof showToast === 'function') showToast(`⚠️ Bạn không đủ $${act.cost} để ${act.name}!`, 'error');
        return;
    }

    // 2. Kiểm tra Sức khỏe hiện tại (phải > health_cost mới được làm)
    if (act.health_cost > 0 && (gameState.health || 0) <= act.health_cost) {
        if (typeof showToast === 'function') showToast(`⚠️ Sức khỏe quá yếu (cần >${act.health_cost}% SK) để ${act.name}!`, 'error');
        return;
    }

    // Trừ chi phí
    gameState.money -= act.cost;
    if (act.health_cost > 0) gameState.health -= act.health_cost;

    // Cập nhật các chỉ số
    if (act.stats.strength) gameState.strength = Math.min(100, (gameState.strength || 50) + act.stats.strength);
    if (act.stats.looks) gameState.looks = Math.min(100, (gameState.looks || 50) + act.stats.looks);
    if (act.stats.charm) gameState.charm = Math.min(100, (gameState.charm || 50) + act.stats.charm);
    if (act.stats.ego) gameState.ego = Math.min(100, (gameState.ego || 50) + act.stats.ego);
    if (act.stats.smarts) gameState.smarts = Math.min(100, (gameState.smarts || 50) + act.stats.smarts);
    if (act.stats.health) gameState.health = Math.min(100, (gameState.health || 0) + act.stats.health);
    if (act.stats.happiness) gameState.happiness = Math.min(100, (gameState.happiness || 50) + act.stats.happiness);
    if (act.stats.stress) gameState.stress = Math.max(0, (gameState.stress || 0) + act.stats.stress);

    // Thông báo & Render lại UI
    if (typeof showToast === 'function') {
        const costText = act.health_cost > 0 ? `-$${act.cost}, -${act.health_cost}% SK` : `-$${act.cost}`;
        showToast(`✨ Đã ${act.name}! (${costText})`, 'success');
    }
    if (typeof updateProfileCard === 'function') {
        updateProfileCard();
    }

=======
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
 * Hàm phụ trợ gán text an toàn cho DOM (Tránh lỗi ReferenceError)
 */
function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

/**
 * Khởi tạo nhân vật mới và thiết lập gameState ban đầu
 * @param {string} name Tên nhân vật
 * @param {string} gender Giới tính ("Nam" | "Nữ" | "Khác")
 */
function createCharacter(name, gender = "Nam") {
    const characterName = name && name.trim() !== "" ? name.trim() : "Kẻ Vô Danh";

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
        currentCity: 'ung_dung',
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

        // Gói đăng ký & Cờ Y tế
        subscriptions: { gym: false, yoga: false },
        hasCheckedHealthThisMonth: false,

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
        // Data chứng khoán ban đầu
        stocks: null,
        portfolio: {},
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

    const zodiacKeys = typeof ZODIAC_DATA !== 'undefined' ? Object.keys(ZODIAC_DATA) : ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

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
            _zodiac: randomZodiac,
            intrinsic_stats: {
                happiness: 70,
                wealth: getFamilyBackground().allowance * 2,
                generosity: Math.floor(Math.random() * 50) + 30
            }
        });
    }

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
            _zodiac: randomZodiac,
            intrinsic_stats: {
                happiness: 80,
                wealth: getFamilyBackground().allowance,
                generosity: Math.floor(Math.random() * 50) + 50
            }
        });
    }
}

function getFamilyBackground() {
    if (!gameState) return { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    if (!gameState.familyBackground) {
        gameState.familyBackground = { type: "normal", label: "🏠 Gia đình bình thường", allowance: 60, contributionChance: 0.3 };
    }
    return gameState.familyBackground;
}

function modifyStat(statKey, amount, maxLimit = 100) {
    if (!gameState) return;

    if (statKey === 'money' || statKey === 'debt') {
        gameState[statKey] = (gameState[statKey] ?? 0) + amount;
        return;
    }

    let current = gameState[statKey];
    if (current === undefined || current === null) {
        if (statKey === 'stress') current = 0;
        else if (statKey === 'hunger') current = 80;
        else if (statKey === 'health') current = 100;
        else current = 50;
    }

    gameState[statKey] = Math.max(0, Math.min(maxLimit, current + amount));
}


/**
 * =================================================================
 * ZONE 2: PERSISTENCE & STORAGE (LƯU & NẠP LOCALSTORAGE/CLOUD)
 * =================================================================
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

function loadGameState() {
    const saved = localStorage.getItem("GIA_TAI_CUA_BAN_GAME_STATE");
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error("❌ Lỗi nạp dữ liệu LocalStorage:", e); }
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
 * ZONE 3: MONTHLY PROGRESSION & LIFECYCLE (TIẾN TRÌNH THÁNG & SINH TỒN)
 * =================================================================
 */

/**
 * 🚀 HEALTH ENGINE 2.0: Tính toán biến động Sức khỏe hàng tháng tập trung & chuẩn xác
 */
function processMonthlyHealthSystem() {
    if (!gameState) return;

    let baseDrain = 0;
    const logs = [];

    // 1. Áp lực thể chất từ Công việc / Học tập cơ bản
    const hasJob = !!gameState.job;
    const hasEdu = !!gameState.currentEducation;

    if (hasJob && gameState.job.stressCost) {
        baseDrain += Math.round(gameState.job.stressCost * 0.3);
    }
    if (hasEdu && gameState.currentEducation.staminaCost) {
        baseDrain += Math.round(gameState.currentEducation.staminaCost * 0.3);
    }

    // 🌟 1.5. CƠ CHẾ PHẠT ÁP LỰC KẾP: VỪA HỌC VỪA LÀM
    if (hasJob && hasEdu) {
        const isFormalEdu = gameState.currentEducation.category === 'formal';

        if (isFormalEdu) {
            const overloadPenalty = 8;
            baseDrain += overloadPenalty;
            logs.push(`Quá tải do vừa học Chính Quy vừa đi làm (-${overloadPenalty} Sức khỏe)`);
        } else {
            const overloadPenalty = 3;
            baseDrain += overloadPenalty;
            logs.push(`Mệt mỏi do vừa học nghề vừa đi làm (-${overloadPenalty} Sức khỏe)`);
        }
    }

    // 2. Dinh dưỡng & Đói khát
    const hunger = gameState.hunger ?? 80;
    if (hunger < 20) {
        baseDrain += 15;
        logs.push("Cơ thể kiệt sức vì đói trầm trọng (-15 Sức khỏe)");
    } else if (hunger < 50) {
        baseDrain += 6;
        logs.push("Thiếu dinh dưỡng nhẹ (-6 Sức khỏe)");
    }

    // 3. Môi trường Nơi ở
    const homeType = gameState.currentHome ? gameState.currentHome.type : 'shared';
    if (homeType === 'homeless') {
        baseDrain += 15;
        logs.push("Sống lang thang xơ xác (-15 Sức khỏe)");
    } else if (homeType === 'rented' && gameState.currentHome.monthlyCost < 200) {
        baseDrain += 3;
    } else if (homeType === 'shared') {
        baseDrain -= 4; // Bố Mẹ chăm sóc: Giảm 4 điểm gánh nặng!
    }

    // 4. BÙ TRỪ: Khả năng chống chịu từ Chỉ số Sức mạnh (Strength)
    const strength = gameState.strength ?? 50;
    const resistance = Math.floor(strength * 0.25); // Strength 50 = Giảm 12 điểm gánh nặng!

    let finalDrain = Math.max(2, baseDrain - resistance); // Tối thiểu chỉ mất 2 điểm sinh hoạt phí/tháng

    // 5. Tác động Bệnh tật (Có tỷ lệ 2% phát bệnh ngẫu nhiên nếu chưa bị bệnh)
    if (Math.random() < 0.02) {
        const diseaseNames = Object.keys(DISEASES_DB);
        const randomDisease = diseaseNames[Math.floor(Math.random() * diseaseNames.length)];
        if (!gameState.ailments) gameState.ailments = [];
        if (!gameState.ailments.includes(randomDisease)) {
            gameState.ailments.push(randomDisease);
            logs.push(`⚠️ Dấu hiệu bất thường: Cơ thể xuất hiện triệu chứng của bệnh ${randomDisease}!`);
        }
    }

    if (gameState.ailments && gameState.ailments.length > 0) {
        let diseaseDamage = 0;
        gameState.ailments.forEach(disease => {
            if (DISEASES_DB[disease]) {
                diseaseDamage += Math.round(DISEASES_DB[disease].drain * 0.5);
            }
        });
        finalDrain += diseaseDamage;
        logs.push(`Bệnh tật tàn phá cơ thể (-${diseaseDamage} Sức khỏe)`);
    }

    // 6. Lão hóa (Tuổi già > 60t)
    const age = gameState.age ?? 16;
    if (age > 60) {
        const agePenalty = Math.floor((age - 60) * 0.5);
        finalDrain += agePenalty;
        logs.push(`Dấu hiệu tuổi già (-${agePenalty} Sức khỏe)`);
    }

    // 💥 Thực thi trừ sức khỏe an toàn
    modifyStat('health', -finalDrain);

    if (logs.length > 0 && typeof addDailyLog === 'function') {
        addDailyLog(`🩺 Thể trạng tháng này: -${finalDrain} Sức khỏe. (${logs.join(', ')})`);
    }
}

/**
 * Xử lý trừ tiền gói đăng ký tháng Gym/Yoga & Reset cờ y tế đầu tháng
 */
function processMonthlySubscriptions() {
    if (!gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    // 🚀 RESET SẠCH 2 CỜ Y TẾ KHI BƯỚC SANG THÁNG MỚI
    gameState.hasCheckupThisMonth = false;
    gameState.hasTreatedThisMonth = false;
    // 1. Gói Gym (60$/tháng)
    if (gameState.subscriptions.gym) {
        if ((gameState.money || 0) >= 60) {
            gameState.money -= 60;
            gameState.stress = Math.max(0, (gameState.stress || 0) - 25);
            gameState.strength = Math.min(100, (gameState.strength || 0) + 5);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Gói tháng: Thẻ tập Gym", -60);
        } else {
            gameState.subscriptions.gym = false;
        }
    }

    // 2. Gói Yoga (40$/tháng)
    if (gameState.subscriptions.yoga) {
        if ((gameState.money || 0) >= 40) {
            gameState.money -= 40;
            gameState.stress = Math.max(0, (gameState.stress || 0) - 35);
            gameState.looks = Math.min(100, (gameState.looks || 0) + 3);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Gói tháng: Lớp Yoga", -40);
        } else {
            gameState.subscriptions.yoga = false;
        }
    }
}

/**
 * Xử lý logic Y tế mới: Khám bệnh độc lập, dùng thuốc/nhập viện khóa chung nhau
 */
function handleMedicalCare(type) {
    if (!gameState) return;

    // Khởi tạo cờ nếu save cũ chưa có
    if (typeof gameState.hasCheckupThisMonth === 'undefined') gameState.hasCheckupThisMonth = false;
    if (typeof gameState.hasTreatedThisMonth === 'undefined') gameState.hasTreatedThisMonth = false;

    if (type === 'checkup') {
        if (gameState.hasCheckupThisMonth) {
            return alert("⏳ Tháng này bạn đã khám sức khỏe định kỳ rồi! Hãy chờ sang tháng sau.");
        }
        if ((gameState.money ?? 0) < 50) return alert("❌ Bạn không đủ 50 $!");

        modifyStat('money', -50);
        gameState.hasCheckupThisMonth = true;

        const ailments = gameState.ailments || [];
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Khám sức khỏe định kỳ", -50);

        if (ailments.length === 0) {
            alert("🩺 KẾT QUẢ KHÁM: Thể trạng hoàn toàn khỏe mạnh, không phát hiện bệnh lý ẩn!");
        } else {
            alert(`🔍 KẾT QUẢ KHÁM: Phát hiện cơ thể bạn đang mắc ${ailments.length} bệnh:\n- ${ailments.join('\n- ')}\n\nHãy nhập viện điều trị sớm!`);
        }

    } else {
        // Dịch vụ điều trị (Mua thuốc hoặc Nhập viện chung một hạn mức trong tháng)
        if (gameState.hasTreatedThisMonth) {
            return alert("⏳ Tháng này bạn đã sử dụng dịch vụ điều trị (Thuốc/Nhập viện) rồi! Chỉ được chọn 1 trong 2 mỗi tháng.");
        }

        if (type === 'pharmacy') {
            if ((gameState.money ?? 0) < 30) return alert("❌ Bạn không đủ 30 $!");
            modifyStat('money', -30);
            gameState.hasTreatedThisMonth = true; // Khóa cả 2 nút điều trị
            modifyStat('health', 10);

            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Mua thuốc tây", -30);
            alert("💊 Đã uống thuốc tây (+10 Sức khỏe). Bệnh nhẹ đã thuyên giảm đôi chút!");

        } else if (type === 'hospital') {
            if ((gameState.money ?? 0) < 200) return alert("❌ Bạn không đủ 200 $!");
            modifyStat('money', -200);
            gameState.hasTreatedThisMonth = true; // Khóa cả 2 nút điều trị
            modifyStat('health', 25);

            if (gameState.ailments && gameState.ailments.length > 0) {
                const cured = gameState.ailments.pop();
                alert(`🏥 Bệnh viện đã chữa khỏi triệt để bệnh: ${cured}! (+25 Sức khỏe)`);
            } else {
                alert("🏥 Đã truyền nước và điều trị chuyên sâu (+25 Sức khỏe)!");
            }

            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Nhập viện điều trị", -200);
        }
    }
    // 🚀 BỔ SUNG DÒNG NÀY
    if (typeof renderGameState === 'function') renderGameState();

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderHealthView === 'function') renderHealthView();
}


/**
 * Chuyển sang tháng tiếp theo và tính toán toàn bộ chi phí / thu nhập / sức khỏe
 */
function nextMonth() {
    if (typeof gameState === 'undefined' || !gameState) return;

    // 🚀 RESET SẠCH CỜ Y TẾ MỖI KHI SANG THÁNG MỚI
    gameState.hasCheckupThisMonth = false;
    gameState.hasTreatedThisMonth = false;



    const startMoney = gameState.money || 0;
    const startHealth = gameState.health || 100;
    const startHunger = gameState.hunger || 80;
    const startHappiness = gameState.happiness || 70;

    const currentMonthNum = gameState.month || 1;

    // 1. Tăng tháng & tuổi
    gameState.month = currentMonthNum + 1;
    if (gameState.month % 12 === 0) {
        gameState.age = (gameState.age || 16) + 1;
        if (typeof addMilestoneLog === 'function') addMilestoneLog(`Tròn ${gameState.age} tuổi.`);
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
    if (typeof processMonthlyStockMarket === 'function') processMonthlyStockMarket(); // 🚀 Tích hợp sàn chứng khoán vào đây
    processMonthlySubscriptions();

    // Trừ tiền gói Gym/Yoga tháng

    // 4. CƠ CHẾ SINH TỒN & SỨC KHỎE TẬP TRUNG
    modifyStat('hunger', -20); // Dinh dưỡng tự nhiên trừ 20%/tháng

    // 🚀 TÍNH TOÁN SỨC KHỎE TẬP TRUNG
    processMonthlyHealthSystem();

    // 4.5. Xử lý Sinh - Tử & Buộc Nhập Viện
    const currentHealth = gameState.health ?? 100;

    if (currentHealth <= 0) {
        gameState.health = 0;
        if (typeof triggerGameOver === 'function') {
            triggerGameOver("Sức khỏe cạn kiệt, cơ thể không thể chịu đựng thêm. Cuộc đời của nhân vật đã chính thức khép lại.");
        }
        return;

    } else if (currentHealth < 20) {
        const hospitalBill = 500;
        const currentMoney = gameState.money ?? 0;

        gameState.health = 40;
        gameState.ailments = [];

        if (currentMoney >= hospitalBill) {
            modifyStat('money', -hospitalBill);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Y tế: Viện phí cấp cứu khẩn cấp", -hospitalBill);
            if (typeof addDailyLog === 'function') addDailyLog(`🚨 Nguy kịch! Bị ép nhập viện cấp cứu (-${hospitalBill}$).`);
            alert(`🚨 Sức khỏe rơi xuống mức NGUY KỊCH (<20%)! Bạn buộc phải nhập viện cấp cứu, tốn ${hospitalBill}$ viện phí. Bệnh viện đã chữa khỏi các bệnh tật hiện tại.`);
        } else {
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
    if (typeof saveGameState === 'function') saveGameState();
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
    // 🚀 Kiểm tra dọn dẹp quan hệ không tương tác sau 3 tháng (Level 0)
    if (gameState.relationships) {
        gameState.relationships = gameState.relationships.filter(npc => {
            if (typeof npc.level === 'undefined') npc.level = 0;
            if (npc.level === 0) {
                npc.inactiveMonths = (npc.inactiveMonths || 0) + 1;
                if (npc.inactiveMonths >= 3) {
                    if (!gameState.relationshipLogs) gameState.relationshipLogs = [];
                    gameState.relationshipLogs.unshift({
                        month: gameState.month,
                        age: gameState.age,
                        text: `${npc.name} (${npc.relation}) đã rời đi vì không có tương tác trong 3 tháng qua.`
                    });
                    return false; // Xóa khỏi danh sách
                }
            }
            return true;
        });
    }
    updateProfileCard();

}
/**
 * =================================================================
 * ZONE 4: WEB WORKER CALENDAR TIMER & SPEED CONTROLLER
 * =================================================================
 */

let gameTimerWorker = null;
let lastWorkerTickTime = Date.now();
let workerWatchdogTimer = null;

const TOTAL_DAYS_IN_MONTH = 30;
const BASE_SECONDS_PER_MONTH = 60; // Mặc định 60 giây / tháng (2 giây / ngày ở x1)

// 🚀 Biến trạng thái tốc độ hiện tại (1 = x1, 2 = x2, 3 = x3)
let currentCalendarSpeed = 1;

/**
 * Tính toán khoảng thời gian tick (ms) dựa trên tốc độ hiện tại
 */
function getTickInterval() {
    const baseInterval = (BASE_SECONDS_PER_MONTH / TOTAL_DAYS_IN_MONTH) * 1000; // 2000ms cho x1
    return baseInterval / currentCalendarSpeed; // x2 = 1000ms, x3 ≈ 667ms
}

/**
 * 🚀 Chuyển đổi tốc độ qua ngày khi bấm nút (x1 -> x2 -> x3 -> x1)
 */
function toggleCalendarSpeed() {
    currentCalendarSpeed = currentCalendarSpeed >= 3 ? 1 : currentCalendarSpeed + 1;

    // Cập nhật nhãn hiển thị trên nút bấm
    const speedBtn = document.getElementById("calendar-speed-btn");
    if (speedBtn) {
        speedBtn.innerText = `⚡ x${currentCalendarSpeed}`;
    }

    // Khởi động lại bộ đếm ngay lập tức với tốc độ mới để áp dụng liền tay
    if (gameState && gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
        startMonthCalendarTimer();
    }

    if (typeof showToast === 'function') {
        showToast(`Đã đẩy nhanh tốc độ thời gian lên x${currentCalendarSpeed}!`, "⚡", "Tốc Độ Ngày");
    }
}

function startMonthCalendarTimer() {
    if (!gameState) return;
    if (typeof gameState.currentDay === 'undefined') gameState.currentDay = 1;

    stopMonthCalendarTimer();
    lastWorkerTickTime = Date.now();
    if (typeof updateCalendarUI === 'function') updateCalendarUI();

    const tickInterval = getTickInterval();

    if (window.Worker) {
        try {
            gameTimerWorker = new Worker('timer-worker.js');

            gameTimerWorker.onmessage = function (e) {
                if (e.data.type === 'tick') {
                    lastWorkerTickTime = Date.now();
                    handleTimerTick();
                }
            };

            gameTimerWorker.postMessage({ cmd: 'start', interval: tickInterval });
            console.log(`⚡ Web Worker Timer đã kích hoạt với tốc độ x${currentCalendarSpeed}!`);

            workerWatchdogTimer = setInterval(() => {
                if (gameState && gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
                    const timeSinceLastTick = Date.now() - lastWorkerTickTime;
                    if (timeSinceLastTick > (tickInterval * 2.5)) {
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

function handleTimerTick() {
    if (!gameState) return;

    if (gameState.currentDay < TOTAL_DAYS_IN_MONTH) {
        gameState.currentDay += 1;
        if (typeof updateCalendarUI === 'function') updateCalendarUI();

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

let fallbackTimer = null;

function startFallbackTimer() {
    if (fallbackTimer) clearInterval(fallbackTimer);
    const tickInterval = getTickInterval();
    fallbackTimer = setInterval(handleTimerTick, tickInterval);
}


/**
 * =================================================================
 * ZONE 5: HOUSING MARKET & PROPERTY LOGIC
 * =================================================================
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
 * ZONE 6: HEALTH, FITNESS & MEDICAL VIEW HANDLERS (SỨC KHỎE & Y TẾ NEW)
 * =================================================================
 */

function renderHealthView() {
    if (!gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    setElementText('health-view-money', (gameState.money ?? 0).toLocaleString());

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

    // Nút Đăng ký tháng Gym / Yoga
    const gymBtn = document.getElementById("btn-sub-gym");
    if (gymBtn) {
        gymBtn.innerText = gameState.subscriptions.gym ? "Đã Đăng Ký (Hủy)" : "Đăng ký (60$/T)";
        gymBtn.className = gameState.subscriptions.gym ?
            "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm" :
            "py-1.5 px-3 bg-teal-600 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm";
    }

    const yogaBtn = document.getElementById("btn-sub-yoga");
    if (yogaBtn) {
        yogaBtn.innerText = gameState.subscriptions.yoga ? "Đã Đăng Ký (Hủy)" : "Đăng ký (40$/T)";
        yogaBtn.className = gameState.subscriptions.yoga ?
            "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm" :
            "py-1.5 px-3 bg-teal-600 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm";
    }

    // Cờ Giới hạn Y tế
    const checkBadge = document.getElementById("health-check-badge");
    if (checkBadge) {
        if (gameState.hasCheckedHealthThisMonth) {
            checkBadge.innerText = "Đã sử dụng tháng này";
            checkBadge.className = "text-[9px] font-bold text-rose-900 bg-rose-200 px-2 py-0.5 rounded-md";
        } else {
            checkBadge.innerText = "Chưa sử dụng";
            checkBadge.className = "text-[9px] font-bold text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-md";
        }
    }

    // Khung Chẩn Đoán Thông Minh
    const advisoryEl = document.getElementById("health-advisory-box");
    if (advisoryEl) {
        let adviceText = "🟢 Thể trạng bình thường. Hãy duy trì lối sống điều độ!";
        let adviceBg = "bg-emerald-100/80 border-emerald-300 text-emerald-950";

        if (hungerVal < 30) {
            adviceText = "⚠️ Đói khát! Hãy ăn uống ngay để tránh tổn hại sức khỏe khi sang tháng.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950 animate-pulse";
        } else if (stressVal >= 60) {
            adviceText = "🧠 Căng thẳng cao! Nên tập Thiền hoặc đăng ký Gym/Yoga để giải tỏa.";
            adviceBg = "bg-amber-100/80 border-amber-300 text-amber-950 animate-pulse";
        } else if (healthVal < 50) {
            adviceText = "🩺 Sức khỏe báo động! Hãy đi khám hoặc mua thuốc tây điều trị.";
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
            statusEl.innerText = `🔴 Bệnh mắc phải: ${ailments.length} bệnh`;
        }
    }
}

/**
 * Xử lý hành động ăn uống (Fastfood, Bình dân, Healthy)
 */
function handleEatMeal(type) {
    if (!gameState) return;

    if (type === 'fastfood') {
        if ((gameState.money ?? 0) < 10) return alert("❌ Bạn không đủ 10 $!");
        modifyStat('money', -10);
        modifyStat('hunger', 20);
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Bánh mì / Đồ ăn nhanh", -10);
        alert("🥪 Đã ăn bánh mì (+20 Dinh dưỡng)!");

    } else if (type === 'normal') {
        if ((gameState.money ?? 0) < 25) return alert("❌ Bạn không đủ 25 $!");
        modifyStat('money', -25);
        modifyStat('hunger', 45);
        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Cơm phần bình dân", -25);
        alert("🍜 Đã ăn cơm phần (+45 Dinh dưỡng)!");

    } else if (type === 'healthy') {
        if ((gameState.money ?? 0) < 60) return alert("❌ Bạn không đủ 60 $!");
        modifyStat('money', -60);
        modifyStat('hunger', 70);
        modifyStat('stress', -5);

        if (typeof addTransactionHistory === 'function') addTransactionHistory("Ăn uống: Bữa ăn Dinh dưỡng", -60);
        alert("🥗 Bữa ăn dinh dưỡng ngon miệng (+70 Dinh dưỡng, -5 Stress)!");
    }

    if (typeof saveGameState === 'function') saveGameState();

    // 🚀 BỔ SUNG DÒNG NÀY ĐỂ RENDER LẠI MÀN HÌNH CHÍNH
    if (typeof renderGameState === 'function') renderGameState();

    renderHealthView();
}




function toggleSubscription(type) {
    if (!gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    if (type === 'gym') {
        gameState.subscriptions.gym = !gameState.subscriptions.gym;
        alert(gameState.subscriptions.gym ? "🏋️ Đã bật đăng ký Gym (60$/tháng)!" : "🚪 Đã hủy gói tập Gym.");
    } else if (type === 'yoga') {
        gameState.subscriptions.yoga = !gameState.subscriptions.yoga;
        alert(gameState.subscriptions.yoga ? "🧘 Đã bật đăng ký Yoga (40$/tháng)!" : "🚪 Đã hủy gói tập Yoga.");
    }

    if (typeof saveGameState === 'function') saveGameState();

    // 🚀 BỔ SUNG DÒNG NÀY
    if (typeof renderGameState === 'function') renderGameState();

    renderHealthView();
}



function handleFitness(type) {
    if (!gameState) return;

    if (type === 'meditation') {
        modifyStat('stress', -15);
        modifyStat('happiness', 2);
        alert("🧘 Thiền định tĩnh lặng (-15 Stress, +2 Hạnh phúc)!");
        if (typeof addDailyLog === 'function') addDailyLog("Dành thời gian thiền định giải tỏa tâm trí.");
    }

    if (typeof saveGameState === 'function') saveGameState();

    // 🚀 BỔ SUNG DÒNG NÀY
    if (typeof renderGameState === 'function') renderGameState();

    renderHealthView();
}

/**
 * =================================================================
 * ZONE 7: GAME LOGS & MILESTONES (NHẬT KÝ & CỘT MỐC)
 * =================================================================
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

function addDailyLog(text) {
    if (!gameState) return;
    if (!gameState.dailyLogs) gameState.dailyLogs = [];
    gameState.dailyLogs.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: text
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
 * GAME OVER & INTERACTION SYSTEM (TƯƠNG TÁC NPC & GAME OVER)
 * =================================================================
 */

function triggerGameOver(reason) {
    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    const modal = document.getElementById("game-over-modal");
    if (!modal) {
        alert("Game Over: " + reason);
        if (typeof resetCharacter === 'function') resetCharacter();
        return;
    }

    setElementText('game-over-reason', reason);
    setElementText('go-final-age', `${gameState.age || 16} tuổi`);
    setElementText('go-final-month', `Tháng ${gameState.month || 1}`);
    setElementText('go-final-money', `${(gameState.money || 0).toLocaleString()} $`);
    setElementText('go-final-debt', `${(gameState.debt || 0).toLocaleString()} $`);

    modal.classList.remove("hidden");
}

function handleRestartFromGameOver() {
    const modal = document.getElementById("game-over-modal");
    if (modal) modal.classList.add("hidden");

    if (typeof resetCharacter === 'function') {
        resetCharacter();
    }
}

function handleHangoutWithNPC(npcId) {
    if (!gameState || (gameState.money || 0) < 30) {
        return alert("❌ Bạn không đủ 30$ để rủ rê người khác đi ăn uống!");
    }

    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    gameState.money -= 30;
    gameState.stress = Math.max(0, (gameState.stress || 0) - 15);

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

function handleAskForMoney(npcId) {
    if (!gameState) return;

    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    if (npc.id !== 'father' && npc.id !== 'mother') {
        return alert(`❌ Chà, bạn không thể xin tiền ${npc.name} được đâu. Mất mặt lắm!`);
    }

    const currentLevel = npc.level || 0;
    if (currentLevel < 0) {
        return alert(`🤬 ${npc.name} đang giận bạn! Còn khuya mới cho tiền nhé. Hãy làm lành trước đi!`);
    }

    if (!npc.intrinsic_stats) {
        npc.intrinsic_stats = { happiness: 70, wealth: 50, generosity: 50 };
    }

    const wealth = npc.intrinsic_stats.wealth;
    const generosity = npc.intrinsic_stats.generosity;

    const chance = generosity / 100;
    const isSuccess = Math.random() < chance;

    if (isSuccess && wealth > 10) {
        const giveAmount = Math.floor(wealth * (0.1 + Math.random() * 0.3));

        npc.intrinsic_stats.wealth -= giveAmount;
        gameState.money = (gameState.money || 0) + giveAmount;

        if (typeof interactWithNPC === 'function') interactWithNPC(npcId, {}, -5);

        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory(`💸 Xin tiền ${npc.name}`, giveAmount);
        }

        alert(`🥰 ${npc.name} đã thở dài và cho bạn ${giveAmount}$ tiêu vặt.\n(Lưu ý: Xin tiền nhiều sẽ làm giảm nhẹ điểm thiện cảm nhé!)`);
    } else {
        if (typeof interactWithNPC === 'function') interactWithNPC(npcId, {}, -15);
        alert(`😤 ${npc.name} từ chối thẳng thừng: "Tiêu pha cho lắm vào rồi giờ ngửa tay xin à? Không có đồng nào đâu!"\n(-15 điểm thiện cảm)`);
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

function interactWithNPC(npcId, options = {}, xpChange = 0) {
    if (!gameState || !gameState.relationships) return;
    // Reset bộ đếm 3 tháng không tương tác vì người chơi vừa tương tác

    let npc = gameState.relationships.find(r => r.id === npcId);

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

    if (typeof npc.xp === 'undefined') npc.xp = 0;
    if (typeof npc.level === 'undefined') npc.level = 0;

    npc.xp += xpChange;
    npc.inactiveMonths = 0;
    if (npc.xp >= 100) {
        const levelUp = Math.floor(npc.xp / 100);
        npc.level += levelUp;
        npc.xp = npc.xp % 100;

        if (typeof showFloatingText === 'function') {
            showFloatingText('relation', `❤️ Mối quan hệ với ${npc.name} tăng cấp!`, 'pos');
        }
    } else if (npc.xp < 0) {
        if (npc.level > -3) {
            npc.level -= 1;
            npc.xp = 100 + npc.xp;

            if (typeof showFloatingText === 'function') {
                showFloatingText('relation', `💔 Mối quan hệ với ${npc.name} giảm cấp!`, 'neg');
            }
        } else {
            npc.xp = 0;
        }
    }

    // 🚀 Ghi nhận Log biến động quan hệ
    if (!gameState.relationshipLogs) gameState.relationshipLogs = [];
    const changeSymbol = xpChange >= 0 ? `+${xpChange}` : `${xpChange}`;
    gameState.relationshipLogs.unshift({
        month: gameState.month || 1,
        age: gameState.age || 16,
        text: `Tương tác với ${npc.name}: ${changeSymbol} XP (Cấp hiện tại: Lvl ${npc.level})`
    });

    if (typeof showFloatingText === 'function') {
        const sign = xpChange > 0 ? '+' : '';
        const type = xpChange > 0 ? 'pos' : 'neg';
        showFloatingText('relation', `${npc.name}: ${sign}${xpChange} XP`, type);
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

// 🚀 ÉP GÁN HÀM VÀO WINDOW ĐỂ NÚT HTML ONCLICK LÚC NÀO CŨNG BẤM ĐƯỢC
if (typeof window !== 'undefined') {
    window.toggleSubscription = toggleSubscription;
    window.handleEatMeal = handleEatMeal;
    window.handleFitness = handleFitness;
    window.handleMedicalCare = handleMedicalCare;
    window.renderHealthView = renderHealthView;
}

// =================================================================
// ZONE 8: HỆ THỐNG CHỈ SỐ PHỤ 2.0 (DECAY, EGO STRESS & BONUS TIP)
// =================================================================

/**
 * 1. Tự động tính toán suy hao & biến động chỉ số phụ hàng tháng
 */
function processSecondaryStatsMonthly() {
    if (typeof gameState === 'undefined' || !gameState) return;
    const age = gameState.age || 16;

    // A. Suy hao Sức mạnh (strength) & Ngoại hình (looks) theo tuổi
    if (age > 35) gameState.strength = Math.max(10, (gameState.strength || 50) - 0.5);
    if (age > 50) gameState.strength = Math.max(10, (gameState.strength || 50) - 0.5); // Giảm thêm khi > 50 tuổi
    if (age > 30) gameState.looks = Math.max(10, (gameState.looks || 50) - 0.5);

    // B. Xuống sắc do Stress quá cao (>80)
    if (gameState.stress > 80) {
        gameState.looks = Math.max(10, (gameState.looks || 50) - 1);
    }

    // C. Tác động của Cái tôi (ego) cao khi làm việc Part-time / Lao động Level 1
    const currentJob = typeof getCurrentJobObject === 'function' ? getCurrentJobObject() : null;
    if (currentJob && currentJob.is_part_time && (gameState.ego || 50) > 60) {
        // Cái tôi cao (>60) mà làm việc vặt -> Bất mãn, tăng thêm Stress hàng tháng
        gameState.stress = Math.min(100, (gameState.stress || 0) + 5);
    }
}

/**
 * 2. Tính tiền Tip / Thưởng năng suất dựa trên Ngoại hình & Sức mạnh
 */
function calculateSecondaryStatsJobBonus(job) {
    if (!job || typeof gameState === 'undefined' || !gameState) return 0;
    let bonus = 0;

    // Nghề Dịch vụ / F&B / Beauty: Ngoại hình càng cao nhận Tip càng nhiều (tối đa +20% lương)
    if (['manual_fnb', 'creative_beauty'].includes(job.track_id)) {
        const looksRatio = (gameState.looks || 50) / 100;
        bonus += Math.floor(looksRatio * (job.salary_per_month * 0.20));
    }

    // Nghề Xây dựng / Vận tải: Sức mạnh cao thưởng năng suất (tối đa +15% lương)
    if (['construction', 'logistics_driver'].includes(job.track_id)) {
        const strengthRatio = (gameState.strength || 50) / 100;
        bonus += Math.floor(strengthRatio * (job.salary_per_month * 0.15));
    }

    return bonus;
}

/**
 * 3. Tương tác Rèn Luyện Bản Thân (Tập Gym, Spa, Đọc sách, Tiệc tùng)
 */
function doSelfImprovementAction(type) {
    if (typeof gameState === 'undefined' || !gameState) return;

    // Quy đổi chi phí tập luyện trực tiếp vào Tiền ($) và Sức khỏe (%)
    const actions = {
        gym: {
            name: 'Tập Gym / Thể Thao',
            cost: 20,
            health_cost: 5, // Tốn 5% Sức khỏe để tập
            stats: { strength: 2, health: 3, stress: -5 } // Tập xong phục hồi thể chất, giảm stress
        },
        spa: {
            name: 'Đi Spa / Skincare',
            cost: 50,
            health_cost: 0,
            stats: { looks: 3, stress: -15 }
        },
        reading: {
            name: 'Đọc Sách Kỹ Năng',
            cost: 15,
            health_cost: 2,
            stats: { charm: 1.5, smarts: 1, stress: -2 }
        },
        party: {
            name: 'Tiệc Tùng / Giao Lưu',
            cost: 100,
            health_cost: 8, // Thức khuya tốn sức khỏe
            stats: { ego: 4, happiness: 5 }
        }
    };

    const act = actions[type];
    if (!act) return;

    // 1. Kiểm tra Tiền
    if ((gameState.money || 0) < act.cost) {
        if (typeof showToast === 'function') showToast(`⚠️ Bạn không đủ $${act.cost} để ${act.name}!`, 'error');
        return;
    }

    // 2. Kiểm tra Sức khỏe hiện tại (phải > health_cost mới được làm)
    if (act.health_cost > 0 && (gameState.health || 0) <= act.health_cost) {
        if (typeof showToast === 'function') showToast(`⚠️ Sức khỏe quá yếu (cần >${act.health_cost}% SK) để ${act.name}!`, 'error');
        return;
    }

    // Trừ chi phí
    gameState.money -= act.cost;
    if (act.health_cost > 0) gameState.health -= act.health_cost;

    // Cập nhật các chỉ số
    if (act.stats.strength) gameState.strength = Math.min(100, (gameState.strength || 50) + act.stats.strength);
    if (act.stats.looks) gameState.looks = Math.min(100, (gameState.looks || 50) + act.stats.looks);
    if (act.stats.charm) gameState.charm = Math.min(100, (gameState.charm || 50) + act.stats.charm);
    if (act.stats.ego) gameState.ego = Math.min(100, (gameState.ego || 50) + act.stats.ego);
    if (act.stats.smarts) gameState.smarts = Math.min(100, (gameState.smarts || 50) + act.stats.smarts);
    if (act.stats.health) gameState.health = Math.min(100, (gameState.health || 0) + act.stats.health);
    if (act.stats.happiness) gameState.happiness = Math.min(100, (gameState.happiness || 50) + act.stats.happiness);
    if (act.stats.stress) gameState.stress = Math.max(0, (gameState.stress || 0) + act.stats.stress);

    // Thông báo & Render lại UI
    if (typeof showToast === 'function') {
        const costText = act.health_cost > 0 ? `-$${act.cost}, -${act.health_cost}% SK` : `-$${act.cost}`;
        showToast(`✨ Đã ${act.name}! (${costText})`, 'success');
    }
    if (typeof updateProfileCard === 'function') {
        updateProfileCard();
    }

>>>>>>> dd63ffbddca0c84c2107b727ddeee84f4a934fcd
}