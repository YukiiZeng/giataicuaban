/**
 * =================================================================
 * ZONE 1: CORE DATA & INITIALIZATION (NẠP DỮ LIỆU HỌC VẤN)
 * =================================================================
 */

let educationData = [];

async function loadEducationData() {
    try {
        const response = await fetch('education.json');
        if (response.ok) {
            const data = await response.json();
            educationData = data.education_programs || [];
            console.log("🎓 Đã nạp thành công education.json:", educationData.length, "chương trình.");
        }
    } catch (error) {
        console.error("❌ Lỗi nạp education.json:", error);
    }
}

loadEducationData();

/**
 * =================================================================
 * ZONE 2: EDUCATION ENROLLMENT & MONTHLY PROCESS (ĐĂNG KÝ & XỬ LÝ HỌC TẬP)
 * =================================================================
 */

function enrollProgram(programId) {
    if (typeof gameState === 'undefined' || !gameState) return;

    const program = educationData.find(p => p.id === programId);
    if (!program) return;

    if (gameState.age < program.min_age) {
        alert(`❌ Bạn chưa đủ tuổi! Yêu cầu tối thiểu ${program.min_age} tuổi.`);
        return;
    }

    if (program.prerequisites && program.prerequisites.length > 0) {
        const myDegrees = gameState.degrees || [];
        const hasAllPrereqs = program.prerequisites.every(req => myDegrees.includes(req));
        if (!hasAllPrereqs) {
            alert("❌ Bạn chưa có đủ Bằng cấp tiên quyết để đăng ký học ngành này!");
            return;
        }
    }

    if (gameState.currentEducation) {
        alert(`⚠️ Bạn đang theo học: ${gameState.currentEducation.name}. Hãy hoàn thành hoặc thôi học trước!`);
        return;
    }

    gameState.currentEducation = {
        id: program.id,
        name: program.name,
        category: program.category,
        monthsCompleted: 0,
        totalMonths: program.duration_months,
        tuitionPerMonth: program.tuition_per_month,
        staminaCost: program.stamina_cost_per_month,
        requiresExam: program.requires_exam,
        examQuestions: program.exam_questions || [],
        rewards: program.rewards,
        answeredSkipExamIds: [],
        hasTakenSkipExamThisMonth: false // 🚀 Khởi tạo cờ giới hạn 1 lần/tháng
    };

    alert(`🎉 Bạn đã đăng ký nhập học thành công: ${program.name}!`);

    if (typeof addMilestoneLog === 'function') addMilestoneLog(`Nhập học: ${program.name}`);
    if (typeof showEducationModal === 'function') showEducationModal(false);
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

function processMonthlyEducation() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.currentEducation) return;

    const edu = gameState.currentEducation;

    // 🚀 RESET CỜ THI VƯỢT CẤP KHI BƯỚC SANG THÁNG MỚI
    edu.hasTakenSkipExamThisMonth = false;

    if ((gameState.money || 0) < edu.tuitionPerMonth) {
        alert(`⚠️ Bạn không đủ tiền đóng học phí (${edu.tuitionPerMonth}$)! Bạn đã bị buộc đình chỉ học.`);
        if (typeof addDailyLog === 'function') addDailyLog(`Bị buộc đình chỉ học ${edu.name} do không đủ tiền.`);
        gameState.currentEducation = null;
        return;
    }

    gameState.money -= edu.tuitionPerMonth;
    gameState.health = Math.max(0, (gameState.health || 100) - (edu.staminaCost || 0));
    edu.monthsCompleted += 1;

    if (typeof addDailyLog === 'function') addDailyLog(`Theo học: ${edu.name} (${edu.monthsCompleted}/${edu.totalMonths} tháng).`);
    if (typeof addTransactionHistory === 'function') addTransactionHistory(`Học phí: ${edu.name}`, -edu.tuitionPerMonth);

    if (edu.monthsCompleted >= edu.totalMonths) {
        if (edu.requiresExam && edu.examQuestions.length > 0) {
            startEducationExam(edu);
        } else {
            completeEducationProgram(edu, true);
        }
    }
}
function handleDropOutEducation() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.currentEducation) return;

    const eduName = gameState.currentEducation.name;
    if (confirm(`Bạn có chắc chắn muốn nộp đơn THÔI HỌC chương trình: ${eduName}?`)) {
        if (typeof addDailyLog === 'function') addDailyLog(`Đã nộp đơn xin thôi học: ${eduName}.`);
        gameState.currentEducation = null;
        alert(`🚪 Bạn đã chính thức thôi học ${eduName}.`);

        if (typeof saveGameState === 'function') saveGameState();
        if (typeof renderGameState === 'function') renderGameState();
        renderEducationModalList();
    }
}

/**
 * Xử lý Thi Vượt Cấp (Rút ngắn 2 tháng học / 1 câu trả lời đúng)
 */
function handleTakeSkipExam() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.currentEducation) return;

    const eduState = gameState.currentEducation;

    // 🚀 KIỂM TRA GIỚI HẠN THÁNG NÀY ĐÃ THI CHƯA
    if (eduState.hasTakenSkipExamThisMonth) {
        return alert("⏳ Bạn đã dùng hết quyền Thi Vượt Cấp của tháng này! Hãy chờ sang tháng sau nhé.");
    }

    const programData = educationData.find(p => p.id === eduState.id);

    if (!programData || !programData.skip_exam_questions || programData.skip_exam_questions.length === 0) {
        return alert("⚠️ Chương trình học này hiện không hỗ trợ thi vượt cấp!");
    }

    if (!eduState.answeredSkipExamIds) eduState.answeredSkipExamIds = [];

    const availableQuestions = programData.skip_exam_questions.filter(q => !eduState.answeredSkipExamIds.includes(q.id));

    if (availableQuestions.length === 0) {
        return alert("🏆 Bạn đã hoàn thành toàn bộ các câu hỏi Thi Vượt Cấp của khóa học này!");
    }

    const q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    eduState.answeredSkipExamIds.push(q.id);
    
    // 🚀 ĐÁNH DẤU LÀ ĐÃ THI TRONG THÁNG NÀY
    eduState.hasTakenSkipExamThisMonth = true;

    if (typeof showEducationModal === 'function') {
        showEducationModal(false);
    }

    if (typeof showEventModal === 'function') {
        const choices = q.options.map((opt, idx) => ({
            text: opt,
            action: function () {
                const isCorrect = (idx === q.answer);
                if (isCorrect) {
                    eduState.monthsCompleted = Math.min(eduState.totalMonths, eduState.monthsCompleted + 2);
                    alert(`🎉 CHÍNH XÁC! Bạn đã trả lời đúng và được ĐẶC CÁCH TIẾT KIỆM 2 THÁNG HỌC! (${eduState.monthsCompleted}/${eduState.totalMonths}T)`);

                    if (typeof addDailyLog === 'function') addDailyLog(`Thi vượt cấp thành công: Rút ngắn 2 tháng học ${eduState.name}.`);

                    if (eduState.monthsCompleted >= eduState.totalMonths) {
                        if (eduState.requiresExam && eduState.examQuestions.length > 0) {
                            startEducationExam(eduState);
                        } else {
                            completeEducationProgram(eduState, true);
                        }
                    }
                } else {
                    alert(`❌ RẤT TIẾC, ĐÁP ÁN SAI! Bạn không được cộng tháng học lần này.`);
                    if (typeof addDailyLog === 'function') addDailyLog(`Thi vượt cấp thất bại môn ${eduState.name}.`);
                }

                if (typeof saveGameState === 'function') saveGameState();
                if (typeof renderGameState === 'function') renderGameState();

                const eventModal = document.getElementById("event-modal");
                if (eventModal) eventModal.classList.add("hidden");
            }
        }));

        showEventModal({
            tag: "⚡ THI VƯỢT CẤP (TIẾT KIỆM 2 THÁNG)",
            icon: "🧠",
            title: `Câu Hỏi Trí Tuệ (Đã trả lời ${eduState.answeredSkipExamIds.length}/18)`,
            description: q.q,
            choices: choices
        });
    }
}

/**
 * =================================================================
 * ZONE 3: EXAM SYSTEM & GRADUATION (THI TỐT NGHIỆP & CẤP BẰNG)
 * =================================================================
 */

function startEducationExam(edu) {
    if (typeof showEventModal !== 'function') return;

    let currentQIndex = 0;
    let correctAnswers = 0;
    const questions = edu.examQuestions;

    function renderQuestionModal() {
        const q = questions[currentQIndex];
        const choices = q.options.map((opt, idx) => ({
            text: opt,
            action: function() {
                if (idx === q.answer) correctAnswers++;
                currentQIndex++;

                if (currentQIndex < questions.length) {
                    renderQuestionModal();
                } else {
                    const passRate = correctAnswers / questions.length;
                    if (passRate >= 0.6) {
                        alert(`🎉 KỲ THI XUẤT SẮC! Bạn trả lời đúng ${correctAnswers}/${questions.length} câu và đã CHÍNH THỨC TỐT NGHIỆP!`);
                        completeEducationProgram(edu, true);
                    } else {
                        alert(`😭 BẠN ĐÃ TRƯỢT KỲ THI! (Chỉ đúng ${correctAnswers}/${questions.length} câu). Hãy học lại hoặc đăng ký thi lại!`);
                        completeEducationProgram(edu, false);
                    }
                }
            }
        }));

        showEventModal({
            tag: "📝 KỲ THI TỐT NGHIỆP / CHUYỂN CẤP",
            icon: "🎓",
            title: `${edu.name} (Câu ${currentQIndex + 1}/${questions.length})`,
            description: q.q,
            choices: choices
        });
    }

    renderQuestionModal();
}

function completeEducationProgram(edu, isPassed) {
    if (typeof gameState === 'undefined' || !gameState) return;

    if (!gameState.degrees) gameState.degrees = [];

    if (isPassed && edu.rewards) {
        if (edu.rewards.degree_id && !gameState.degrees.includes(edu.rewards.degree_id)) {
            gameState.degrees.push(edu.rewards.degree_id);
        }

        if (edu.rewards.smarts_bonus) gameState.smarts = Math.min(100, (gameState.smarts || 50) + edu.rewards.smarts_bonus);
        if (edu.rewards.charm_bonus) gameState.charm = Math.min(100, (gameState.charm || 45) + edu.rewards.charm_bonus);
        if (edu.rewards.strength_bonus) gameState.strength = Math.min(100, (gameState.strength || 50) + edu.rewards.strength_bonus);
        if (edu.rewards.looks_bonus) gameState.looks = Math.min(100, (gameState.looks || 60) + edu.rewards.looks_bonus);

        if (typeof addMilestoneLog === 'function') addMilestoneLog(`Tốt nghiệp xuất sắc: ${edu.name}`);
    } else {
        if (typeof addDailyLog === 'function') addDailyLog(`Thi trượt kỳ thi tốt nghiệp: ${edu.name}`);
    }

    gameState.currentEducation = null;

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * =================================================================
 * ZONE 4: EDUCATION MODAL RENDERER & UI CONTROLLER (HIỂN THỊ MODAL)
 * =================================================================
 */

function renderEducationModalList() {
    const modalList = document.getElementById("education-modal-list");
    if (!modalList) return;

    modalList.innerHTML = "";

    if (!educationData || educationData.length === 0) {
        modalList.innerHTML = `
            <div class="text-center py-6 flex flex-col items-center gap-1">
                <span class="text-2xl">⌛</span>
                <p class="text-xs font-bold text-amber-900">Đang tải danh sách khóa học...</p>
            </div>
        `;
        loadEducationData();
        return;
    }

    const currentEdu = gameState ? gameState.currentEducation : null;

    educationData.forEach(program => {
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40 mb-2 shrink-0";

        const isFormal = program.category === 'formal';
        const tagText = isFormal ? "🎓 Chính Quy (Có Thi)" : "📜 Chứng Chỉ Ngắn Hạn";

        const isEnrolled = currentEdu && currentEdu.id === program.id;

        let buttonHTML = '';
        if (isEnrolled) {
            const answeredCount = (currentEdu.answeredSkipExamIds || []).length;
            buttonHTML = `
                <div class="flex flex-col gap-1.5 w-full">
                    <button disabled 
                        class="w-full py-2 bg-amber-800/20 text-amber-950 font-display font-extrabold rounded-xl text-[10px] cursor-not-allowed border border-amber-900/20 flex items-center justify-center gap-1">
                        <span>✅</span>
                        <span>Đang Theo Học (${currentEdu.monthsCompleted}/${currentEdu.totalMonths}T)</span>
                    </button>
                    
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="handleTakeSkipExam()" 
                            class="py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1 border border-amber-300/40">
                            <span>⚡</span>
                            <span>Thi Vượt Cấp (${answeredCount}/18)</span>
                        </button>

                        <button onclick="handleDropOutEducation()" 
                            class="py-2 bg-rose-500 hover:bg-rose-600 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1 border border-rose-300">
                            <span>🚪</span>
                            <span>Thôi Học</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            buttonHTML = `
                <button onclick="enrollProgram('${program.id}')" 
                    class="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95">
                    📝 Đăng Ký Nhập Học
                </button>
            `;
        }

        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex flex-col">
                    <span class="text-[9px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md w-fit mb-1">${tagText}</span>
                    <span class="text-xs font-extrabold text-amber-950">${program.name}</span>
                    <span class="text-[10px] text-amber-800/80 mt-0.5">Thời gian: ${program.duration_months} tháng | Học phí: ${program.tuition_per_month}$/tháng</span>
                </div>
            </div>
            ${buttonHTML}
        `;

        modalList.appendChild(item);
    });
}

function showEducationModal(show) {
    const modal = document.getElementById("education-modal");
    if (modal) {
        if (show) {
            renderEducationModalList();
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}