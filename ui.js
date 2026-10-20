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

                // 🌟 THÊM ĐOẠN NÀY VÀO ĐÂY: Cập nhật màu giao diện theo thành phố khi tải Cloud
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

                // Xóa dữ liệu cũ còn sót
                localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
                gameState = null;
                if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

                // Bật màn hình tạo nhân vật cho tài khoản mới
                if (typeof showCreateCharacterModal === 'function') showCreateCharacterModal(true);
            }
        })
        .catch((error) => {
            console.error("❌ Lỗi nạp dữ liệu từ Firebase:", error);
        });
    // Khi tải xong gameState từ LocalStorage hoặc Firebase:
    if (typeof updateCityTheme === 'function') {
        updateCityTheme();
    }

}


/**
 * Lắng nghe trạng thái đăng nhập & Cập nhật Username lên Header
 */
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        const cloudUserDisplay = document.getElementById("cloud-username-display");
        const authBtnText = document.getElementById("auth-status-btn-text");

        if (user && user.email) {
            const displayUsername = user.email.replace(DOMAIN_SUFFIX, "");

            if (cloudUserDisplay) cloudUserDisplay.innerText = displayUsername;
            if (authBtnText) authBtnText.innerText = "Đăng xuất"; // Đổi nhãn thành Đăng xuất cho rõ ràng

            checkAdminAccess(displayUsername);
            console.log("👤 Đang đăng nhập với Username:", displayUsername);

            // Tải dữ liệu của tài khoản vừa đăng nhập
            loadGameStateFromFirebase(user.uid);
        } else {
            if (cloudUserDisplay) cloudUserDisplay.innerText = "Chưa đăng nhập";
            if (authBtnText) authBtnText.innerText = "Đăng nhập";
            checkAdminAccess(null);

            // Xóa sạch bộ nhớ khi không có user
            localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
            gameState = null;
        }
    });
}




/**
 * =================================================================
 * ZONE 2: AUTHENTICATION MODAL & LOGIC (ĐĂNG NHẬP / ĐĂNG KÝ)
 * =================================================================
 */

let isSignUpMode = false;
const DOMAIN_SUFFIX = "@giataicuaban.com";

/**
 * Ẩn / Hiện Modal Đăng nhập
 */
/**
 * Ẩn / Hiện Modal Đăng nhập (Hoặc hỏi Đăng xuất nếu đã có tài khoản)
 */
function showAuthModal(show) {
    // Nếu người dùng đã đăng nhập và bấm vào nút Auth trên Header -> Bật hỏi Đăng xuất
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


/**
 * Chuyển đổi giữa chế độ Đăng nhập và Đăng ký
 */
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

/**
 * Chuyển đổi Username thường thành dạng Email để khớp với Firebase Auth
 */
function usernameToEmail(username) {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    return `${cleanUsername}${DOMAIN_SUFFIX}`;
}

/**
 * Xử lý khi nhấn nút Đăng nhập / Đăng ký
 */
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
                console.log("✅ Đăng ký thành công cho Username:", rawUsername);
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
                console.log("✅ Đăng nhập thành công cho Username:", rawUsername);
                showAuthModal(false);
                loadGameStateFromFirebase(user.uid);
            })
            .catch((error) => {
                showAuthError(getAuthErrorMessage(error.code));
            });
    }
}

/**
 * Vietsub câu thông báo lỗi từ Firebase
 */
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

/**
 * Hiển thị dòng lỗi bên trong Modal Đăng nhập
 */
function showAuthError(text) {
    const errorMsg = document.getElementById("auth-error-msg");
    if (errorMsg) {
        errorMsg.innerText = text;
        errorMsg.classList.remove("hidden");
    }
}

/**
 * Xử lý Đăng xuất tài khoản & Xóa sạch dữ liệu tạm trên giao diện
 */
function handleLogout() {
    showGameConfirm(
        "Bạn có chắc chắn muốn Đăng xuất tài khoản này? Dữ liệu hiện tại sẽ được giải phóng khỏi giao diện.",
        function () {
            if (typeof auth !== 'undefined') {
                auth.signOut().then(() => {
                    // 1. Dừng đồng hồ đếm thời gian
                    if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

                    // 2. Xóa sạch LocalStorage & biến gameState trong RAM
                    localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
                    gameState = null;

                    // 3. Ẩn tất cả Modal đang mở
                    const openModals = document.querySelectorAll('.fixed:not(.hidden)');
                    openModals.forEach(m => m.classList.add('hidden'));

                    // 4. Bật Modal Đăng nhập / Đăng ký hoặc Tạo nhân vật mới
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

/**
 * Ẩn / Hiện Admin Panel Debug
 */
function showAdminPanel(show) {
    const modal = document.getElementById("admin-panel-modal");
    if (modal) {
        if (show) {
            updateAdminSkipMidMonthButtonUI(); // Cập nhật trạng thái nút khi mở panel
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}


/**
 * Xử lý Bật/Tắt tính năng Bỏ qua sự kiện giữa tháng từ Admin Panel
 */
function handleAdminToggleSkipMidMonthEvents() {
    if (!gameState) {
        alert("⚠️ Vui lòng tạo hoặc tải nhân vật trước khi bật tính năng debug này!");
        return;
    }

    // Đảo trạng thái cờ debug
    gameState.debugSkipMidMonthEvents = !gameState.debugSkipMidMonthEvents;

    // Cập nhật lại giao diện nút bấm ngay lập tức
    updateAdminSkipMidMonthButtonUI();

    if (gameState.debugSkipMidMonthEvents) {
        showToast("Đã BẬT chế độ Skip sự kiện giữa tháng!", "⚡", "Admin Debug");
    } else {
        showToast("Đã TẮT chế độ Skip sự kiện giữa tháng!", "⚡", "Admin Debug");
    }

    if (typeof saveGameState === 'function') saveGameState();
}

/**
 * Hàm phụ trợ cập nhật màu sắc và chữ trên nút Skip Midmonth
 */
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


/**
 * Xử lý Reset Nhân vật từ Admin Panel
 */
function handleAdminResetCharacter() {
    showGameConfirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn RESET toàn bộ nhân vật và tiến trình chơi về lại từ đầu? Mọi dữ liệu sẽ bị xóa sạch!",
        function () {
            if (typeof resetCharacter === 'function') {
                resetCharacter();
            }
        },
        "Xác Nhận Tái Sinh",
        "🔄",
        "🛠️ System Debug"
    );
}

/**
 * Kiểm tra xem tài khoản hiện tại có phải "admin" hay không để hiện nút Debug
 */
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

/**
 * Xóa toàn bộ Collection 'players' trên Firebase Firestore (Admin Only)
 */
async function handleAdminDeleteAllPlayers() {
    showGameConfirm(
        "🚨 CẢNH BÁO CỰC NGHIỆM: Bạn có chắc chắn muốn XÓA SẠCH TOÀN BỘ dữ liệu của TẤT CẢ NGƯỜI CHƠI trên Firebase Cloud? Hành động này không thể hoàn tác!",
        async function () {
            if (typeof db === 'undefined') {
                alert("❌ Lỗi: Chưa kết nối được với Firebase Firestore!");
                return;
            }

            try {
                // 1. Lấy toàn bộ documents trong collection 'players'
                const snapshot = await db.collection("players").get();
                if (snapshot.empty) {
                    alert("ℹ️ Collection 'players' hiện đang trống, không có dữ liệu để xóa.");
                    return;
                }

                // 2. Dùng WriteBatch để xóa hàng loạt
                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                await batch.commit();

                // 3. Xóa dữ liệu local hiện tại và reset giao diện
                localStorage.removeItem("GIA_TAI_CUA_BAN_GAME_STATE");
                gameState = null;
                if (typeof stopMonthCalendarTimer === 'function') stopMonthCalendarTimer();

                alert(`💥 Đã xóa thành công toàn bộ ${snapshot.size} hồ sơ người chơi trên Cloud!`);

                // Ẩn Admin Panel và mở Modal tạo nhân vật
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

/**
 * Hiển thị Toast Notification thay thế cho Alert mặc định
 */
function showToast(message, icon = "💡", title = "Thông Báo") {
    const toast = document.getElementById("custom-toast");
    const msgEl = document.getElementById("toast-message");
    const iconEl = document.getElementById("toast-icon");
    const titleEl = document.getElementById("toast-title");

    if (!toast || !msgEl) {
        console.log(`[Notification]: ${message}`);
        return;
    }

    // Tự động nhận diện Icon dựa trên từ khóa trong thông báo
    if (message.includes("❌") || message.includes("lỗi") || message.includes("không đủ")) icon = "⚠️";
    else if (message.includes("🎉") || message.includes("Chúc mừng") || message.includes("thành công")) icon = "🎉";
    else if (message.includes("💊") || message.includes("🏥") || message.includes("🥗")) icon = "🏥";

    if (iconEl) iconEl.innerText = icon;
    if (titleEl) titleEl.innerText = title;
    msgEl.innerText = message.replace(/^[❌🎉⚠️💊🏥🥗🍜🏋️🏃🚪📝]/g, '').trim();

    // Hiển thị Toast trượt mượt mà
    toast.classList.remove("opacity-0", "pointer-events-none", "-translate-y-4");
    toast.classList.add("opacity-100", "pointer-events-auto", "translate-y-0");

    if (toastTimeout) clearTimeout(toastTimeout);

    // Tự động ẩn sau 3.2 giây
    toastTimeout = setTimeout(() => {
        closeToast();
    }, 3200);
}

/**
 * Đóng Popup Toast Notification
 */
function closeToast() {
    const toast = document.getElementById("custom-toast");
    if (toast) {
        toast.classList.remove("opacity-100", "pointer-events-auto", "translate-y-0");
        toast.classList.add("opacity-0", "pointer-events-none", "-translate-y-4");
    }
}

// 🪄 GHI ĐÈ HÀM alert() MẶC ĐỊNH CỦA TRÌNH DUYỆT
window.alert = function (msg) {
    showToast(msg);
};

/**
 * =================================================================
 * ZONE 5: DOM ANIMATION SYSTEM (HIỆU ỨNG GIAO DIỆN)
 * =================================================================
 */

/**
 * Hiển thị số bay lên (Floating Text) tại một phần tử cụ thể
 * @param {string} targetId ID của phần tử gốc trên UI (VD: 'money', 'health')
 * @param {string} text Nội dung hiển thị (VD: '+500$', '-20')
 * @param {string} type 'pos' (Cộng/Màu Xanh) hoặc 'neg' (Trừ/Màu Đỏ)
 */
function showFloatingText(targetId, text, type = 'pos') {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    // Lấy tọa độ thực tế của phần tử trên màn hình
    const rect = targetEl.getBoundingClientRect();

    // Tạo thẻ span chứa số bay lên
    const floatingEl = document.createElement('span');
    floatingEl.innerText = text;
    floatingEl.className = `fixed font-black text-sm drop-shadow-md animate-float-up z-[100] ${type === 'pos' ? 'text-emerald-500' : 'text-rose-500'}`;

    // Đặt vị trí ngẫu nhiên lệch một chút để các số không đè chặt lên nhau
    const randomOffsetX = (Math.random() - 0.5) * 20;
    floatingEl.style.left = `${rect.left + (rect.width / 2) + randomOffsetX}px`;
    floatingEl.style.top = `${rect.top}px`;

    document.body.appendChild(floatingEl);

    // Tự dọn rác DOM sau khi animation 1.2s kết thúc
    setTimeout(() => floatingEl.remove(), 1200);
}

/**
 * Rung màn hình khi có sự kiện tiêu cực hoặc lỗi (Screen Shake)
 */
function triggerScreenShake() {
    const mainContainer = document.getElementById("main-game-view") || document.body;
    mainContainer.classList.add("animate-shake");

    setTimeout(() => mainContainer.classList.remove("animate-shake"), 300);
}

/**
 * =================================================================
 * CUSTOM GAME CONFIRMATION MODAL SYSTEM (HỆ THỐNG XÁC NHẬN TÙY CHỈNH)
 * =================================================================
 */

/**
 * Hiển thị bảng xác nhận mang phong cách game thay thế cho confirm() mặc định
 * @param {string} title Tiêu đề bảng
 * @param {string} message Nội dung câu hỏi
 * @param {function} onConfirm Callback thực thi khi người chơi bấm Đồng Ý
 * @param {string} icon Icon hiển thị (mặc định là ❓)
 * @param {string} tag Thẻ nhỏ phía trên (mặc định là ⚠️ Xác Nhận)
 */
function showGameConfirm(message, onConfirm, title = "Xác Nhận Hành Động", icon = "❓", tag = "⚠️ Chú Ý") {
    const modal = document.getElementById("game-confirm-modal");
    const titleEl = document.getElementById("confirm-modal-title");
    const descEl = document.getElementById("confirm-modal-description");
    const iconEl = document.getElementById("confirm-modal-icon");
    const tagEl = document.getElementById("confirm-modal-tag");
    const okBtn = document.getElementById("confirm-modal-ok-btn");
    const cancelBtn = document.getElementById("confirm-modal-cancel-btn");

    if (!modal) {
        // Fallback an toàn nếu chưa kịp nhúng HTML
        if (confirm(message)) {
            if (typeof onConfirm === 'function') onConfirm();
        }
        return;
    }

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = message;
    if (iconEl) iconEl.innerText = icon;
    if (tagEl) tagEl.innerText = tag;

    // Xóa bỏ các sự kiện click cũ bằng cách clone node
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Gắn sự kiện Đồng Ý
    newOkBtn.onclick = function () {
        modal.classList.add("hidden");
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };

    // Gắn sự kiện Hủy Bỏ
    newCancelBtn.onclick = function () {
        modal.classList.add("hidden");
    };

    // Hiển thị modal
    modal.classList.remove("hidden");
}

/**
 * Hiển thị bảng nhập liệu mang phong cách game thay thế cho prompt() mặc định
 */
function showGamePrompt(message, defaultValue, onConfirm, title = "Nhập Dữ Liệu", icon = "✏️", tag = "⚠️ Yêu Cầu") {
    const modal = document.getElementById("game-prompt-modal");
    if (!modal) {
        // Fallback an toàn nếu chưa nhúng HTML
        const val = prompt(message, defaultValue);
        if (val !== null && typeof onConfirm === 'function') onConfirm(val);
        return;
    }

    document.getElementById("prompt-modal-title").innerText = title;
    document.getElementById("prompt-modal-description").innerText = message;
    document.getElementById("prompt-modal-icon").innerText = icon;
    document.getElementById("prompt-modal-tag").innerText = tag;

    const inputEl = document.getElementById("prompt-modal-input");
    inputEl.value = defaultValue || "";

    const okBtn = document.getElementById("prompt-modal-ok-btn");
    const cancelBtn = document.getElementById("prompt-modal-cancel-btn");

    // Clone node để dọn dẹp các sự kiện click rác của lần mở trước
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
    // Tự động focus vào ô nhập số sau khi modal bật lên
    setTimeout(() => inputEl.focus(), 100);
}

/**
 * Di chuyển sang thành phố mới với điều kiện chi phí và thay đổi giao diện trực quan
 * @param {string} cityId ID thành phố ('ung_dung', 'voi_vang', 'phon_hoa')
 * @param {string} cityName Tên hiển thị của thành phố
 * @param {number} travelCost Chi phí di cư (VNĐ / $)
 */
/**
 * Cập nhật giao diện theo thành phố hiện tại bằng thuộc tính data-city
 */
function updateCityTheme() {
    const currentCity = (gameState && gameState.currentCity) ? gameState.currentCity : 'ung_dung';
    document.body.setAttribute('data-city', currentCity);
    console.log("🎨 Đã cập nhật theme giao diện cho thành phố:", currentCity);
}

/**
 * =================================================================
 * ZONE 6: CITY MIGRATION & MAP SYSTEM (HỆ THỐNG DI CƯ & BẢN ĐỒ)
 * =================================================================
 */

// Danh sách các thành phố và thông số tác động (travelCost đang để 0 để debug)
const CITIES_DATA = [
    {
        id: 'ung_dung',
        name: 'Thành phố Ung Dung',
        icon: '🏡',
        description: 'Bình yên, chi phí sinh hoạt thấp, nhịp sống chậm rãi và thư thái.',
        travelCost: 0, // Đang để 0 để anh debug
        wageMultiplier: 1.0,
        stressMultiplier: 0.7,
        themeClass: 'city-ung-dung'
    },
    {
        id: 'voi_vang',
        name: 'Thành phố Vội Vàng',
        icon: '⚡',
        description: 'Nhịp độ công nghiệp cao, lương thưởng hấp dẫn nhưng áp lực công việc lớn.',
        travelCost: 0, // Đang để 0 để anh debug
        wageMultiplier: 1.25,
        stressMultiplier: 1.4,
        themeClass: 'city-voi-vang'
    },
    {
        id: 'phon_hoa',
        name: 'Thành phố Phồn Hoa',
        icon: '🌆',
        description: 'Trung tâm tài chính xa hoa rực rỡ ánh đèn, mở khóa các ngành nghề đỉnh cao.',
        travelCost: 0, // Đang để 0 để anh debug
        wageMultiplier: 1.4,
        stressMultiplier: 1.6,
        themeClass: 'city-phon-hoa'
    }];

/**
 * Cập nhật màu sắc giao diện body dựa theo thành phố hiện tại của nhân vật
 */
function updateCityTheme() {
    const currentCity = (gameState && gameState.currentCity) ? gameState.currentCity : 'ung_dung';

    // Dùng setAttribute để không đè mất class Tailwind dàn trang của thẻ <body>
    document.body.setAttribute('data-city', currentCity);

    console.log("🎨 Đã cập nhật theme giao diện cho thành phố:", currentCity);
}


/**
 * Thực hiện di cư sang thành phố mới
 * @param {string} cityId ID thành phố ('ung_dung', 'voi_vang', 'phon_hoa')
 */
function relocateToCity(cityId) {
    if (!gameState) return;
    const cityInfo = CITIES_DATA.find(c => c.id === cityId);
    if (!cityInfo) return;

    if (gameState.currentCity === cityId) {
        alert(`⚠️ Bạn đang sinh sống tại ${cityInfo.name} rồi!`);
        return;
    }

    // Kiểm tra tiền (đang để 0 để debug)
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

            // 🌟 Cập nhật ngay lập tức giao diện màu sắc body
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

/**
 * Render danh sách các thành phố ra Modal Bản Đồ
 */
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

/**
 * Ẩn / Hiện Modal Bản Đồ Thành Phố
 */
function showCityMapModal(show) {
    const modal = document.getElementById("city-map-modal");
    if (modal) {
        if (show) {
            renderCityMapList();
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}

// Mảng danh sách Avatar local trỏ trực tiếp tới assets/avatars/
const AVATAR_PRESETS = [
    // --- AVATAR NAM (.png) ---
    { id: 'boy_1', name: 'Năng Động', gender: 'Nam', url: 'assets/avatars/boy-1.png' },
    { id: 'boy_2', name: 'Đường Phố', gender: 'Nam', url: 'assets/avatars/boy-2.png' },
    { id: 'boy_3', name: 'Tri Thức', gender: 'Nam', url: 'assets/avatars/boy-3.png' },
    { id: 'boy_4', name: 'Thời Trang', gender: 'Nam', url: 'assets/avatars/boy-4.png' },
    { id: 'boy_5', name: 'Gamer 3D', gender: 'Nam', url: 'assets/avatars/boy-5.png' },

    // --- AVATAR NỮ (.png) ---
    { id: 'girl_1', name: 'Hoạt Bát', gender: 'Nữ', url: 'assets/avatars/girl-1.png' },
    { id: 'girl_2', name: 'Cá Tính', gender: 'Nữ', url: 'assets/avatars/girl-2.png' },
    { id: 'girl_3', name: 'Tri Thức', gender: 'Nữ', url: 'assets/avatars/girl-3.png' },
    { id: 'girl_4', name: 'Phóng Khoáng', gender: 'Nữ', url: 'assets/avatars/girl-4.png' },
    { id: 'girl_5', name: 'Streamer 3D', gender: 'Nữ', url: 'assets/avatars/girl-5.png' }
];

/**
 * Mở Modal Chọn Avatar
 */
function openAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    const grid = document.getElementById('avatar-grid-list');
    if (!modal || !grid) return;

    // Tự động lọc Avatar khớp với giới tính nhân vật
    const isMale = (gameState && (gameState.gender === 'Nam' || gameState.gender === 'male'));
    const targetGender = isMale ? 'Nam' : 'Nữ';

    const filteredAvatars = AVATAR_PRESETS.filter(item => item.gender === targetGender);

    grid.innerHTML = filteredAvatars.map(item => {
        const isSelected = (gameState && gameState.customAvatarUrl === item.url);
        return `
            <div onclick="selectAvatar('${item.url}')" 
                 class="relative p-2 rounded-2xl border-2 cursor-pointer transition transform hover:scale-105 flex flex-col items-center gap-1.5 ${isSelected ? 'border-amber-600 bg-amber-200/60 shadow-md' : 'border-amber-200/50 hover:border-amber-400 bg-amber-50/50'}">
                <div class="w-16 h-16 rounded-full border-2 border-amber-700/40 overflow-hidden bg-amber-100">
                    <img src="${item.url}" 
                         alt="${item.name}" 
                         class="w-full h-full object-cover" 
                         onerror="this.src='https://api.dicebear.com/7.x/adventurer/svg?seed=${item.id}'" />
                </div>
                <span class="text-[10px] font-bold text-amber-950 text-center line-clamp-1">${item.name}</span>
                ${isSelected ? '<span class="absolute top-1 right-1 bg-amber-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">✓</span>' : ''}
            </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
}

/**
 * Đóng Modal Avatar
 */
function closeAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Chọn Avatar mới và cập nhật Profile
 */
function selectAvatar(avatarUrl) {
    if (!gameState) return;

    // Lưu đường dẫn ảnh local vào gameState
    gameState.customAvatarUrl = avatarUrl;

    // Đã thêm cập nhật Profile Card
    if (typeof updateProfileCard === 'function') {
        updateProfileCard();
    }

    if (typeof showToast === 'function') {
        showToast('✨ Đã thay đổi Avatar thành công!', 'success');
    }

    closeAvatarModal();
}

// Danh sách 12 Cung Hoàng Đạo
const ZODIAC_LIST = [
    { name: "Bạch Dương", icon: "♈", date: "21/03 - 19/04" },
    { name: "Kim Ngưu", icon: "♉", date: "20/04 - 20/05" },
    { name: "Song Tử", icon: "♊", date: "21/05 - 20/06" },
    { name: "Cự Giải", icon: "♋", date: "21/06 - 22/07" },
    { name: "Sư Tử", icon: "♌", date: "23/07 - 22/08" },
    { name: "Xử Nữ", icon: "♍", date: "23/08 - 22/09" },
    { name: "Thiên Bình", icon: "♎", date: "23/09 - 22/10" },
    { name: "Bọ Cạp", icon: "♏", date: "23/10 - 21/11" },
    { name: "Nhân Mã", icon: "♐", date: "22/11 - 21/12" },
    { name: "Ma Kết", icon: "♑", date: "22/12 - 19/01" },
    { name: "Bảo Bình", icon: "♒", date: "20/01 - 18/02" },
    { name: "Song Ngư", icon: "♓", date: "19/02 - 20/03" }
];

/**
 * Mở Modal Chọn Cung Hoàng Đạo
 */
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

/**
 * Đóng Modal Cung Hoàng Đạo
 */
function closeZodiacModal() {
    const modal = document.getElementById('zodiac-modal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Chọn Cung Hoàng Đạo
 */
function selectZodiac(index) {
    if (!gameState) return;

    // Lưu chỉ số Cung Hoàng Đạo được chọn vào gameState
    gameState.zodiacIndex = index;

    // Cập nhật lại giao diện Profile Card
    if (typeof updateProfileCard === 'function') {
        updateProfileCard();
    }

    const selected = ZODIAC_LIST[index];
    if (typeof showToast === 'function') {
        showToast(`✨ Bạn đã chọn Cung ${selected.icon} ${selected.name}!`, 'success');
    }

    closeZodiacModal();
}

/**
 * Bật / Tắt Sidebar Drawer (Menu 3 Gạch Gemini Style)
 */
function toggleSidebarMenu() {
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    const content = document.getElementById('sidebar-content');
    if (!drawer || !backdrop || !content) return;

    const isOpen = !content.classList.contains('-translate-x-full');

    if (isOpen) {
        // Đóng Sidebar
        content.classList.add('-translate-x-full');
        backdrop.classList.add('opacity-0');
        setTimeout(() => drawer.classList.add('pointer-events-none'), 300);
    } else {
        // Mở Sidebar & kiểm tra quyền Admin
        drawer.classList.remove('pointer-events-none');
        backdrop.classList.remove('opacity-0');
        content.classList.remove('-translate-x-full');

        // Hiện nút Admin Debug nếu tài khoản là Admin
        const adminBtn = document.getElementById('sidebar-admin-btn');
        if (adminBtn && gameState && (gameState.isAdmin || gameState.accountName === 'admin')) {
            adminBtn.classList.remove('hidden');
        }
    }
}

/**
 * Bật / Tắt Menu Vòng Cung Trung Tâm
 */
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

/**
 * Chuyển tab trong View tích hợp (Sự Nghiệp / Tiệm Đồ)
 */
function switchSubTab(parentViewId, subTabName) {
    const view = document.getElementById(parentViewId);
    if (!view) return;

    // Ẩn tất cả sub-content trong view đó
    view.querySelectorAll('.sub-tab-content').forEach(el => el.classList.add('hidden'));
    
    // Hiện sub-content được chọn
    const target = view.querySelector(`#sub-tab-${subTabName}`);
    if (target) target.classList.remove('hidden');

    // Đổi style active nút bấm sub-tab
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

