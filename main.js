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
            // --- MẸO CHỨNG KHOÁN & ĐẦU TƯ ---
            "📈 Mẹo Chứng Khoán: Cổ phiếu Blue-chip (SBM, LGC, QCP) rất an toàn và sẽ chia 'Cổ tức' tự động cho bạn vào tháng 12 hàng năm!",
            "🚨 Cảnh Báo Đầu Tư: Tránh xa các mã Penny hoặc Crypto nếu bạn không giỏi chịu đựng rủi ro. Có thể cháy tài khoản chỉ sau một đêm!",
            "💡 Mẹo Chứng Khoán: Nếu lỡ mua hớ ở đỉnh, hãy mua thêm khi giá giảm để hạ 'Giá vốn trung bình' (DCA) xuống thấp hơn.",
            "⚖️ Tin Tức Thị Trường: Khi Tâm lý thị trường chuyển sang 'Suy thoái (Downtrend)', đó lại là cơ hội vàng để gom cổ phiếu giá rẻ.",
            "💰 Mẹo Tài Chính: Tiền mặt mất giá theo thời gian. Hãy dùng tiền nhàn rỗi mua một ít tài sản an toàn để sinh lời.",
            
            // --- MẸO HỌC TẬP & CÔNG VIỆC ---
            "🎓 Mẹo Khởi Nghiệp: Vừa học Chính Quy vừa làm Toàn thời gian sẽ khiến cơ thể suy nhược nghiêm trọng do quá tải (-8 Sức khỏe/tháng)!",
            "💼 Tin Tức Nghề Nghiệp: Một số công việc cấp cao yêu cầu bạn phải có mối quan hệ tốt với những người trong ngành đó.",
            "✈️ Mẹo Di Cư: Tới Thành phố Phồn Hoa lương sẽ tăng mạnh (x1.4), nhưng hãy cẩn thận vì Áp lực (Stress) cũng tăng theo cấp số nhân!",
            
            // --- MẸO SỨC KHỎE & XÃ HỘI ---
            "🏥 Mẹo Y Tế: Đừng bao giờ để Sức khỏe tụt dưới 20%. Bạn sẽ bị ép nhập viện cấp cứu khẩn cấp và tốn cả đống tiền viện phí!",
            "🍔 Mẹo Dinh Dưỡng: Hãy giữ Độ no (Hunger) trên 50. Nếu để cơ thể đói khát, bạn sẽ bị trừ Sức khỏe rất nặng khi sang tháng mới.",
            "👥 Mẹo Xã Hội: Đừng bỏ bê bạn bè! Nếu không tương tác quá 3 tháng liên tục, họ sẽ dần xa cách và rời bỏ bạn đấy.",
            "🧘 Mẹo Sức Khỏe: Căng thẳng (Stress) quá cao? Đi ăn uống cùng bạn bè, tập Thiền, hoặc đăng ký lớp Yoga sẽ giúp giải tỏa cực kỳ hiệu quả."
        ];
        // Lấy 3 tin tức khác nhau đan xen dựa trên số tháng để tạo thành 1 dải tin dài
        const idx = gameState.month || 1;
        const tip1 = tips[idx % tips.length];
        const tip2 = tips[(idx + 3) % tips.length];
        const tip3 = tips[(idx + 7) % tips.length];
        
        // Nối lại bằng icon chấm đỏ báo hiệu chuyển tin
        const currentTip = `${tip1} 🔴 ${tip2} 🔴 ${tip3}`;
        newsTickerEl.innerText = currentTip;

    }

    
    // Cập nhật 4 thuộc tính năng lực
    setElementText('strength', gameState.strength ?? 50);
    setElementText('looks', gameState.looks ?? 60);
    setElementText('charm', gameState.charm ?? 45);
    setElementText('ego', gameState.ego ?? 30);
      // 🌟 Đảm bảo gọi updateCityTheme() mỗi khi render lại game
    if (typeof updateCityTheme === 'function') {
        updateCityTheme();
    }
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
/**
 * Render thanh chỉ số tiến trình (% width) với bộ lọc giới hạn 0 - 100 an toàn
 */
function renderStatBar(id, value) {
    const clampedValue = Math.max(0, Math.min(100, Number(value) || 0));
    setElementText(id, clampedValue);
    const barEl = document.getElementById(`${id}-bar`);
    if (barEl) {
        barEl.style.width = `${clampedValue}%`;
    }
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
    const btn = document.getElementById("next-month-btn");
    if (btn && btn.disabled) return;
    if (btn) btn.disabled = true; // Khóa ngay lập tức

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
    // Hide tất cả các view
    const mainView = document.getElementById('main-game-view');
    const reportView = document.getElementById('overview-report-view');
    const healthView = document.getElementById('health-care-view');

    if (mainView) mainView.classList.add('hidden');
    if (reportView) reportView.classList.add('hidden');
    if (healthView) healthView.classList.add('hidden');

    if (viewName === 'main' && mainView) {
        mainView.classList.remove('hidden');
    } else if (viewName === 'report' && reportView) {
        reportView.classList.remove('hidden');
        if (typeof renderOverviewReport === 'function') renderOverviewReport();
    } else if (viewName === 'health' && healthView) {
        healthView.classList.remove('hidden');
        
        // 🚀 CỰC KỲ QUAN TRỌNG: Bắt buộc phải gọi hàm này mỗi khi mở Tab Sức Khỏe!
        if (typeof renderHealthView === 'function') {
            renderHealthView();
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
    const currentMoney = gameState.money ?? 0;
    
    if (currentMoney <= 0) {
        return alert("❌ Cảnh sát trưởng: Bạn không có đồng nào trong túi để trả nợ!");
    }
    
    const maxPayable = Math.min(currentDebt, currentMoney);
    
    // Sử dụng Custom Prompt thay thế cho prompt() xấu xí
    showGamePrompt(
        `📉 TÌNH TRẠNG CÔNG NỢ:\n- Bạn đang nợ: ${currentDebt.toLocaleString()} $\n- Tiền trong ví: ${currentMoney.toLocaleString()} $\n\nNhập số tiền bạn muốn thanh toán:`,
        maxPayable,
        function(amountStr) {
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
            
            // Dùng hàm modifyStat (đã tạo ở bước tối ưu trước) để tính toán an toàn
            modifyStat('money', -amount);
            modifyStat('debt', -amount);
            
            if (typeof addTransactionHistory === 'function') addTransactionHistory("💳 Thanh toán công nợ", -amount);
            if (typeof addDailyLog === 'function') addDailyLog(`Đã trả nợ ${amount.toLocaleString()} $. Nợ còn lại: ${(gameState.debt ?? 0).toLocaleString()} $.`);
            
            alert(`✅ Bạn đã thanh toán ${amount.toLocaleString()} $ tiền nợ!\nNợ còn lại: ${(gameState.debt ?? 0).toLocaleString()} $`);
            
            saveGameState();
            renderGameState();
            if (typeof renderOverviewReport === 'function') renderOverviewReport();
        },
        "Thanh Toán Nợ",
        "💳",
        "📉 CÔNG NỢ"
    );
}


/**
 * Hiển thị bảng Tương tác chi tiết với một NPC cụ thể
 */
function showNPCInteractionModal(npcId, show) {
    const modal = document.getElementById("npc-interaction-modal");
    if (!modal) return;

    if (!show || !npcId) {
        modal.classList.add("hidden");
        return;
    }

    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    // Cập nhật thông tin lên UI
    setElementText("npc-modal-name", npc.name);
    setElementText("npc-modal-relation", npc.relation);
    document.getElementById("npc-modal-icon").innerText = npc.icon || "👤";

    // Khởi tạo các nút tương tác
    const actionsContainer = document.getElementById("npc-interaction-actions");
    
    // Nút Xin Tiền (Chỉ hiện nếu là Bố/Mẹ)
    const askMoneyBtnHTML = (npc.id === 'father' || npc.id === 'mother') ? `
        <button onclick="handleAskForMoney('${npc.id}'); showNPCInteractionModal(null, false);" class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border border-amber-300/40">
            <span>💸</span> Xin Hỗ Trợ Tài Chính
        </button>
    ` : '';

    actionsContainer.innerHTML = `
        <button onclick="handleHangoutWithNPC('${npc.id}'); showNPCInteractionModal(null, false);" class="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-display font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border border-teal-300/40">
            <span>☕</span> Rủ Đi Ăn / Cafe (-30$)
        </button>
        
        ${askMoneyBtnHTML}

        <button onclick="handleNPCChat('${npc.id}'); showNPCInteractionModal(null, false);" class="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-display font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border border-indigo-300/40 mt-1">
            <span>💬</span> Trò Chuyện Tâm Sự
        </button>
    `;

    modal.classList.remove("hidden");
}

/**
 * 🚀 Kích hoạt khung trò chuyện tâm sự (NLP Dialogue) với NPC được chọn
 */
// 🗂️ KHO TẢI CHỦ ĐỀ HỘI THOẠI THEO NGỮ CẢNH (Dễ quản lý & mở rộng)
const NPC_CHAT_TOPICS = [
    {
        id: "work",
        title: "Công việc & Sự nghiệp",
        icon: "💼",
        getPrompt: (npc) => `${npc.name} nhìn bạn nghiêm túc hỏi: "Dạo này công việc bên chỗ cậu thế nào rồi? Có gặp áp lực gì lớn từ cấp trên hay khách hàng không, kể nghe xem nào."`
    },
    {
        id: "money",
        title: "Tài chính & Đầu tư",
        icon: "💰",
        getPrompt: (npc) => `${npc.name} bấm điện thoại rồi ngẩng lên bảo: "Thời buổi kinh tế này kiếm tiền khó khăn thật. Cậu đang có khoản tích lũy nào không, hay có định đầu tư gì mới không đấy?"`
    },
    {
        id: "life",
        title: "Triết lý & Lối sống",
        icon: "🌿",
        getPrompt: (npc) => `${npc.name} thở dài cười nhẹ: "Nhiều lúc nhìn lại thấy thời gian trôi nhanh khủng khiếp. Theo cậu, điều quan trọng nhất ở đời này rốt cuộc là gì?"`
    },
    {
        id: "gossip",
        title: "Than thở & Xả stress",
        icon: "☕",
        getPrompt: (npc) => `${npc.name} chống cằm phàn nàn: "Hôm nay tự nhiên tớ thấy mệt mỏi ngang xương, chán chẳng muốn làm gì cả. Cậu có bí quyết gì xả stress không, chia sẻ xem nào!"`
    }
];

/**
 * 🚀 Mở khung trò chuyện tâm sự với chủ đề ngữ cảnh riêng biệt
 */
function handleNPCChat(npcId) {
    if (!gameState || !gameState.relationships) return;
    const npc = gameState.relationships.find(r => r.id === npcId);
    if (!npc) return;

    const modal = document.getElementById("dialogue-event-modal");
    if (!modal) return;

    // Chọn ngẫu nhiên 1 chủ đề ngữ cảnh trong kho
    const randomTopic = NPC_CHAT_TOPICS[Math.floor(Math.random() * NPC_CHAT_TOPICS.length)];
    const contextualPrompt = randomTopic.getPrompt(npc);

    // Gán vào khung dialogue chung
    currentActiveDialogueEvent = {
        id: "npc_chat_" + randomTopic.id,
        tag: `${randomTopic.icon} TÂM SỰ: ${randomTopic.title.toUpperCase()}`,
        title: `Trò chuyện cùng ${npc.name} (${npc.relation})`,
        prompt: contextualPrompt,
        category: "social",
        targetNpcId: npc.id,
        topicContext: randomTopic.id // Lưu ngữ cảnh để chấm điểm
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
    setTimeout(() => { if (inputEl) inputEl.focus(); }, 150);
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

/**
 * Tính toán danh hiệu, icon và tiến độ thanh XP cho mối quan hệ NPC
 * @param {number} level Cấp độ quan hệ hiện tại
 * @param {number} xp Điểm kinh nghiệm hiện tại (0 - 99)
 * @returns {Object} Thông tin hiển thị (icons, label, xpText, progressPercent, barColor)
 */
function getRelationshipTier(level, xp) {
    let label = "Xã giao";
    let icons = "💬";
    let barColor = "bg-amber-400";

    if (level <= -2) {
        label = "Thù địch 😡";
        icons = "⚡⚡";
        barColor = "bg-rose-600";
    } else if (level === -1) {
        label = "Xa cách / Ghét 😒";
        icons = "💢";
        barColor = "bg-rose-400";
    } else if (level === 0) {
        label = "Quen biết 👁️";
        icons = "👁️";
        barColor = "bg-amber-400";
    } else if (level === 1) {
        label = "Bạn bè 😊";
        icons = "🌟";
        barColor = "bg-teal-500";
    } else if (level === 2) {
        label = "Thân thiết 🥰";
        icons = "💖";
        barColor = "bg-emerald-500";
    } else if (level >= 3) {
        label = "Tri kỷ / Soulmate 👑";
        icons = "👑💖";
        barColor = "bg-purple-600";
    }

    const progressPercent = Math.max(0, Math.min(100, xp));
    const xpText = `${xp}/100 XP (Lvl ${level})`;

    return {
        icons,
        label,
        xpText,
        progressPercent,
        barColor
    };
}

// Biến trạng thái tab quan hệ hiện tại ('list' hoặc 'history')
let currentRelationshipTab = 'list';

function setRelationshipTab(tabName) {
    currentRelationshipTab = tabName;
    const listBtn = document.getElementById("rel-tab-list");
    const historyBtn = document.getElementById("rel-tab-history");
    const listContainer = document.getElementById("relationship-modal-list");
    const historyContainer = document.getElementById("relationship-modal-history");
    const sortContainer = document.getElementById("rel-sort-container");

    if (tabName === 'list') {
        if (listBtn) listBtn.className = "flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all text-amber-900 bg-white/80 shadow-sm";
        if (historyBtn) historyBtn.className = "flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all text-amber-800/70 hover:text-amber-900";
        if (listContainer) listContainer.classList.remove("hidden");
        if (historyContainer) historyContainer.classList.add("hidden");
        if (sortContainer) sortContainer.classList.remove("hidden");
    } else {
        if (historyBtn) historyBtn.className = "flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all text-amber-900 bg-white/80 shadow-sm";
        if (listBtn) listBtn.className = "flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all text-amber-800/70 hover:text-amber-900";
        if (historyContainer) historyContainer.classList.remove("hidden");
        if (listContainer) listContainer.classList.add("hidden");
        if (sortContainer) sortContainer.classList.add("hidden");
        renderRelationshipHistory();
    }
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

    // 🚀 SẮP XẾP THEO BỘ LỌC (Thân nhất ➔ Ghét nhất HOẶC Ngược lại)
    const sortSelect = document.getElementById("rel-sort-select");
    const sortOrder = sortSelect ? sortSelect.value : 'desc';

    const sortedRels = [...rels].sort((a, b) => {
        const scoreA = (a.level || 0) * 100 + (a.xp || 0);
        const scoreB = (b.level || 0) * 100 + (b.xp || 0);
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
    
    sortedRels.forEach(rel => {
        const lvl = typeof rel.level === 'number' ? rel.level : 0;
        const xp = typeof rel.xp === 'number' ? rel.xp : 0;
        const tier = getRelationshipTier(lvl, xp);
        
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-3 rounded-2xl flex items-center justify-between border border-amber-300/40 shrink-0 gap-2";
        item.innerHTML = `
            <div class="flex flex-col w-full gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <span class="text-3xl drop-shadow-sm">${rel.icon || '👤'}</span>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-amber-950">${rel.name} <span class="text-[9px] text-amber-800/80">(${rel.relation})</span></span>
                            <span class="text-[10px] tracking-widest mt-0.5">${tier.icons}</span>
                        </div>
                    </div>
                    <button onclick="showNPCInteractionModal('${rel.id}', true)" class="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl text-[10px] shadow-sm active:scale-95 border border-amber-300/40">
                        Tương Tác
                    </button>
                </div>

                <div class="flex flex-col items-end gap-1 w-full mt-1">
                    <div class="flex justify-between w-full text-[9px] font-extrabold text-amber-900">
                        <span class="truncate">${tier.label}</span>
                        <span class="font-mono">${tier.xpText}</span>
                    </div>
                    <div class="w-full bg-amber-950/10 h-2 rounded-full overflow-hidden p-0.5 border border-amber-300/50">
                        <div class="${tier.barColor} h-full rounded-full transition-all duration-300 shadow-sm" style="width: ${tier.progressPercent}%"></div>
                    </div>
                </div>
            </div>
        `;
        modalList.appendChild(item);
    });
}

function renderRelationshipHistory() {
    const historyContainer = document.getElementById("relationship-modal-history");
    if (!historyContainer) return;
    historyContainer.innerHTML = "";

    const logs = gameState.relationshipLogs || [];
    if (logs.length === 0) {
        historyContainer.innerHTML = `<p class="text-xs text-center font-bold text-amber-800/60 py-6">Chưa có lịch sử biến động quan hệ nào.</p>`;
        return;
    }

    logs.forEach(log => {
        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold border border-amber-300/30";
        item.innerHTML = `
            <span class="text-[9px] font-mono bg-amber-900/10 text-amber-950 px-1.5 py-0.5 rounded-md">T${log.month} (${log.age}t)</span>
            <span class="text-amber-900">${log.text}</span>
        `;
        historyContainer.appendChild(item);
    });
}

function showRelationshipModal(show) {
    const modal = document.getElementById("relationship-modal");
    if (modal) {
        if (show) { 
            setRelationshipTab('list'); // Mặc định mở tab danh sách
            renderRelationships();
            modal.classList.remove("hidden"); 
        } else { 
            modal.classList.add("hidden"); 
        }
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
/**
 * 🚀 ĐẶT HÀM NÀY Ở CUỐI FILE UI.JS ĐỂ KHÔNG BỊ ĐÈ CODE
 */
function renderHealthView() {
    if (typeof gameState === 'undefined' || !gameState) return;
    if (!gameState.subscriptions) gameState.subscriptions = { gym: false, yoga: false };

    // Khởi tạo cờ mặc định nếu save cũ chưa có
    if (typeof gameState.hasCheckupThisMonth === 'undefined') gameState.hasCheckupThisMonth = false;
    if (typeof gameState.hasTreatedThisMonth === 'undefined') gameState.hasTreatedThisMonth = false;

    const moneyEl = document.getElementById('health-view-money');
    if (moneyEl) moneyEl.innerText = (gameState.money ?? 0).toLocaleString();
    
    const healthVal = Math.max(0, Math.min(100, gameState.health ?? 100));
    const hungerVal = Math.max(0, Math.min(100, gameState.hunger ?? 80));
    const stressVal = Math.max(0, Math.min(100, gameState.stress ?? 0));
    
    const hvHealth = document.getElementById('hv-health');
    if (hvHealth) hvHealth.innerText = healthVal;
    const hvHunger = document.getElementById('hv-hunger');
    if (hvHunger) hvHunger.innerText = hungerVal;
    const hvStress = document.getElementById('hv-stress');
    if (hvStress) hvStress.innerText = stressVal;
    
    const healthBar = document.getElementById('hv-health-bar');
    if (healthBar) healthBar.style.width = `${healthVal}%`;
    
    const hungerBar = document.getElementById('hv-hunger-bar');
    if (hungerBar) hungerBar.style.width = `${hungerVal}%`;
    
    const stressBar = document.getElementById('hv-stress-bar');
    if (stressBar) stressBar.style.width = `${stressVal}%`;
    
    // Cập nhật nút Gym & Yoga
    const gymBtn = document.getElementById("btn-sub-gym");
    if (gymBtn) {
        gymBtn.innerText = gameState.subscriptions.gym ? "Đã Đăng Ký (Hủy)" : "Đăng ký";
        gymBtn.className = gameState.subscriptions.gym 
            ? "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm"
            : "py-1.5 px-3 bg-teal-600 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm";
    }

    const yogaBtn = document.getElementById("btn-sub-yoga");
    if (yogaBtn) {
        yogaBtn.innerText = gameState.subscriptions.yoga ? "Đã Đăng Ký (Hủy)" : "Đăng ký";
        yogaBtn.className = gameState.subscriptions.yoga 
            ? "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm"
            : "py-1.5 px-3 bg-teal-600 text-white font-extrabold rounded-xl text-[10px] active:scale-95 shadow-sm";
    }

    // 🩺 CẬP NHẬT TRẠNG THÁI NÚT KHÁM BỆNH (Dùng cờ hasCheckupThisMonth)
    const checkupBtn = document.getElementById("btn-med-checkup");
    const checkBadge = document.getElementById("health-check-badge");
    
    if (gameState.hasCheckupThisMonth) {
        if (checkupBtn) {
            checkupBtn.innerText = "Đã khám";
            checkupBtn.className = "py-1.5 px-3 bg-gray-300 text-gray-600 font-extrabold rounded-xl text-[10px]";
        }
        if (checkBadge) {
            checkBadge.innerText = "Đã khám tháng này";
            checkBadge.className = "text-[9px] font-bold text-rose-900 bg-rose-200 px-2 py-0.5 rounded-md";
        }
    } else {
        if (checkupBtn) {
            checkupBtn.innerText = "Chẩn đoán";
            checkupBtn.className = "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px]";
        }
        if (checkBadge) {
            checkBadge.innerText = "Chưa khám";
            checkBadge.className = "text-[9px] font-bold text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-md";
        }
    }

    // 💊 CẬP NHẬT TRẠNG THÁI NÚT ĐIỀU TRỊ (Dùng cờ hasTreatedThisMonth)
    const pharmacyBtn = document.getElementById("btn-med-pharmacy");
    const hospitalBtn = document.getElementById("btn-med-hospital");
    
    if (gameState.hasTreatedThisMonth) {
        if (pharmacyBtn) {
            pharmacyBtn.innerText = "Đã dùng tháng này";
            pharmacyBtn.className = "py-1.5 px-3 bg-gray-300 text-gray-600 font-extrabold rounded-xl text-[10px]";
        }
        if (hospitalBtn) {
            hospitalBtn.innerText = "Đã dùng tháng này";
            hospitalBtn.className = "py-1.5 px-3 bg-gray-300 text-gray-600 font-extrabold rounded-xl text-[10px]";
        }
    } else {
        if (pharmacyBtn) {
            pharmacyBtn.innerText = "Mua thuốc";
            pharmacyBtn.className = "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px]";
        }
        if (hospitalBtn) {
            hospitalBtn.innerText = "Nhập viện";
            hospitalBtn.className = "py-1.5 px-3 bg-rose-500 text-white font-extrabold rounded-xl text-[10px]";
        }
    }

    // Khung Chẩn Đoán Thông Minh
    const advisoryEl = document.getElementById("health-advisory-box");
    if (advisoryEl) {
        let adviceText = "🟢 Thể trạng bình thường. Hãy duy trì lối sống điều độ!";
        let adviceBg = "bg-emerald-100/80 border-emerald-300 text-emerald-950";
        
        if (hungerVal < 30) {
            adviceText = "⚠️ Đói khát! Hãy ăn uống ngay để tránh tổn hại sức khỏe khi sang tháng.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950 animate-pulse";
        } else if (stressVal >= 60) {
            adviceText = "🧠 Căng thẳng cao! Nên tập Thiền hoặc đăng ký Gym/Yoga để giải tỏa.";
            adviceBg = "bg-amber-100/80 border-amber-300 text-amber-950 animate-pulse";
        } else if (healthVal < 50) {
            adviceText = "🩺 Sức khỏe báo động! Hãy đi khám hoặc mua thuốc tây điều trị.";
            adviceBg = "bg-rose-100/80 border-rose-300 text-rose-950";
        }
        
        advisoryEl.className = `glass-card-inner-light p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${adviceBg}`;
        advisoryEl.innerHTML = `<span>💡</span><span>${adviceText}</span>`;
    }
    
    // Trạng thái bệnh tật
    const ailments = gameState.ailments || [];
    const statusEl = document.getElementById("health-view-status");
    if (statusEl) {
        if (ailments.length === 0) {
            statusEl.className = "text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300";
            statusEl.innerText = "🟢 Khỏe mạnh";
        } else {
            statusEl.className = "text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300";
            statusEl.innerText = `🔴 Bệnh mắc phải: ${ailments.length} bệnh`;
        }
    }
}