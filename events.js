/**
 * =================================================================
 * ZONE 1: DATA LOADING & GLOBAL STATE (NẠP DỮ LIỆU & TRẠNG THÁI)
 * =================================================================
 */

let gameEventsData = {
    allowance_events: [],
    random_events: []
};

let currentActiveDialogueEvent = null;

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
 * =================================================================
 * ZONE 2: DATA-DRIVEN MONTHLY EVENTS ENGINE (ENGINE SỰ KIỆN HÀNG THÁNG)
 * =================================================================
 */

let monthlyEventQueue = [];

function checkMonthlyEvents() {
    if (typeof gameState === 'undefined' || !gameState) return;

    monthlyEventQueue = [];
    const monthlyData = gameEventsData.monthly_events || [];

    monthlyData.forEach(ev => {
        if (ev.min_age !== undefined && gameState.age < ev.min_age) return;
        if (ev.max_age !== undefined && gameState.age > ev.max_age) return;
        if (ev.requires_housing && gameState.currentHome?.type !== ev.requires_housing) return;
        if (ev.trigger_chance !== undefined && Math.random() > ev.trigger_chance) return;

        monthlyEventQueue.push(ev);
    });

    generateDynamicNPCEvents();
    processNextMonthlyEvent();
}

function generateDynamicNPCEvents() {
    if (!gameState.relationships) return;
    const pName = gameState.name || "bạn";

    gameState.relationships.forEach(npc => {
        if (!npc.intrinsic_stats) return;

        npc.intrinsic_stats.wealth += Math.floor(Math.random() * 30);
        const moodSwing = Math.floor(Math.random() * 15) - 7;
        npc.intrinsic_stats.happiness = Math.max(0, Math.min(100, npc.intrinsic_stats.happiness + moodSwing));

        gameState.relationships.forEach(n => {
            const isCloseRelation = (n.level && n.level >= 2) || (n.xp && n.xp >= 50);

            if (isCloseRelation && Math.random() < 0.035) {
                let introducedRelation = "Bạn của " + n.name;
                if (n.id === 'mother' || n.id === 'father') introducedRelation = "Họ hàng / Người quen gia đình";

                // 🌟 Sửa đoạn sinh mối quan hệ giới thiệu từ Bố/Mẹ trong events.js
                const newFriend = generateRandomNPC("Người quen", "social", false);

                // Đảm bảo gán rõ ràng tên quan hệ xã hội thay vì dùng chung chuỗi "Người quen" cho cả tên lẫn quan hệ
                let relationLabel = "Bạn của " + n.name;
                if (n.id === 'mother' || n.id === 'father') {
                    relationLabel = "Người quen gia đình";
                }
                newFriend.relation = relationLabel; // Cập nhật nhãn quan hệ chính xác

                const referralEvent = {
                    id: "referral_" + Date.now(),
                    tag: "🤝 GIỚI THIỆU MỐI QUAN HỆ",
                    icon: "💌",
                    title: `${n.name} Giới Thiệu Người Quen`,
                    description: `${n.name} vừa giới thiệu ${newFriend.name} với bạn: "${n.id === 'mother' ? 'Con giao lưu với đứa này đi, ngoan lắm!' : 'Thằng bạn này của tao vui tính lắm, giao lưu nhé!'}"`,
                    choices: [
                        {
                            text: `🥰 Chào hỏi và kết bạn với ${newFriend.name}`,
                            reward_happiness: 5,
                            npc_targets: [newFriend.id],
                            npc_change: 20,
                            add_new_npc: newFriend,
                            success_msg: `Bạn đã vui vẻ làm quen với ${newFriend.name}! Danh sách quan hệ +1.`
                        },
                        {
                            text: "😅 Ngại ngùng từ chối",
                            success_msg: "Bạn đã khéo léo từ chối cơ hội làm quen."
                        }
                    ]
                };

                monthlyEventQueue.push(referralEvent);
            }
        });

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
                            }]
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
                            }]
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
                            }]
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
                            }]
                    };
                }
            }

            if (eventObj) monthlyEventQueue.push(eventObj);
        }
    });
}

function processNextMonthlyEvent() {
    if (monthlyEventQueue.length === 0) return;

    const ev = monthlyEventQueue.shift();
    const pName = gameState.name || "bạn";

    if (ev.is_unique && !gameState.completedEvents.includes(ev.id)) {
        gameState.completedEvents.push(ev.id);
    }

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
            text: choiceJSON.text.replace(/{NAME}/g, pName),
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

                    if (choiceJSON.add_new_npc) {
                        if (!gameState.relationships) gameState.relationships = [];
                        if (!gameState.relationships.some(r => r.id === choiceJSON.add_new_npc.id)) {
                            gameState.relationships.push(choiceJSON.add_new_npc);
                        }
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
 * ZONE 3: DYNAMIC MID-MONTH EVENT SPAWNER
 * =================================================================
 */

function checkDynamicMidMonthEvents() {
    if (!gameState || gameState.currentDay >= 30) return;
    if (gameState.debugSkipMidMonthEvents) return;
    if (Math.random() > 0.08) return;

    const rawList = gameEventsData.random_events || [];
    const currentAge = gameState.age || 16;
    const hasJob = !!(gameState.job && gameState.job !== "Unemployed" && gameState.job !== "Thất nghiệp");
    const housingState = gameState.currentHome ? gameState.currentHome.type : "parents";

    if (!gameState.storyFlags) gameState.storyFlags = {};
    if (!gameState.completedEvents) gameState.completedEvents = [];

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

    if (eligibleEvents.length === 0) return;

    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    const modal = document.getElementById("dialogue-event-modal");
    if (!modal) return;

    const randomIndex = Math.floor(Math.random() * eligibleEvents.length);
    const ev = eligibleEvents[randomIndex];

    gameState.completedEvents.push(ev.id);
    if (typeof saveGameState === 'function') saveGameState();

    let targetNPC = null;
    if (gameState.relationships && gameState.relationships.length > 0) {
        targetNPC = gameState.relationships[Math.floor(Math.random() * gameState.relationships.length)];
    }

    const pName = gameState.name || "bạn";
    let dynamicPrompt = ev.prompt || ev.description || "Có chuyện gì đó vừa xảy ra...";

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

function submitDialogueResponse() {
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
    const topic = eventData.topicContext || "life";

    let targetNPC = null;
    if (eventData.targetNpcId && gameState.relationships) {
        targetNPC = gameState.relationships.find(r => r.id === eventData.targetNpcId);
    }

    if (targetNPC && targetNPC.patience <= 0) {
        setTimeout(() => {
            const npcBubble = document.getElementById("dialogue-npc-reply-bubble");
            const npcTextEl = document.getElementById("dialogue-npc-reply-text");
            if (npcTextEl) npcTextEl.innerText = `${targetNPC.name} quay mặt đi, khoanh tay lạnh lùng: "Tôi không có gì để nói chuyện với cậu nữa cả. Tránh ra!"`;
            if (npcBubble) npcBubble.classList.remove("hidden");
            document.getElementById("dialogue-close-btn")?.classList.remove("hidden");
        }, 400);
        return;
    }

    if (eventData.id === "fallback_peace") {
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 1);
        setTimeout(() => {
            const npcBubble = document.getElementById("dialogue-npc-reply-bubble");
            const npcTextEl = document.getElementById("dialogue-npc-reply-text");
            if (npcTextEl) npcTextEl.innerText = "Bạn hít một hơi thật sâu, cảm thấy tâm hồn thư thái hơn đôi chút.";
            if (npcBubble) npcBubble.classList.remove("hidden");
            document.getElementById("dialogue-close-btn")?.classList.remove("hidden");
        }, 400);
        if (typeof saveGameState === 'function') saveGameState();
        if (typeof renderGameState === 'function') renderGameState();
        return;
    }

    const words = rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const isAllUpperCase = rawText === rawText.toUpperCase() && rawText.length > 3;
    const hasSarcasmMarks = text.includes("...") && (text.includes("ghê") || text.includes("lắm") || text.includes("nhỉ"));

    const politeWords = ["xin lỗi", "cảm ơn", "bình tĩnh", "thành thật", "thông cảm", "dạ", "ạ", "giúp", "nhẹ nhàng", "vâng", "thưa"];
    const smartWords = ["doanh thu", "lý do", "kế hoạch", "thực tế", "phân tích", "giải pháp", "chứng minh", "số liệu", "chiến lược", "đầu tư", "cố gắng"];
    const toxicWords = ["cút", "liên quan", "kệ", "chửi", "ngu", "mất dạy", "đéo", "đập", "biến", "điên", "xéo"];
    const funnyWords = ["hihi", "haha", "kaka", "vui", "đùa", "ủa alo", "ngơ", "gì vậy"];

    let scorePolite = politeWords.filter(w => text.includes(w)).length * 2;
    let scoreSmart = smartWords.filter(w => text.includes(w)).length * 3;
    let scoreFunny = funnyWords.filter(w => text.includes(w)).length * 2;
    let scoreAggressive = toxicWords.filter(w => text.includes(w)).length * 4;

    const usesMayTao = text.includes("mày") || text.includes("tao");
    let isCloseRelation = false;
    if (targetNPC) {
        const relLower = (targetNPC.relation || "").toLowerCase();
        if (relLower.includes("bạn") || relLower.includes("chiến hữu") || relLower.includes("đồng nghiệp") || relLower.includes("em")) {
            isCloseRelation = true;
        }
    }

    if (usesMayTao) {
        if (!isCloseRelation) scoreAggressive += 4;
        else scoreFunny += 1;
    }

    if (isAllUpperCase) scoreAggressive += 5;
    if (hasSarcasmMarks) { scoreSmart -= 2; scoreAggressive += 3; }

    let topicBonusText = "";
    if (topic === "work" && (scoreSmart > 0 || text.includes("làm") || text.includes("việc"))) {
        scoreSmart += 2;
        topicBonusText = " [Đúng chủ đề công việc]";
    } else if (topic === "money" && (scoreSmart > 0 || text.includes("tiền") || text.includes("đầu tư") || text.includes("kiếm"))) {
        scoreSmart += 2;
        topicBonusText = " [Tư duy tài chính tốt]";
    } else if (topic === "gossip" && (scoreFunny > 0 || scorePolite > 0 || text.includes("buồn") || text.includes("vui"))) {
        scoreFunny += 2;
        topicBonusText = " [Đồng cảm, xả stress tốt]";
    } else if (topic === "life" && (wordCount >= 6 || scorePolite > 0)) {
        scorePolite += 2;
        topicBonusText = " [Triết lý sâu sắc]";
    }

    let feedback = "";
    let logSummary = "";
    let npcReply = "";
    let npcIcon = "💬";
    let relXpChange = 0;
    let patienceChange = 0;

    if (scoreAggressive > scorePolite && scoreAggressive > scoreSmart && scoreAggressive > scoreFunny) {
        npcIcon = "🤬";
        gameState.ego = Math.min(100, (gameState.ego || 30) + 5);
        gameState.stress = Math.min(100, (gameState.stress || 0) + 10);
        relXpChange = -30;
        patienceChange = -35;
        if (targetNPC) targetNPC.has_offended = true;

        feedback = `🔥 Thái độ hằn học, kém lịch sự! (-30 Mối quan hệ)`;
        logSummary = `${eventData.title}: Tranh cãi căng thẳng`;
        npcReply = `${targetNPC ? targetNPC.name : 'NPC'} hầm hầm lườm bạn: "Cậu bị làm sao thế hả, tự dưng nổi đóa lên à!"`;
    }
    else if (hasSarcasmMarks || (wordCount < 3 && scorePolite === 0 && scoreSmart === 0 && !usesMayTao)) {
        npcIcon = "😒";
        relXpChange = -10;
        patienceChange = -15;

        feedback = `😒 Trả lời hời hợt, nhạt nhẽo (-10 Mối quan hệ)`;
        logSummary = `${eventData.title}: Trò chuyện hời hợt`;
        npcReply = `${targetNPC ? targetNPC.name : 'NPC'} thở dài: "Hỏi thế mà cũng trả lời được, đúng là chán."`;
    }
    else if (scoreFunny > 0 || (wordCount <= 5 && scoreSmart === 0)) {
        npcIcon = "🤣";
        gameState.happiness = Math.min(100, (gameState.happiness || 70) + 4);
        relXpChange = 15;
        patienceChange = 10;

        feedback = `🤪 Trò chuyện vui vẻ, thoải mái! (+15 Mối quan hệ)${topicBonusText}`;
        logSummary = `${eventData.title}: Tâm sự vui vẻ`;
        npcReply = `${targetNPC ? targetNPC.name : 'NPC'} cười phá lên: "Cậu hài hước thật đấy, nghe xong thấy nhẹ cả người!"`;
    }
    else if (scoreSmart >= scorePolite && scoreSmart > 0) {
        npcIcon = "🧠";
        gameState.smarts = Math.min(100, (gameState.smarts || 50) + 4);
        relXpChange = 20;
        patienceChange = 15;

        feedback = `🧠 Phân tích sắc sảo, tư duy tốt! (+4 Trí tuệ, +20 Mối quan hệ)${topicBonusText}`;
        logSummary = `${eventData.title}: Trao đổi góc nhìn sâu sắc`;
        npcReply = `${targetNPC ? targetNPC.name : 'NPC'} gật gù tâm đắc: "Góc nhìn của cậu rất đáng suy ngẫm đấy."`;
    }
    else {
        npcIcon = "🥰";
        gameState.charm = Math.min(100, (gameState.charm || 45) + 3);
        relXpChange = 20;
        patienceChange = 20;

        feedback = `🕊️ Lời đáp nhã nhặn, chân thành! (+20 Mối quan hệ)${topicBonusText}`;
        logSummary = `${eventData.title}: Tâm sự chân thành`;
        npcReply = `${targetNPC ? targetNPC.name : 'NPC'} mỉm cười ấm áp: "Cảm ơn vì đã lắng nghe và chia sẻ chân thành với tôi nhé."`;
    }

    if (targetNPC) {
        if (typeof targetNPC.patience === 'undefined') targetNPC.patience = 100;
        targetNPC.patience = Math.max(0, Math.min(100, targetNPC.patience + patienceChange));

        if (typeof interactWithNPC === 'function') {
            interactWithNPC(targetNPC.id, {}, relXpChange);
        }
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
            };

            container.appendChild(button);
        });
    }

    modal.classList.remove("hidden");
}