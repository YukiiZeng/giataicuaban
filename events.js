/**
 * =================================================================
 * ZONE 1: GAME EVENTS DATA & CONFIGURATION (DỮ LIỆU SỰ KIỆN)
 * =================================================================
 */

// Danh sách sự kiện cố định / định kỳ
const GAME_EVENTS = {
    parent_allowance: {
        id: "parent_allowance",
        tag: "👨‍👩‍👦 Gia Đình",
        icon: "💵",
        title: "Tiền Chu Cấp Hàng Tháng",
        description: "Đầu tháng, bố mẹ gửi cho bạn 500$ để trang trải chi phí học tập và sinh hoạt.",
        choices: [
            {
                text: "💚 Cảm ơn bố mẹ (Nhận 500$)",
                action: function() {
                    gameState.money = (gameState.money || 0) + 500;
                    gameState.happiness = Math.min(100, (gameState.happiness || 70) + 5);
                    
                    // Tương tác tự động cập nhật Bố & Mẹ
                    if (typeof interactWithNPC === 'function') {
                        interactWithNPC("father", {}, 30);
                        interactWithNPC("mother", {}, 30);
                    }
                    console.log("✅ Đã nhận 500$ tiền chu cấp từ bố mẹ.");
                }
            },
            {
                text: "😎 Con tự lập được (Từ chối)",
                action: function() {
                    gameState.ego = Math.min(100, (gameState.ego || 30) + 5);
                    
                    if (typeof interactWithNPC === 'function') {
                        interactWithNPC("father", {}, -20);
                        interactWithNPC("mother", {}, -20);
                    }
                    console.log("🚫 Đã từ chối tiền chu cấp từ bố mẹ.");
                }
            }
        ]
    }
};

/**
 * =================================================================
 * ZONE 2: EVENT MODAL RENDERER & LOGIC (XỬ LÝ HIỂN THỊ MODAL SỰ KIỆN)
 * =================================================================
 */

/**
 * Hiển thị Modal Sự Kiện lên màn hình
 * @param {Object} eventData Object dữ liệu sự kiện
 */
function showEventModal(eventData) {
    if (!eventData) return;

    const modal = document.getElementById("event-modal");
    const tagEl = document.getElementById("event-tag");
    const iconEl = document.getElementById("event-icon");
    const titleEl = document.getElementById("event-title");
    const descEl = document.getElementById("event-description");
    const container = document.getElementById("event-choices-container");

    if (!modal || !container) return;

    // Gán thông tin hiển thị
    if (tagEl) tagEl.innerText = eventData.tag || "✉️ Sự Kiện";
    if (iconEl) iconEl.innerText = eventData.icon || "🎲";
    if (titleEl) titleEl.innerText = eventData.title || "Sự kiện";
    if (descEl) descEl.innerText = eventData.description || "";

    // Xóa các nút lựa chọn cũ
    container.innerHTML = "";

    // Render danh sách nút lựa chọn mới
    if (eventData.choices && Array.isArray(eventData.choices)) {
        eventData.choices.forEach((choice) => {
            const button = document.createElement("button");
            button.className = "w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 border border-amber-300/40 text-center";
            button.innerText = choice.text;
            
            // Lắng nghe sự kiện click nút lựa chọn
            button.onclick = function() {
                // Thực thi hành động của lựa chọn
                if (typeof choice.action === 'function') {
                    choice.action();
                }

                // Ẩn modal sự kiện
                modal.classList.add("hidden");

                // Lưu & Render lại giao diện game
                if (typeof saveGameState === 'function') saveGameState();
                if (typeof renderGameState === 'function') renderGameState();
            };

            container.appendChild(button);
        });
    }

    // Hiển thị modal
    modal.classList.remove("hidden");
}

/**
 * Hàm kiểm tra sự kiện đầu tháng khi người chơi bấm "Sang Tháng Mới"
 */
/**
 * Kiểm tra sự kiện hàng tháng (Đã cập nhật tính năng Gia Cảnh & Phụ Tiền Nhà)
 */
function checkMonthlyEvents() {
    if (typeof gameState === 'undefined' || !gameState) return;

    const bg = typeof getFamilyBackground === 'function' ? getFamilyBackground() : { allowance: 60, contributionChance: 0.3 };

    // 1. SỰ KIỆN PHỤ GIÚP TIỀN NHÀ (Chỉ khi ở nhà Bố Mẹ 'shared')
    if (gameState.currentHome && gameState.currentHome.type === 'shared') {
        const shouldAskContribution = Math.random() < bg.contributionChance;
        if (shouldAskContribution && gameState.month > 1) {
            const costReq = Math.floor(Math.random() * 20) + 15; // 15$- 35$
            showEventModal({
                tag: "🏠 Chi Phí Gia Đình",
                icon: "💡",
                title: "Phụ Giúp Tiền Sinh Hoạt",
                description: `Bố Mẹ bảo: "Tháng này tiền điện nước tăng cao quá, con phụ Bố Mẹ ${costReq}$ nhé?"`,
                choices: [
                    {
                        text: `💚 Phụ Bố Mẹ (${costReq}$)`,
                        action: function() {
                            if ((gameState.money || 0) < costReq) {
                                alert("⚠️ Bạn không đủ tiền trong túi! Bố Mẹ thở dài thất vọng.");
                                if (typeof interactWithNPC === 'function') interactWithNPC("father", {}, -10);
                                return;
                            }
                            gameState.money -= costReq;
                            gameState.happiness = Math.min(100, (gameState.happiness || 70) + 5);
                            if (typeof interactWithNPC === 'function') {
                                interactWithNPC("father", {}, 15);
                                interactWithNPC("mother", {}, 15);
                            }
                            alert(`✅ Bạn đã phụ Bố Mẹ ${costReq}$. Tình cảm gia đình đi lên!`);
                        }
                    },
                    {
                        text: "😎 Con không có tiền / Từ chối",
                        action: function() {
                            if (typeof interactWithNPC === 'function') {
                                interactWithNPC("father", {}, -15);
                                interactWithNPC("mother", {}, -15);
                            }
                            alert("💔 Bố Mẹ thở dài không hài lòng về bạn.");
                        }
                    }
                ]
            });
            return; // Ưu tiên hiện sự kiện phụ tiền nhà trước
        }
    }

    // 2. SỰ KIỆN CHU CẤP HÀNG THÁNG (Từ 16 đến dưới 18 tuổi)
    if (gameState.age >= 16 && gameState.age < 18) {
        // Tỷ lệ cho tiền phụ thuộc vào tình cảm Bố Mẹ (level > 0 mới cho đủ)
        const father = (gameState.relationships || []).find(r => r.id === "father");
        const fatherLvl = father ? (father.level || 0) : 0;
        
        let actualAllowance = bg.allowance;
        if (fatherLvl < 0) actualAllowance = Math.floor(bg.allowance * 0.3); // Giận thì cắt 70% tiền
        
        // Gia đình nghèo thì có tháng có tháng không
        if (bg.type === 'poor' && Math.random() < 0.4) {
            actualAllowance = 0;
        }

        if (actualAllowance > 0) {
            showEventModal({
                tag: "👨‍👩‍👦 Gia Đình",
                icon: "💵",
                title: "Tiền Sinh Hoạt Hàng Tháng",
                description: `Bố mẹ gửi cho bạn ${actualAllowance}$ (${bg.label}) để trang trải chi phí.`,
                choices: [
                    {
                        text: `💚 Cảm ơn Bố Mẹ (Nhận ${actualAllowance}$)`,
                        action: function() {
                            gameState.money = (gameState.money || 0) + actualAllowance;
                            gameState.happiness = Math.min(100, (gameState.happiness || 70) + 3);
                            if (typeof interactWithNPC === 'function') {
                                interactWithNPC("father", {}, 10);
                                interactWithNPC("mother", {}, 10);
                            }
                        }
                    },
                    {
                        text: "😎 Con tự lập được (Từ chối)",
                        action: function() {
                            gameState.ego = Math.min(100, (gameState.ego || 30) + 5);
                        }
                    }
                ]
            });
        }
    }
}
/**
 * =================================================================
 * DYNAMIC EVENT SPAWNER & FREE-TEXT DIALOGUE SYSTEM
 * =================================================================
 */

let currentActiveDialogueEvent = null;

/**
 * Hàm kiểm tra sinh Event ngẫu nhiên giữa tháng
 */
/**
 * GEMINI TỰ SINH SỰ KIỆN BẤT NGỜ DỰA TRÊN THÔNG TIN NHÂN VẬT
 */
/**
 * LỌC SỰ KIỆN KHỚP VỚI TRẠNG THÁI NHÂN VẬT (ĐỘ TUỔI, VIỆC CÔNG, NHÀ Ở)
 */
function checkDynamicMidMonthEvents() {
    if (!gameState || gameState.currentDay >= 30) return;

    // Tỷ lệ xuất hiện ~8% mỗi ngày
    if (Math.random() > 0.08) return;

    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    const modal = document.getElementById("dialogue-event-modal");
    if (!modal) return;

    const rawList = gameEventsData.random_events || [];

    // Lấy trạng thái hiện tại của nhân vật
    const currentAge = gameState.age || 16;
    const hasJob = !!(gameState.job && gameState.job !== "Unemployed" && gameState.job !== "Thất nghiệp");
    const housingState = gameState.housingType || "parents"; // "parents" (ở với bố mẹ), "rented" (thủ nhà trọ), "owned" (có nhà riêng)

    // 🚀 BỘ LỌC ĐIỀU KIỆN STRICT FILTER
    const eligibleEvents = rawList.filter(ev => {
        // 1. Kiểm tra độ tuổi
        const minAge = ev.min_age !== undefined ? ev.min_age : 16;
        const maxAge = ev.max_age !== undefined ? ev.max_age : 100;
        if (currentAge < minAge || currentAge > maxAge) return false;

        // 2. Kiểm tra công việc (Sự kiện công sở chỉ xuất hiện khi đã đi làm)
        if (ev.requires_job && !hasJob) return false;

        // 3. Kiểm tra hoàn cảnh nhà ở (Tăng giá nhà trọ chỉ xuất hiện khi đang thuê nhà)
        if (ev.requires_housing && ev.requires_housing !== "any") {
            if (ev.requires_housing !== housingState) return false;
        }

        return true;
    });

    // Bốc ngẫu nhiên từ danh sách ĐÃ LỌC CHUẨN
    if (eligibleEvents.length > 0) {
        const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
        const ev = eligibleEvents[randomIndex];
        currentActiveDialogueEvent = {
            tag: ev.tag || "🗣️ Va Chạm Giao Tiếp",
            title: ev.title || "Tình Huống Ngẫu Nhiên",
            prompt: ev.prompt || ev.description || "Có chuyện gì đó vừa xảy ra...",
            category: ev.category || "life"
        };
    } else {
        // Dự phòng khi chưa có event phù hợp với độ tuổi/hoàn cảnh
        currentActiveDialogueEvent = {
            tag: "🚶 ĐƯỜNG PHỐ",
            title: "Xô Xát Nhẹ",
            prompt: "Người đi đường va vào bạn rồi gắt gỏng: 'Đi đứng kiểu gì đấy hả? Không có mắt à?'",
            category: "street"
        };
    }

    setElementText('dialogue-tag', currentActiveDialogueEvent.tag);
    setElementText('dialogue-title', currentActiveDialogueEvent.title);
    setElementText('dialogue-prompt', currentActiveDialogueEvent.prompt);

    // Reset giao diện Chat
    document.getElementById("dialogue-user-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-npc-reply-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-system-badge")?.classList.add("hidden");
    document.getElementById("dialogue-input-container")?.classList.remove("hidden");
    document.getElementById("dialogue-close-btn")?.classList.add("hidden");

    modal.classList.remove("hidden");
}


/**
 * =================================================================
 * SUPER ADVANCED OFFLINE DIALOGUE ENGINE (ENGINE ĐÁNH GIÁ ĐA TẦNG)
 * =================================================================
 */



function showDialogueEventModal(eventData) {
    currentActiveDialogueEvent = eventData;
    const modal = document.getElementById("dialogue-event-modal");
    if (!modal) return;

    setElementText('dialogue-tag', eventData.tag);
    setElementText('dialogue-title', eventData.title);
    setElementText('dialogue-prompt', eventData.prompt);

    // Reset lại trạng thái bong bóng chat
    document.getElementById("dialogue-user-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-npc-reply-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-system-badge")?.classList.add("hidden");

    document.getElementById("dialogue-input-container")?.classList.remove("hidden");
    document.getElementById("dialogue-close-btn")?.classList.add("hidden");

    // 🚀 FIX LỖI 2: Reset câu trả lời cũ
    const inputEl = document.getElementById("dialogue-user-input");
    if (inputEl) {
        inputEl.value = "";
    }

    modal.classList.remove("hidden");

    // 🚀 FIX LỖI 1: Focus ô nhập liệu để sẵn sàng gõ tiếng Việt
    setTimeout(() => {
        if (inputEl) {
            inputEl.focus();
        }
    }, 150);
}


/**
 * HỆ THỐNG ĐÁNH GIÁ ĐỐI THOẠI ĐA TẦNG + GIAO DIỆN CHAT REAL-TIME
 */
/**
 * =================================================================
 * LOCAL INTENT & COSINE SIMILARITY ENGINE (NLP OFFLINE SIÊU NHẸ)
 * =================================================================
 */

// 1. Hàm tính Độ tương đồng Cosine (Cosine Similarity) giữa 2 chuỗi văn bản
function calculateCosineSimilarity(str1, str2) {
    const getTokens = (text) => text.toLowerCase().replace(/[^\w\sàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, '').split(/\s+/).filter(Boolean);
    
    const tokens1 = getTokens(str1);
    const tokens2 = getTokens(str2);

    if (!tokens1.length || !tokens2.length) return 0;

    const freq1 = {}, freq2 = {};
    tokens1.forEach(t => freq1[t] = (freq1[t] || 0) + 1);
    tokens2.forEach(t => freq2[t] = (freq2[t] || 0) + 1);

    const allTokens = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    let dotProduct = 0, mag1 = 0, mag2 = 0;

    allTokens.forEach(token => {
        const v1 = freq1[token] || 0;
        const v2 = freq2[token] || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    });

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// 2. Hàm Đánh giá Ý định & Thái độ thông qua NLP Offline
/**
 * =================================================================
 * BACKEND AI ENGINE (GEMINI FLASH API FOR DYNAMIC DIALOGUE & EVALUATION)
 * =================================================================
 */

// API Key Gemini từ cURL của anh
const GEMINI_API_KEY = "AQ.Ab8RN6Kgyo6YqFk2cIZ7zx4mKG5nwmbv926HFdInMFLZW_2-kw";

let gameEventsData = {
    allowance_events: [],
    random_events: []
};

/**
 * 1. TẢI FILE EVENTS.JSON THEO CẤU TRÚC MỚI
 */
async function loadEventsJSON() {
    try {
        const response = await fetch('events.json');
        if (response.ok) {
            gameEventsData = await response.json();
            console.log("✅ Đã tải thành công events.json:", gameEventsData);
        }
    } catch (e) {
        console.warn("⚠️ Chưa tìm thấy file events.json hoặc lỗi tải, đang dùng dữ liệu dự phòng.", e);
    }
}
loadEventsJSON();

/**
 * 2. KIỂM TRA CHU CẤP HÀNG THÁNG (GỌI KHI SANG THÁNG MỚI)
 */
function checkMonthlyAllowance() {
    if (!gameState || !gameEventsData.allowance_events) return;

    const currentAge = gameState.age || 16;
    gameEventsData.allowance_events.forEach(event => {
        if (currentAge >= event.min_age && currentAge <= event.max_age) {
            gameState.money = (gameState.money || 0) + event.amount;
            if (typeof addDailyLog === 'function') {
                addDailyLog(`💵 ${event.title}: +${event.amount}$`);
            }
        }
    });
}

/**
 * 3. LẤY SỰ KIỆN BẤT NGỜ TỪ MẢNG RANDOM_EVENTS
 */
function checkDynamicMidMonthEvents() {
    if (!gameState || gameState.currentDay >= 30) return;

    // Tỷ lệ xuất hiện ~8% mỗi ngày
    if (Math.random() > 0.08) return;

    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    const modal = document.getElementById("dialogue-event-modal");
    if (!modal) return;

    const rawList = gameEventsData.random_events || [];

    // Lấy trạng thái hiện tại của nhân vật
    const currentAge = gameState.age || 16;
    const hasJob = !!(gameState.job && gameState.job !== "Unemployed" && gameState.job !== "Thất nghiệp");
    const housingState = gameState.housingType || "parents";

    // BỘ LỌC ĐIỀU KIỆN STRICT FILTER
    const eligibleEvents = rawList.filter(ev => {
        const minAge = ev.min_age !== undefined ? ev.min_age : 16;
        const maxAge = ev.max_age !== undefined ? ev.max_age : 100;
        if (currentAge < minAge || currentAge > maxAge) return false;

        if (ev.requires_job && !hasJob) return false;

        if (ev.requires_housing && ev.requires_housing !== "any") {
            if (ev.requires_housing !== housingState) return false;
        }

        return true;
    });

    if (eligibleEvents.length > 0) {
        const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
        const ev = eligibleEvents[randomIndex];
        currentActiveDialogueEvent = {
            tag: ev.tag || "🗣️ Va Chạm Giao Tiếp",
            title: ev.title || "Tình Huống Ngẫu Nhiên",
            prompt: ev.prompt || ev.description || "Có chuyện gì đó vừa xảy ra...",
            category: ev.category || "life"
        };
    } else {
        currentActiveDialogueEvent = {
            tag: "🚶 ĐƯỜNG PHỐ",
            title: "Xô Xát Nhẹ",
            prompt: "Người đi đường va vào bạn rồi gắt gỏng: 'Đi đứng kiểu gì đấy hả? Không có mắt à?'",
            category: "street"
        };
    }

    setElementText('dialogue-tag', currentActiveDialogueEvent.tag);
    setElementText('dialogue-title', currentActiveDialogueEvent.title);
    setElementText('dialogue-prompt', currentActiveDialogueEvent.prompt);

    // Reset giao diện Chat
    document.getElementById("dialogue-user-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-npc-reply-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-system-badge")?.classList.add("hidden");
    document.getElementById("dialogue-input-container")?.classList.remove("hidden");
    document.getElementById("dialogue-close-btn")?.classList.add("hidden");

    // 🚀 FIX LỖI 2: Xóa sạch nội dung cũ trong ô nhập dữ liệu
    const inputEl = document.getElementById("dialogue-user-input");
    if (inputEl) {
        inputEl.value = "";
    }

    // Hiển thị modal
    modal.classList.remove("hidden");

    // 🚀 FIX LỖI 1: Tự động Focus vào ô input để bàn phím gõ tiếng Việt ngay lập tức
    setTimeout(() => {
        if (inputEl) {
            inputEl.focus();
        }
    }, 150);
}

/**
 * HÀM XỬ LÝ KHI BẤM "GỬI LỜI ĐÁP" TRONG CỬA SỔ DIALOGUE
 */
function submitDialogueResponse() {
    const inputEl = document.getElementById("dialogue-user-input");
    if (!inputEl) return;

    const rawText = inputEl.value.trim();
    if (!rawText) return alert("⚠️ Vui lòng nhập câu trả lời của bạn!");

    // 1. Hiển thị Lời nhắn của Người chơi lên Khung Chat
    const userBubble = document.getElementById("dialogue-user-bubble");
    const userTextEl = document.getElementById("dialogue-user-text");
    if (userTextEl) userTextEl.innerText = rawText;
    if (userBubble) userBubble.classList.remove("hidden");

    document.getElementById("dialogue-input-container")?.classList.add("hidden");

    const text = rawText.toLowerCase();
    const eventData = currentActiveDialogueEvent || { title: "Tương tác", category: "street" };
    const category = eventData.category || "street";

    // 2. PHÂN TÍCH TỪ VỰNG & THÁI ĐỘ (ENGINE OFFLINE)
    const words = rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const politeDict = ["xin lỗi", "cảm ơn", "bình tĩnh", "thành thật", "thông cảm", "dạ", "ạ", "giúp", "nhẹ nhàng"];
    const smartDict = ["doanh thu", "lý do", "kế hoạch", "thực tế", "phân tích", "giải pháp", "chứng minh", "xem lại", "số liệu"];
    const aggressiveDict = ["mày", "tao", "im đi", "cút", "liên quan", "kệ", "chửi", "ngu", "mất dạy", "đéo", "đập"];
    const funnyDict = ["hihi", "haha", "kaka", "vui", "đùa", "dạ không có á", "ủa alo", "ngơ", "gì vậy"];

    let scorePolite = politeDict.filter(w => text.includes(w)).length;
    let scoreSmart = smartDict.filter(w => text.includes(w)).length;
    let scoreAggressive = aggressiveDict.filter(w => text.includes(w)).length;
    let scoreFunny = funnyDict.filter(w => text.includes(w)).length;

    const isShortFunny = wordCount <= 5 && (text.includes("dạ") || text.includes("ơi") || text.includes("ủa") || text.includes("hihi")) && scoreSmart === 0 && scoreAggressive === 0;

    let feedback = "";
    let logSummary = "";
    let npcReply = "";
    let npcIcon = "💬";

    // 3. ĐÁNH GIÁ CHỈ SỐ & TẠO PHẢN HỒI NPC
    if (wordCount < 3 && scorePolite === 0 && scoreSmart === 0 && scoreAggressive === 0 && !isShortFunny) {
        npcIcon = "😐";
        gameState.charm = Math.max(0, (gameState.charm || 45) - 2);
        feedback = "😐 Lời đáp cụt ngủn, thiếu đầu tư (-2 Ăn nói)";
        logSummary = `${eventData.title}: Trả lời hời hợt`;
        npcReply = "NPC nhếch mép gắt gỏng: 'Nói năng cụt ngủn thế? Không có tý lịch sự nào!'";
    }
    else if (isShortFunny || scoreFunny > 0) {
        npcIcon = "🤣";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 3);
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 4);
        gameState.stress = Math.max(0, (gameState.stress || 0) - 5);
        feedback = "🤪 Lời đáp tấu hài ngơ ngác! (+3 Ăn nói, +4 Hạnh phúc, -5 Stress)";
        logSummary = `${eventData.title}: Tấu hài ngơ ngác hóa giải xung đột`;
        npcReply = "NPC cạn lời ngơ ngác: 'Ủa? Trả lời cái câu huề vốn vậy mà cũng nghĩ ra được hả?!'";
    }
    else if (scoreAggressive > 0) {
        npcIcon = "🤬";
        gameState.ego = Math.min(100, (gameState.ego || 30) + 5);
        gameState.stress = Math.min(100, (gameState.stress || 0) + 10);
        gameState.charm = Math.max(0, (gameState.charm || 45) - 3);
        feedback = "🔥 Phản ứng bốc đồng, gay gắt! (+5 Cái tôi, +10 Stress, -3 Ăn nói)";
        logSummary = `${eventData.title}: Xô xát lời nói, thái độ ngông nghênh`;
        npcReply = "NPC đập bàn giận dữ: 'Mày thái độ gì đấy?! Ra đây nói chuyện!'";
    }
    else if (scoreSmart > 0 || wordCount >= 7) {
        npcIcon = "🧠";
        gameState.smarts = Math.min(100, (gameState.smarts || 50) + 4);
        gameState.charm = Math.min(100, (gameState.charm || 45) + 2);
        feedback = "🧠 Lập luận sắc bén, logic! (+4 Trí tuệ, +2 Ăn nói)";
        logSummary = `${eventData.title}: Dùng lý lẽ sắc bén làm chủ cuộc đối thoại`;
        npcReply = "NPC khựng lại gật gù: 'Ừm... nghe cũng có lý. Tạm thời ghi nhận.'";
    }
    else if (scorePolite > 0) {
        npcIcon = "🥰";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 4);
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 3);
        gameState.stress = Math.max(0, (gameState.stress || 0) - 6);
        feedback = "🕊️ Xử sự đắc nhân tâm, nhã nhặn! (+4 Ăn nói, +3 Hạnh phúc, -6 Stress)";
        logSummary = `${eventData.title}: Ứng xử đắc nhân tâm, nhã nhặn`;
        npcReply = "NPC mỉm cười dịu giọng: 'Bạn đã nói thế thì tôi không chấp nhặt nữa. Cảm ơn nhé!'";
    }
    else {
        npcIcon = "💬";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 1);
        feedback = "💬 Phản hồi chừng mực, trung lập (+1 Ăn nói)";
        logSummary = `${eventData.title}: Trả lời trung lập`;
        npcReply = "NPC gật đầu nhẹ rồi quay đi.";
    }

    // Ghi nhận nhật ký biến cố ngày thường
    if (typeof addDailyLog === 'function') addDailyLog(logSummary);

    // 4. Hiển thị Phản hồi NPC & Badge Đánh giá
    setTimeout(() => {
        const npcBubble = document.getElementById("dialogue-npc-reply-bubble");
        const npcTextEl = document.getElementById("dialogue-npc-reply-text");
        
        const npcIconEl = npcBubble ? npcBubble.querySelector("span") : null;
        if (npcIconEl) npcIconEl.innerText = npcIcon;

        if (npcTextEl) npcTextEl.innerText = npcReply;
        if (npcBubble) npcBubble.classList.remove("hidden");

        const badgeEl = document.getElementById("dialogue-system-badge");
        const fbTextEl = document.getElementById("dialogue-feedback-text");
        if (fbTextEl) fbTextEl.innerText = feedback;
        if (badgeEl) badgeEl.classList.remove("hidden");

        document.getElementById("dialogue-close-btn")?.classList.remove("hidden");
    }, 400);

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * HÀM ĐÓNG MODAL DIALOGUE VÀ TIẾP TỤC TIME LOOP
 */
function closeDialogueModal() {
    document.getElementById("dialogue-event-modal")?.classList.add("hidden");
    if (typeof startMonthCalendarTimer === 'function') startMonthCalendarTimer();
}



