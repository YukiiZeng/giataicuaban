// Biến lưu dữ liệu (vẫn giữ window. ở biến data để các file khác dễ truy xuất)
window.careersData = window.careersData || [];
window.jobsData = window.jobsData || [];

// 1. Tải danh sách công việc từ jobs.json
async function loadJobsData() {
    try {
        const response = await fetch('jobs.json');
        const data = await response.json();

        window.careersData = data.careers || [];

        // Gom tất cả job từ các levels thành mảng phẳng
        window.jobsData = [];
        window.careersData.forEach(track => {
            if (Array.isArray(track.levels)) {
                track.levels.forEach(job => {
                    window.jobsData.push({
                        ...job,
                        track_id: track.track_id,
                        track_name: track.track_name
                    });
                });
            }
        });

        if (typeof renderJobsModalList === 'function') renderJobsModalList();
    } catch (error) {
        console.error("Lỗi tải jobs.json:", error);
    }
}

// 2. Kiểm tra điều kiện ứng tuyển
function checkJobRequirements(job) {
    if (typeof gameState === 'undefined') return false;

    // 1. Kiểm tra tuổi
    if (gameState.age < job.min_age) return false;

    // 2. Kiểm tra bằng cấp
    if (job.required_degrees && job.required_degrees.length > 0) {
        const hasAllDegrees = job.required_degrees.every(degree =>
            gameState.degrees && gameState.degrees.includes(degree)
        );
        if (!hasAllDegrees) return false;
    }

    // 3. Kiểm tra chỉ số
    if (job.required_stats) {
        for (const [key, reqValue] of Object.entries(job.required_stats)) {
            const statKey = key.toLowerCase();
            const playerStat = gameState[statKey] || 0;
            if (playerStat < reqValue) return false;
        }
    }

    return true;
}

// 3. Render danh sách công việc
function renderJobsModalList() {
    const listContainer = document.getElementById('jobs-modal-list');
    if (!listContainer) return;

    const careers = window.careersData || [];

    if (careers.length === 0) {
        listContainer.innerHTML = `<div class="text-center text-xs font-bold text-amber-900/60 py-6">Đang tải danh sách công việc...</div>`;
        return;
    }

    let html = '';

    careers.forEach(track => {
        if (!track.levels || track.levels.length === 0) return;

        html += `
        <div class="mb-3">
            <div class="text-[10px] font-black text-amber-900/80 uppercase tracking-wider mb-1.5 px-1">
                📂 ${track.track_name}
            </div>
            <div class="flex flex-col gap-2">
        `;

        track.levels.forEach(job => {
            const isQualified = checkJobRequirements(job);
            const currentJobId = typeof gameState !== 'undefined' ? gameState?.job?.id : null;
            const isCurrentJob = currentJobId === job.id;

            html += `
            <div class="glass-card-inner-light p-2.5 rounded-2xl flex items-center justify-between border border-amber-300/40 gap-2">
                <div class="flex flex-col min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-black text-amber-950 truncate">${job.title}</span>
                        ${job.is_part_time ? '<span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-orange-200 text-orange-900">Part-time</span>' : ''}
                    </div>
                    <span class="text-xs font-black text-emerald-700 font-mono mt-0.5">${Number(job.salary_per_month).toLocaleString()} $/tháng</span>
                    <span class="text-[10px] font-bold ${isCurrentJob ? 'text-amber-900 font-black' : (isQualified ? 'text-emerald-700' : 'text-rose-600')}">
                        ${isCurrentJob ? '⭐ Đang làm việc này' : (isQualified ? '✅ Đủ điều kiện ứng tuyển' : '❌ Chưa đủ điều kiện')}
                    </span>
                </div>
<div class="flex items-center gap-1 shrink-0">
    <button onclick="openJobDetail('${job.id}')" class="py-1.5 px-2 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-[10px] active:scale-95 transition">
        Chi tiết
    </button>
    
    ${isCurrentJob ? `
    <button onclick="quitJob()" class="py-1.5 px-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 transition shadow-sm">
        Thôi việc
    </button>
    ` : `
    <button onclick="applyForJob('${job.id}')" ${!isQualified ? 'disabled' : ''} 
        class="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-gray-400 disabled:to-gray-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 transition shadow-sm">
        Ứng tuyển
    </button>
    `}
</div>
            </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    listContainer.innerHTML = html;
}

// 4. Các hàm quản lý Modal
function showJobsModal(show = true) {
    const modal = document.getElementById('jobs-modal');
    if (!modal) return;
    if (show) {
        modal.classList.remove('hidden');
        renderJobsModalList();
    } else {
        modal.classList.add('hidden');
    }
}

function showJobDetailModal(jobId, show = true) {
    const modal = document.getElementById('job-detail-modal');
    if (!modal) return;
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function showEducationModal(show = true) {
    const modal = document.getElementById('education-modal');
    if (!modal) return;
    if (show) {
        modal.classList.remove('hidden');
        if (typeof renderEducationModalList === 'function') renderEducationModalList();
    } else {
        modal.classList.add('hidden');
    }
}

// 5. Mở Modal Chi Tiết Công Việc & Dịch Chỉ Số
function openJobDetail(jobId) {
    const job = (window.jobsData || []).find(j => j.id === jobId);
    if (!job) return;

    const content = document.getElementById('job-detail-content');
    const applyBtn = document.getElementById('job-detail-apply-btn');
    const title = document.getElementById('job-detail-title');
    const track = document.getElementById('job-detail-track');

    if (title) title.innerText = job.title;
    if (track) track.innerText = job.track_name || 'Công việc';

    const isQualified = checkJobRequirements(job);

    // Bộ từ điển dịch
    const statLabels = {
        health: "Sức khỏe", smarts: "Trí tuệ", charm: "Giao tiếp",
        looks: "Ngoại hình", strength: "Thể lực", ego: "Tự tôn"
    };
    const degreeLabels = {
        thpt_diploma: "Bằng THPT", bachelor_it: "Cử nhân CNTT",
        bachelor_civil_engineering: "Kỹ sư Xây dựng", bachelor_mechanical: "Kỹ sư Cơ khí",
        bachelor_business: "Cử nhân Kinh tế", bachelor_law: "Cử nhân Luật",
        bachelor_medicine: "Bằng Bác sĩ", bachelor_design: "Cử nhân Thiết kế",
        bachelor_tourism: "Cử nhân Du lịch", cert_builder: "Chứng chỉ Xây dựng",
        cert_barista: "Chứng chỉ Pha chế", cert_chef_degree: "Chứng chỉ Nấu ăn",
        cert_driver: "Bằng lái B2", cert_coder: "Chứng chỉ Lập trình",
        cert_beauty: "Chứng chỉ Spa", cert_electrician_degree: "Chứng chỉ Điện"
    };

    let reqStatsText = 'Không yêu cầu';
    if (job.required_stats && Object.keys(job.required_stats).length > 0) {
        reqStatsText = Object.entries(job.required_stats)
            .map(([k, v]) => `${statLabels[k.toLowerCase()] || k.toUpperCase()}: ${v}`)
            .join(', ');
    }

    let reqDegreesText = 'Không bắt buộc';
    if (job.required_degrees && job.required_degrees.length > 0) {
        reqDegreesText = job.required_degrees
            .map(degreeId => degreeLabels[degreeId] || degreeId)
            .join(', ');
    }

    if (content) {
        content.innerHTML = `
            <div class="bg-amber-900/5 p-3 rounded-2xl border border-amber-900/10 flex flex-col gap-1.5">
                <div class="flex justify-between">
                    <span class="text-amber-900/80">Lương hàng tháng:</span>
                    <span class="font-mono font-black text-emerald-700">${Number(job.salary_per_month).toLocaleString()} $</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-amber-900/80">Áp lực (Stress):</span>
                    <span class="font-mono font-black text-rose-700">+${job.stress_cost || 0} /tháng</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-amber-900/80">Yêu cầu tuổi:</span>
                    <span class="font-mono font-black text-amber-950">${job.min_age || 16}+ tuổi</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-amber-900/80">Yêu cầu chỉ số:</span>
                    <span class="font-mono font-black text-amber-950 text-right w-1/2">${reqStatsText}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-amber-900/80">Yêu cầu bằng cấp:</span>
                    <span class="font-mono font-black text-amber-950 text-right w-1/2">${reqDegreesText}</span>
                </div>
            </div>
        `;
    }
    const currentJobId = typeof gameState !== 'undefined' ? gameState?.job?.id : null;
    const isCurrentJob = currentJobId === job.id;
    if (applyBtn) {
    if (isCurrentJob) {
        // Nếu đang làm công việc này -> Biến thành nút Thôi việc
        applyBtn.onclick = () => {
            quitJob();
            showJobDetailModal(jobId, false); // Đóng modal chi tiết sau khi bấm thôi việc
        };
        applyBtn.className = "w-full py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-display font-extrabold rounded-2xl text-xs shadow-md active:scale-95 transition-all text-center";
        applyBtn.innerText = "🚪 THÔI VIỆC";
        applyBtn.disabled = false;
    } else {
        // Logic cũ cho việc ứng tuyển bình thường
        applyBtn.onclick = () => {
            if (isQualified) applyForJob(job.id);
        };

        if (!isQualified) {
            applyBtn.className = "w-full py-3 bg-gray-300 text-gray-500 cursor-not-allowed font-bold rounded-xl text-center";
            applyBtn.innerText = "❌ CHƯA ĐỦ ĐIỀU KIỆN";
            applyBtn.disabled = true;
        } else {
            applyBtn.className = "w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-extrabold rounded-2xl text-xs shadow-md active:scale-95 transition-all text-center";
            applyBtn.innerText = "💼 NỘP ĐƠN ỨNG TUYỂN";
            applyBtn.disabled = false;
        }
    }
}

    showJobDetailModal(jobId, true);
}

// 6. Xử lý Nộp Đơn Xin Việc
function applyForJob(jobId) {
    const job = (window.jobsData || []).find(j => j.id === jobId);
    if (!job) return;

    if (!checkJobRequirements(job)) {
        if (typeof showToast === 'function') showToast("⚠️ Anh chưa đủ điều kiện ứng tuyển công việc này!");
        return;
    }

    if (typeof gameState !== 'undefined') {
        gameState.job = {
            id: job.id,
            title: job.title,
            salary: job.salary_per_month,
            stress: job.stress_cost || 0,
            is_part_time: job.is_part_time || false,
            months: 0
        };

        // 🌟 Tự động làm quen 1 đồng nghiệp khi nhận việc
        if (typeof generateRandomNPC === 'function') {
            const newColleague = generateRandomNPC(`Đồng nghiệp (${job.title})`, 'work', true);
            if (typeof addDailyLog === 'function') {
                addDailyLog(`🤝 Nhận việc mới và làm quen với đồng nghiệp: ${newColleague.name}.`);
            }
        }

        if (typeof showToast === 'function') {
            showToast(`🎉 Chúc mừng! Bạn đã trở thành ${job.title}!`);
        } else {
            alert(`🎉 Chúc mừng! Bạn đã trở thành ${job.title}!`);
        }

        showJobDetailModal(null, false);
        showJobsModal(false);

        renderJobsModalList();

        if (typeof updateUI === 'function') updateUI();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderGameState === 'function') renderGameState();
        if (typeof saveGameState === 'function') saveGameState();
    }
}

function processMonthlyJob() {
    if (!gameState || !gameState.job) return;

    gameState.job.months = (gameState.job.months || 0) + 1;

    // 🌟 Ngẫu nhiên gặp thêm đồng nghiệp mới hàng tháng (tối đa 3 người)
    const workFriends = (gameState.relationships || []).filter(r => r.category === 'work');
    if (workFriends.length < 3 && Math.random() < 0.35 && typeof generateRandomNPC === 'function') {
        const jobTitle = gameState.job.title || 'Công việc';
        const newColleague = generateRandomNPC(`Đồng nghiệp (${jobTitle})`, 'work', true);
        if (typeof addDailyLog === 'function') {
            addDailyLog(`🤝 Làm quen với đồng nghiệp mới: ${newColleague.name}.`);
        }
        if (typeof showToast === 'function') {
            showToast(`🤝 Bạn quen một đồng nghiệp mới: ${newColleague.name} (${newColleague.relation})!`, '🤝', 'Quan Hệ');
        }
    }
}


// 7. Xử lý Thôi Việc
function quitJob() {
    if (typeof gameState === 'undefined' || !gameState.job) {
        if (typeof showToast === 'function') {
            showToast("⚠️ Bạn hiện không có công việc nào để nghỉ!");
        } else {
            alert("⚠️ Bạn hiện không có công việc nào để nghỉ!");
        }
        return;
    }

    if (typeof showGameConfirm === 'function') {
        showGameConfirm(
            "Bạn có chắc chắn muốn nộp đơn xin nghỉ việc không?",
            function () {
                gameState.job = null;
                if (typeof showToast === 'function') showToast("💼 Bạn đã chính thức thôi việc.");

                renderJobsModalList();

                if (typeof updateUI === 'function') updateUI();
                if (typeof updateDashboard === 'function') updateDashboard();
                if (typeof renderGameState === 'function') renderGameState();
                if (typeof saveGameState === 'function') saveGameState();
            },
            "Xác Nhận Nghỉ Việc",
            "💼",
            "📝 Nghề Nghiệp"
        );
    } else {
        const confirmQuit = confirm("Bạn có chắc chắn muốn nộp đơn xin nghỉ việc không?");
        if (confirmQuit) {
            gameState.job = null;
            alert("💼 Bạn đã chính thức thôi việc.");

            renderJobsModalList();

            if (typeof updateUI === 'function') updateUI();
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof renderGameState === 'function') renderGameState();
            if (typeof saveGameState === 'function') saveGameState();
        }
    }
}

// Khởi tạo load dữ liệu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadJobsData);
} else {
    loadJobsData();
}