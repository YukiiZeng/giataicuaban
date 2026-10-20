/**
 * =================================================================
 * ZONE 1: DATABASE & MARKET ENGINE (DỮ LIỆU & THUẬT TOÁN THỊ TRƯỜNG)
 * =================================================================
 */

// Danh sách các mã cổ phiếu mặc định với các đặc tính thực tế
// Thay thế toàn bộ mảng cũ trong stocks.js bằng hệ thống 37 mã tài sản này
const STOCK_MARKET_DB = [
    // =================================================================
    // 🇻🇳 12 CỔ PHIẾU TRONG NƯỚC (Thị trường Nội Địa)
    // =================================================================
    { id: "SBM", name: "Sữa Bò Mục Đồng", type: "blue_chip", basePrice: 80, volatility: 0.05, trend: 0.005, dividend: 0.06, desc: "[TRONG NƯỚC] Hãng sữa quốc dân, cực kỳ an toàn, chia cổ tức đều đặn hàng năm." },
    { id: "LGC", name: "Địa Ốc Lĩnh Giao", type: "blue_chip", basePrice: 120, volatility: 0.06, trend: 0.008, dividend: 0.04, desc: "[TRONG NƯỚC] Ông lớn bất động sản, thâu tóm hàng loạt quỹ đất vàng trải dài các vùng lãnh thổ." },
    { id: "VBP", name: "Giải Khát Vườn Bia", type: "blue_chip", basePrice: 45, volatility: 0.05, trend: 0.006, dividend: 0.05, desc: "[TRONG NƯỚC] Chuỗi kho bãi và phân phối đồ uống lớn nhất nhì thành phố. Dòng tiền cực kỳ ổn định." },
    { id: "TVS", name: "Thủy Sản Tiến Viễn", type: "blue_chip", basePrice: 60, volatility: 0.07, trend: 0.007, dividend: 0.03, desc: "[TRONG NƯỚC] Tập đoàn xuất khẩu hải sản hàng đầu, doanh thu phụ thuộc nhiều vào tỷ giá ngoại tệ." },
    
    { id: "TVN", name: "Công Nghệ Tinh Vân", type: "growth", basePrice: 50, volatility: 0.12, trend: 0.015, dividend: 0.01, desc: "[TRONG NƯỚC] Kỳ lân công nghệ nội địa. Tiềm năng tăng trưởng mạnh nhưng giá hay biến động." },
    { id: "NHV", name: "Ẩm Thực Nhà Hàng Vui", type: "growth", basePrice: 35, volatility: 0.15, trend: 0.012, dividend: 0.02, desc: "[TRONG NƯỚC] Chuỗi nhà hàng nhượng quyền đang mở rộng thần tốc. Rủi ro cạnh tranh F&B cao." },
    { id: "GTC", name: "Tập Đoàn Gia Tài", type: "growth", basePrice: 85, volatility: 0.10, trend: 0.018, dividend: 0.01, desc: "[TRONG NƯỚC] Công ty holding đa ngành, đầu tư từ bán lẻ đến y tế. Con cưng của các quỹ đầu tư." },
    { id: "DCO", name: "Cà Phê Đắng", type: "growth", basePrice: 20, volatility: 0.18, trend: 0.01, dividend: 0.0, desc: "[TRONG NƯỚC] Chuỗi cà phê khởi nghiệp đang đốt tiền mở rộng thị phần. Biên độ dao động giá rất gắt." },
    { id: "HVN", name: "Hàng Không Hải Vân", type: "growth", basePrice: 40, volatility: 0.11, trend: 0.009, dividend: 0.01, desc: "[TRONG NƯỚC] Hãng bay giá rẻ vươn tầm châu lục, hay bị ảnh hưởng bởi giá xăng dầu thế giới." },

    { id: "CXB", name: "Xây Dựng Cát Xây", type: "penny", basePrice: 5, volatility: 0.35, trend: -0.01, dividend: 0.0, desc: "[TRONG NƯỚC] Cổ phiếu trà đá, chủ tịch hay lên báo hô hào rồi \"úp sọt\" cổ đông. Rủi ro cháy túi." },
    { id: "LTC", name: "Truyền Thông Lăng Tiêu", type: "penny", basePrice: 3, volatility: 0.40, trend: -0.015, dividend: 0.0, desc: "[TRONG NƯỚC] Hãng phim và giải trí tiên hiệp đang vướng lùm xùm nợ lương nhân viên." },
    { id: "XLC", name: "Xổ Số Kiến Thiết Lộc", type: "penny", basePrice: 8, volatility: 0.25, trend: 0.0, dividend: 0.05, desc: "[TRONG NƯỚC] Không tăng trưởng nhưng thi thoảng chia cổ tức đột biến. Thuần túy may rủi." },

    // =================================================================
    // 🌎 15 CỔ PHIẾU QUỐC TẾ (Thị trường Toàn Cầu)
    // =================================================================
    { id: "QCP", name: "Tập Đoàn Quả Cam", type: "blue_chip", basePrice: 250, volatility: 0.05, trend: 0.01, dividend: 0.01, desc: "[QUỐC TẾ] Thương hiệu công nghệ số 1 thế giới với hệ sinh thái thiết bị thông minh đắt đỏ." },
    { id: "MCR", name: "Cửa Sổ Nhỏ Corp", type: "blue_chip", basePrice: 320, volatility: 0.04, trend: 0.009, dividend: 0.02, desc: "[QUỐC TẾ] Gã khổng lồ phần mềm và hệ điều hành, đang đổ hàng tỷ đô vào trí tuệ nhân tạo." },
    { id: "RZN", name: "Khu Rừng R-Z", type: "blue_chip", basePrice: 180, volatility: 0.06, trend: 0.011, dividend: 0.0, desc: "[QUỐC TẾ] Đế chế thương mại điện tử và logistics, kiểm soát chuỗi cung ứng toàn cầu." },
    { id: "WMT", name: "Siêu Thị Tường Lớn", type: "blue_chip", basePrice: 150, volatility: 0.03, trend: 0.004, dividend: 0.03, desc: "[QUỐC TẾ] Kênh bán lẻ lớn nhất hành tinh. Chậm chạp, nhàm chán nhưng là hầm trú ẩn an toàn nhất." },
    { id: "SNY", name: "Điện Tử Mặt Trời", type: "blue_chip", basePrice: 90, volatility: 0.07, trend: 0.006, dividend: 0.02, desc: "[QUỐC TẾ] Tập đoàn đa quốc gia Nhật Bản, vô đối trong mảng máy ảnh và máy chơi game console." },
    
    { id: "NVD", name: "Đồ Họa Mắt Xanh", type: "growth", basePrice: 400, volatility: 0.15, trend: 0.025, dividend: 0.0, desc: "[QUỐC TẾ] Bá chủ thiết kế chip AI và card đồ họa. Đang trong cơn sốt giá siêu tưởng." },
    { id: "VLT", name: "Xe Điện Volts", type: "growth", basePrice: 210, volatility: 0.18, trend: 0.015, dividend: 0.0, desc: "[QUỐC TẾ] Hãng xe điện tiên phong. CEO hay lên mạng phát ngôn gây sốc làm giá nhảy múa." },
    { id: "GGL", name: "Kính Lúp Toàn Cầu", type: "growth", basePrice: 160, volatility: 0.08, trend: 0.012, dividend: 0.01, desc: "[QUỐC TẾ] Kẻ thống trị công cụ tìm kiếm và quảng cáo số, đang chật vật giữ ngôi vương." },
    { id: "MTA", name: "Vũ Trụ Ngân Hà", type: "growth", basePrice: 280, volatility: 0.14, trend: 0.01, dividend: 0.0, desc: "[QUỐC TẾ] Mạng xã hội lớn nhất thế giới, đang đặt cược sống còn vào thế giới thực tế ảo." },
    { id: "NTF", name: "Phim Ảnh Mạng Đỏ", type: "growth", basePrice: 450, volatility: 0.16, trend: 0.008, dividend: 0.0, desc: "[QUỐC TẾ] Ông trùm dịch vụ streaming phim. Giá trị phụ thuộc hẳn vào số lượng người đăng ký mới." },
    { id: "SBU", name: "Cà Phê Tiên Cá", type: "growth", basePrice: 100, volatility: 0.09, trend: 0.007, dividend: 0.02, desc: "[QUỐC TẾ] Thương hiệu đồ uống toàn cầu, bán phong cách sống nhiều hơn là bán cà phê." },
    { id: "TKT", name: "Giải Trí Video Ngắn", type: "growth", basePrice: 120, volatility: 0.20, trend: 0.02, dividend: 0.0, desc: "[QUỐC TẾ] Nền tảng gây nghiện thuật toán. Rủi ro cao vì hay bị các chính phủ dọa cấm cửa." },
    
    { id: "BOE", name: "Hàng Không Chim Sắt", type: "penny", basePrice: 15, volatility: 0.25, trend: -0.01, dividend: 0.0, desc: "[QUỐC TẾ] Từng là niềm tự hào ngành hàng không nhưng đang ngập trong scandal rơi máy bay." },
    { id: "BKG", name: "Bánh Mì Khổng Lồ", type: "penny", basePrice: 12, volatility: 0.22, trend: 0.002, dividend: 0.01, desc: "[QUỐC TẾ] Chuỗi thức ăn nhanh đang chật vật tái cơ cấu để giành lại thị phần từ các đối thủ." },
    { id: "ASU", name: "Dược Phẩm Á Châu", type: "penny", basePrice: 8, volatility: 0.30, trend: 0.0, dividend: 0.0, desc: "[QUỐC TẾ] Công ty công nghệ sinh học chuyên săn lùng thuốc đặc trị. Nếu thử nghiệm xịt là cổ phiếu sập." },

    // =================================================================
    // 🪙 10 TIỀN MÃ HÓA (Crypto & Token rủi ro siêu cao)
    // =================================================================
    { id: "BXC", name: "Byte-Coin Vàng", type: "blue_chip", basePrice: 65000, volatility: 0.15, trend: 0.01, dividend: 0.0, desc: "[CRYPTO] Anh cả của làng tiền số. Được xem là vàng điện tử nhưng vẫn trồi sụt theo tâm lý thị trường." },
    { id: "ETC", name: "Ether-Contract", type: "blue_chip", basePrice: 3500, volatility: 0.18, trend: 0.015, dividend: 0.0, desc: "[CRYPTO] Nền tảng hợp đồng thông minh số 1. Phí giao dịch trên mạng lưới đắt cắt cổ." },
    { id: "TET", name: "Tether-Đô La", type: "blue_chip", basePrice: 1, volatility: 0.001, trend: 0.0, dividend: 0.0, desc: "[CRYPTO] Stablecoin neo giá 1:1 với USD. Nơi trú ẩn an toàn nhất khi giông bão ập đến sàn coin." },
    
    { id: "SUN", name: "Ánh Dương Chói", type: "growth", basePrice: 120, volatility: 0.30, trend: 0.02, dividend: 0.0, desc: "[CRYPTO] Hệ sinh thái tốc độ cao đối trọng với ETC. Khuyết điểm lớn nhất là hay bị sập mạng." },
    { id: "BEX", name: "Sàn Ảo Toàn Cầu", type: "growth", basePrice: 450, volatility: 0.25, trend: 0.01, dividend: 0.0, desc: "[CRYPTO] Đồng coin của sàn giao dịch tiền mã hóa khổng lồ. Bị giới tỷ phú phố Wall ghét cay đắng." },
    
    { id: "DOG", name: "Meme Chú Chó", type: "penny", basePrice: 2, volatility: 0.60, trend: 0.0, dividend: 0.0, desc: "[CRYPTO] Sinh ra từ một trò đùa mạng. Lên đỉnh hay xuống vực chỉ qua một dòng trạng thái mạng xã hội." },
    { id: "SHI", name: "Khuyển Nhật Lắc Đuôi", type: "penny", basePrice: 1, volatility: 0.70, trend: 0.0, dividend: 0.0, desc: "[CRYPTO] Clone của DOG nhưng vô dụng hơn. Thuần túy là trò chơi bơm xả của đội lái." },
    { id: "FRO", name: "Cóc Xanh Tâm Linh", type: "penny", basePrice: 3, volatility: 0.65, trend: -0.05, dividend: 0.0, desc: "[CRYPTO] Token hệ tâm linh rác rưởi. Ai vào trễ là xác định đu đỉnh nghìn năm." },
    { id: "MOO", name: "Mặt Trăng Tan Vỡ", type: "penny", basePrice: 15, volatility: 0.90, trend: -0.10, dividend: 0.0, desc: "[CRYPTO] Từng là tượng đài nhưng thuật toán sụp đổ khiến bao người phá sản. Ai còn chơi là chơi hệ tâm linh." },
    { id: "SQD", name: "Mực Ống Tốc Độ", type: "penny", basePrice: 6, volatility: 0.95, trend: 0.0, dividend: 0.0, desc: "[CRYPTO] Token cờ bạc cực đoan, chủ dự án sẵn sàng rút thanh khoản (rug pull) bỏ trốn bất cứ lúc nào." }
];


// Khởi tạo thị trường nếu save game chưa có
function initStockMarket() {
    if (!gameState.stocks) {
        gameState.stocks = STOCK_MARKET_DB.map(s => ({
            id: s.id,
            currentPrice: s.basePrice,
            history: [s.basePrice] // Lưu lịch sử 6 tháng để vẽ biểu đồ
        }));
        gameState.portfolio = {}; // { "VNM": { quantity: 100, avgCost: 82.5 } }
        gameState.marketSentiment = "normal"; // bull (lạc quan), bear (bi quan), normal
    }
}

// Chạy mỗi đầu tháng (Gọi trong nextMonth của logic.js)
function processMonthlyStockMarket() {
    initStockMarket();
    
    // 1. Xác định chu kỳ kinh tế (Tâm lý thị trường)
    const rand = Math.random();
    if (rand < 0.10) gameState.marketSentiment = "bull";       // 10% bùng nổ
    else if (rand < 0.20) gameState.marketSentiment = "bear";  // 10% suy thoái
    else gameState.marketSentiment = "normal";                 // 80% bình thường

    let logs = [];

    // 2. Cập nhật giá từng mã cổ phiếu
    gameState.stocks.forEach(stockData => {
        const dbInfo = STOCK_MARKET_DB.find(s => s.id === stockData.id);
        if (!dbInfo) return;

        let sentimentMod = 0;
        if (gameState.marketSentiment === "bull") sentimentMod = 0.06;
        if (gameState.marketSentiment === "bear") sentimentMod = -0.08;

        const randomFactor = (Math.random() * 2) - 1; // Từ -1 đến 1
        const changePercent = dbInfo.trend + sentimentMod + (dbInfo.volatility * randomFactor);
        
        const oldPrice = stockData.currentPrice;
        let newPrice = Math.max(1, Math.round(oldPrice * (1 + changePercent))); // Giá tối thiểu là 1$
        
        stockData.currentPrice = newPrice;
        
        // Cập nhật lịch sử (giữ tối đa 10 tháng để render chart)
        stockData.history.push(newPrice);
        if (stockData.history.length > 10) stockData.history.shift();
    });

    // 3. Trả Cổ tức hàng năm (Tháng 12)
    if (gameState.month % 12 === 0 && gameState.portfolio) {
        let totalDividend = 0;
        Object.keys(gameState.portfolio).forEach(id => {
            const dbInfo = STOCK_MARKET_DB.find(s => s.id === id);
            const holding = gameState.portfolio[id];
            if (dbInfo && holding && dbInfo.dividend > 0) {
                // Tính cổ tức dựa trên giá hiện tại hoặc giá trị vốn (ở đây dùng giá hiện tại cho thực tế)
                const currentPrice = gameState.stocks.find(s => s.id === id).currentPrice;
                const payout = Math.round(holding.quantity * currentPrice * dbInfo.dividend);
                totalDividend += payout;
            }
        });

        if (totalDividend > 0) {
            modifyStat('money', totalDividend);
            if (typeof addTransactionHistory === 'function') addTransactionHistory("Cổ tức chứng khoán", totalDividend);
            if (typeof showToast === 'function') showToast(`🎉 Nhận được ${totalDividend.toLocaleString()} $ tiền cổ tức cuối năm!`, "📈");
            logs.push(`Nhận ${totalDividend}$ cổ tức.`);
        }
    }

    if (logs.length > 0 && typeof addDailyLog === 'function') {
        addDailyLog(`Thị trường chứng khoán: ${logs.join(' ')}`);
    }
}

/**
 * =================================================================
 * ZONE 2: TRADING LOGIC (MUA / BÁN)
 * =================================================================
 */

function handleBuyStock(stockId) {
    initStockMarket(); // 🚀 DÒNG BẢO HIỂM: Tự động khôi phục data nếu bị Cloud đè

    const stock = gameState.stocks.find(s => s.id === stockId);
    const dbInfo = STOCK_MARKET_DB.find(s => s.id === stockId);
    const currentMoney = gameState.money || 0;
    const maxAffordable = Math.floor(currentMoney / stock.currentPrice);

    if (maxAffordable <= 0) {
        return alert(`❌ Bạn không đủ tiền mua dù chỉ 1 cổ phiếu ${stockId}! (Giá: ${stock.currentPrice}$)`);
    }

    showGamePrompt(
        `📈 MUA CỔ PHIẾU [${stockId}]\nGiá hiện tại: ${stock.currentPrice} $/cổ phiếu\nSức mua tối đa: ${maxAffordable.toLocaleString()} cổ\n\nNhập số lượng muốn mua:`,
        maxAffordable,
        function(amountStr) {
            const amount = parseInt(amountStr.replace(/[^0-9]/g, ''));
            if (isNaN(amount) || amount <= 0) return alert("❌ Số lượng không hợp lệ!");
            if (amount > maxAffordable) return alert("❌ Bạn không đủ tiền!");

            const totalCost = amount * stock.currentPrice;
            modifyStat('money', -totalCost);

            // Xử lý Danh mục (Trung bình giá - DCA)
            if (!gameState.portfolio[stockId]) {
                gameState.portfolio[stockId] = { quantity: 0, avgCost: 0 };
            }
            const holding = gameState.portfolio[stockId];
            const newTotalQty = holding.quantity + amount;
            const newAvgCost = ((holding.quantity * holding.avgCost) + totalCost) / newTotalQty;

            gameState.portfolio[stockId].quantity = newTotalQty;
            gameState.portfolio[stockId].avgCost = Math.round(newAvgCost * 100) / 100;

            if (typeof addTransactionHistory === 'function') addTransactionHistory(`Mua ${amount} cp ${stockId}`, -totalCost);
            showToast(`✅ Đã khớp lệnh mua ${amount} cổ phiếu ${stockId}!`, "🛒");
            
            saveGameState();
            renderGameState();
            renderStockModal('market');
        },
        "Đặt Lệnh Mua",
        "📥",
        "Sàn Giao Dịch"
    );
}

function handleSellStock(stockId) {
    initStockMarket(); // 🚀 DÒNG BẢO HIỂM

    const stock = gameState.stocks.find(s => s.id === stockId);
    const holding = gameState.portfolio[stockId];
    if (!holding || holding.quantity <= 0) return alert("❌ Bạn không nắm giữ cổ phiếu này!");

    showGamePrompt(
        `📉 BÁN CỔ PHIẾU [${stockId}]\nGiá hiện tại: ${stock.currentPrice} $\nGiá vốn của bạn: ${holding.avgCost} $\nSố lượng đang có: ${holding.quantity.toLocaleString()} cổ\n\nNhập số lượng muốn bán:`,
        holding.quantity,
        function(amountStr) {
            const amount = parseInt(amountStr.replace(/[^0-9]/g, ''));
            if (isNaN(amount) || amount <= 0) return alert("❌ Số lượng không hợp lệ!");
            if (amount > holding.quantity) return alert("❌ Bạn không có đủ số lượng cổ phiếu này!");

            const totalRevenue = amount * stock.currentPrice;
            modifyStat('money', totalRevenue);

            // Trừ số lượng, nếu hết thì xóa khỏi danh mục
            gameState.portfolio[stockId].quantity -= amount;
            if (gameState.portfolio[stockId].quantity === 0) {
                delete gameState.portfolio[stockId];
            }

            const pnl = totalRevenue - (amount * holding.avgCost);
            const pnlText = pnl >= 0 ? `Lãi +${Math.round(pnl)}$` : `Lỗ ${Math.round(pnl)}$`;

            if (typeof addTransactionHistory === 'function') addTransactionHistory(`Bán ${amount} cp ${stockId}`, totalRevenue);
            showToast(`✅ Đã bán ${amount} cp ${stockId} thu về ${totalRevenue.toLocaleString()}$. (${pnlText})`, "💰");
            
            saveGameState();
            renderGameState();
            renderStockModal('portfolio');
        },
        "Đặt Lệnh Bán",
        "📤",
        "Danh Mục"
    );
}

/**
 * =================================================================
 * ZONE 3: UI RENDERER (HIỂN THỊ MODAL CHỨNG KHOÁN)
 * =================================================================
 */

let currentStockTab = 'market'; // 'market' hoặc 'portfolio'

function renderStockModal(tab = currentStockTab) {
    currentStockTab = tab;
    initStockMarket();

    const mktBtn = document.getElementById("stock-tab-market");
    const portBtn = document.getElementById("stock-tab-portfolio");
    const listContainer = document.getElementById("stock-modal-list");
    if (!listContainer) return;

    if (tab === 'market') {
        mktBtn.className = "flex-1 py-1 rounded-lg bg-white/80 text-amber-950 shadow-sm font-extrabold transition-all";
        portBtn.className = "flex-1 py-1 rounded-lg text-amber-800/70 hover:text-amber-900 font-extrabold transition-all";
        renderMarketTab(listContainer);
    } else {
        portBtn.className = "flex-1 py-1 rounded-lg bg-white/80 text-amber-950 shadow-sm font-extrabold transition-all";
        mktBtn.className = "flex-1 py-1 rounded-lg text-amber-800/70 hover:text-amber-900 font-extrabold transition-all";
        renderPortfolioTab(listContainer);
    }
}

function renderMarketTab(container) {
    container.innerHTML = "";
    
    // Header hiển thị chu kỳ kinh tế
    let sentimentText = "Đang đi ngang ⚖️";
    let sentimentColor = "text-amber-700";
    if (gameState.marketSentiment === 'bull') { sentimentText = "Bùng nổ (Uptrend) 🚀"; sentimentColor = "text-emerald-600"; }
    if (gameState.marketSentiment === 'bear') { sentimentText = "Suy thoái (Downtrend) 📉"; sentimentColor = "text-rose-600"; }

    container.innerHTML += `
        <div class="flex justify-between items-center text-[10px] font-extrabold bg-amber-900/5 p-2 rounded-xl border border-amber-900/10 mb-2">
            <span class="text-amber-900">Tâm lý thị trường:</span>
            <span class="${sentimentColor} font-black">${sentimentText}</span>
        </div>
    `;

    STOCK_MARKET_DB.forEach(dbInfo => {
        const liveData = gameState.stocks.find(s => s.id === dbInfo.id);
        if (!liveData) return;

        // Vẽ biểu đồ thu nhỏ (Sparkline) bằng Flexbox
        const maxPrice = Math.max(...liveData.history);
        const minPrice = Math.min(...liveData.history);
        const range = maxPrice - minPrice || 1; // Tránh chia 0
        
        let sparklineHTML = liveData.history.map((price, idx) => {
            const heightPercent = Math.max(10, ((price - minPrice) / range) * 100);
            const isLast = idx === liveData.history.length - 1;
            const barColor = isLast ? "bg-amber-600" : "bg-amber-400/50";
            return `<div class="w-1.5 rounded-t-sm ${barColor} mx-[1px]" style="height: ${heightPercent}%;"></div>`;
        }).join('');

        const isUp = liveData.history.length > 1 && liveData.currentPrice >= liveData.history[liveData.history.length - 2];
        const priceColor = isUp ? "text-emerald-700" : "text-rose-600";

        const card = document.createElement("div");
        card.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40 mb-2 shrink-0";
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex flex-col">
                    <span class="text-xs font-black text-amber-950">${dbInfo.id} - <span class="font-bold text-amber-900">${dbInfo.name}</span></span>
                    <span class="text-[9px] text-amber-800/80 mt-0.5">${dbInfo.desc}</span>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-sm font-mono font-black ${priceColor}">${liveData.currentPrice.toLocaleString()}$</span>
                    <span class="text-[9px] font-extrabold text-amber-900 mt-0.5">Cổ tức: ${dbInfo.dividend * 100}%/năm</span>
                </div>
            </div>
            <div class="flex items-end justify-between border-t border-amber-900/10 pt-2 mt-1">
                <div class="flex items-end h-6 w-20 border-b border-amber-900/20">${sparklineHTML}</div>
                <button onclick="handleBuyStock('${dbInfo.id}')" class="py-1.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm active:scale-95">
                    MUA VÀO
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderPortfolioTab(container) {
    container.innerHTML = "";
    const holdings = Object.keys(gameState.portfolio || {});
    
    if (holdings.length === 0) {
        container.innerHTML = `<p class="text-xs text-center font-bold text-amber-800/60 py-6">Danh mục trống. Hãy sang tab Thị Trường để mua cổ phiếu!</p>`;
        return;
    }

    let totalAssetValue = 0;
    let totalInvestment = 0;

    holdings.forEach(id => {
        const holding = gameState.portfolio[id];
        const liveData = gameState.stocks.find(s => s.id === id);
        if (!liveData) return;

        const currentValue = holding.quantity * liveData.currentPrice;
        const investedValue = holding.quantity * holding.avgCost;
        const pnlPercent = ((liveData.currentPrice - holding.avgCost) / holding.avgCost) * 100;
        
        totalAssetValue += currentValue;
        totalInvestment += investedValue;

        const isProfit = pnlPercent >= 0;
        const pnlColor = isProfit ? "text-emerald-700" : "text-rose-600";
        const pnlBg = isProfit ? "bg-emerald-100" : "bg-rose-100";

        const card = document.createElement("div");
        card.className = "glass-card-inner-light p-3 rounded-2xl flex flex-col gap-2 border border-amber-300/40 mb-2 shrink-0";
        card.innerHTML = `
            <div class="flex justify-between items-center border-b border-amber-900/10 pb-1.5">
                <span class="text-xs font-black text-amber-950">${id} <span class="text-[10px] font-bold text-amber-800/80">(${holding.quantity.toLocaleString()} cổ)</span></span>
                <span class="text-[10px] font-black ${pnlColor} ${pnlBg} px-2 py-0.5 rounded-md">
                    ${isProfit ? '+' : ''}${pnlPercent.toFixed(2)}%
                </span>
            </div>
            <div class="flex justify-between items-center text-[10px] font-bold text-amber-900 mt-1">
                <div class="flex flex-col">
                    <span>Giá vốn: <span class="font-mono text-amber-950">${holding.avgCost}$</span></span>
                    <span>Giá TT: <span class="font-mono text-amber-950">${liveData.currentPrice}$</span></span>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-amber-800/80">Tổng tài sản:</span>
                    <span class="font-mono font-black text-amber-950 text-xs">${currentValue.toLocaleString()}$</span>
                </div>
            </div>
            <button onclick="handleSellStock('${id}')" class="w-full mt-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-display font-extrabold rounded-xl text-[10px] shadow-sm active:scale-95 border border-rose-300">
                CHỐT BÁN
            </button>
        `;
        container.appendChild(card);
    });

    // Tổng quan danh mục
    const totalPnl = totalAssetValue - totalInvestment;
    const totalPnlColor = totalPnl >= 0 ? "text-emerald-700" : "text-rose-600";
    
    const summaryHeader = document.createElement("div");
    summaryHeader.className = "glass-card-inner-light p-3 rounded-2xl flex justify-between items-center border border-amber-400 mb-3 shadow-sm bg-white/60";
    summaryHeader.innerHTML = `
        <div class="flex flex-col">
            <span class="text-[9px] font-extrabold text-amber-900 uppercase">TỔNG TÀI SẢN CHỨNG KHOÁN</span>
            <span class="text-sm font-mono font-black text-amber-950">${totalAssetValue.toLocaleString()} $</span>
        </div>
        <div class="flex flex-col items-end">
            <span class="text-[9px] font-extrabold text-amber-900 uppercase">LÃI / LỖ TỔNG</span>
            <span class="text-xs font-mono font-black ${totalPnlColor}">${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()} $</span>
        </div>
    `;
    container.insertBefore(summaryHeader, container.firstChild);
}

function showStockModal(show) {
    closeAllModals(); // Đóng tất cả modal khác trước
    const modal = document.getElementById("stock-market-modal");
    if (modal) {
        if (show) {
            renderStockModal(currentStockTab);
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
}
