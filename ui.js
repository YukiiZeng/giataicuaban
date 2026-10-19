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
        function() {
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
        if (show) modal.classList.remove("hidden");
        else modal.classList.add("hidden");
    }
}

/**
 * Xử lý Reset Nhân vật từ Admin Panel
 */
function handleAdminResetCharacter() {
    showGameConfirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn RESET toàn bộ nhân vật và tiến trình chơi về lại từ đầu? Mọi dữ liệu sẽ bị xóa sạch!",
        function() {
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
        async function() {
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
window.alert = function(msg) {
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
    newOkBtn.onclick = function() {
        modal.classList.add("hidden");
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };

    // Gắn sự kiện Hủy Bỏ
    newCancelBtn.onclick = function() {
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

    newOkBtn.onclick = function() {
        modal.classList.add("hidden");
        if (typeof onConfirm === 'function') onConfirm(inputEl.value);
    };

    newCancelBtn.onclick = function() {
        modal.classList.add("hidden");
    };

    modal.classList.remove("hidden");
    // Tự động focus vào ô nhập số sau khi modal bật lên
    setTimeout(() => inputEl.focus(), 100);
}
