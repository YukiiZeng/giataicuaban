/**
 * =================================================================
 * ZONE 1: GAME INITIALIZATION & RENDER ENGINE (KHỞI TẠO & RENDER UI)
 * =================================================================
 */

/**
 * Khởi tạo Game khi load trang
 */
function initGame() {
    if (typeof loadGameState === 'function') {
        const savedState = loadGameState();
        if (savedState) {
            gameState = savedState;
            if (typeof showCreateCharacterModal === 'function') showCreateCharacterModal(false);
            renderGameState();
            
            // Kích hoạt thanh thời gian tự chạy ngay khi load game
            if (typeof startMonthCalendarTimer === 'function') {
                startMonthCalendarTimer();
            }
            return;
        }
    }
    if (typeof showCreateCharacterModal === 'function') showCreateCharacterModal(true);
}

// Lắng nghe sự kiện khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    initGame();
});

/**
 * Render toàn bộ trạng thái Dashboard game chính
 */
function renderGameState() {
    if (typeof gameState === 'undefined' || !gameState) return;
    
    // Cập nhật thông tin cá nhân
    setElementText('player-name', gameState.name || "Chưa đặt tên");
    setElementText('player-gender', gameState.gender ? `(${gameState.gender})` : "(Nam)");
    setElementText('player-age', gameState.age ?? 16);
    setElementText('month', gameState.month ?? 1);
    
    // Cập nhật tiền bạc
    const formattedMoney = (gameState.money ?? 0).toLocaleString();
    setElementText('money', formattedMoney);
    
    // Cập nhật các thanh chỉ số sinh tồn (Health, Hunger, Happiness, Smarts)
    renderStatBar('health', gameState.health ?? 100);
    renderStatBar('hunger', gameState.hunger ?? 80);
    renderStatBar('happiness', gameState.happiness ?? 70);
    renderStatBar('smarts', gameState.smarts ?? 50);
    
    // Cập nhật Bảng tin / Mẹo chơi ngẫu nhiên hàng tháng
    const newsTickerEl = document.getElementById('game-news-ticker');
    if (newsTickerEl) {
        const tips = [
            "💡 Mẹo: Ăn uống đầy đủ giúp duy trì Sức khỏe và Hạnh phúc hàng tháng!",
            "💼 Tin tức: Đừng quên nâng cao học vấn để ứng tuyển các vị trí lương cao hơn.",
            "🏋️ Mẹo: Đi chạy bộ hoặc tập Gym giúp giải tỏa Stress do áp lực công việc.",
            "🏠 Tin tức: Hãy cân nhắc chi phí thuê nhà phù hợp với thu nhập hàng tháng.",
            "👨‍👩‍👦 Mẹo: Giữ mối quan hệ tốt với Bố Mẹ để nhận hỗ trợ khi gặp khó khăn!"
        ];
        const currentTip = tips[(gameState.month || 1) % tips.length];
        newsTickerEl.innerText = currentTip;
    }
    
    // Cập nhật 4 thuộc tính năng lực
    setElementText('strength', gameState.strength ?? 50);
    setElementText('looks', gameState.looks ?? 60);
    setElementText('charm', gameState.charm ?? 45);
    setElementText('ego', gameState.ego ?? 30);
    
    // Render các Sub-Panels
    renderRelationships();
    renderHousing();
    renderEducationAndJobStatus();
}

/**
 * Gán văn bản cho phần tử HTML theo ID
 */
function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

/**
 * Render thanh chỉ số tiến trình (% width)
 */
function renderStatBar(id, value) {
    const clampedValue = Math.max(0, Math.min(100, value));
    setElementText(id, clampedValue);
    const barEl = document.getElementById(`${id}-bar`);
    if (barEl) barEl.style.width = `${clampedValue}%`;
}


/**
 * =================================================================
 * ZONE 2: CALENDAR UI CONTROLLER & MONTH TRANSITION (ĐIỀU KHIỂN LỊCH)
 * =================================================================
 */

/**
 * Cập nhật Giao diện Thanh Lịch & Nút Sang Tháng
 */
function updateCalendarUI() {
    if (!gameState) return;
    
    const currentDay = gameState.currentDay || 1;
    const dayTextEl = document.getElementById("calendar-day-text");
    const progressBarEl = document.getElementById("calendar-progress-bar");
    const badgeEl = document.getElementById("calendar-status-badge");
    const btnEl = document.getElementById("next-month-btn");
    const btnTextEl = document.getElementById("next-month-btn-text");
    
    if (dayTextEl) dayTextEl.innerText = `Ngày ${currentDay} / 30`;
    
    const percent = Math.min(100, Math.round((currentDay / 30) * 100));
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;
    
    if (currentDay >= 30) {
        // Đã xong 30 ngày: Mở khóa nút Sang Tháng
        if (badgeEl) {
            badgeEl.className = "text-[9px] font-extrabold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full";
            badgeEl.innerText = "✅ Đã xong tháng!";
        }
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.className = "w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-display font-black rounded-2xl text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-amber-300/40 cursor-pointer opacity-100";
        }
        if (btnTextEl) btnTextEl.innerText = "SANG THÁNG MỚI";
    } else {
        // Đang trôi thời gian: Khóa nút
        if (badgeEl) {
            badgeEl.className = "text-[9px] font-extrabold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full animate-pulse";
            badgeEl.innerText = "⏳ Đang trôi thời gian...";
        }
        if (btnEl) {
            btnEl.disabled = true;
            btnEl.className = "w-full py-3.5 px-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-display font-black rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-gray-300/40 cursor-not-allowed opacity-75";
        }
        const remainingSeconds = Math.ceil((30 - currentDay) * 2);
        if (btnTextEl) btnTextEl.innerText = `ĐANG TRÔI THỜI GIAN (${remainingSeconds}s)...`;
    }
}

/**
 * Xử lý khi nhấn nút "Sang Tháng Mới"
 */
function handleNextMonth() {
    if (typeof nextMonth === 'function') {
        nextMonth();
        gameState.currentDay = 1;
        if (typeof startMonthCalendarTimer === 'function') startMonthCalendarTimer();
    }
}


/**
 * =================================================================
 * ZONE 3: VIEW NAVIGATION & OVERVIEW REPORT (ĐIỀU HƯỚNG VIEW & BÁO CÁO)
 * =================================================================
 */

/**
 * Chuyển đổi giữa các View (Main game, Báo cáo, Sức khỏe)
 * @param {string} viewName 'main' | 'report' | 'health'
 */
/**
 * Chuyển đổi giữa các View (Main game, Báo cáo, Sức khỏe)
 * @param {string} viewName 'main' | 'report' | 'health'
 */
/**
 * Chuyển đổi giữa các View (Main game, Báo cáo, Sức khỏe)
 * Bộ đếm thời gian vẫn chạy ngầm liên tục không bị gián đoạn
 * @param {string} viewName 'main' | 'report' | 'health'
 */
function switchView(viewName) {
    console.log("🔄 Đang chuyển sang View:", viewName);
    
    const mainView = document.getElementById("main-game-view");
    const reportView = document.getElementById("overview-report-view");
    const healthView = document.getElementById("health-care-view");
    
    // Ẩn tất cả View
    if (mainView) mainView.classList.add("hidden");
    if (reportView) reportView.classList.add("hidden");
    if (healthView) healthView.classList.add("hidden");
    
    if (viewName === 'report') {
        if (reportView) {
            reportView.classList.remove("hidden");
            renderOverviewReport();
        }
    } else if (viewName === 'health') {
        if (healthView) {
            healthView.classList.remove("hidden");
            renderHealthView();
        }
    } else {
        if (mainView) {
            mainView.classList.remove("hidden");
            renderGameState();
            // Không cần gọi startMonthCalendarTimer() ở đây nữa vì nó vẫn đang chạy ngầm liên tục rồi!
        }
    }
}
/**
 * Render Giao diện Báo Cáo Phụ Lục Tổng Quát
 */
// Biến toàn cục theo dõi bộ lọc Lịch sử giao dịch hiện tại
let currentTransactionFilter = 'last_month';

/**
 * Thay đổi Tab bộ lọc Lịch Sử Giao Dịch
 */
function setTransactionFilter(filterType) {
    currentTransactionFilter = filterType;
    
    // Cập nhật trạng thái Active trên UI Tab
    ['last_month', 'this_month', 'all'].forEach(type => {
        const btn = document.getElementById(`tx-filter-${type}`);
        if (btn) {
            if (type === filterType) {
                btn.className = "flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all text-amber-900 bg-white/80 shadow-sm";
            } else {
                btn.className = "flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all text-amber-800/70 hover:text-amber-900";
            }
        }
    });
    
    renderTransactionsList();
}

/**
 * Render Danh Sách Lịch Sử Giao Dịch theo Filter
 */
function renderTransactionsList() {
    if (!gameState) return;
    const container = document.getElementById("report-transactions-list");
    if (!container) return;
    
    container.innerHTML = "";
    const history = gameState.transactionHistory || [];
    const currentMonth = gameState.month || 1;
    
    let filtered = [];
    if (currentTransactionFilter === 'last_month') {
        filtered = history.filter(t => t.month === currentMonth - 1);
    } else if (currentTransactionFilter === 'this_month') {
        filtered = history.filter(t => t.month === currentMonth);
    } else {
        filtered = [...history]; // All-Time
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-[11px] text-amber-800/60 font-bold text-center py-3">Không có giao dịch nào trong khoảng thời gian này.</p>`;
        return;
    }
    
    filtered.forEach(tx => {
        const isPos = tx.amount > 0;
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-2 rounded-xl flex items-center justify-between text-xs font-bold border border-amber-300/30";
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-[9px] font-mono bg-amber-900/10 text-amber-950 px-1.5 py-0.5 rounded-md">T${tx.month}</span>
                <span class="text-amber-950">${tx.title}</span>
            </div>
            <span class="font-mono font-extrabold ${isPos ? 'text-emerald-700' : 'text-rose-700'}">
                ${isPos ? '+' : ''}${tx.amount.toLocaleString()} $
            </span>
        `;
        container.appendChild(item);
    });
}

/**
 * Render Giao diện Báo Cáo Phụ Lục Tổng Quát
 */
function renderOverviewReport() {
    if (!gameState) return;
    
    setElementText('report-total-income', `+${(gameState.totalLifetimeIncome || 0).toLocaleString()} $`);
    setElementText('report-total-expense', `-${(gameState.totalLifetimeExpense || 0).toLocaleString()} $`);
        // === CẬP NHẬT TRẠNG THÁI NỢ ===
    const currentDebt = gameState.debt || 0;
    setElementText('report-total-debt', `${currentDebt.toLocaleString()} $`);
    
    const debtStatusBadge = document.getElementById('report-debt-status');
    const payDebtBtn = document.getElementById('btn-pay-debt');
    
    if (currentDebt > 0) {
        if (debtStatusBadge) {
            debtStatusBadge.className = "text-[9px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300";
            debtStatusBadge.innerText = "Đang gánh nợ";
        }
        if (payDebtBtn) payDebtBtn.classList.remove("hidden"); // Hiện nút trả nợ
    } else {
        if (debtStatusBadge) {
            debtStatusBadge.className = "text-[9px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300";
            debtStatusBadge.innerText = "Không có nợ";
        }
        if (payDebtBtn) payDebtBtn.classList.add("hidden"); // Ẩn nút trả nợ
    }

    const familyBg = typeof getFamilyBackground === 'function' ? getFamilyBackground() : { label: "🏠 Gia đình bình thường" };
    setElementText('report-family-bg', familyBg.label);
    
    // Render Danh Sách Bằng Cấp
    const degreeContainer = document.getElementById("report-degrees-list");
    if (degreeContainer) {
        degreeContainer.innerHTML = "";
        const degrees = gameState.degrees || [];
        if (degrees.length === 0) {
            degreeContainer.innerHTML = `<p class="text-[11px] text-amber-800/60 font-bold">Chưa có bằng cấp nào.</p>`;
        } else {
            degrees.forEach(degId => {
                // Tìm tên chương trình học để lấy tên bằng đẹp hơn
                let degName = degId.toUpperCase();
                if (typeof educationData !== 'undefined') {
                    const program = educationData.find(p => p.rewards && p.rewards.degree_id === degId);
                    if (program) degName = program.name;
                }
                
                const item = document.createElement("div");
                item.className = "text-[10px] font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-md shadow-sm border border-amber-300/50";
                item.innerText = "🎓 " + degName;
                degreeContainer.appendChild(item);
            });
        }
    }
    
    // Render danh sách giao dịch
    renderTransactionsList();
    
    // Render Cột Mốc Đời Người
    const milestoneContainer = document.getElementById("report-milestones-logs");
    if (milestoneContainer) {
        milestoneContainer.innerHTML = "";
        const mLogs = gameState.milestoneLogs || [];
        if (mLogs.length === 0) {
            milestoneContainer.innerHTML = `<p class="text-xs text-amber-800/60 font-bold">Chưa có cột mốc lớn nào.</p>`;
        } else {
            mLogs.forEach(log => {
                const item = document.createElement("div");
                item.className = "glass-card-inner-light p-2 rounded-xl flex items-center gap-2 text-xs font-bold border border-amber-400/60 bg-amber-100/50";
                item.innerHTML = `
                    <span class="text-[10px] font-mono bg-amber-900/10 text-amber-950 px-1.5 py-0.5 rounded-md">Tháng ${log.month} (${log.age}t)</span>
                    <span class="text-amber-950 font-extrabold">👑 ${log.text}</span>
                `;
                milestoneContainer.appendChild(item);
            });
        }
    }
    
    // Render Nhật Ký Diễn Biến & Học Tập / Đi Làm
    const dailyContainer = document.getElementById("report-daily-logs");
    if (dailyContainer) {
        dailyContainer.innerHTML = "";
        const dLogs = gameState.dailyLogs || [];
        if (dLogs.length === 0) {
            dailyContainer.innerHTML = `<p class="text-xs text-amber-800/60 font-bold">Chưa có nhật ký diễn biến.</p>`;
        } else {
            dLogs.forEach(log => {
                const item = document.createElement("div");
                item.className = "glass-card-inner-light p-2 rounded-xl flex items-center gap-2 text-xs font-bold border border-amber-300/30";
                item.innerHTML = `
                    <span class="text-[10px] font-mono bg-amber-900/10 text-amber-950 px-1.5 py-0.5 rounded-md">Tháng ${log.month} (${log.age}t)</span>
                    <span class="text-amber-900">${log.text}</span>
                `;
                dailyContainer.appendChild(item);
            });
        }
    }
}

/**
 * Hiển thị Modal Báo Cáo Cuối Tháng
 */
function showMonthlySummaryModal(data, onContinue) {
    const modal = document.getElementById("monthly-summary-modal");
    if (!modal) return;
    
    setElementText('summary-month-title', `BÁO CÁO THÁNG ${data.month}`);
    setElementText('summary-income-text', `+${data.income.toLocaleString()} $`);
    setElementText('summary-expense-text', `-${data.expense.toLocaleString()} $`);
    setElementText('summary-net-text', `${data.net >= 0 ? '+' : ''}${data.net.toLocaleString()} $`);
    
    const statsContainer = document.getElementById("summary-stats-changes");
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="${data.healthDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">Sức khỏe: ${data.healthDiff >= 0 ? '+' : ''}${data.healthDiff}</div>
            <div class="${data.hungerDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">Độ no: ${data.hungerDiff >= 0 ? '+' : ''}${data.hungerDiff}</div>
            <div class="${data.happinessDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">Hạnh phúc: ${data.happinessDiff >= 0 ? '+' : ''}${data.happinessDiff}</div>
        `;
    }
    
    const btn = document.getElementById("summary-continue-btn");
    if (btn) {
        btn.onclick = function() {
            modal.classList.add("hidden");
            if (typeof onContinue === 'function') onContinue();
        };
    }
    
    modal.classList.remove("hidden");
}


/**
 * =================================================================
 * ZONE 4: DASHBOARD PANELS & MODAL HANDLERS (DASHBOARD & HỌC VẤN/VIỆC LÀM)
 * =================================================================
 */

/**
 * Render Trạng thái Học tập & Nghề nghiệp trên Dashboard
 */
function renderEducationAndJobStatus() {
    if (typeof gameState === 'undefined' || !gameState) return;
    
    // 1. Cập nhật Trạng thái Học tập
    const edu = gameState.currentEducation;
    setElementText('edu-status-title', edu ? edu.name : "Chưa đăng ký học");
    setElementText('edu-status-months', edu ? `${edu.monthsCompleted}/${edu.totalMonths} tháng` : "--/-- tháng");
    const eduBarEl = document.getElementById("edu-progress-bar");
    if (eduBarEl) eduBarEl.style.width = edu ? `${Math.min(100, Math.round((edu.monthsCompleted / edu.totalMonths) * 100))}%` : "0%";
    
    const eduTypeBadgeEl = document.getElementById("edu-type-badge");
    if (eduTypeBadgeEl) {
        if (edu) {
            eduTypeBadgeEl.classList.remove("hidden");
            eduTypeBadgeEl.innerText = edu.category === 'formal' ? "🎓 Chính Quy" : "📜 Bằng Nghề";
        } else {
            eduTypeBadgeEl.classList.add("hidden");
        }
    }
    
    // 2. Cập nhật Trạng thái Nghề nghiệp
    const job = gameState.job;
    const jobTitleEl = document.getElementById("job-status-title");
    const jobSalaryEl = document.getElementById("job-status-salary");
    const jobExpEl = document.getElementById("job-status-exp");
    const jobLevelBadgeEl = document.getElementById("job-level-badge");
    
    if (job && job.title) {
        if (jobTitleEl) jobTitleEl.innerText = job.title;
        if (jobSalaryEl) jobSalaryEl.innerText = `+${(job.salary || 0).toLocaleString()} $/tháng`;
        if (jobExpEl) jobExpEl.innerText = `${job.monthsExperience || 0} tháng kinh nghiệm`;
        
        if (jobLevelBadgeEl) {
            jobLevelBadgeEl.className = "text-[9px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 px-2 py-0.5 rounded-md shadow-sm";
            jobLevelBadgeEl.innerText = `Lvl ${job.level || 1}`;
        }
    } else {
        if (jobTitleEl) jobTitleEl.innerText = "Chưa có việc làm";
        if (jobSalaryEl) jobSalaryEl.innerText = "0 $/tháng";
        if (jobExpEl) jobExpEl.innerText = "0 tháng kinh nghiệm";
        
        if (jobLevelBadgeEl) {
            jobLevelBadgeEl.className = "text-[9px] font-black text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-md";
            jobLevelBadgeEl.innerText = "Thất nghiệp";
        }
    }
}

/**
 * Mở / Ẩn Modal Tạo nhân vật
 */
function showCreateCharacterModal(show) {
    const modal = document.getElementById("create-character-modal");
    if (modal) {
        if (show) modal.classList.remove("hidden");
        else modal.classList.add("hidden");
    }
}

/**
 * Xử lý sau khi nhấn nút Tạo Nhân Vật Mới
 */
function handleCreateCharacterSubmit() {
    const nameInput = document.getElementById("input-character-name")?.value;
    const genderSelect = document.getElementById("select-character-gender")?.value;
    
    if (typeof createCharacter === 'function') {
        createCharacter(nameInput, genderSelect);
    }
    showCreateCharacterModal(false);
    renderGameState();
    
    if (typeof startMonthCalendarTimer === 'function') {
        startMonthCalendarTimer();
    }
}

/**
 * Xử lý thanh toán nợ trong View Báo Cáo
 */
function handlePayDebt() {
    if (!gameState || !gameState.debt || gameState.debt <= 0) return;
    
    const currentDebt = gameState.debt;
    const currentMoney = gameState.money || 0;
    
    if (currentMoney <= 0) {
        return alert("❌ Cảnh sát trưởng: Bạn không có đồng nào trong túi để trả nợ!");
    }
    
    // Gợi ý số tiền trả mặc định là trả hết (nếu đủ tiền) hoặc trả tối đa số tiền đang có
    const maxPayable = Math.min(currentDebt, currentMoney);
    
    const amountStr = prompt(`📉 TÌNH TRẠNG CÔNG NỢ:\n- Bạn đang nợ: ${currentDebt.toLocaleString()} $\n- Tiền trong ví: ${currentMoney.toLocaleString()} $\n\nNhập số tiền bạn muốn thanh toán:`, maxPayable);
    
    if (amountStr === null || amountStr.trim() === "") return; // Người chơi bấm Hủy
    
    // Lọc bỏ các ký tự không phải số
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
        return alert("❌ Số tiền nhập không hợp lệ!");
    }
    
    if (amount > currentMoney) {
        return alert("❌ Bạn không đủ tiền mặt để trả mức này!");
    }
    
    if (amount > currentDebt) {
        return alert("❌ Chà, bạn không cần phải trả dư số tiền đang nợ đâu!");
    }
    
    // Trừ tiền, trừ nợ
    gameState.money -= amount;
    gameState.debt -= amount;
    
    // Ghi sổ sao kê & Nhật ký
    if (typeof addTransactionHistory === 'function') addTransactionHistory("💳 Thanh toán công nợ", -amount);
    if (typeof addDailyLog === 'function') addDailyLog(`Đã trả nợ ${amount.toLocaleString()} $. Nợ còn lại: ${gameState.debt.toLocaleString()} $.`);
    
    alert(`✅ Bạn đã thanh toán ${amount.toLocaleString()} $ tiền nợ!\nNợ còn lại: ${gameState.debt.toLocaleString()} $`);
    
    // Lưu và Load lại UI
    saveGameState();
    renderGameState();
    renderOverviewReport();
}



/**
 * =================================================================
 * ZONE 5: HOUSING & RELATIONSHIP PANELS (NHÀ TRỌ & QUAN HỆ)
 * =================================================================
 */

function getSocialLevelTitle(count) {
    if (count < 10) return "🌱 Hướng Nội (< 10)";
    if (count <= 20) return "🤝 Xã Giao (10 - 20)";
    if (count <= 40) return "🌟 Hướng Ngoại (20 - 40)";
    if (count <= 60) return "👑 Quan Hệ Rộng (40 - 60)";
    return "🔥 Bậc Thầy Ngoại Giao (> 60)";
}

function renderRelationships() {
    if (typeof gameState === 'undefined' || !gameState) return;
    const rels = gameState.relationships || [];
    setElementText('rel-count-badge', `${rels.length} Mối quan hệ`);
    setElementText('rel-level-title', getSocialLevelTitle(rels.length));
    
    const modalList = document.getElementById("relationship-modal-list");
    if (!modalList) return;
    modalList.innerHTML = "";
    
    if (rels.length === 0) {
        modalList.innerHTML = `<p class="text-xs text-center font-bold text-amber-800/60 py-4">Chưa có mối quan hệ nào.</p>`;
        return;
    }
    
    rels.forEach(rel => {
        const lvl = typeof rel.level === 'number' ? rel.level : 0;
        const xp = typeof rel.xp === 'number' ? rel.xp : 0;
        const tier = typeof getRelationshipTier === 'function' ? getRelationshipTier(lvl, xp) : { icons: "👁️", label: "Quen biết", xpText: "0/100", progressPercent: 0, barColor: "bg-gray-400" };
        
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-3 rounded-2xl flex items-center justify-between border border-amber-300/40 shrink-0 gap-2";
        item.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="text-2xl">${rel.icon || '👤'}</span>
                <div class="flex flex-col">
                    <span class="text-xs font-extrabold text-amber-950">${rel.name} (${rel.relation})</span>
                    <span class="text-xs tracking-widest mt-0.5">${tier.icons}</span>
                </div>
            </div>
            <div class="flex flex-col items-end gap-1 w-28">
                <div class="flex justify-between w-full text-[9px] font-extrabold text-amber-900">
                    <span class="truncate">${tier.label}</span>
                    <span class="font-mono">${tier.xpText}</span>
                </div>
                <div class="w-full bg-amber-950/10 h-2 rounded-full overflow-hidden p-0.5 border border-amber-300/50">
                    <div class="${tier.barColor} h-full rounded-full transition-all duration-300 shadow-sm" style="width: ${tier.progressPercent}%"></div>
                </div>
            </div>
        `;
        modalList.appendChild(item);
    });
}

function showRelationshipModal(show) {
    const modal = document.getElementById("relationship-modal");
    if (modal) {
        if (show) { renderRelationships();
            modal.classList.remove("hidden"); }
        else { modal.classList.add("hidden"); }
    }
}

function renderHousing() {
    if (!gameState) return;
    const home = gameState.currentHome || { name: "Chưa có", type: "homeless", monthlyCost: 0 };
    
    setElementText('home-name', home.name);
    setElementText('home-cost-text', `Chi phí: ${home.monthlyCost} $/tháng`);
    
    const badgeEl = document.getElementById("home-type-badge");
    if (badgeEl) {
        if (home.type === 'shared') badgeEl.innerText = "Ở nhờ";
        else if (home.type === 'rented') badgeEl.innerText = "Đang thuê";
        else badgeEl.innerText = "Vô gia cư";
    }
    
    const modalList = document.getElementById("housing-modal-list");
    if (!modalList) return;
    modalList.innerHTML = "";
    const pool = gameState.availableHousingPool || [];
    
    if (pool.length === 0) {
        modalList.innerHTML = `<div class="text-center py-6"><span class="text-2xl">🚫</span><p class="text-xs font-bold text-amber-900 mt-1">Không có tin thuê nhà tháng này.</p></div>`;
        return;
    }
    
    pool.forEach(house => {
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40";
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex flex-col">
                    <span class="text-xs font-extrabold text-amber-950">${house.name}</span>
                    <span class="text-[10px] text-amber-800/80 mt-0.5">${house.description}</span>
                </div>
                <span class="text-xs font-black text-orange-700 font-mono">${house.monthlyCost} $/tháng</span>
            </div>
            <button onclick="handleRentHouse('${house.id}')" class="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display font-extrabold rounded-xl text-[10px]">🏠 Ký Hợp Đồng Thuê</button>
        `;
        modalList.appendChild(item);
    });
}

function handleRentHouse(houseId) {
    if (!gameState || !gameState.availableHousingPool) return;
    const targetHouse = gameState.availableHousingPool.find(h => h.id === houseId);
    if (!targetHouse) return;
    
    if ((gameState.money || 0) < targetHouse.monthlyCost) {
        alert("❌ Bạn không đủ tiền cọc/tiền nhà!");
        return;
    }
    
    gameState.currentHome = { ...targetHouse };
    alert(`🎉 Bạn đã chuyển sang ở: ${targetHouse.name}!`);
    showHousingModal(false);
    if (typeof saveGameState === 'function') saveGameState();
    renderGameState();
}

function showHousingModal(show) {
    const modal = document.getElementById("housing-modal");
    if (modal) {
        if (show) { renderHousing();
            modal.classList.remove("hidden"); }
        else { modal.classList.add("hidden"); }
    }
}


/**
 * =================================================================
 * ZONE 6: HEALTH, FITNESS & MEDICAL VIEW HANDLERS (SỨC KHỎE & Y TẾ)
 * =================================================================
 */

/**
 * Render Giao diện Chăm sóc sức khỏe
 */
/**
 * Render Giao diện Chăm sóc sức khỏe & Cập nhật Real-time các thanh chỉ số
 */
function renderHealthView() {
    if (!gameState) return;
    
    // 1. Cập nhật Ví tiền trong View Sức khỏe
    setElementText('health-view-money', (gameState.money || 0).toLocaleString());
    
    // 2. Cập nhật 3 thanh chỉ số: Sức khỏe, Dinh dưỡng, Stress
    const healthVal = Math.max(0, Math.min(100, gameState.health || 100));
    const hungerVal = Math.max(0, Math.min(100, gameState.hunger || 80));
    const stressVal = Math.max(0, Math.min(100, gameState.stress || 0));
    
    setElementText('hv-health', healthVal);
    setElementText('hv-hunger', hungerVal);
    setElementText('hv-stress', stressVal);
    
    const healthBar = document.getElementById('hv-health-bar');
    if (healthBar) healthBar.style.width = `${healthVal}%`;
    
    const hungerBar = document.getElementById('hv-hunger-bar');
    if (hungerBar) hungerBar.style.width = `${hungerVal}%`;
    
    const stressBar = document.getElementById('hv-stress-bar');
    if (stressBar) stressBar.style.width = `${stressVal}%`;
    
    // 3. Khung Chẩn Đoán Thông Minh
    const advisoryEl = document.getElementById("health-advisory-box");
    if (advisoryEl) {
        let adviceText = "🟢 Thể trạng hoàn hảo. Hãy tiếp tục duy trì lối sống điều độ!";
        let adviceBg = "bg-emerald-100/80 border-emerald-300 text-emerald-950";
        
        if (hungerVal < 30) {
            adviceText = "⚠️ Đói khát trầm trọng! Hãy ăn ngay để tránh tụt sức khỏe.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950 animate-pulse";
        } else if (stressVal >= 60) {
            adviceText = "🧠 Căng thẳng đỉnh điểm! Cần đi chạy bộ hoặc tập gym ngay lập tức.";
            adviceBg = "bg-amber-100/80 border-amber-300 text-amber-950 animate-pulse";
        } else if (healthVal < 50) {
            adviceText = "🩺 Sức khỏe báo động! Nên mua thuốc hoặc đến bệnh viện khám tổng quát.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950";
        }
        
        advisoryEl.className = `glass-card-inner-light p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${adviceBg}`;
        advisoryEl.innerHTML = `<span>💡</span><span>${adviceText}</span>`;
    }
    
    // 4. Trạng thái bệnh tật
    const ailments = gameState.ailments || [];
    const statusEl = document.getElementById("health-view-status");
    if (statusEl) {
        if (ailments.length === 0) {
            statusEl.className = "text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300";
            statusEl.innerText = "🟢 Khỏe mạnh";
        } else {
            statusEl.className = "text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300";
            statusEl.innerText = `🔴 Đang bị bệnh: ${ailments.join(', ')}`;
        }
    }
}

function handleEatMeal(type) {
    if (!gameState) return;
    
    if (type === 'fastfood') {
        if ((gameState.money || 0) < 15) return alert("❌ Bạn không đủ 15 $!");
        gameState.money -= 15;
        gameState.hunger = Math.min(100, (gameState.hunger || 0) + 30);
        
        // 🚀 ĐẨY VÀO SAO KÊ VÀ NHẬT KÝ
        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory("Ăn uống: Cơm bình dân / Đồ ăn nhanh", -15);
        }
        if (typeof addDailyLog === 'function') {
            addDailyLog("Ăn cơm bình dân (+30 Dinh dưỡng).");
        }
        
        alert("🍜 Ăn cơm bình dân (+30 Độ no)!");
    } else if (type === 'healthy') {
        if ((gameState.money || 0) < 50) return alert("❌ Bạn không đủ 50 $!");
        gameState.money -= 50;
        gameState.hunger = Math.min(100, (gameState.hunger || 0) + 60);
        gameState.health = Math.min(100, (gameState.health || 0) + 10);
        
        // 🚀 ĐẨY VÀO SAO KÊ VÀ NHẬT KÝ
        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory("Ăn uống: Bữa ăn dinh dưỡng cao cấp", -50);
        }
        if (typeof addDailyLog === 'function') {
            addDailyLog("Thưởng thức bữa ăn dinh dưỡng cao cấp (+60 Dinh dưỡng, +10 Sức khỏe).");
        }
        
        alert("🥗 Bữa ăn dinh dưỡng (+60 Độ no, +10 Sức khỏe)!");
    }
    
    if (typeof saveGameState === 'function') saveGameState();
    renderHealthView();
}

function handleMedicalCare(type) {
    if (!gameState) return;
    
    if (type === 'pharmacy') {
        if ((gameState.money || 0) < 30) return alert("❌ Bạn không đủ 30 $!");
        gameState.money -= 30;
        gameState.health = Math.min(100, (gameState.health || 0) + 15);
        gameState.ailments = [];
        
        // 🚀 ĐẨY VÀO SAO KÊ VÀ NHẬT KÝ
        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory("Y tế: Mua thuốc cảm sốt", -30);
        }
        if (typeof addDailyLog === 'function') {
            addDailyLog("Mua thuốc tiệm tây (+15 Sức khỏe, chữa hết bệnh nhẹ).");
        }
        
        alert("💊 Đã uống thuốc. Chữa sạch bệnh vặt (+15 Sức khỏe)!");
    } else if (type === 'hospital') {
        if ((gameState.money || 0) < 150) return alert("❌ Bạn không đủ 150 $!");
        gameState.money -= 150;
        gameState.health = Math.min(100, (gameState.health || 0) + 40);
        gameState.stress = Math.max(0, (gameState.stress || 0) - 20);
        gameState.ailments = [];
        
        // 🚀 ĐẨY VÀO SAO KÊ VÀ NHẬT KÝ
        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory("Y tế: Khám & Chữa bệnh tổng quát Bệnh viện", -150);
        }
        if (typeof addDailyLog === 'function') {
            addDailyLog("Nhập viện điều trị tổng quát (+40 Sức khỏe, giảm Stress).");
        }
        
        alert("🏥 Đã điều trị tại bệnh viện (+40 Sức khỏe, giảm Stress)!");
    }
    
    if (typeof saveGameState === 'function') saveGameState();
    renderHealthView();
}

function handleFitness(type) {
    if (!gameState) return;
    
    if (type === 'park') {
        gameState.stress = Math.max(0, (gameState.stress || 0) - 10);
        gameState.strength = Math.min(100, (gameState.strength || 0) + 2);
        
        if (typeof addDailyLog === 'function') {
            addDailyLog("Chạy bộ ở công viên (-10 Stress, +2 Sức mạnh).");
        }
        
        alert("🏃 Đã chạy bộ công viên (-10 Stress, +2 Sức mạnh)!");
    } else if (type === 'gym') {
        if ((gameState.money || 0) < 60) return alert("❌ Bạn không đủ 60 $!");
        gameState.money -= 60;
        gameState.stress = Math.max(0, (gameState.stress || 0) - 30);
        gameState.strength = Math.min(100, (gameState.strength || 0) + 5);
        gameState.looks = Math.min(100, (gameState.looks || 0) + 5);
        
        // 🚀 ĐẨY VÀO SAO KÊ VÀ NHẬT KÝ
        if (typeof addTransactionHistory === 'function') {
            addTransactionHistory("Giải trí: Đăng ký tập Gym / Yoga", -60);
        }
        if (typeof addDailyLog === 'function') {
            addDailyLog("Đăng ký tập Gym/Yoga (-30 Stress, +5 Sức mạnh, +5 Ngoại hình).");
        }
        
        alert("🏋️ Tập Gym hăng say (-30 Stress, +5 Sức mạnh, +5 Ngoại hình)!");
    }
    
    if (typeof saveGameState === 'function') saveGameState();
    renderHealthView();
}