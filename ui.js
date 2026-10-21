/**
 * =================================================================
 * ZONE 1: FIREBASE CLOUD SYNC & AUTH STATE (ĐỒNG BỘ DỮ LIỆU CLOUD)
 * =================================================================
 */

/**
 * Lưu gameState hiện tại lên Firebase Firestore
 * @param {string} userId UID của người dùng
 */
function saveGameStateToFirebase(userId) {
    if (typeof db === 'undefined' || !gameState) return;

    db.collection("players").doc(userId).set(gameState, { merge: true })
        .then(() => {
            console.log("☁️ Đã đồng bộ tiến trình lên Firebase thành công!");
        })
        .catch((error) => {
            console.error("❌ Lỗi đồng bộ Firebase:", error);
        });
}

function loadGameStateFromFirebase(userId) {
    if (typeof db === 'undefined') return;

    db.collection("players").doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                gameState = doc.data();

                if (gameState && gameState.currentCity) {
                    document.body.className = `city-${gameState.currentCity}`;
                } else {
                    document.body.className = `city-ung-dung`;
                }

                if (typeof saveGameState === 'function') saveGameState();
                if (typeof renderGameState === 'function') renderGameState();
                if (typeof startMonthCalendarTimer === 'function') startMonthCalendarTimer();
                console.log("☁️ Đã tải tiến trình từ Firebase thành công!");
            } else {
                console.warn("⚠️ Tài khoản mới chưa có dữ liệu Cloud. Đang khởi tạo bộ nhớ trống...");

                localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
                gameState = null;
                if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

                if (typeof showCreateCharacterModal === 'function') showCreateCharacterModal(true);
            }
        })
        .catch((error) => {
            console.error("❌ Lỗi nạp dữ liệu từ Firebase:", error);
        });
    
    if (typeof updateCityTheme === 'function') {
        updateCityTheme();
    }
}

/**
 * Lắng nghe trạng thái đăng nhập & Cập nhật UI Tài khoản trong Sidebar
 */
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        const cloudUserDisplay = document.getElementById("cloud-username-display");
        const authBtnText = document.getElementById("auth-status-btn-text");
        const authIcon = document.getElementById("sidebar-auth-icon");
        const authBtn = document.getElementById("sidebar-auth-btn");
        const userIcon = document.getElementById("sidebar-user-icon");
        const userAvatarBg = document.getElementById("sidebar-user-avatar-bg");

        if (user && user.email) {
            const displayUsername = user.email.replace(DOMAIN_SUFFIX, "");

            if (cloudUserDisplay) cloudUserDisplay.innerText = displayUsername;
            if (authBtnText) authBtnText.innerText = "Đăng xuất";
            if (authIcon) authIcon.innerText = "🚪";
            if (userIcon) userIcon.innerText = "☁️";

            if (userAvatarBg) {
                userAvatarBg.className = "w-8 h-8 rounded-full bg-emerald-200 border border-emerald-400/60 flex items-center justify-center shrink-0";
            }

            if (authBtn) {
                authBtn.className = "w-full py-2 px-3 bg-rose-500 hover:bg-rose-600 text-white font-display font-extrabold rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-rose-300/40";
            }

            checkAdminAccess(displayUsername);
            console.log("👤 Đang đăng nhập với Username:", displayUsername);
            loadGameStateFromFirebase(user.uid);
        } else {
            if (cloudUserDisplay) cloudUserDisplay.innerText = "Chưa đăng nhập (Offline)";
            if (authBtnText) authBtnText.innerText = "Đăng nhập / Đăng ký";
            if (authIcon) authIcon.innerText = "🔑";
            if (userIcon) userIcon.innerText = "👤";

            if (userAvatarBg) {
                userAvatarBg.className = "w-8 h-8 rounded-full bg-amber-200 border border-amber-400/60 flex items-center justify-center shrink-0";
            }

            if (authBtn) {
                authBtn.className = "w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-amber-300/40";
            }

            checkAdminAccess(null);
        }
    });
}

function handleSidebarAuthAction() {
    if (typeof auth !== 'undefined' && auth.currentUser) {
        handleLogout();
    } else {
        showAuthModal(true);
    }
}

/**
 * =================================================================
 * ZONE 2: AUTHENTICATION MODAL & LOGIC (ĐĂNG NHẬP / ĐĂNG KÝ)
 * =================================================================
 */

let isSignUpMode = false;
const DOMAIN_SUFFIX = "@giataicuaban.com";

function showAuthModal(show) {
    if (show && typeof auth !== 'undefined' && auth.currentUser) {
        handleLogout();
        return;
    }

    const modal = document.getElementById("auth-modal");
    if (modal) {
        if (show) modal.classList.remove("hidden");
        else modal.classList.add("hidden");
    }
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById("auth-modal-title");
    const submitBtn = document.getElementById("auth-submit-btn");
    const switchText = document.getElementById("auth-switch-text");
    const switchBtn = document.getElementById("auth-switch-btn");
    const errorMsg = document.getElementById("auth-error-msg");

    if (errorMsg) errorMsg.classList.add("hidden");

    if (isSignUpMode) {
        if (title) title.innerText = "ĐĂNG KÝ TÀI KHOẢN";
        if (submitBtn) submitBtn.innerText = "✨ TẠO TÀI KHOẢN MỚI";
        if (switchText) switchText.innerText = "Đã có tài khoản?";
        if (switchBtn) switchBtn.innerText = "Đăng nhập ngay";
    } else {
        if (title) title.innerText = "ĐĂNG NHẬP";
        if (submitBtn) submitBtn.innerText = "🔑 ĐĂNG NHẬP";
        if (switchText) switchText.innerText = "Chưa có tài khoản?";
        if (switchBtn) switchBtn.innerText = "Đăng ký ngay";
    }
}

function usernameToEmail(username) {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    return `${cleanUsername}${DOMAIN_SUFFIX}`;
}

function handleAuthSubmit() {
    const usernameInput = document.getElementById("auth-username");
    const passwordInput = document.getElementById("auth-password");

    if (!usernameInput || !passwordInput) return;

    const rawUsername = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!rawUsername || !password) {
        showAuthError("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
        return;
    }

    if (rawUsername.length < 3) {
        showAuthError("Tên đăng nhập phải có ít nhất 3 ký tự!");
        return;
    }

    const email = usernameToEmail(rawUsername);

    if (isSignUpMode) {
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                showAuthModal(false);
                saveGameStateToFirebase(user.uid);
            })
            .catch((error) => {
                showAuthError(getAuthErrorMessage(error.code));
            });
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                showAuthModal(false);
                loadGameStateFromFirebase(user.uid);
            })
            .catch((error) => {
                showAuthError(getAuthErrorMessage(error.code));
            });
    }
}

function getAuthErrorMessage(code) {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Tên đăng nhập này đã có người sử dụng!';
        case 'auth/invalid-email':
            return 'Tên đăng nhập chứa ký tự không hợp lệ!';
        case 'auth/weak-password':
            return 'Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Sai tên đăng nhập hoặc mật khẩu!';
        default:
            return 'Lỗi kết nối, vui lòng thử lại sau!';
    }
}

function showAuthError(text) {
    const errorMsg = document.getElementById("auth-error-msg");
    if (errorMsg) {
        errorMsg.innerText = text;
        errorMsg.classList.remove("hidden");
    }
}

function handleLogout() {
    showGameConfirm(
        "Bạn có chắc chắn muốn Đăng xuất tài khoản này? Dữ liệu hiện tại sẽ được giải phóng khỏi giao diện.",
        function () {
            if (typeof auth !== 'undefined') {
                auth.signOut().then(() => {
                    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();
                    localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
                    gameState = null;

                    const openModals = document.querySelectorAll('.fixed:not(.hidden)');
                    openModals.forEach(m => m.classList.add('hidden'));

                    if (typeof showAuthModal === 'function') showAuthModal(true);
                    alert("🚪 Đã đăng xuất tài khoản thành công!");
                }).catch((error) => {
                    console.error("❌ Lỗi khi đăng xuất:", error);
                });
            }
        },
        "Xác Nhận Đăng Xuất",
        "🚪",
        "☁️ Cloud Auth"
    );
}

/**
 * =================================================================
 * ZONE 3: ADMIN PANEL & SYSTEM DEBUG (QUẢN TRỊ VIÊN)
 * =================================================================
 */

function showAdminPanel(show) {
    const modal = document.getElementById("admin-panel-modal");
    if (modal) {
        if (show) {
            updateAdminSkipMidMonthButtonUI();
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}

function handleAdminToggleSkipMidMonthEvents() {
    if (!gameState) {
        alert("⚠️ Vui lòng tạo hoặc tải nhân vật trước khi bật tính năng debug này!");
        return;
    }
    gameState.debugSkipMidMonthEvents = !gameState.debugSkipMidMonthEvents;
    updateAdminSkipMidMonthButtonUI();

    if (gameState.debugSkipMidMonthEvents) {
        showToast("Đã BẬT chế độ Skip sự kiện giữa tháng!", "⚡", "Admin Debug");
    } else {
        showToast("Đã TẮT chế độ Skip sự kiện giữa tháng!", "⚡", "Admin Debug");
    }
    if (typeof saveGameState === 'function') saveGameState();
}

function updateAdminSkipMidMonthButtonUI() {
    const btn = document.getElementById("admin-skip-midmonth-btn");
    if (!btn || !gameState) return;

    const isSkipping = !!gameState.debugSkipMidMonthEvents;
    if (isSkipping) {
        btn.className = "w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold rounded-2xl text-xs border border-emerald-300/40 shadow-sm transition-all active:scale-95";
        btn.innerText = "⚡ ĐANG SKIP SỰ KIỆN GIỮA THÁNG (DEBUG: ON)";
    } else {
        btn.className = "w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-display font-extrabold rounded-2xl text-xs border border-purple-300/40 shadow-sm transition-all active:scale-95";
        btn.innerText = "⚡ TẮT SỰ KIỆN GIỮA THÁNG (DEBUG: OFF)";
    }
}

function handleAdminResetCharacter() {
    showGameConfirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn RESET toàn bộ nhân vật và tiến trình chơi về lại từ đầu? Mọi dữ liệu sẽ bị xóa sạch!",
        function () {
            if (typeof resetCharacter === 'function') resetCharacter();
        },
        "Xác Nhận Tái Sinh",
        "🔄",
        "🛠️ System Debug"
    );
}

function checkAdminAccess(username) {
    const adminBtn = document.getElementById("admin-panel-btn");
    if (adminBtn) {
        if (username && username.toLowerCase() === "admin") {
            adminBtn.classList.remove("hidden");
        } else {
            adminBtn.classList.add("hidden");
        }
    }
}

async function handleAdminDeleteAllPlayers() {
    showGameConfirm(
        "🚨 CẢNH BÁO CỰC NGHIỆM: Bạn có chắc chắn muốn XÓA SẠCH TOÀN BỘ dữ liệu của TẤT CẢ NGƯỜI CHƠI trên Firebase Cloud? Hành động này không thể hoàn tác!",
        async function () {
            if (typeof db === 'undefined') {
                alert("❌ Lỗi: Chưa kết nối được với Firebase Firestore!");
                return;
            }
            try {
                const snapshot = await db.collection("players").get();
                if (snapshot.empty) {
                    alert("ℹ️ Collection 'players' hiện đang trống, không có dữ liệu để xóa.");
                    return;
                }
                const batch = db.batch();
                snapshot.docs.forEach((doc) => { batch.delete(doc.ref); });
                await batch.commit();

                localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
                gameState = null;
                if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

                alert(`💥 Đã xóa thành công toàn bộ ${snapshot.size} hồ sơ người chơi trên Cloud!`);
                showAdminPanel(false);
                if (typeof showCreateCharacterModal === 'function') showCreateCharacterModal(true);
            } catch (error) {
                console.error("❌ Lỗi khi xóa collection players:", error);
                alert("❌ Không thể xóa collection: " + error.message);
            }
        },
        "XÓA SẠCH FIREBASE CLOUD",
        "🔥",
        "🚨 Admin Danger Zone"
    );
}
/**
 * =================================================================
 * ZONE 4: CUSTOM TOAST NOTIFICATION SYSTEM (HỆ THỐNG THÔNG BÁO)
 * =================================================================
 */

let toastTimeout = null;

function showToast(message, icon = "💡", title = "Thông Báo") {
    const toast = document.getElementById("custom-toast");
    const msgEl = document.getElementById("toast-message");
    const iconEl = document.getElementById("toast-icon");
    const titleEl = document.getElementById("toast-title");

    if (!toast || !msgEl) {
        console.log(`[Notification]: ${message}`);
        return;
    }

    if (message.includes("❌") || message.includes("lỗi") || message.includes("không đủ")) icon = "⚠️";
    else if (message.includes("🎉") || message.includes("Chúc mừng") || message.includes("thành công")) icon = "🎉";
    else if (message.includes("💊") || message.includes("🏥") || message.includes("🥗")) icon = "🏥";

    if (iconEl) iconEl.innerText = icon;
    if (titleEl) titleEl.innerText = title;
    msgEl.innerText = message.replace(/^[❌🎉⚠️💊🏥🥗🍜🏋️🏃🚪📝]/g, '').trim();

    toast.classList.remove("opacity-0", "pointer-events-none", "-translate-y-4");
    toast.classList.add("opacity-100", "pointer-events-auto", "translate-y-0");

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        closeToast();
    }, 3200);
}

function closeToast() {
    const toast = document.getElementById("custom-toast");
    if (toast) {
        toast.classList.remove("opacity-100", "pointer-events-auto", "translate-y-0");
        toast.classList.add("opacity-0", "pointer-events-none", "-translate-y-4");
    }
}

window.alert = function (msg) {
    showToast(msg);
};

/**
 * =================================================================
 * ZONE 5: DOM ANIMATION SYSTEM (HIỆU ỨNG GIAO DIỆN)
 * =================================================================
 */

function showFloatingText(targetId, text, type = 'pos') {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const floatingEl = document.createElement('span');
    floatingEl.innerText = text;
    floatingEl.className = `fixed font-black text-sm drop-shadow-md animate-float-up z-[100] ${type === 'pos' ? 'text-emerald-500' : 'text-rose-500'}`;

    const randomOffsetX = (Math.random() - 0.5) * 20;
    floatingEl.style.left = `${rect.left + (rect.width / 2) + randomOffsetX}px`;
    floatingEl.style.top = `${rect.top}px`;

    document.body.appendChild(floatingEl);
    setTimeout(() => floatingEl.remove(), 1200);
}

function triggerScreenShake() {
    const mainContainer = document.getElementById("main-game-view") || document.body;
    mainContainer.classList.add("animate-shake");
    setTimeout(() => mainContainer.classList.remove("animate-shake"), 300);
}

function showGameConfirm(message, onConfirm, title = "Xác Nhận Hành Động", icon = "❓", tag = "⚠️ Chú Ý") {
    const modal = document.getElementById("game-confirm-modal");
    const titleEl = document.getElementById("confirm-modal-title");
    const descEl = document.getElementById("confirm-modal-description");
    const iconEl = document.getElementById("confirm-modal-icon");
    const tagEl = document.getElementById("confirm-modal-tag");
    const okBtn = document.getElementById("confirm-modal-ok-btn");
    const cancelBtn = document.getElementById("confirm-modal-cancel-btn");

    if (!modal) {
        if (confirm(message)) {
            if (typeof onConfirm === 'function') onConfirm();
        }
        return;
    }

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = message;
    if (iconEl) iconEl.innerText = icon;
    if (tagEl) tagEl.innerText = tag;

    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newOkBtn.onclick = function () {
        modal.classList.add("hidden");
        if (typeof onConfirm === 'function') onConfirm();
    };

    newCancelBtn.onclick = function () {
        modal.classList.add("hidden");
    };

    modal.classList.remove("hidden");
}

function showGamePrompt(message, defaultValue, onConfirm, title = "Nhập Dữ Liệu", icon = "✏️", tag = "⚠️ Yêu Cầu", inputType = "text", placeholder = "Nhập nội dung...") {
    const modal = document.getElementById("game-prompt-modal");
    if (!modal) {
        const val = prompt(message, defaultValue);
        if (val !== null && typeof onConfirm === 'function') onConfirm(val);
        return;
    }

    document.getElementById("prompt-modal-title").innerText = title;
    document.getElementById("prompt-modal-description").innerText = message;
    document.getElementById("prompt-modal-icon").innerText = icon;
    document.getElementById("prompt-modal-tag").innerText = tag;

    const inputEl = document.getElementById("prompt-modal-input");
    if (inputEl) {
        inputEl.type = inputType; // Tự động chuyển kiểu bàn phím (text hoặc number)
        inputEl.placeholder = placeholder; // Tự động đổi chữ mờ hiển thị
        inputEl.value = defaultValue || "";
    }

    const okBtn = document.getElementById("prompt-modal-ok-btn");
    const cancelBtn = document.getElementById("prompt-modal-cancel-btn");

    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newOkBtn.onclick = function () {
        modal.classList.add("hidden");
        if (typeof onConfirm === 'function') onConfirm(inputEl.value);
    };

    newCancelBtn.onclick = function () {
        modal.classList.add("hidden");
    };

    modal.classList.remove("hidden");
    setTimeout(() => inputEl.focus(), 100);
}


/**
 * Áp dụng Font, Màu sắc & Hiệu ứng đã chọn vào Element Tên Nhân Vật
 */
function applyNameCustomizationToUI(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !gameState) return;

    ensureNameCustomState();
    const config = gameState.nameCustomization;

    // Lấy thông tin Class từ DB
    const fontObj = NAME_CUSTOM_DB.fonts.find(f => f.id === config.equippedFont) || NAME_CUSTOM_DB.fonts[0];
    const colorObj = NAME_CUSTOM_DB.colors.find(c => c.id === config.equippedColor) || NAME_CUSTOM_DB.colors[0];
    const effectObj = NAME_CUSTOM_DB.effects.find(e => e.id === config.equippedEffect) || NAME_CUSTOM_DB.effects[0];

    // Reset sạch các class màu/font/hiệu ứng cũ VÀ xóa luôn class text-amber-950 mặc định
    el.className = el.className
        .replace(/font-\S+/g, '')
        .replace(/color-\S+/g, '')
        .replace(/effect-\S+/g, '')
        .replace(/text-amber-\S+/g, '') // Gỡ bỏ màu mặc định để tránh bị CSS thành phố bắt nhầm
        .trim();

    // Thêm class mới
    const classesToAdd = [fontObj.class, colorObj.class, effectObj.class].filter(Boolean).join(' ');
    if (classesToAdd) {
        el.classList.add(...classesToAdd.split(' '));
    }
}


/**
 * =================================================================
 * ZONE 6: CITY MIGRATION & MAP SYSTEM (HỆ THỐNG DI CƯ & BẢN ĐỒ)
 * =================================================================
 */

const CITIES_DATA = [
    {
        id: 'ung_dung',
        name: 'Thành phố Ung Dung',
        icon: '🏡',
        description: 'Bình yên, chi phí sinh hoạt thấp, nhịp sống chậm rãi và thư thái.',
        travelCost: 0,
        wageMultiplier: 1.0,
        stressMultiplier: 0.7,
        themeClass: 'city-ung-dung'
    },
    {
        id: 'voi_vang',
        name: 'Thành phố Vội Vàng',
        icon: '⚡',
        description: 'Nhịp độ công nghiệp cao, lương thưởng hấp dẫn nhưng áp lực công việc lớn.',
        travelCost: 0,
        wageMultiplier: 1.25,
        stressMultiplier: 1.4,
        themeClass: 'city-voi-vang'
    },
    {
        id: 'phon_hoa',
        name: 'Thành phố Phồn Hoa',
        icon: '🌆',
        description: 'Trung tâm tài chính xa hoa rực rỡ ánh đèn, mở khóa các ngành nghề đỉnh cao.',
        travelCost: 0,
        wageMultiplier: 1.4,
        stressMultiplier: 1.6,
        themeClass: 'city-phon-hoa'
    }
];

function updateCityTheme() {
    const currentCity = (gameState && gameState.currentCity) ? gameState.currentCity : 'ung_dung';
    document.body.setAttribute('data-city', currentCity);
    console.log("🎨 Đã cập nhật theme giao diện cho thành phố:", currentCity);
}

function relocateToCity(cityId) {
    if (!gameState) return;
    const cityInfo = CITIES_DATA.find(c => c.id === cityId);
    if (!cityInfo) return;

    if (gameState.currentCity === cityId) {
        alert(`⚠️ Bạn đang sinh sống tại ${cityInfo.name} rồi!`);
        return;
    }

    if ((gameState.money || 0) < cityInfo.travelCost) {
        if (typeof triggerScreenShake === 'function') triggerScreenShake();
        alert(`❌ Không đủ tiền! Cần ${cityInfo.travelCost.toLocaleString()} $ để di cư.`);
        return;
    }

    showGameConfirm(
        `Xác nhận di cư sang ${cityInfo.name}? Phí di chuyển: ${cityInfo.travelCost === 0 ? 'MIỄN PHÍ (DEBUG)' : cityInfo.travelCost.toLocaleString() + ' $'}. Môi trường sống và không gian sẽ thay đổi hoàn toàn!`,
        function () {
            gameState.money -= cityInfo.travelCost;
            gameState.currentCity = cityId;

            updateCityTheme();

            if (typeof addDailyLog === 'function') {
                addDailyLog(`Di cư thành công đến ${cityInfo.name}`);
            }
            if (typeof showFloatingText === 'function' && cityInfo.travelCost > 0) {
                showFloatingText('money', `-${cityInfo.travelCost}$`, 'neg');
            }

            if (typeof triggerScreenShake === 'function') triggerScreenShake();
            alert(`🌟 Chào mừng bạn đã đặt chân đến ${cityInfo.name}! Không gian xung quanh đã lột xác hoàn toàn.`);

            if (typeof saveGameState === 'function') saveGameState();
            if (typeof renderGameState === 'function') renderGameState();
            showCityMapModal(false);
        },
        "Xác Nhận Di Cư",
        "✈️",
        "🌆 Hệ Thống Bản Đồ"
    );
    updateCityTheme();
}

function renderCityMapList() {
    const listEl = document.getElementById("city-map-modal-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    const currentCity = gameState ? (gameState.currentCity || 'ung_dung') : 'ung_dung';

    CITIES_DATA.forEach(city => {
        const isCurrent = currentCity === city.id;
        const card = document.createElement("div");
        card.className = "glass-card-inner-light p-4 rounded-2xl flex flex-col gap-3 border border-amber-300/40 shrink-0";

        let actionBtnHTML = `
            <button onclick="relocateToCity('${city.id}')" 
                class="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-extrabold rounded-xl text-xs shadow-sm transition-all active:scale-95">
                ✈️ Di Cư Ngay (${city.travelCost === 0 ? '0 $ (DEBUG)' : city.travelCost.toLocaleString() + ' $'})
            </button>
        `;

        if (isCurrent) {
            actionBtnHTML = `
                <button disabled class="w-full py-2.5 bg-amber-800/20 text-amber-950 font-display font-extrabold rounded-xl text-xs cursor-not-allowed border border-amber-900/20">
                    📍 Đang Sinh Sống Tại Đây
                </button>
            `;
        }

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">${city.icon}</span>
                    <div>
                        <h4 class="text-sm font-extrabold text-amber-950">${city.name}</h4>
                        <p class="text-[11px] text-amber-800/80">${city.description}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-between text-[11px] bg-white/50 p-2 rounded-xl text-amber-900 font-semibold">
                <span>💵 Lương: x${city.wageMultiplier}</span>
                <span>⚡ Stress: x${city.stressMultiplier}</span>
            </div>
            ${actionBtnHTML}
        `;
        listEl.appendChild(card);
    });
}

function showCityMapModal(show) {
    const modal = document.getElementById("city-map-modal");
    if (modal) {
        if (show) {
            if (typeof closeAllModals === 'function') closeAllModals();
            renderCityMapList();
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}
// Mảng danh sách Avatar local trỏ trực tiếp tới assets/avatars/
const AVATAR_PRESETS = [
    { id: 'boy_1', name: 'Năng Động', gender: 'Nam', url: 'assets/avatars/boy-1.png' },
    { id: 'boy_2', name: 'Đường Phố', gender: 'Nam', url: 'assets/avatars/boy-2.png' },
    { id: 'boy_3', name: 'Tri Thức', gender: 'Nam', url: 'assets/avatars/boy-3.png' },
    { id: 'boy_4', name: 'Thời Trang', gender: 'Nam', url: 'assets/avatars/boy-4.png' },
    { id: 'boy_5', name: 'Gamer 3D', gender: 'Nam', url: 'assets/avatars/boy-5.png' },
    { id: 'girl_1', name: 'Hoạt Bát', gender: 'Nữ', url: 'assets/avatars/girl-1.png' },
    { id: 'girl_2', name: 'Cá Tính', gender: 'Nữ', url: 'assets/avatars/girl-2.png' },
    { id: 'girl_3', name: 'Tri Thức', gender: 'Nữ', url: 'assets/avatars/girl-3.png' },
    { id: 'girl_4', name: 'Phóng Khoáng', gender: 'Nữ', url: 'assets/avatars/girl-4.png' },
    { id: 'girl_5', name: 'Streamer 3D', gender: 'Nữ', url: 'assets/avatars/girl-5.png' }
];

function openAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    const grid = document.getElementById('avatar-grid-list');
    if (!modal || !grid) return;

    const isMale = (gameState && (gameState.gender === 'Nam' || gameState.gender === 'male'));
    const targetGender = isMale ? 'Nam' : 'Nữ';
    const filteredAvatars = AVATAR_PRESETS.filter(item => item.gender === targetGender);

    grid.innerHTML = filteredAvatars.map(item => {
        const isSelected = (gameState && gameState.customAvatarUrl === item.url);
        return `
            <div onclick="selectAvatar('${item.url}')" 
                 class="relative p-2 rounded-2xl border-2 cursor-pointer transition transform hover:scale-105 flex flex-col items-center gap-1.5 ${isSelected ? 'border-amber-600 bg-amber-200/60 shadow-md' : 'border-amber-200/50 hover:border-amber-400 bg-amber-50/50'}">
                <div class="w-16 h-16 rounded-full border-2 border-amber-700/40 overflow-hidden bg-amber-100">
                    <img src="${item.url}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='https://api.dicebear.com/7.x/adventurer/svg?seed=${item.id}'" />
                </div>
                <span class="text-[10px] font-bold text-amber-950 text-center line-clamp-1">${item.name}</span>
                ${isSelected ? '<span class="absolute top-1 right-1 bg-amber-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">✓</span>' : ''}
            </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
}

function closeAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.classList.add('hidden');
}

function selectAvatar(avatarUrl) {
    if (!gameState) return;
    gameState.customAvatarUrl = avatarUrl;
    if (typeof updateProfileCard === 'function') updateProfileCard();
    if (typeof showToast === 'function') showToast('✨ Đã thay đổi Avatar thành công!', 'success');
    closeAvatarModal();
}


function openZodiacModal() {
    const modal = document.getElementById('zodiac-modal');
    const grid = document.getElementById('zodiac-grid-list');
    if (!modal || !grid) return;

    const currentIdx = (gameState && gameState.zodiacIndex !== undefined) ? gameState.zodiacIndex : 2;

    grid.innerHTML = ZODIAC_LIST.map((item, idx) => {
        const isSelected = (currentIdx === idx);
        return `
            <div onclick="selectZodiac(${idx})" 
                 class="p-2.5 rounded-2xl border-2 cursor-pointer transition transform hover:scale-105 flex flex-col items-center gap-1 relative ${isSelected ? 'border-amber-600 bg-amber-200/70 shadow-md' : 'border-amber-200/50 hover:border-amber-400 bg-amber-50/50'}">
                <span class="text-2xl">${item.icon}</span>
                <span class="text-xs font-bold text-amber-950 text-center">${item.name}</span>
                <span class="text-[9px] text-amber-800/70 font-medium">${item.date}</span>
                ${isSelected ? '<span class="absolute top-1 right-1 bg-amber-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">✓</span>' : ''}
            </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
}

function closeZodiacModal() {
    const modal = document.getElementById('zodiac-modal');
    if (modal) modal.classList.add('hidden');
}

function selectZodiac(index) {
    if (!gameState) return;
    gameState.zodiacIndex = index;
    if (typeof updateProfileCard === 'function') updateProfileCard();
    const selected = ZODIAC_LIST[index];
    if (typeof showToast === 'function') showToast(`✨ Bạn đã chọn Cung ${selected.icon} ${selected.name}!`, 'success');
    closeZodiacModal();
}

function toggleSidebarMenu() {
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    const content = document.getElementById('sidebar-content');
    if (!drawer || !backdrop || !content) return;

    const isOpen = !content.classList.contains('-translate-x-full');

    if (isOpen) {
        content.classList.add('-translate-x-full');
        backdrop.classList.add('opacity-0');
        setTimeout(() => drawer.classList.add('pointer-events-none'), 300);
    } else {
        drawer.classList.remove('pointer-events-none');
        backdrop.classList.remove('opacity-0');
        content.classList.remove('-translate-x-full');

        const adminBtn = document.getElementById('sidebar-admin-btn');
        if (adminBtn && gameState && (gameState.isAdmin || gameState.accountName === 'admin')) {
            adminBtn.classList.remove('hidden');
        }
    }
}

function toggleArcMenu(forceState) {
    const menu = document.getElementById('arc-radial-menu');
    const backdrop = document.getElementById('arc-backdrop');
    const icon = document.getElementById('center-arc-icon');
    if (!menu || !backdrop) return;

    const isActive = forceState !== undefined ? forceState : !menu.classList.contains('active');

    if (isActive) {
        menu.classList.add('active');
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        if (icon) icon.style.transform = 'rotate(45deg)';
    } else {
        menu.classList.remove('active');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

function switchSubTab(parentViewId, subTabName) {
    const view = document.getElementById(parentViewId);
    if (!view) return;

    view.querySelectorAll('.sub-tab-content').forEach(el => el.classList.add('hidden'));
    
    const target = view.querySelector(`#sub-tab-${subTabName}`);
    if (target) target.classList.remove('hidden');

    view.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.classList.remove('bg-amber-500', 'text-white');
        btn.classList.add('bg-amber-100/60', 'text-amber-950');
    });
    const activeBtn = view.querySelector(`#btn-sub-${subTabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-amber-100/60', 'text-amber-950');
        activeBtn.classList.add('bg-amber-500', 'text-white');
    }
}

let currentRelationshipViewTab = 'list';

function setRelationshipViewTab(tabName) {
    currentRelationshipViewTab = tabName;
    const listBtn = document.getElementById("rel-vtab-list");
    const historyBtn = document.getElementById("rel-vtab-history");
    const listContainer = document.getElementById("relationship-view-list");
    const historyContainer = document.getElementById("relationship-view-history");

    if (tabName === 'list') {
        if (listBtn) listBtn.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all text-amber-900 bg-white/80 shadow-sm";
        if (historyBtn) historyBtn.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all text-amber-800/70 hover:text-amber-900";
        if (listContainer) listContainer.classList.remove("hidden");
        if (historyContainer) historyContainer.classList.add("hidden");
        renderRelationshipsView();
    } else {
        if (historyBtn) historyBtn.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all text-amber-900 bg-white/80 shadow-sm";
        if (listBtn) listBtn.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all text-amber-800/70 hover:text-amber-900";
        if (historyContainer) historyContainer.classList.remove("hidden");
        if (listContainer) listContainer.classList.add("hidden");
        renderRelationshipViewHistory();
    }
}


function renderRelationshipsView() {
    if (typeof gameState === 'undefined' || !gameState) return;
    const rels = gameState.relationships || [];

    setElementText('rel-view-count-badge', `${rels.length} Mối quan hệ`);
    setElementText('rel-view-level-title', getSocialLevelTitle(rels.length));

    const container = document.getElementById("relationship-view-list");
    if (!container) return;
    container.innerHTML = "";

    if (rels.length === 0) {
        container.innerHTML = `<p class="text-xs text-center font-bold text-amber-800/60 py-6">Chưa có mối quan hệ nào.</p>`;
        return;
    }

    const sortSelect = document.getElementById("rel-view-sort-select");
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

        if (!rel.avatarUrl) {
            const isMale = (rel.icon === '👦' || rel.icon === '👨' || rel.relation === 'Bố');
            const randIdx = Math.floor(Math.random() * 5) + 1;
            rel.avatarUrl = isMale ? `assets/avatars/male-${randIdx}.png` : `assets/avatars/fem-${randIdx}.png`;
        }
        
        const avatarDisplayHTML = rel.avatarUrl
            ? `<img src="${rel.avatarUrl}" alt="${rel.name}" class="w-12 h-12 rounded-full object-cover border-2 border-amber-600 shadow-sm shrink-0" onerror="this.src='assets/avatars/male-1.png'" />`
            : `<span class="text-3xl drop-shadow-sm">${rel.icon || '👤'}</span>`;

        const item = document.createElement("div");
        item.className = "glass-card-inner-light p-3 rounded-2xl flex items-center justify-between border border-amber-300/40 shrink-0 gap-2";
        item.innerHTML = `
            <div class="flex flex-col w-full gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        ${avatarDisplayHTML}
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
        container.appendChild(item);
    });
}


function renderRelationshipViewHistory() {
    const container = document.getElementById("relationship-view-history");
    if (!container) return;
    container.innerHTML = "";

    const logs = gameState.relationshipLogs || [];
    if (logs.length === 0) {
        container.innerHTML = `<p class="text-xs text-center font-bold text-amber-800/60 py-6">Chưa có lịch sử biến động quan hệ nào.</p>`;
        return;
    }

    logs.forEach(log => {
        const item = document.createElement("div");
        item.className = "glass-card-light p-3 rounded-2xl flex items-center gap-2 text-xs font-bold border border-indigo-300/30";
        item.innerHTML = `
            <span class="text-[9px] font-mono bg-indigo-900/10 text-indigo-950 px-2 py-0.5 rounded-md">T${log.month} (${log.age}t)</span>
            <span class="text-amber-900">${log.text}</span>
        `;
        container.appendChild(item);
    });
}

function closeAllModals() {
    const modalIds = [
        'city-map-modal',
        'jobs-modal',
        'shop-modal',
        'relationship-modal',
        'housing-modal',
        'education-modal',
        'stock-market-modal',
        'inventory-modal',
        'job-detail-modal',
        'avatar-modal',
        'zodiac-modal',
        'auth-modal',
        'admin-panel-modal'
    ];
    
    modalIds.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
        }
    });
}
