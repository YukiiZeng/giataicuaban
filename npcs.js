// BỘ TỪ ĐIỂN CHIÊM TINH HỌC & TÂM LÝ HỌC CHO NPC
const ZODIAC_DATA = {
    aries: { name: "Bạch Dương", element: "fire", nlp_bias: "aggressive", icon: "♈", trait: "short_tempered" },
    taurus: { name: "Kim Ngưu", element: "earth", nlp_bias: "polite", icon: "♉", trait: "stubborn" },
    gemini: { name: "Song Tử", element: "air", nlp_bias: "smart", icon: "♊", trait: "chatty" },
    cancer: { name: "Cự Giải", element: "water", nlp_bias: "polite", icon: "♋", trait: "sensitive" },
    leo: { name: "Sư Tử", element: "fire", nlp_bias: "aggressive", icon: "♌", trait: "proud" },
    virgo: { name: "Xử Nữ", element: "earth", nlp_bias: "smart", icon: "♍", trait: "perfectionist" },
    libra: { name: "Thiên Bình", element: "air", nlp_bias: "polite", icon: "♎", trait: "balanced" },
    scorpio: { name: "Bọ Cạp", element: "water", nlp_bias: "smart", icon: "♏", trait: "suspicious" },
    sagittarius: { name: "Nhân Mã", element: "fire", nlp_bias: "funny", icon: "♐", trait: "humorous" },
    capricorn: { name: "Ma Kết", element: "earth", nlp_bias: "smart", icon: "♑", trait: "practical" },
    aquarius: { name: "Bảo Bình", element: "air", nlp_bias: "funny", icon: "♒", trait: "eccentric" },
    pisces: { name: "Song Ngư", element: "water", nlp_bias: "polite", icon: "♓", trait: "dreamy" }
};

/**
 * Sinh một NPC ngẫu nhiên chuẩn dải avatar:
 * - Nam: male-1.png đến male-5.png
 * - Nữ: fem-1.png đến fem-5.png
 */
function generateRandomNPC(relationType = "Người Quen", category = "street", addToRelationships = true, customName = null, customGender = null) {
    const namesMale = ["Minh", "Hoàng", "Tuấn", "Khang", "Đức", "Huy", "Phong", "Nam", "Bảo", "Sơn"];
    const namesFemale = ["Linh", "Trang", "Hương", "Mai", "Vy", "Thảo", "Nhi", "Hà", "An", "Yến"];
    
    const isMale = customGender !== null ? (customGender === 'Nam' || customGender === true) : (Math.random() < 0.5);
    const firstName = customName ? customName : (isMale ? namesMale[Math.floor(Math.random() * namesMale.length)] : namesFemale[Math.floor(Math.random() * namesFemale.length)]);
    const icon = isMale ? "👦" : "👧";

    // 🌟 Gán avatar chuẩn từ male-1..5 hoặc fem-1..5
    const randomIdx = Math.floor(Math.random() * 5) + 1; // Từ 1 đến 5
    const avatarUrl = isMale ? `assets/avatars/male-${randomIdx}.png` : `assets/avatars/fem-${randomIdx}.png`;

    const zodiacKeys = Object.keys(ZODIAC_DATA);
    const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
    const zodiacInfo = ZODIAC_DATA[randomZodiac];

    const newNPC = {
        id: "npc_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        name: firstName,
        relation: relationType,
        icon: icon,
        avatarUrl: avatarUrl,
        category: category,
        level: 0,
        xp: 10,
        inactiveMonths: 0,
        _zodiac: randomZodiac,
        personality: zodiacInfo.nlp_bias || "polite",
        trait: zodiacInfo.trait || "normal",
        patience: 100,
        has_offended: false,
        intrinsic_stats: {
            happiness: Math.floor(Math.random() * 40) + 50,
            wealth: Math.floor(Math.random() * 200) + 50,
            generosity: Math.floor(Math.random() * 60) + 20
        }
    };

    if (addToRelationships && typeof gameState !== 'undefined' && gameState && gameState.relationships) {
        gameState.relationships.push(newNPC);
    }

    return newNPC;
}
