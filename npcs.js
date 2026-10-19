// BỘ TỪ ĐIỂN CHIÊM TINH HỌC CHO NPC
const ZODIAC_DATA = {
    aries: { name: "Bạch Dương", element: "fire", nlp_bias: "aggressive", icon: "♈" },
    taurus: { name: "Kim Ngưu", element: "earth", nlp_bias: "polite", icon: "♉" },
    gemini: { name: "Song Tử", element: "air", nlp_bias: "smart", icon: "♊" },
    cancer: { name: "Cự Giải", element: "water", nlp_bias: "polite", icon: "♋" },
    leo: { name: "Sư Tử", element: "fire", nlp_bias: "aggressive", icon: "♌" },
    virgo: { name: "Xử Nữ", element: "earth", nlp_bias: "smart", icon: "♍" },
    libra: { name: "Thiên Bình", element: "air", nlp_bias: "polite", icon: "♎" },
    scorpio: { name: "Bọ Cạp", element: "water", nlp_bias: "smart", icon: "♏" },
    sagittarius: { name: "Nhân Mã", element: "fire", nlp_bias: "funny", icon: "♐" },
    capricorn: { name: "Ma Kết", element: "earth", nlp_bias: "smart", icon: "♑" },
    aquarius: { name: "Bảo Bình", element: "air", nlp_bias: "funny", icon: "♒" },
    pisces: { name: "Song Ngư", element: "water", nlp_bias: "polite", icon: "♓" }
};

/**
 * Sinh một NPC ngẫu nhiên hoàn chỉnh và lưu vào gameState.relationships
 */
function generateRandomNPC(relationType = "Người Quen", category = "street") {
    const namesMale = ["Minh", "Hoàng", "Tuấn", "Khang", "Đức", "Huy", "Phong", "Nam", "Bảo", "Sơn"];
    const namesFemale = ["Linh", "Trang", "Hương", "Mai", "Vy", "Thảo", "Nhi", "Hà", "An", "Yến"];
    
    const isMale = Math.random() < 0.5;
    const firstName = isMale ? namesMale[Math.floor(Math.random() * namesMale.length)] : namesFemale[Math.floor(Math.random() * namesFemale.length)];
    const icon = isMale ? "👦" : "👧";

    const zodiacKeys = typeof ZODIAC_DATA !== 'undefined' ? Object.keys(ZODIAC_DATA) : ['aries', 'taurus', 'gemini'];
    const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
    const zodiacInfo = ZODIAC_DATA ? ZODIAC_DATA[randomZodiac] : { nlp_bias: "polite" };

    const newNPC = {
        id: "npc_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: firstName,
        relation: relationType,
        icon: icon,
        category: category,
        level: 0,
        xp: 10,
        _zodiac: randomZodiac,
        personality: zodiacInfo.nlp_bias || "polite",
        intrinsic_stats: {
            happiness: Math.floor(Math.random() * 40) + 50,
            wealth: Math.floor(Math.random() * 200) + 50,
            generosity: Math.floor(Math.random() * 60) + 20
        }
    };

    if (typeof gameState !== 'undefined' && gameState && gameState.relationships) {
        gameState.relationships.push(newNPC);
    }

    return newNPC;
}
