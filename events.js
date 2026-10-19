/**
 * =================================================================
 * ZONE 1: DATA LOADING & GLOBAL STATE (NẠP DỮ LIỆU & TRẠNG THÁI)
 * =================================================================
 */

// Lưu trữ dữ liệu sự kiện tĩnh từ events.json
let gameEventsData = {
    allowance_events: [],
    random_events: []
};

// Sự kiện hội thoại tự do hiện tại đang kích hoạt
let currentActiveDialogueEvent = null;

/**
 * Nạp dữ liệu sự kiện từ file events.json
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

// Tự động nạp dữ liệu khi script khởi chạy
loadEventsJSON();


/**
 * =================================================================
 * ZONE 2: DATA-DRIVEN MONTHLY EVENTS ENGINE (ENGINE SỰ KIỆN HÀNG THÁNG)
 * =================================================================
 */

let monthlyEventQueue = [];

/**
 * Quét toàn bộ JSON và đưa các sự kiện thỏa điều kiện vào Hàng đợi
 */
function checkMonthlyEvents() {
    if (typeof gameState === 'undefined' || !gameState) return;

    monthlyEventQueue = [];
    const monthlyData = gameEventsData.monthly_events || [];

    // 1. Quét & Lọc Sự Kiện Tĩnh (từ file JSON)
    monthlyData.forEach(ev => {
        if (ev.min_age !== undefined && gameState.age < ev.min_age) return;
        if (ev.max_age !== undefined && gameState.age > ev.max_age) return;
        if (ev.requires_housing && gameState.currentHome?.type !== ev.requires_housing) return;
        if (ev.trigger_chance !== undefined && Math.random() > ev.trigger_chance) return;

        monthlyEventQueue.push(ev);
    });

    // 2. 🚀 CẬP NHẬT ĐỜI SỐNG NGẦM & SINH SỰ KIỆN NPC ĐỘNG
    generateDynamicNPCEvents();

    // 3. Kích hoạt xử lý hàng đợi
    processNextMonthlyEvent();
}

/**
 * Giả lập cuộc sống của NPC: Tự động dao động tâm trạng, tài chính
 * và kích hoạt các sự kiện ngẫu nhiên dựa trên chỉ số ẩn.
 */
function generateDynamicNPCEvents() {
    if (!gameState.relationships) return;
    const pName = gameState.name || "bạn"; // Bắt tên nhân vật

    gameState.relationships.forEach(npc => {
        if (!npc.intrinsic_stats) return;

        // A. Cập nhật sinh hoạt ngầm
        npc.intrinsic_stats.wealth += Math.floor(Math.random() * 30);
        const moodSwing = Math.floor(Math.random() * 15) - 7;
        npc.intrinsic_stats.happiness = Math.max(0, Math.min(100, npc.intrinsic_stats.happiness + moodSwing));

        // B. Kích hoạt sự kiện
        if (Math.random() < 0.05) {
            let eventObj = null;

            if (npc.id === 'mother') {
                if (npc.intrinsic_stats.happiness >= 60) {
                    eventObj = {
                        id: "npc_mother_care",
                        tag: "👩 Gia Đình",
                        icon: "🍲",
                        title: "Mẹ Gửi Quà Tẩm Bổ",
                        description: `Dạo này Mẹ đang rất vui. Mẹ gửi lên cho ${pName} một thùng đồ ăn ngon tẩm bổ: "Nhớ ăn uống đầy đủ nhé con!"`,
                        choices: [
                            {
                                text: "Gọi điện cảm ơn Mẹ rối rít",
                                reward_happiness: 10,
                                npc_targets: ["mother"],
                                npc_change: 10,
                                success_msg: `${pName} no bụng và cảm thấy vô cùng ấm áp (+10 Hạnh phúc, +10 Thiện cảm Mẹ).`
                            }
                        ]
                    };
                } else {
                    eventObj = {
                        id: "npc_mother_sick",
                        tag: "👩 Gia Đình",
                        icon: "🤒",
                        title: "Mẹ Bị Ốm",
                        description: `Hôm nay gọi điện thấy giọng Mẹ hơi mệt. Mẹ bảo bị cảm xoàng, không sao đâu, nhưng ${pName} nghe tiếng ho lụ khụ rất xót xa.`,
                        choices: [
                            {
                                text: "Gửi 50$ về biếu Mẹ mua thuốc",
                                req_money: 50,
                                cost_money: 50,
                                npc_targets: ["mother"],
                                npc_change: 20,
                                success_msg: `Mẹ rất cảm động vì sự hiếu thảo và trưởng thành của ${pName} (+20 Thiện cảm Mẹ).`,
                                fail_msg: `${pName} mở ví ra và thở dài... Không đủ 50$ để gửi cho Mẹ.`
                            },
                            {
                                text: "Chỉ dặn dò Mẹ nghỉ ngơi suông",
                                npc_targets: ["mother"],
                                npc_change: -5,
                                success_msg: `${pName} dặn Mẹ giữ sức khỏe rồi cúp máy. Cảm giác trong lòng hơi áy náy (-5 Thiện cảm Mẹ).`
                            }
                        ]
                    };
                }
            } else if (npc.id === 'father') {
                if (npc.intrinsic_stats.wealth > 150) {
                    eventObj = {
                        id: "npc_father_bonus",
                        tag: "👨 Gia Đình",
                        icon: "💵",
                        title: "Bố Cho Tiền Tiêu Vặt",
                        description: `Bố dạo này làm ăn trúng mánh hoặc vừa được thưởng. Bố lén chuyển cho ${pName} 100$: "Tiêu gì thì tiêu, đừng cho Mẹ biết nhé!"`,
                        choices: [
                            {
                                text: "Nhận tiền và giữ bí mật",
                                reward_money: 100,
                                npc_targets: ["father"],
                                npc_change: 5,
                                success_msg: `Tài khoản ting ting, tình cảm cha con khăng khít hơn! (+100$, +5 Thiện cảm Bố).`
                            }
                        ]
                    };
                    npc.intrinsic_stats.wealth -= 100;
                } else {
                    eventObj = {
                        id: "npc_father_need_money",
                        tag: "👨 Gia Đình",
                        icon: "📉",
                        title: "Bố Kẹt Tiền",
                        description: `Bố gọi điện giọng ngập ngừng: "Con có dư đồng nào không, Bố đang kẹt chút việc cần 100$, tháng sau Bố trả..."`,
                        choices: [
                            {
                                text: "Chuyển luôn 100$ cho Bố",
                                req_money: 100,
                                cost_money: 100,
                                reward_ego: 5,
                                npc_targets: ["father"],
                                npc_change: 25,
                                success_msg: `Bố thở phào nhẹ nhõm và vô cùng tự hào về ${pName}. (+25 Thiện cảm Bố, +5 Cái tôi).`,
                                fail_msg: `${pName} không có đủ 100$ để giúp Bố...`
                            },
                            {
                                text: "Than nghèo kể khổ để từ chối",
                                npc_targets: ["father"],
                                npc_change: -10,
                                success_msg: `Bố cúp máy cái rụp. ${pName} biết Bố buồn và có chút thất vọng (-10 Thiện cảm Bố).`
                            }
                        ]
                    };
                }
            }

            if (eventObj) monthlyEventQueue.push(eventObj);
        }
    });
}


/**
 * Xử lý tuần tự từng sự kiện trong Hàng đợi
 */
/**
/**
 * Xử lý tuần tự từng sự kiện trong Hàng đợi sự kiện đầu tháng
 */
function processNextMonthlyEvent() {
    if (monthlyEventQueue.length === 0) return;

    const ev = monthlyEventQueue.shift();
    const pName = gameState.name || "bạn"; // Biến bắt tên

    if (ev.is_unique && !gameState.completedEvents.includes(ev.id)) {
        gameState.completedEvents.push(ev.id);
    }

    // Tự động dịch mã {NAME} trong file JSON thành Tên nhân vật
    let finalDescription = ev.description.replace(/{NAME}/g, pName);
    let calculatedAllowance = 0;

    const hasAllowanceChoice = ev.choices && ev.choices.some(c => c.is_allowance_calc);
    if (hasAllowanceChoice) {
        const bg = typeof getFamilyBackground === 'function' ? getFamilyBackground() : { allowance: 60 };
        const father = (gameState.relationships || []).find(r => r.id === "father");
        calculatedAllowance = (father && father.level < 0) ? Math.floor(bg.allowance * 0.3) : bg.allowance;

        finalDescription = `${finalDescription}\n\n💵 Tiền chu cấp thực nhận tháng này: +${calculatedAllowance}$`;
    }

    const parsedChoices = ev.choices.map(choiceJSON => {
        return {
            text: choiceJSON.text.replace(/{NAME}/g, pName), // Dịch {NAME} ở nút bấm
            action: function () {
                let actualRewardMoney = choiceJSON.reward_money || 0;
                if (choiceJSON.is_allowance_calc) actualRewardMoney = calculatedAllowance;

                if (choiceJSON.req_money && (gameState.money || 0) < choiceJSON.req_money) {
                    if (typeof triggerScreenShake === 'function') triggerScreenShake();
                    if (choiceJSON.fail_msg) alert(choiceJSON.fail_msg.replace(/{NAME}/g, pName));
                    if (choiceJSON.fail_npc_change && choiceJSON.npc_targets && typeof interactWithNPC === 'function') {
                        choiceJSON.npc_targets.forEach(npcId => interactWithNPC(npcId, {}, choiceJSON.fail_npc_change));
                    }
                } else {
                    if (choiceJSON.cost_money) {
                        gameState.money -= choiceJSON.cost_money;
                        if (typeof showFloatingText === 'function') showFloatingText('money', `-${choiceJSON.cost_money}$`, 'neg');
                        if (typeof triggerScreenShake === 'function') triggerScreenShake();
                    }

                    if (actualRewardMoney) {
                        gameState.money = (gameState.money || 0) + actualRewardMoney;
                        if (typeof showFloatingText === 'function') showFloatingText('money', `+${actualRewardMoney}$`, 'pos');
                    }

                    if (choiceJSON.reward_happiness) gameState.happiness = Math.min(100, (gameState.happiness || 70) + choiceJSON.reward_happiness);
                    if (choiceJSON.reward_ego) gameState.ego = Math.min(100, (gameState.ego || 30) + choiceJSON.reward_ego);

                    if (choiceJSON.npc_change && choiceJSON.npc_targets && typeof interactWithNPC === 'function') {
                        choiceJSON.npc_targets.forEach(npcId => interactWithNPC(npcId, {}, choiceJSON.npc_change));
                    }

                    if (choiceJSON.success_msg) alert(choiceJSON.success_msg.replace(/{NAME}/g, pName));
                }

                if (typeof saveGameState === 'function') saveGameState();
                if (typeof renderGameState === 'function') renderGameState();

                document.getElementById("event-modal").classList.add("hidden");
                setTimeout(processNextMonthlyEvent, 300);
            }
        };
    });

    showEventModal({
        tag: ev.tag,
        icon: ev.icon,
        title: ev.title.replace(/{NAME}/g, pName),
        description: finalDescription,
        choices: parsedChoices
    });
}


/**
 * =================================================================
 * ZONE 3: DYNAMIC MID-MONTH EVENT SPAWNER (SINH SỰ KIỆN GIỮA THÁNG)
 * =================================================================
 */

/**
 * Kiểm tra và kích hoạt ngẫu nhiên sự kiện va chạm giao tiếp giữa tháng
 */
/**
/**
 * Kiểm tra và kích hoạt ngẫu nhiên sự kiện va chạm giao tiếp giữa tháng
 * (Đã sửa lỗi kẹt timer khi hết sự kiện)
 */
function checkDynamicMidMonthEvents() {
    if (!gameState || gameState.currentDay >= 30) return;

    // Tỷ lệ 8% xuất hiện sự kiện giữa tháng
    if (Math.random() > 0.08) return;

    const rawList = gameEventsData.random_events || [];
    const currentAge = gameState.age || 16;
    const hasJob = !!(gameState.job && gameState.job !== "Unemployed" && gameState.job !== "Thất nghiệp");
    const housingState = gameState.currentHome ? gameState.currentHome.type : "parents";

    if (!gameState.storyFlags) gameState.storyFlags = {};
    if (!gameState.completedEvents) gameState.completedEvents = [];

    // BỘ LỌC CÁC SỰ KIỆN CHƯA XUẤT HIỆN
    const eligibleEvents = rawList.filter(ev => {
        if (gameState.completedEvents.includes(ev.id)) return false;

        const minAge = ev.min_age !== undefined ? ev.min_age : 16;
        const maxAge = ev.max_age !== undefined ? ev.max_age : 100;
        if (currentAge < minAge || currentAge > maxAge) return false;

        if (ev.requires_job && !hasJob) return false;
        if (ev.requires_housing && ev.requires_housing !== "any") {
            if (ev.requires_housing !== housingState) return false;
        }

        if (ev.min_stress !== undefined && (gameState.stress || 0) < ev.min_stress) return false;
        if (ev.min_ego !== undefined && (gameState.ego || 0) < ev.min_ego) return false;
        if (ev.min_charm !== undefined && (gameState.charm || 0) < ev.min_charm) return false;
        if (ev.max_money !== undefined && (gameState.money || 0) > ev.max_money) return false;
        if (ev.flag_required && !gameState.storyFlags[ev.flag_required]) return false;

        return true;
    });

    // 🚀 NẾU HẾT SỰ KIỆN: BỎ QUA LUÔN, ĐỂ ĐỒNG HỒ CHẠY TIẾP MƯỢT MÀ, KHÔNG BỊ KẸT MODAL
    if (eligibleEvents.length === 0) {
        console.log("🌿 Không có sự kiện giữa tháng phù hợp, thời gian tiếp tục trôi...");
        return; 
    }

    // TẠM DỪNG ĐỒNG HỒ ĐỂ NGƯỜI CHƠI TRẢ LỜI SỰ KIỆN
    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    const modal = document.getElementById("dialogue-event-modal");
    if (!modal) return;

    const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
    const ev = eligibleEvents[randomIndex];

    // Ghi nhớ ID sự kiện
    gameState.completedEvents.push(ev.id);
    if (typeof saveGameState === 'function') saveGameState();

    let targetNPC = null;
    if (gameState.relationships && gameState.relationships.length > 0) {
        targetNPC = gameState.relationships[Math.floor(Math.random() * gameState.relationships.length)];
    }

        const pName = gameState.name || "bạn";
    let dynamicPrompt = ev.prompt || ev.description || "Có chuyện gì đó vừa xảy ra...";
    
    // Tự động dịch mã {NAME} và {NPC_NAME}
    dynamicPrompt = dynamicPrompt.replace(/{NAME}/g, pName);
    
    if (targetNPC) {
        dynamicPrompt = dynamicPrompt.replace(/{NPC_NAME}/g, `${targetNPC.name} (${targetNPC.relation})`);
    } else {
        dynamicPrompt = dynamicPrompt.replace(/{NPC_NAME}/g, "Người quen");
    }


    currentActiveDialogueEvent = {
        id: ev.id,
        tag: ev.tag || "🗣️ Va Chạm Giao Tiếp",
        title: ev.title || "Tình Huống Ngẫu Nhiên",
        prompt: dynamicPrompt,
        category: ev.category || "life",
        targetNpcId: targetNPC ? targetNPC.id : null,
        set_flag: ev.set_flag || null,
        clear_flag: ev.clear_flag || null
    };

    if (typeof setElementText === 'function') {
        setElementText('dialogue-tag', currentActiveDialogueEvent.tag);
        setElementText('dialogue-title', currentActiveDialogueEvent.title);
        setElementText('dialogue-prompt', currentActiveDialogueEvent.prompt);
    }

    document.getElementById("dialogue-user-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-npc-reply-bubble")?.classList.add("hidden");
    document.getElementById("dialogue-system-badge")?.classList.add("hidden");
    document.getElementById("dialogue-input-container")?.classList.remove("hidden");
    document.getElementById("dialogue-close-btn")?.classList.add("hidden");

    const inputEl = document.getElementById("dialogue-user-input");
    if (inputEl) inputEl.value = "";

    modal.classList.remove("hidden");

    setTimeout(() => {
        if (inputEl) inputEl.focus();
    }, 150);
}


/**
 * =================================================================
 * ZONE 4: OFFLINE DIALOGUE EVALUATION ENGINE (NLP PHÂN TÍCH HỘI THOẠI)
 * =================================================================
 */

/**
 * Xử lý khi người chơi bấm nút "Gửi Lời Đáp"
 */
function submitDialogueResponse() {
    // 1. Khai báo biến (Chỉ khai báo 1 lần duy nhất)
    const inputEl = document.getElementById("dialogue-user-input");
    if (!inputEl) return;

    const rawText = inputEl.value.trim();
    if (!rawText) return alert("⚠️ Vui lòng nhập câu trả lời của bạn!");

    const userBubble = document.getElementById("dialogue-user-bubble");
    const userTextEl = document.getElementById("dialogue-user-text");
    if (userTextEl) userTextEl.innerText = rawText;
    if (userBubble) userBubble.classList.remove("hidden");

    document.getElementById("dialogue-input-container")?.classList.add("hidden");

    const text = rawText.toLowerCase();
    const eventData = currentActiveDialogueEvent || { title: "Tương tác", category: "street" };

    // 🚀 2. XỬ LÝ RIÊNG CHO SỰ KIỆN "BÌNH YÊN"
    if (eventData.id === "fallback_peace") {
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 1);
        if (typeof addDailyLog === 'function') addDailyLog("Tận hưởng một ngày tĩnh lặng.");

        setTimeout(() => {
            const npcBubble = document.getElementById("dialogue-npc-reply-bubble");
            const npcTextEl = document.getElementById("dialogue-npc-reply-text");
            const npcIconEl = npcBubble ? npcBubble.querySelector("span") : null;

            if (npcIconEl) npcIconEl.innerText = "🌿";
            if (npcTextEl) npcTextEl.innerText = "Bạn hít một hơi thật sâu, cảm thấy tâm hồn thư thái hơn đôi chút.";
            if (npcBubble) npcBubble.classList.remove("hidden");

            const badgeEl = document.getElementById("dialogue-system-badge");
            const fbTextEl = document.getElementById("dialogue-feedback-text");
            if (fbTextEl) fbTextEl.innerText = "✨ Tận hưởng sự tĩnh lặng (+1 Hạnh phúc)";
            if (badgeEl) badgeEl.classList.remove("hidden");

            document.getElementById("dialogue-close-btn")?.classList.remove("hidden");
        }, 400);

        if (typeof saveGameState === 'function') saveGameState();
        if (typeof renderGameState === 'function') renderGameState();
        return; // Dừng tại đây, không chạy bộ đếm NLP bên dưới nữa
    }

    // 3. BỘ ĐẾM NLP CHO CÁC SỰ KIỆN GIAO TIẾP THÔNG THƯỜNG
    const words = rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const politeDict = ["xin lỗi", "cảm ơn", "bình tĩnh", "thành thật", "thông cảm", "dạ", "ạ", "giúp", "nhẹ nhàng", "đồng ý", "vâng"];
    const smartDict = ["doanh thu", "lý do", "kế hoạch", "thực tế", "phân tích", "giải pháp", "chứng minh", "xem lại", "số liệu", "chí hướng", "đầu tư"];
    const aggressiveDict = ["mày", "tao", "im đi", "cút", "liên quan", "kệ", "chửi", "ngu", "mất dạy", "đéo", "đập", "biến"];
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
    let relXpChange = 0;

    if (wordCount < 3 && scorePolite === 0 && scoreSmart === 0 && scoreAggressive === 0 && !isShortFunny) {
        npcIcon = "😐";
        gameState.charm = Math.max(0, (gameState.charm || 45) - 2);
        relXpChange = -5;
        feedback = "😐 Lời đáp cụt ngủn, thiếu đầu tư (-2 Ăn nói, -5 Mối quan hệ)";
        logSummary = `${eventData.title}: Trả lời hời hợt`;
        npcReply = "NPC nhếch mép gắt gỏng: 'Nói năng cụt ngủn thế? Không có tý lịch sự nào!'";
    }
    else if (isShortFunny || scoreFunny > 0) {
        npcIcon = "🤣";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 3);
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 4);
        gameState.stress = Math.max(0, (gameState.stress || 0) - 5);
        relXpChange = 10;
        feedback = "🤪 Lời đáp tấu hài ngơ ngác! (+3 Ăn nói, +4 Hạnh phúc, +10 Mối quan hệ)";
        logSummary = `${eventData.title}: Tấu hài ngơ ngác hóa giải xung đột`;
        npcReply = "NPC cạn lời ngơ ngác: 'Ủa? Trả lời cái câu huề vốn vậy mà cũng nghĩ ra được hả?!'";
    }
    else if (scoreAggressive > 0) {
        npcIcon = "🤬";
        gameState.ego = Math.min(100, (gameState.ego || 30) + 5);
        gameState.stress = Math.min(100, (gameState.stress || 0) + 10);
        gameState.charm = Math.max(0, (gameState.charm || 45) - 3);
        relXpChange = -20;
        feedback = "🔥 Phản ứng bốc đồng, gay gắt! (+5 Cái tôi, +10 Stress, -20 Mối quan hệ)";
        logSummary = `${eventData.title}: Xô xát lời nói, thái độ ngông nghênh`;
        npcReply = "NPC đập bàn giận dữ: 'Mày thái độ gì đấy?! Ra đây nói chuyện!'";
    }
    else if (scoreSmart > 0 || wordCount >= 7) {
        npcIcon = "🧠";
        gameState.smarts = Math.min(100, (gameState.smarts || 50) + 4);
        gameState.charm = Math.min(100, (gameState.charm || 45) + 2);
        relXpChange = 15;
        feedback = "🧠 Lập luận sắc bén, logic! (+4 Trí tuệ, +2 Ăn nói, +15 Mối quan hệ)";
        logSummary = `${eventData.title}: Dùng lý lẽ sắc bén làm chủ cuộc đối thoại`;
        npcReply = "NPC khựng lại gật gù: 'Ừm... nghe cũng có lý. Tạm thời ghi nhận.'";
    }
    else if (scorePolite > 0) {
        npcIcon = "🥰";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 4);
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 3);
        gameState.stress = Math.max(0, (gameState.stress || 0) - 6);
        relXpChange = 20;
        feedback = "🕊️ Xử sự đắc nhân tâm, nhã nhặn! (+4 Ăn nói, +3 Hạnh phúc, +20 Mối quan hệ)";
        logSummary = `${eventData.title}: Ứng xử đắc nhân tâm, nhã nhặn`;
        npcReply = "NPC mỉm cười dịu giọng: 'Bạn đã nói thế thì tôi không chấp nhặt nữa. Cảm ơn nhé!'";
    }
    else {
        npcIcon = "💬";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 1);
        relXpChange = 5;
        feedback = "💬 Phản hồi chừng mực, trung lập (+1 Ăn nói)";
        logSummary = `${eventData.title}: Trả lời trung lập`;
        npcReply = "NPC gật đầu nhẹ rồi quay đi.";
    }

    // 🚀 CHỈ TÁC ĐỘNG KHI CÓ ĐÍNH KÈM ĐỐI TƯỢNG NPC CỤ THỂ VÀ KHÔNG PHẢI LÀ NPC VÔ HÌNH (như hàng xã hội, đường phố)
    if (eventData.targetNpcId && eventData.targetNpcId !== "none" && typeof interactWithNPC === 'function') {
        interactWithNPC(eventData.targetNpcId, {}, relXpChange);
    }

    if (eventData.set_flag && (scorePolite > 0 || scoreSmart > 0)) {
        if (!gameState.storyFlags) gameState.storyFlags = {};
        gameState.storyFlags[eventData.set_flag] = true;
        console.log(`🚩 Bật Cờ Cốt Truyện: ${eventData.set_flag}`);
    }

    if (typeof addDailyLog === 'function') addDailyLog(logSummary);

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
 * Đóng Modal Dialogue và tiếp tục vòng lặp thời gian 30 ngày
 */
function closeDialogueModal() {
    document.getElementById("dialogue-event-modal")?.classList.add("hidden");
    if (typeof startMonthCalendarTimer === 'function') startMonthCalendarTimer();
}


/**
 * =================================================================
 * ZONE 5: STANDARD EVENT MODAL RENDERER
 * =================================================================
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

    if (tagEl) tagEl.innerText = eventData.tag || "✉️ Sự Kiện";
    if (iconEl) iconEl.innerText = eventData.icon || "🎲";
    if (titleEl) titleEl.innerText = eventData.title || "Sự kiện";
    if (descEl) descEl.innerText = eventData.description || "";

    container.innerHTML = "";

    if (eventData.choices && Array.isArray(eventData.choices)) {
        eventData.choices.forEach((choice) => {
            const button = document.createElement("button");
            button.className = "w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 border border-amber-300/40 text-center";
            button.innerText = choice.text;

            button.onclick = function () {
                if (typeof choice.action === 'function') choice.action();
                // Lưu ý: Việc đóng modal và gọi tiếp hàng đợi đã được xử lý bên trong choice.action ở Engine ZONE 2
            };

            container.appendChild(button);
        });
    }

    modal.classList.remove("hidden");
}