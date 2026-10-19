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
                // Thay vì gọi applyForJob trực tiếp, đổi thành:
                buttonHTML = `
    <button onclick="showJobDetailModal('${job.id}', true)" 
        class="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95">
        🔍 Xem Chi Tiết & Ứng Tuyển
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

/**
 * Mở bảng thông tin chi tiết công việc trước khi ứng tuyển
 */
function showJobDetailModal(jobId, show) {
    const modal = document.getElementById("job-detail-modal");
    if (!modal) return;

    if (!show || !jobId) {
        modal.classList.add("hidden");
        return;
    }

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

    // Gán thông tin cơ bản lên Header Modal
    setElementText("job-detail-track", `📂 ${targetTrack.track_name} (Level ${targetJob.level})`);
    setElementText("job-detail-title", targetJob.title);

    // Kiểm tra các điều kiện thực tế của nhân vật
    const playerAge = gameState.age || 16;
    const isAgeValid = playerAge >= targetJob.min_age;
    
    // 🌟 1. TỪ ĐIỂN QUY ĐỔI TÊN BẰNG CẤP / CHỨNG CHỈ THÂN THIỆN
    const degreeNamesMap = {
        "cert_coder": "Chứng chỉ Lập trình",
        "cert_driver" : "Bằng Lái Xe Máy & Ô Tô B2",
        "cert_builder": "Chứng chỉ Thợ xây",
        "cert_barista": "Chứng chỉ Pha chế",
        "cert_beauty": "Chứng chỉ Thẩm mỹ",
        "thpt_diploma": "Bằng tốt nghiệp THPT",
        "bachelor_it": "Cử nhân Công nghệ thông tin",
        "bachelor_civil_engineering": "Kỹ sư Xây dựng",
        "bachelor_mechanical": "Kỹ sư Cơ khí",
        "bachelor_business": "Cử nhân Quản trị Kinh doanh",
        "bachelor_law": "Cử nhân Luật",
        "bachelor_medicine": "Cử nhân Y khoa",
        "bachelor_design": "Cử nhân Thiết kế",
        "bachelor_tourism": "Cử nhân Du lịch"
    };

    const reqDegrees = targetJob.required_degrees || [];
    let degreeCheckHTML = "";
    let hasValidDegree = checkHasRequiredDegrees(reqDegrees);

    if (reqDegrees.length === 0) {
        degreeCheckHTML = `
            <div class="flex justify-between items-center text-[11px] bg-white/60 p-1.5 rounded-xl border border-amber-300/30">
                <span class="text-amber-900">Bằng cấp / Chứng chỉ:</span>
                <span class="font-mono font-bold text-emerald-700">Không yêu cầu ✨</span>
            </div>
        `;
    } else {
        const myDegrees = gameState.degrees || [];
        let degreeItemsHTML = reqDegrees.map(degId => {
            const degName = degreeNamesMap[degId] || degId;
            let isSatisfied = myDegrees.includes(degId);
            if (!isSatisfied && typeof degreeHierarchy !== 'undefined' && degreeHierarchy[degId]) {
                isSatisfied = degreeHierarchy[degId].some(higher => myDegrees.includes(higher));
            }
            return `
                <div class="flex justify-between items-center text-[11px] bg-white/60 p-1.5 rounded-xl border border-amber-300/30 mt-1">
                    <span class="text-amber-900">• ${degName}</span>
                    <span class="font-mono font-black ${isSatisfied ? 'text-emerald-700' : 'text-rose-700'}">${isSatisfied ? 'Đạt ✅' : 'Chưa có ❌'}</span>
                </div>
            `;
        }).join('');

        degreeCheckHTML = `
            <div class="flex flex-col gap-1">
                <span class="text-[10px] font-extrabold text-amber-900 uppercase">📜 Yêu cầu bằng cấp / chứng chỉ:</span>
                ${degreeItemsHTML}
            </div>
        `;
    }

    // 2. Kiểm tra Chỉ số cần thiết
    const reqStats = targetJob.required_stats || {};
    let statsCheckHTML = "";
    let isStatsValid = true;

    for (const [statKey, reqVal] of Object.entries(reqStats)) {
        const playerVal = gameState[statKey] || 0;
        const passed = playerVal >= reqVal;
        if (!passed) isStatsValid = false;
        
        const statNames = { smarts: "Trí tuệ", strength: "Sức mạnh", charm: "Ăn nói", looks: "Ngoại hình", ego: "Cái tôi" };
        statsCheckHTML += `
            <div class="flex justify-between items-center text-[11px] bg-white/60 p-1.5 rounded-xl border border-amber-300/30">
                <span class="text-amber-900">${statNames[statKey] || statKey}:</span>
                <span class="font-mono font-black ${passed ? 'text-emerald-700' : 'text-rose-700'}">${playerVal} / ${reqVal} ${passed ? '✅' : '❌'}</span>
            </div>
        `;
    }
    if (!statsCheckHTML) statsCheckHTML = `<span class="text-[11px] text-amber-800/70 font-bold">Không yêu cầu chỉ số đặc biệt.</span>`;

    // 3. Kiểm tra Mối quan hệ NPC chuyên môn
    const reqField = targetJob.required_npc_field; 
    let npcCheckHTML = "";
    let isNpcValid = true;

    if (reqField) {
        const rels = gameState.relationships || [];
        const qualifiedNpc = rels.find(n => n.category === reqField && (n.level || 0) >= 1);
        isNpcValid = !!qualifiedNpc;

        npcCheckHTML = `
            <div class="flex flex-col gap-1 bg-amber-900/5 p-2 rounded-xl border border-amber-900/10 mt-1">
                <span class="text-[10px] font-extrabold text-amber-900 uppercase">🤝 Yêu cầu mối quan hệ ngành nghề:</span>
                <span class="text-[11px] font-bold ${isNpcValid ? 'text-emerald-700' : 'text-rose-700'}">
                    ${isNpcValid ? `✅ Đã quen biết: ${qualifiedNpc.name} (${qualifiedNpc.relation})` : `❌ Cần có quan hệ bạn bè (Lvl 1+) với một NPC thuộc lĩnh vực [${reqField}]`}
                </span>
            </div>
        `;
    }

    // 4. Buff / Tác động từ Thành phố hiện tại
    const currentCity = gameState.currentCity || "Thành phố Ung Dung";
    let citySalaryMultiplier = 1.0;
    let cityBuffText = "Mức lương chuẩn (x1.0)";

    if (currentCity === "Thành phố Vội Vàng") {
        citySalaryMultiplier = 1.25;
        cityBuffText = "🔥 Nhịp sống nhanh: Lương x1.25, Stress tăng nhanh hơn.";
    } else if (currentCity === "Thành phố Phồn Hoa" || currentCity === "Thành phố Hiện Đại") {
        citySalaryMultiplier = 1.15;
        cityBuffText = "🌟 Trung tâm phát triển: Lương x1.15, Kinh nghiệm tích lũy nhanh.";
    }

    const finalCalculatedSalary = Math.round((targetJob.salary_per_month || 0) * citySalaryMultiplier);

    // Render toàn bộ nội dung vào Modal Chi Tiết
    const contentEl = document.getElementById("job-detail-content");
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="flex justify-between items-center bg-emerald-50 p-2 rounded-xl border border-emerald-300/40">
                <span class="text-emerald-900 font-bold">💰 Mức lương cơ bản:</span>
                <span class="font-mono font-black text-emerald-700 text-sm">${finalCalculatedSalary.toLocaleString()} $/tháng</span>
            </div>
            <span class="text-[10px] text-amber-800/80 italic">(${cityBuffText})</span>

            <div class="flex flex-col gap-1 mt-1">
                <span class="text-[10px] font-extrabold text-amber-900 uppercase">📋 Điều kiện ứng tuyển:</span>
                <div class="flex justify-between items-center text-[11px] bg-white/60 p-1.5 rounded-xl border border-amber-300/30">
                    <span class="text-amber-900">Độ tuổi tối thiểu:</span>
                    <span class="font-mono font-black ${isAgeValid ? 'text-emerald-700' : 'text-rose-700'}">${playerAge} / ${targetJob.min_age} tuổi ${isAgeValid ? '✅' : '❌'}</span>
                </div>
            </div>

            <div class="mt-1">
                ${degreeCheckHTML}
            </div>

            <div class="flex flex-col gap-1 mt-1">
                <span class="text-[10px] font-extrabold text-amber-900 uppercase">📊 Chỉ số yêu cầu:</span>
                ${statsCheckHTML}
            </div>

            ${npcCheckHTML}
        `;
    }

    // Gắn sự kiện cho nút Nộp đơn trong Modal
    const applyBtn = document.getElementById("job-detail-apply-btn");
    if (applyBtn) {
        const canApply = isAgeValid && hasValidDegree && isStatsValid && isNpcValid;
        if (canApply) {
            applyBtn.disabled = false;
            applyBtn.className = "w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-extrabold rounded-2xl text-xs shadow-md active:scale-95 transition-all cursor-pointer";
            applyBtn.onclick = function() {
                applyForJob(targetJob.id);
                showJobDetailModal(null, false);
                showJobsModal(false);
            };
        } else {
            applyBtn.disabled = true;
            applyBtn.className = "w-full py-3 bg-gray-300 text-gray-500 font-display font-extrabold rounded-2xl text-xs cursor-not-allowed text-center";
            applyBtn.onclick = null;
        }
    }

    modal.classList.remove("hidden");
}
