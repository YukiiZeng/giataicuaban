/**
 * =================================================================
 * ZONE 1: FIREBASE CLOUD SYNC (ĐỒNG BỘ CLOUD)
 * =================================================================
 */

/**
 * Lưu gameState hiện tại lên Firebase Firestore
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

/**
 * Tải gameState từ Firebase Firestore về máy
 */
function loadGameStateFromFirebase(userId) {
    if (typeof db === 'undefined') return;

    db.collection("players").doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                gameState = doc.data();
                saveGameState(); // Lưu đè vào LocalStorage
                renderGameState(); // Render lại UI
                console.log("☁️ Đã tải tiến trình từ Firebase thành công!");
            } else {
                console.warn("Không tìm thấy dữ liệu trên Cloud cho user này!");
            }
        })
        .catch((error) => {
            console.error("❌ Lỗi nạp dữ liệu từ Firebase:", error);
        });
}

function updateUI() {
    if (typeof renderGameState === 'function') {
        renderGameState();
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
        title.innerText = "ĐĂNG KÝ TÀI KHOẢN";
        submitBtn.innerText = "✨ TẠO TÀI KHOẢN MỚI";
        switchText.innerText = "Đã có tài khoản?";
        switchBtn.innerText = "Đăng nhập ngay";
    } else {
        title.innerText = "ĐĂNG NHẬP";
        submitBtn.innerText = "🔑 ĐĂNG NHẬP";
        switchText.innerText = "Chưa có tài khoản?";
        switchBtn.innerText = "Đăng ký ngay";
    }
}

function usernameToEmail(username) {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    return `${cleanUsername}${DOMAIN_SUFFIX}`;
}

function handleAuthSubmit() {
    const rawUsername = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value.trim();

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
/**
 * =================================================================
 * ZONE 3: ADMIN PANEL & AUTH STATE LISTENERS (PANEL QUẢN TRỊ)
 * =================================================================
 */

/**
 * Lắng nghe trạng thái Auth & hiển thị Username lên Header
 */
if (typeof auth !== 'undefined') {
    // Cập nhật tên tài khoản Cloud hiển thị ở hàng riêng
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        const cloudUserDisplay = document.getElementById("cloud-username-display");
        const authBtnText = document.getElementById("auth-status-btn-text");

        if (user && user.email) {
            const displayUsername = user.email.replace(DOMAIN_SUFFIX, "");
            
            if (cloudUserDisplay) cloudUserDisplay.innerText = displayUsername;
            if (authBtnText) authBtnText.innerText = "Đổi TK";
            
            if (typeof checkAdminAccess === 'function') checkAdminAccess(displayUsername);
            console.log("👤 Đang đăng nhập với Username:", displayUsername);
        } else {
            if (cloudUserDisplay) cloudUserDisplay.innerText = "Chưa đăng nhập";
            if (authBtnText) authBtnText.innerText = "Đăng nhập";
            if (typeof checkAdminAccess === 'function') checkAdminAccess(null);
        }
    });
}

}

function showAdminPanel(show) {
    const modal = document.getElementById("admin-panel-modal");
    if (modal) {
        if (show) modal.classList.remove("hidden");
        else modal.classList.add("hidden");
    }
}

function handleAdminResetCharacter() {
    const confirmReset = confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn RESET toàn bộ nhân vật và tiến trình chơi về lại từ đầu?");
    if (confirmReset) {
        if (typeof resetCharacter === 'function') {
            resetCharacter();
        }
    }
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

/**
 * =================================================================
 * CUSTOM TOAST NOTIFICATION SYSTEM (THAY THẾ ALERT BẰNG POPUP ĐẸP)
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

    // Tự động chọn Icon dựa vào nội dung nếu dùng alert mặc định
    if (message.includes("❌") || message.includes("lỗi") || message.includes("không đủ")) icon = "⚠️";
    else if (message.includes("🎉") || message.includes("Chúc mừng") || message.includes("thành công")) icon = "🎉";
    else if (message.includes("💊") || message.includes("🏥") || message.includes("🥗")) icon = "🏥";

    if (iconEl) iconEl.innerText = icon;
    if (titleEl) titleEl.innerText = title;
    msgEl.innerText = message.replace(/^[❌🎉⚠️💊🏥🥗🍜🏋️🏃🚪📝]/g, '').trim(); // Lọc bỏ bớt icon trùng ở đầu

    // Hiển thị Toast với hiệu ứng trượt xuống
    toast.classList.remove("opacity-0", "pointer-events-none", "-translate-y-4");
    toast.classList.add("opacity-100", "pointer-events-auto", "translate-y-0");

    if (toastTimeout) clearTimeout(toastTimeout);
    
    // Tự động ẩn sau 3 giây
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

// 🪄 BẢO BỐI: GHI ĐÈ HÀM alert() MẶC ĐỊNH CỦA TRÌNH DUYỆT
window.alert = function(msg) {
    showToast(msg);
};
