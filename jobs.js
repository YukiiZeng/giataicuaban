/**
 * =================================================================
 * ZONE 1: JOBS DATA & INITIALIZATION (NẠP DỮ LIỆU CÔNG VIỆC)
 * =================================================================
 */

// Lưu trữ danh sách nghề nghiệp nạp từ file jobs.json
let jobsData = [];

/**
 * Nạp dữ liệu ngành nghề từ jobs.json
 */
async function loadJobsData() {
    try {
        const response = await fetch('jobs.json');
        if (response.ok) {
            const data = await response.json();
            jobsData = data.careers || [];
            console.log("💼 Đã nạp thành công jobs.json:", jobsData.length, "lĩnh vực nghề nghiệp.");
        }
    } catch (error) {
        console.error("❌ Lỗi nạp jobs.json:", error);
    }
}

// Tự động nạp dữ liệu khi load script
loadJobsData();


/**
 * =================================================================
 * ZONE 2: JOB PROCESS & APPLICATION LOGIC (ỨNG TUYỂN & TÍNH LƯƠNG)
 * =================================================================
 */

/**
 * Nộp đơn xin việc / Chuyển vị trí công việc
 * @param {string} jobId ID công việc trong jobs.json
 */
function applyForJob(jobId) {
    if (typeof gameState === 'undefined' || !gameState) return;
    
    let targetJob = null;
    let targetTrack = null;
    
    // Tìm kiếm vị trí công việc trong cây danh mục
    for (const track of jobsData) {
        const found = track.levels.find(j => j.id === jobId);
        if (found) {
            targetJob = found;
            targetTrack = track;
            break;
        }
    }
    
    if (!targetJob) return;
    
    // 1. Kiểm tra điều kiện độ tuổi
    if (gameState.age < targetJob.min_age) {
        alert(`❌ Bạn chưa đủ tuổi! Yêu cầu tối thiểu ${targetJob.min_age} tuổi.`);
        return;
    }
    
    // 2. Kiểm tra điều kiện Bằng cấp / Chứng chỉ (Sử dụng hệ thống quy đổi cấp bậc)
    if (targetJob.required_degrees && targetJob.required_degrees.length > 0) {
        const hasValidDegree = checkHasRequiredDegrees(targetJob.required_degrees);
        if (!hasValidDegree) {
            alert("❌ Bạn chưa có Bằng cấp / Chứng chỉ đáp ứng yêu cầu công việc này!");
            return;
        }
    }
    
    
    // 3. 🚀 Kiểm tra quy tắc Vừa học vừa làm (Part-time / Full-time)
    const isFormalEdu = gameState.currentEducation && gameState.currentEducation.category === 'formal';
    if (isFormalEdu && !targetJob.is_part_time) {
        alert(`❌ Bạn đang theo học chương trình chính quy! Khung thời gian bận rộn không cho phép nhận việc Full-time (${targetJob.title}). Bạn chỉ có thể làm việc bán thời gian (Part-time).`);
        return;
    }
    
    // 4. Tiến hành nhận việc
    gameState.job = {
        id: targetJob.id,
        title: targetJob.title,
        trackId: targetTrack.track_id,
        level: targetJob.level,
        salary: targetJob.salary_per_month,
        stressCost: targetJob.stress_cost,
        isPartTime: targetJob.is_part_time || false,
        monthsExperience: 0,
        expRequiredForNext: targetJob.exp_required_for_next
    };
    
    alert(`🎉 Chúc mừng! Bạn đã nhận vị trí: ${targetJob.title} với mức lương ${targetJob.salary_per_month}$/tháng!`);
    
    // Ghi nhận cột mốc xin việc thành công
    if (typeof addMilestoneLog === 'function') {
        addMilestoneLog(`Nhận việc mới: ${targetJob.title}`);
    }
    
    if (typeof showJobsModal === 'function') showJobsModal(false);
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
}

/**
 * Xử lý nhận lương & tính kinh nghiệm làm việc hàng tháng (Gọi trong nextMonth ở logic.js)
 */
function processMonthlyJob() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.job) return;
    
    const job = gameState.job;
    
    // 1. Nhận lương (Đã bỏ dòng trừ health trực tiếp ở đây để tránh trùng lặp với Health Engine)
    gameState.money = (gameState.money || 0) + (job.salary || 0);
    if (typeof showFloatingText === 'function') {
        showFloatingText('money', `+${job.salary}$`, 'pos');
    }
    
    if (typeof addDailyLog === 'function') {
        addDailyLog(`Đi làm: ${job.title} (+${job.salary}$) - Thâm niên ${job.monthsExperience + 1} tháng.`);
    }
    if (typeof addTransactionHistory === 'function') {
        addTransactionHistory(`Lương: ${job.title}`, job.salary);
    }
    
    // 2. Tích lũy số tháng kinh nghiệm
    job.monthsExperience = (job.monthsExperience || 0) + 1;
    
    console.log(`💼 Đi làm: ${job.title} (+${job.salary}$) - Tích lũy: ${job.monthsExperience} tháng kinh nghiệm.`);

    // 🚀 TÍNH TỶ LỆ KẾT BẠN TỪ CÔNG VIỆC (5% cơ bản + 1%/tháng thâm niên, tối đa +10%)
    const baseChance = 0.05;
    const expBonus = Math.min(0.10, (job.monthsExperience || 0) * 0.01);
    const totalChance = baseChance + expBonus;

    if (Math.random() < totalChance) {
        // Xác định loại mối quan hệ dựa trên công việc
        let relationTitle = "Đồng nghiệp";
        if (job.id.includes("shipper") || job.id.includes("driver")) relationTitle = "Khách quen";
        else if (job.id.includes("manager") || job.id.includes("lead") || job.id.includes("ceo")) relationTitle = "Đối tác làm ăn";

        if (typeof generateRandomNPC === 'function') {
            const newColleague = generateRandomNPC(relationTitle, "work");
            if (typeof addDailyLog === 'function') {
                addDailyLog(`💼 Đi làm gặp gỡ và quen biết thêm ${newColleague.name} (${relationTitle}).`);
            }
        }
    }
}


/**
 * Xử lý khi người chơi tự xin thôi việc (Nghỉ việc)
 */
function handleResignJob() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.job) return;

    const jobTitle = gameState.job.title;

    // Sử dụng Modal Xác Nhận tùy chỉnh phong cách game
    showGameConfirm(
        `Bạn có chắc chắn muốn nộp đơn xin nghỉ việc vị trí: ${jobTitle}?`,
        function() {
            console.log(`🚪 Đã nghỉ việc: ${jobTitle}`);

            if (typeof addDailyLog === 'function') {
                addDailyLog(`Đã nộp đơn xin thôi việc vị trí: ${jobTitle}`);
            }

            gameState.job = null;

            if (typeof renderJobsModalList === 'function') renderJobsModalList();
            if (typeof saveGameState === 'function') saveGameState();
            if (typeof renderGameState === 'function') renderGameState();
        },
        "Xác Nhận Thôi Việc",
        "💼",
        "🏢 Sự Nghiệp"
    );
}


/**
 * =================================================================
 * ZONE 3: JOBS MODAL RENDERER & UI CONTROLLER (HIỂN THỊ MODAL VIỆC LÀM)
 * =================================================================
 */

/**
 * Render Danh sách Công Việc trong Modal Cơ Hội Việc Làm
 */
function renderJobsModalList() {
    const modalList = document.getElementById("jobs-modal-list");
    if (!modalList) return;
    
    modalList.innerHTML = "";
    
    // Nếu dữ liệu JSON chưa tải xong
    if (!jobsData || jobsData.length === 0) {
        modalList.innerHTML = `
            <div class="text-center py-6 flex flex-col items-center gap-1">
                <span class="text-2xl">⌛</span>
                <p class="text-xs font-bold text-amber-900">Đang tải danh sách công việc...</p>
            </div>
        `;
        loadJobsData();
        return;
    }
    
    const currentJob = gameState ? gameState.job : null;
    
    // 1. Hiển thị Banner Công Việc Hiện Tại & Nút Nghỉ Việc (nếu đang đi làm)
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
    
    // 2. Duyệt qua từng danh mục ngành nghề
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
 * Ẩn / Hiện Modal Tìm Việc Làm
 * @param {boolean} show 
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
// BẢNG QUY ĐỔI BẰNG CẤP BẬC CAO
// Cấu trúc: "bằng_yêu_cầu": ["danh_sách_các_bằng_cao_hơn_được_chấp_nhận"]
const degreeHierarchy = {
    "cert_coder": ["bachelor_it"], // Yêu cầu chứng chỉ code -> Có bằng Đại học IT là qua
    "cert_builder": ["bachelor_civil_engineering"], // Yêu cầu chứng chỉ thợ -> Có bằng Kỹ sư XD là qua
    "cert_barista": ["bachelor_tourism", "bachelor_business"], // Yêu cầu chứng chỉ pha chế -> Có bằng Du lịch hoặc Kinh doanh là qua
    "cert_beauty": ["bachelor_design"],
    // Yêu cầu bằng cấp 3 -> Có BẤT KỲ bằng Đại học nào cũng được chấp nhận
    "thpt_diploma": [
        "bachelor_it", "bachelor_civil_engineering", "bachelor_mechanical",
        "bachelor_business", "bachelor_law", "bachelor_medicine",
        "bachelor_design", "bachelor_tourism"
    ]
};

/**
 * Hàm kiểm tra thông minh: Trả về true nếu user có bằng yêu cầu HOẶC bằng cấp cao hơn
 */
function checkHasRequiredDegrees(requiredDegreesArray) {
    if (!requiredDegreesArray || requiredDegreesArray.length === 0) return true;
    
    const myDegrees = gameState.degrees || [];
    
    // Phải thỏa mãn TOÀN BỘ các điều kiện trong mảng requiredDegrees
    return requiredDegreesArray.every(reqDegree => {
        // 1. Nếu có đúng cái bằng đó -> Hợp lệ luôn
        if (myDegrees.includes(reqDegree)) return true;
        
        // 2. Nếu không có bằng gốc, đối chiếu xem có bằng cấp cao hơn không
        const higherDegrees = degreeHierarchy[reqDegree] || [];
        return higherDegrees.some(higher => myDegrees.includes(higher));
    });
}