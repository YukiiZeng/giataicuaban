/**
 * =================================================================
 * ZONE 1: JOBS DATA & INITIALIZATION (NẠP DỮ LIỆU CÔNG VIỆC)
 * =================================================================
 */

let jobsData = [];

/**
 * Nạp dữ liệu từ jobs.json
 */
async function loadJobsData() {
    try {
        const response = await fetch('jobs.json');
        const data = await response.json();
        jobsData = data.careers || [];
        console.log("💼 Đã nạp thành công jobs.json:", jobsData.length, "lĩnh vực nghề nghiệp.");
    } catch (error) {
        console.error("❌ Lỗi nạp jobs.json:", error);
    }
}

// Tự động nạp khi load script
loadJobsData();

/**
 * =================================================================
 * ZONE 2: JOB APPLICATION & MONTHLY PROCESS (ỨNG TUYỂN & TÍNH LƯƠNG)
 * =================================================================
 */

/**
 * Nộp đơn xin việc / Nâng cấp thăng tiến
 */
/**
 * Nộp đơn xin việc / Nâng cấp thăng tiến (Đã cập nhật tự động Refresh UI)
 */
function applyForJob(jobId) {
    if (!gameState) return;

    let targetJob = null;
    let targetTrack = null;

    for (const track of jobsData) {
        const found = track.levels.find(j => j.id === jobId);
        if (found) {
            targetJob = found;
            targetTrack = track;
            break;
        }
    }

    if (!targetJob) return;

    // Kiểm tra độ tuổi, bằng cấp & chỉ số...
    if (gameState.age < targetJob.min_age) {
        alert(`❌ Bạn chưa đủ tuổi! Yêu cầu tối thiểu ${targetJob.min_age} tuổi.`);
        return;
    }

    if (targetJob.required_degrees && targetJob.required_degrees.length > 0) {
        const myDegrees = gameState.degrees || [];
        const hasDegree = targetJob.required_degrees.some(deg => myDegrees.includes(deg));
        if (!hasDegree) {
            alert("❌ Bạn chưa có Bằng cấp / Chứng chỉ đáp ứng yêu cầu công việc này!");
            return;
        }
    }

    // Nhận việc
    gameState.job = {
        id: targetJob.id,
        title: targetJob.title,
        trackId: targetTrack.track_id,
        level: targetJob.level,
        salary: targetJob.salary_per_month,
        stressCost: targetJob.stress_cost,
        monthsExperience: 0,
        expRequiredForNext: targetJob.exp_required_for_next
    };

    alert(`🎉 Chúc mừng! Bạn đã nhận vị trí: ${targetJob.title} với mức lương ${targetJob.salary_per_month}$/tháng!`);
    
    if (typeof showJobsModal === 'function') showJobsModal(false);
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}


/**
 * Xử lý nhận lương & tính kinh nghiệm làm việc hàng tháng
 */
function processMonthlyJob() {
    if (!gameState || !gameState.job) return;

    const job = gameState.job;

    // 1. Nhận lương & Trừ sức khỏe do áp lực công việc
    gameState.money = (gameState.money || 0) + job.salary;
    gameState.health = Math.max(0, (gameState.health || 100) - job.stressCost);

    // 2. Tích lũy số tháng kinh nghiệm
    job.monthsExperience = (job.monthsExperience || 0) + 1;

    console.log(`💼 Đi làm: ${job.title} (+${job.salary}$) - Tích lũy: ${job.monthsExperience} tháng kinh nghiệm.`);
}

/**
 * =================================================================
 * ZONE 3: JOBS & EDUCATION MODAL RENDERERS (RENDER UI CÔNG VIỆC & HỌC VẤN)
 * =================================================================
 */

/**
 * Render Danh sách Chương trình Đào tạo vào Modal
 */
function renderEducationModalList() {
    const modalList = document.getElementById("education-modal-list");
    if (!modalList) return;

    modalList.innerHTML = "";

    // Nếu dữ liệu JSON chưa nạp xong
    if (typeof educationData === 'undefined' || !educationData || educationData.length === 0) {
        modalList.innerHTML = `
            <div class="text-center py-6 flex flex-col items-center gap-1">
                <span class="text-2xl">⌛</span>
                <p class="text-xs font-bold text-amber-900">Đang tải danh sách khóa học...</p>
            </div>
        `;
        // Thử nạp lại nếu chưa có data
        if (typeof loadEducationData === 'function') loadEducationData();
        return;
    }

    const currentEdu = gameState ? gameState.currentEducation : null;

    educationData.forEach(program => {
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40 mb-2 shrink-0";

        const isFormal = program.category === 'formal';
        const tagText = isFormal ? "🎓 Chính Quy (Có Thi)" : "📜 Chứng Chỉ Ngắn Hạn";

        // Kiểm tra xem người chơi có đang học khóa này không
        const isEnrolled = currentEdu && currentEdu.id === program.id;

        let buttonHTML = '';
        if (isEnrolled) {
            buttonHTML = `
                <button disabled 
                    class="w-full py-2 bg-amber-800/20 text-amber-950 font-display font-extrabold rounded-xl text-[10px] cursor-not-allowed border border-amber-900/20 flex items-center justify-center gap-1">
                    <span>✅</span>
                    <span>Đang Theo Học (${currentEdu.monthsCompleted}/${currentEdu.totalMonths}T)</span>
                </button>
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

/**
 * Ẩn / Hiện Modal Chương Trình Đào Tạo
 */
function showEducationModal(show) {
    const modal = document.getElementById("education-modal");
    if (modal) {
        if (show) {
            if (typeof renderEducationModalList === 'function') {
                renderEducationModalList();
            }
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}

/**
 * Render Danh sách Công Việc trong Modal
 */
function renderJobsModalList() {
    const modalList = document.getElementById("jobs-modal-list");
    if (!modalList) return;

    modalList.innerHTML = "";

    if (typeof jobsData === 'undefined' || !jobsData || jobsData.length === 0) {
        modalList.innerHTML = `
            <div class="text-center py-6 flex flex-col items-center gap-1">
                <span class="text-2xl">⌛</span>
                <p class="text-xs font-bold text-amber-900">Đang tải danh sách công việc...</p>
            </div>
        `;
        if (typeof loadJobsData === 'function') loadJobsData();
        return;
    }

    const currentJob = gameState ? gameState.job : null;

    // 1. NẾU ĐANG CÓ VIỆC LÀM: Hiển thị Banner công việc hiện tại + Nút Xin Thôi Việc
    if (currentJob) {
        const currentJobCard = document.createElement("div");
        currentJobCard.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-teal-400/60 bg-teal-50/50 mb-3";
        currentJobCard.innerHTML = `
            <div class="flex justify-between items-center border-b border-teal-900/10 pb-1.5">
                <span class="text-[10px] font-extrabold text-teal-900 uppercase">💼 Công Việc Hiện Tại</span>
                <span class="text-[9px] font-black text-white bg-teal-600 px-2 py-0.5 rounded-md">Lvl ${currentJob.level || 1}</span>
            </div>
            <div class="flex justify-between items-center">
                <div class="flex flex-col">
                    <span class="text-xs font-black text-teal-950">${currentJob.title}</span>
                    <span class="text-[10px] text-teal-800/80">Thâm niên: ${currentJob.monthsExperience || 0} tháng</span>
                </div>
                <span class="text-xs font-black text-emerald-700 font-mono">+${(currentJob.salary || 0).toLocaleString()} $/tháng</span>
            </div>
            <button onclick="handleResignJob()" 
                class="w-full py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95 border border-rose-300">
                🚪 Xin Thôi Việc (Nghỉ Việc)
            </button>
        `;
        modalList.appendChild(currentJobCard);
    }

    // 2. DUYỆT DANH SÁCH CÁC NGÀNH NGHỀ
    jobsData.forEach(track => {
        const trackTitle = document.createElement("div");
        trackTitle.className = "text-xs font-black text-amber-950 uppercase border-b border-amber-900/10 pb-1 mt-2 mb-1";
        trackTitle.innerText = `📂 ${track.track_name}`;
        modalList.appendChild(trackTitle);

        track.levels.forEach(job => {
            const item = document.createElement("div");
            item.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40 mb-2";

            const isWorkingThis = currentJob && currentJob.id === job.id;

            let buttonHTML = '';
            if (isWorkingThis) {
                buttonHTML = `
                    <button disabled 
                        class="w-full py-2 bg-teal-600/80 text-white font-display font-extrabold rounded-xl text-[10px] cursor-not-allowed opacity-90 flex items-center justify-center gap-1">
                        <span>✅</span>
                        <span>Đang Làm Vị Trí Này</span>
                    </button>
                `;
            } else {
                const btnText = currentJob ? "🔄 Chuyển Sang Việc Này" : "💼 Nộp Đơn Xin Việc";
                buttonHTML = `
                    <button onclick="applyForJob('${job.id}')" 
                        class="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95">
                        ${btnText}
                    </button>
                `;
            }

            item.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex flex-col">
                        <span class="text-xs font-extrabold text-amber-950">Lvl ${job.level}: ${job.title}</span>
                        <span class="text-[10px] text-amber-800/80 mt-0.5">Yêu cầu: ${job.min_age} tuổi</span>
                    </div>
                    <span class="text-xs font-black text-emerald-700 font-mono">${job.salary_per_month} $/tháng</span>
                </div>
                ${buttonHTML}
            `;

            modalList.appendChild(item);
        });
    });
}

/**
 * Xử lý khi xin thôi việc
 */
function handleResignJob() {
    if (!gameState || !gameState.job) return;

    if (confirm(`Bạn có chắc chắn muốn nghỉ việc vị trí: ${gameState.job.title}?`)) {
        console.log(`🚪 Đã nghỉ việc: ${gameState.job.title}`);
        gameState.job = null;

        if (typeof renderJobsModalList === 'function') renderJobsModalList();
        if (typeof saveGameState === 'function') saveGameState();
        if (typeof renderGameState === 'function') renderGameState();
    }
}

/**
 * Ẩn / Hiện Modal Tìm Việc
 */
function showJobsModal(show) {
    const modal = document.getElementById("jobs-modal");
    if (modal) {
        if (show) {
            renderJobsModalList();
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}
