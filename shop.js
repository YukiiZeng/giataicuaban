/**
 * =================================================================
 * CORE MODULE: INVENTORY & SHOPPING SYSTEM (TÚI ĐỒ & CỬA HÀNG)
 * =================================================================
 */

let globalItemsData = [];

/**
 * Nạp dữ liệu vật phẩm từ items.json
 */
async function loadItemsJSON() {
    try {
        const response = await fetch('items.json');
        if (response.ok) {
            const data = await response.json();
            globalItemsData = data.items || [];
            console.log("🛍️ Đã nạp thành công items.json:", globalItemsData.length, "vật phẩm.");
        }
    } catch (e) {
        console.error("❌ Lỗi nạp items.json:", e);
    }
}
loadItemsJSON();

/**
 * Mua vật phẩm từ Cửa Hàng
 */
function buyItem(itemId) {
    if (!gameState) return;
    const item = globalItemsData.find(i => i.id === itemId);
    if (!item) return;

    if ((gameState.money || 0) < item.price) {
        if (typeof triggerScreenShake === 'function') triggerScreenShake();
        return alert(`❌ Bạn không đủ tiền! Cần ${item.price.toLocaleString()} $ để mua ${item.name}.`);
    }

    if (!gameState.inventory) gameState.inventory = [];

    // Kiểm tra nếu là Smartphone hoặc Xe cộ đã sở hữu loại tương tự
    if (item.type === 'smartphone') {
        const hasPhone = gameState.inventory.some(i => i.type === 'smartphone');
        if (hasPhone) {
            // Thay confirm() cũ bằng Modal xác nhận phong cách game
            showGameConfirm(
                `Bạn đã có điện thoại trong túi đồ. Bạn có muốn đổi sang ${item.name} không?`,
                function() {
                    executeBuyItem(item);
                },
                "Xác Nhận Đổi Thiết Bị",
                "📱",
                "🛒 Cửa Hàng"
            );
            return;
        }
    }

    executeBuyItem(item);
}

// Hàm phụ trợ thực hiện giao dịch mua sau khi đã qua bước xác nhận
function executeBuyItem(item) {
    gameState.money -= item.price;

    const existingIndex = gameState.inventory.findIndex(i => i.id === item.id);
    if (existingIndex >= 0 && item.type !== 'smartphone' && item.type !== 'vehicle') {
        gameState.inventory[existingIndex].quantity = (gameState.inventory[existingIndex].quantity || 1) + 1;
    } else {
        gameState.inventory.push({ ...item, quantity: 1, purchasedAt: gameState.month || 1 });
    }

    if (item.effects) {
        if (item.effects.charm_bonus) gameState.charm = Math.min(100, (gameState.charm || 0) + item.effects.charm_bonus);
        if (item.effects.looks_bonus) gameState.looks = Math.min(100, (gameState.looks || 0) + item.effects.looks_bonus);
        if (item.effects.ego_bonus) gameState.ego = Math.min(100, (gameState.ego || 0) + item.effects.ego_bonus);
        if (item.effects.smarts_bonus) gameState.smarts = Math.min(100, (gameState.smarts || 0) + item.effects.smarts_bonus);
    }

    if (typeof addDailyLog === 'function') {
        addDailyLog(`Mua sắm: ${item.name} (-${item.price}$)`);
    }
    if (typeof addTransactionHistory === 'function') {
        addTransactionHistory(`Mua sắm: ${item.name}`, -item.price);
    }
    if (typeof showFloatingText === 'function') {
        showFloatingText('money', `-${item.price}$`, 'neg');
    }

    alert(`🎉 Mua thành công: ${item.name}! Check túi đồ của bạn ngay.`);

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof renderGameState === 'function') renderGameState();
    renderShopModalList();
}


/**
 * Bán lại vật phẩm trong Túi Đồ (Lấy lại 60% giá trị)
 */
function sellItem(itemId) {
    if (!gameState || !gameState.inventory) return;

    const itemIndex = gameState.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = gameState.inventory[itemIndex];
    const resellPrice = Math.floor(item.price * 0.6);

    // Sử dụng Modal Xác Nhận tùy chỉnh phong cách game
    showGameConfirm(
        `Bạn có chắc chắn muốn bán lại ${item.name} với giá ${resellPrice.toLocaleString()} $ (60% giá trị gốc)?`,
        function() {
            gameState.money = (gameState.money || 0) + resellPrice;

            if (item.quantity && item.quantity > 1) {
                item.quantity -= 1;
            } else {
                gameState.inventory.splice(itemIndex, 1);
            }

            if (typeof addDailyLog === 'function') {
                addDailyLog(`Bán đồ: ${item.name} (+${resellPrice}$)`);
            }
            if (typeof addTransactionHistory === 'function') {
                addTransactionHistory(`Bán đồ: ${item.name}`, resellPrice);
            }

            alert(`💰 Đã bán ${item.name}, nhận lại ${resellPrice.toLocaleString()} $!`);

            if (typeof saveGameState === 'function') saveGameState();
            if (typeof renderGameState === 'function') renderGameState();
            renderInventoryModalList();
        },
        "Xác Nhận Bán Vật Phẩm",
        "🏷️",
        "🎒 Túi Đồ"
    );
}


/**
 * Render Danh sách Cửa Hàng (Shop Modal)
 */
function renderShopModalList(filterCategory) {
    if (!filterCategory) filterCategory = 'all';

    // 🚀 CẬP NHẬT TRẠNG THÁI HIỂN THỊ ACTIVE / INACTIVE CỦA NÚT TAB
    const categories = ['all', 'technology', 'vehicle', 'lifestyle'];
    categories.forEach(cat => {
        const tabBtn = document.getElementById(`shop-tab-${cat}`);
        if (tabBtn) {
            if (cat === filterCategory) {
                // Tab đang chọn: Nền trắng, chữ đậm, có shadow
                tabBtn.className = "flex-1 py-1 rounded-lg bg-white/80 text-amber-950 shadow-sm font-extrabold transition-all";
            } else {
                // Tab không chọn: Chữ mờ
                tabBtn.className = "flex-1 py-1 rounded-lg text-amber-800/70 hover:text-amber-900 font-extrabold transition-all";
            }
        }
    });

    const listEl = document.getElementById("shop-modal-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!globalItemsData || globalItemsData.length === 0) {
        listEl.innerHTML = `<p class="text-xs text-center font-bold text-amber-900 py-4">⌛ Đang tải danh sách hàng hóa...</p>`;
        loadItemsJSON();
        return;
    }

    const myInventory = (typeof gameState !== 'undefined' && gameState) ? (gameState.inventory || []) : [];

    const itemsToRender = filterCategory === 'all' 
        ? globalItemsData 
        : globalItemsData.filter(i => i.category === filterCategory);

    itemsToRender.forEach(item => {
        const isOwned = myInventory.some(inv => inv.id === item.id);
        const card = document.createElement("div");
        card.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40 shrink-0";

        let buttonHTML = `
            <button onclick="buyItem('${item.id}')" 
                class="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm transition-all active:scale-95">
                🛒 Mua Ngay (${item.price.toLocaleString()} $)
            </button>
        `;

        if (isOwned && (item.type === 'smartphone' || item.type === 'vehicle')) {
            buttonHTML = `
                <button disabled class="w-full py-2 bg-amber-800/20 text-amber-950 font-display font-extrabold rounded-xl text-[10px] cursor-not-allowed border border-amber-900/20">
                    ✅ Đã Sở Hữu
                </button>
            `;
        }

        card.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                    <span class="text-2xl">${item.icon || '📦'}</span>
                    <div class="flex flex-col">
                        <span class="text-xs font-extrabold text-amber-950">${item.name}</span>
                        <span class="text-[10px] text-amber-800/80 mt-0.5">${item.description}</span>
                    </div>
                </div>
            </div>
            ${buttonHTML}
        `;
        listEl.appendChild(card);
    });
}

/**
 * Render Danh sách Túi Đồ (Inventory Modal)
 */
function renderInventoryModalList() {
    const listEl = document.getElementById("inventory-modal-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    const items = gameState ? (gameState.inventory || []) : [];

    if (items.length === 0) {
        listEl.innerHTML = `<p class="text-xs text-center font-bold text-amber-800/60 py-6">🎒 Túi đồ đang trống. Hãy ghé Cửa Hàng sắm đồ nhé!</p>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "glass-card-inner-light p-3 rounded-2xl flex items-center justify-between border border-amber-300/40 shrink-0 gap-2";
        card.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="text-2xl">${item.icon || '📦'}</span>
                <div class="flex flex-col">
                    <span class="text-xs font-extrabold text-amber-950">${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                    <span class="text-[10px] text-amber-800/80">${item.description}</span>
                </div>
            </div>
            <button onclick="sellItem('${item.id}')" class="py-1.5 px-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm active:scale-95 border border-rose-300 shrink-0">
                🏷️ Bán (${Math.floor(item.price * 0.6).toLocaleString()} $)
            </button>
        `;
        listEl.appendChild(card);
    });
}

function showShopModal(show) {
    const modal = document.getElementById("shop-modal");
    if (modal) {
        if (show) { renderShopModalList(); modal.classList.remove("hidden"); }
        else modal.classList.add("hidden");
    }
}

function showInventoryModal(show) {
    const modal = document.getElementById("inventory-modal");
    if (modal) {
        if (show) { renderInventoryModalList(); modal.classList.remove("hidden"); }
        else modal.classList.add("hidden");
    }
}