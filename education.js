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
    
    if (typeof gameState === 'undefined' || !gameState) return;
    
    const program = educationData.find(p => p.id === programId);
    if (!program) return;
    
    // THÊM ĐOẠN NÀY ĐỂ CHẶN HỌC LẠI
    if (program.rewards && program.rewards.degree_id && gameState.degrees && gameState.degrees.includes(program.rewards.degree_id)) {
        alert("✅ Bạn đã tốt nghiệp và có bằng của chương trình này rồi, không cần học lại!");
        return;
    }
    
    if (gameState.age < program.min_age) {
        alert(`❌ Bạn chưa đủ tuổi! Yêu cầu tối thiểu ${program.min_age} tuổi.`);
        return;
    }
    
    // Thêm vào dưới đoạn check tuổi trong hàm enrollProgram:
    // Đã sửa lại logic check đúng biến isPartTime để chặn học chính quy khi đang làm Full-time
    if (gameState.job && !gameState.job.isPartTime && program.category === 'formal') {
        alert("⚠️ Bạn đang làm công việc Toàn thời gian (Full-time)! Hãy nộp đơn xin nghỉ việc trước khi nhập học hệ Chính Quy để đảm bảo thời gian.");
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
    
    // Khởi tạo biến đếm số tháng khất nợ (nếu chưa có)
    if (typeof edu.unpaidMonths === 'undefined') edu.unpaidMonths = 0;

    let finalTuition = edu.tuitionPerMonth;
    let isScholarship = false;

    // 🌟 LOGIC 1: HỌC BỔNG (Miễn học phí nếu Trí tuệ >= 85)
    if ((gameState.smarts || 0) >= 85) {
        finalTuition = 0;
        isScholarship = true;
        if (typeof addDailyLog === 'function') addDailyLog(`🌟 Nhận học bổng xuất sắc khóa ${edu.name} (Miễn học phí).`);
    }

    // XỬ LÝ HỌC PHÍ (Nếu không có học bổng)
    if (finalTuition > 0) {
        if ((gameState.money || 0) >= finalTuition) {
            // Đủ tiền đóng
            gameState.money -= finalTuition;
            edu.unpaidMonths = 0; // Trả đủ thì reset nợ
            if (typeof addTransactionHistory === 'function') addTransactionHistory(`Học phí: ${edu.name}`, -finalTuition);
        } else {
            // 🌟 LOGIC 2 & 3: VAY VỐN VÀ KHẤT NỢ
            const wantLoan = confirm(`⚠️ Bạn không đủ ${finalTuition}$ đóng học phí tháng này!\n\nBạn có muốn vay Quỹ Sinh Viên để nộp không? (Sẽ bị tính vào Nợ)`);
            
            if (wantLoan) {
                // Chấp nhận vay nợ
                gameState.debt = (gameState.debt || 0) + finalTuition;
                edu.unpaidMonths = 0; // Đã vay để trả học phí nên reset nợ
                if (typeof addDailyLog === 'function') addDailyLog(`💳 Vay quỹ sinh viên ${finalTuition}$ để đóng học phí.`);
                alert(`💳 Bạn đã vay ${finalTuition}$ nộp học phí. Tổng nợ hiện tại: ${gameState.debt}$!`);
            } else {
                // Không chịu vay -> Khất nợ
                edu.unpaidMonths += 1;
                
                if (edu.unpaidMonths >= 3) {
                    // Quá 3 lần khất nợ -> Đuổi học
                    alert(`🚫 BẠN ĐÃ BỊ BUỘC THÔI HỌC!\nLý do: Nợ học phí ${edu.name} quá 3 tháng.`);
                    if (typeof addDailyLog === 'function') addDailyLog(`Bị đuổi học ${edu.name} do nợ học phí.`);
                    gameState.currentEducation = null;
                    
                    if (typeof saveGameState === 'function') saveGameState();
                    if (typeof renderGameState === 'function') renderGameState();
                    return; // Kết thúc việc học tại đây
                } else {
                    // Cảnh cáo
                    alert(`⚠️ CẢNH CÁO NỢ HỌC PHÍ (${edu.unpaidMonths}/3 tháng)!\nTháng sau nếu không đóng hoặc không vay, bạn sẽ bị đuổi học.`);
                    if (typeof addDailyLog === 'function') addDailyLog(`Khất nợ học phí tháng này (${edu.unpaidMonths}/3).`);
                }
            }
        }
    }

    // TRỪ THỂ LỰC VÀ TĂNG TIẾN TRÌNH HỌC (Nếu không bị đuổi)
    gameState.health = Math.max(0, (gameState.health || 100) - (edu.staminaCost || 0));
    edu.monthsCompleted += 1;

    let logMsg = `Theo học: ${edu.name} (${edu.monthsCompleted}/${edu.totalMonths} tháng).`;
    if (!isScholarship && typeof addDailyLog === 'function') addDailyLog(logMsg);

    // XÉT TỐT NGHIỆP KHI ĐỦ THÁNG
    if (edu.monthsCompleted >= edu.totalMonths) {
        if (edu.requiresExam && edu.examQuestions && edu.examQuestions.length > 0) {
            startEducationExam(edu);
        } else {
            completeEducationProgram(edu, true);
        }
    }
}


function handleDropOutEducation() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.currentEducation) return;
    
    const eduName = gameState.currentEducation.name;
    
    // Sử dụng Modal Xác Nhận tùy chỉnh phong cách game
    showGameConfirm(
        `Bạn có chắc chắn muốn nộp đơn THÔI HỌC chương trình: ${eduName}? Mọi tiến trình học tập hiện tại sẽ mất hết!`,
        function() {
            if (typeof addDailyLog === 'function') addDailyLog(`Đã nộp đơn xin thôi học: ${eduName}.`);
            gameState.currentEducation = null;
            alert(`🚪 Bạn đã chính thức thôi học ${eduName}.`);
            
            if (typeof saveGameState === 'function') saveGameState();
            if (typeof renderGameState === 'function') renderGameState();
            renderEducationModalList();
        },
        "Xác Nhận Thôi Học",
        "🚪",
        "📜 Giáo Dục"
    );
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
            action: function() {
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

    // Tạm dừng đồng hồ để tránh lịch nhảy sang tháng lúc đang thi
    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

    function renderQuestionModal() {
        // Nếu đã làm hết số câu hỏi -> Chạy logic báo điểm và đóng Modal
        if (currentQIndex >= questions.length) {
            const passRate = correctAnswers / questions.length;
            if (passRate >= 0.6) {
                alert(`🎉 KỲ THI XUẤT SẮC! Bạn trả lời đúng ${correctAnswers}/${questions.length} câu và đã CHÍNH THỨC TỐT NGHIỆP!`);
                completeEducationProgram(edu, true);
            } else {
                alert(`😭 BẠN ĐÃ TRƯỢT KỲ THI! (Chỉ đúng ${correctAnswers}/${questions.length} câu). Hãy học lại hoặc đăng ký thi lại!`);
                completeEducationProgram(edu, false);
            }

            // Đóng Modal an toàn tuyệt đối
            const eventModal = document.getElementById("event-modal");
            if (eventModal) eventModal.classList.add("hidden");

            // Kích hoạt lại đồng hồ sau khi thi xong
            if (typeof startMonthCalendarTimer === 'function') startMonthCalendarTimer();
            return;
        }

        // Nếu chưa thi xong -> Tiếp tục render câu hỏi hiện tại
        const q = questions[currentQIndex];
        const choices = q.options.map((opt, idx) => ({
            text: opt,
            action: function() {
                if (idx === q.answer) correctAnswers++;
                currentQIndex++;
                
                // Gắn đệ quy: Render lại chính hàm này cho câu tiếp theo
                renderQuestionModal(); 
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

    // Kích hoạt câu đầu tiên
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
        
        // Thay thế đoạn khai báo buttonHTML trong vòng lặp forEach:
        const hasDegree = gameState.degrees && program.rewards && gameState.degrees.includes(program.rewards.degree_id);
        let buttonHTML = '';
        
        if (hasDegree) {
            buttonHTML = `
        <button disabled 
            class="w-full py-2 bg-emerald-800/20 text-emerald-950 font-display font-extrabold rounded-xl text-[10px] cursor-not-allowed border border-emerald-900/20">
            🎓 Đã Tốt Nghiệp
        </button>
    `;
        } else if (isEnrolled) {
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
    closeAllModals(); // Đóng tất cả modal khác trước
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