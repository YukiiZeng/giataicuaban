/**
 * =================================================================
 * ZONE 1: CORE DATA & INITIALIZATION (NẠP DỮ LIỆU HỌC VẤN)
 * =================================================================
 */

let educationData = [];

/**
 * Nạp dữ liệu từ education.json
 */
async function loadEducationData() {
    try {
        const response = await fetch('education.json');
        const data = await response.json();
        educationData = data.education_programs || [];
        console.log("🎓 Đã nạp thành công education.json:", educationData.length, "chương trình.");
    } catch (error) {
        console.error("❌ Lỗi nạp education.json:", error);
    }
}

// Tự động nạp khi load script
loadEducationData();

/**
 * =================================================================
 * ZONE 2: EDUCATION LOGIC & ENROLLMENT (ĐĂNG KÝ & XỬ LÝ HỌC TẬP)
 * =================================================================
 */

/**
 * Đăng ký tham gia một khóa học / chương trình đào tạo
 */
function enrollProgram(programId) {
    if (!gameState) return;

    const program = educationData.find(p => p.id === programId);
    if (!program) return;

    // 1. Kiểm tra độ tuổi
    if (gameState.age < program.min_age) {
        alert(`❌ Bạn chưa đủ tuổi! Yêu cầu tối thiểu ${program.min_age} tuổi.`);
        return;
    }

    // 2. Kiểm tra bằng cấp tiên quyết (Prerequisites)
    if (program.prerequisites && program.prerequisites.length > 0) {
        const myDegrees = gameState.degrees || [];
        const hasAllPrereqs = program.prerequisites.every(req => myDegrees.includes(req));
        if (!hasAllPrereqs) {
            alert("❌ Bạn chưa có đủ bằng cấp yêu cầu để đăng ký học ngành này!");
            return;
        }
    }

    // 3. Kiểm tra xem đang học khóa khác chưa
    if (gameState.currentEducation) {
        alert(`⚠️ Bạn đang theo học: ${gameState.currentEducation.name}. Hãy hoàn thành hoặc bỏ học trước!`);
        return;
    }

    // Tiến hành đăng ký
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
        rewards: program.rewards
    };

    alert(`🎉 Bạn đã đăng ký thành công: ${program.name}!`);
    if (typeof showEducationModal === 'function') showEducationModal(false);
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * Cập nhật tiến trình học tập hàng tháng (Gọi trong nextMonth ở logic.js)
 */
function processMonthlyEducation() {
    if (!gameState || !gameState.currentEducation) return;

    const edu = gameState.currentEducation;

    // 1. Trừ tiền học phí & Trừ sức khỏe
    if ((gameState.money || 0) < edu.tuitionPerMonth) {
        alert(`⚠️ Bạn không đủ tiền đóng học phí (${edu.tuitionPerMonth}$)! Bạn đã bị đình chỉ học.`);
        gameState.currentEducation = null;
        return;
    }

    gameState.money -= edu.tuitionPerMonth;
    gameState.health = Math.max(0, (gameState.health || 100) - edu.staminaCost);
    edu.monthsCompleted += 1;

    console.log(`📚 Học tập: ${edu.name} (${edu.monthsCompleted}/${edu.totalMonths} tháng)`);

    // 2. Kiểm tra nếu hoàn thành đủ số tháng
    if (edu.monthsCompleted >= edu.totalMonths) {
        if (edu.requiresExam && edu.examQuestions.length > 0) {
            // Kích hoạt Quiz Thi Tốt Nghiệp / Chuyển Cấp
            startEducationExam(edu);
        } else {
            // Cấp bằng ngay đối với Hệ chứng chỉ / Nghề ngắn hạn
            completeEducationProgram(edu, true);
        }
    }
}
/**
 * =================================================================
 * ZONE 3: EXAM SYSTEM & GRADUATION (THI TỐT NGHIỆP & CẤP BẰNG)
 * =================================================================
 */

/**
 * Kích hoạt Modal Quiz Thi Tốt Nghiệp
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
                    // Tóm tắt kết quả
                    const passRate = correctAnswers / questions.length;
                    if (passRate >= 0.6) {
                        alert(`🎉 KỲ THI HOÀN HẢO! Bạn trả lời đúng ${correctAnswers}/${questions.length} câu và đã TỐT NGHIỆP!`);
                        completeEducationProgram(edu, true);
                    } else {
                        alert(`😭 BẠN ĐÃ TRƯỢT KỲ THI! (Chỉ đúng ${correctAnswers}/${questions.length} câu). Hãy học lại hoặc thi lại!`);
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

/**
 * Xử lý Tốt nghiệp hoặc Trượt
 */
function completeEducationProgram(edu, isPassed) {
    if (!gameState) return;

    if (!gameState.degrees) gameState.degrees = [];

    if (isPassed && edu.rewards) {
        // Thêm Bằng Cấp vào danh sách cá nhân
        if (edu.rewards.degree_id && !gameState.degrees.includes(edu.rewards.degree_id)) {
            gameState.degrees.push(edu.rewards.degree_id);
        }

        // Cộng chỉ số phần thưởng
        if (edu.rewards.smarts_bonus) gameState.smarts = Math.min(100, (gameState.smarts || 50) + edu.rewards.smarts_bonus);
        if (edu.rewards.charm_bonus) gameState.charm = Math.min(100, (gameState.charm || 45) + edu.rewards.charm_bonus);
        if (edu.rewards.strength_bonus) gameState.strength = Math.min(100, (gameState.strength || 50) + edu.rewards.strength_bonus);
        if (edu.rewards.looks_bonus) gameState.looks = Math.min(100, (gameState.looks || 60) + edu.rewards.looks_bonus);
    }

    // Giải phóng trạng thái đang học
    gameState.currentEducation = null;

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}
