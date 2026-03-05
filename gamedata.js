// ============ gamedata.js ============
// 所有游戏数据配置表，修改此文件来新增/修改游戏内容
// 修改后需重新同步到 www/ 并构建APK

// ============ LANGUAGE STRINGS ============
const LANG = {
    en: {
        title: "ALCHEMIST'S PATH",
        sub: ['Explore','Gather','Brew','Conquer'],
        enterLab: 'ENTER LAB',
        controls: 'WASD Move • Click Attack • Brew potions to grow stronger',
        controlsMobile: 'Tap to interact • Left stick to move • Right to attack',
        tabExtract: 'Extract', tabBrew: 'Brew', tabPotions: 'Potions', tabExpedition: 'Expedition',
        selectHerb: 'Select a herb to extract essences',
        noHerbs: 'No herbs. Go on an expedition!',
        extract: 'EXTRACT',
        yourEssences: '— Your Essences —',
        noneYet: 'None yet',
        select2: 'Select 2 essences to brew a potion',
        selectMore: 'Select one more essence...',
        noRecipe: 'No known recipe for this combination',
        brew: 'BREW',
        discoveredRecipes: '— Discovered Recipes —',
        brewToDiscover: 'Brew to discover!',
        yourPotions: 'Your potions — use before expedition',
        noPotions: 'No potions brewed yet.',
        chooseBiome: 'Choose a biome to explore',
        activeBuffs: 'Active buffs: ',
        explore: 'EXPLORE',
        herbs: 'Herbs:',
        exit: 'EXIT',
        expFailed: 'EXPEDITION FAILED',
        backToLab: 'BACK TO LAB',
        score: 'Score',
        expComplete: 'Expedition complete! Check your herbs.',
        youFell: 'You fell... but your herbs are safe.',
        newRecipe: 'New recipe discovered: ',
        brewed: 'Brewed: ',
        revived: 'REVIVED!',
        atk: 'ATK', def: 'DEF', hp: 'HP',
        biomeForest: 'Forest', biomeCave: 'Cave', biomeSwamp: 'Swamp',
        tier: 'Tier',
        step1Chop: 'Step 1: CHOP', step1Desc: 'Click rapidly to chop the herb!',
        step2Grind: 'Step 2: GRIND', step2Desc: 'Click left and right to grind!',
        step3Distill: 'Step 3: DISTILL', step3Desc: 'Keep temperature in the green zone!',
        chopProgress: 'Chop', grindProgress: 'Grind', tempLabel: 'Temp', holdTime: 'Hold',
        bonusEssence: 'BONUS essence!', extractComplete: 'Extraction complete!',
        extracting: 'Extracting...',
        equip: 'EQUIP', carriedSlots: 'Expedition Belt',
        slotEmpty: 'Empty', beltFull: 'Belt is full! (max 3)',
        quality: 'Quality', perfect: 'Perfect!', good: 'Good', poor: 'Poor',
        weapon: 'Weapon', weaponFound: 'Weapon Found!', weaponReplace: 'REPLACE', weaponKeep: 'KEEP',
        enchant: 'ENCHANT', enchantWeapon: 'Enchant Weapon', selectPotion: 'Select potion to enchant',
        enchanted: 'Enchanted!', noWeapon: 'No weapon equipped',
        merchant: 'Merchant', buy: 'BUY', sell: 'SELL', gold: 'Gold',
        notEnoughGold: 'Not enough gold!', soldItem: 'Sold!', boughtItem: 'Bought!',
        floor: 'Floor', nextFloor: 'Next Floor', bossDefeated: 'BOSS DEFEATED!',
        eliteSlain: 'ELITE SLAIN!', bossAppears: 'BOSS APPEARS!',
        exitLocked: 'Defeat the boss to unlock exit',
        tabWeapons: 'Weapons', tabShop: 'Shop',
        enchantNone: 'No enchantment',
        dmg: 'DMG', spd: 'Speed', rng: 'Range',
        tabResearch: 'Research', researchDesc: 'Spend gold to permanently upgrade',
        resHP: 'Max HP +1', resDEF: 'Base DEF +1', resATK: 'Base ATK +1', resSpeed: 'Move Speed +',
        resLuck: 'Luck +', resCarry: 'Belt +1 Slot',
        lvl: 'Lv', maxLvl: 'MAX',
        key: 'Key', keys: 'Keys', needKey: 'Need a key',
        newRelic: 'New Relic Found!',
        relicCase: 'Relic Case', relicsFound: 'Relics Found',
        minimap: 'Map',
        saved: 'Saved!', loaded: 'Loaded!', saveBtn: 'Save', loadSave: 'Load Save',
        tabSkills: 'Skills', skillTree: 'Skill Tree', skillDesc: 'Unlock permanent abilities',
        skillUnlocked: 'Unlocked', skillReq: 'Requires',
        skCombat: 'Combat', skPowerStrike: 'Power Strike', skPowerStrikeD: 'Crit chance +10%',
        skLifeSteal: 'Life Steal', skLifeStealD: 'Heal 1 HP per 5 kills',
        skBerserker: 'Berserker', skBerserkerD: 'ATK +20% when HP<30%',
        skExecute: 'Execute', skExecuteD: '+50% DMG to enemies <25% HP',
        skAlchemy: 'Alchemy', skDoubleYield: 'Double Yield', skDoubleYieldD: '20% chance double essence',
        skPotionMaster: 'Potion Master', skPotionMasterD: 'Potions +50% effect',
        skTransmute: 'Transmute', skTransmuteD: 'Convert 3 essences to any 1',
        skPhiloStone: 'Philosopher', skPhiloStoneD: 'Brew costs no essences 15%',
        skSurvival: 'Survival', skThickSkin: 'Thick Skin', skThickSkinD: 'Take -1 DMG (min 1)',
        skScavenger: 'Scavenger', skScavengerD: '+30% gold from enemies',
        skDodge: 'Dodge', skDodgeD: '12% chance to dodge attacks',
        skSecondWind: 'Second Wind', skSecondWindD: 'Heal 30% HP once per floor',
        settingsTitle: 'SETTINGS', bgmVol: 'Music', sfxVol: 'Sound FX',
        qualityLow: 'Low', qualityMed: 'Medium', qualityHigh: 'High', qualityLabel: 'Quality',
        langLabel: 'Language', settingsClose: 'CLOSE',
    },
    zh: {
        title: '炼金之路',
        sub: ['探险','采集','炼制','征服'],
        enterLab: '进入炼金室',
        controls: 'WASD移动 • 点击攻击 • 炼制药剂变强',
        controlsMobile: '点击交互 • 左摇杆移动 • 右侧攻击',
        tabExtract: '提取', tabBrew: '酿造', tabPotions: '药剂', tabExpedition: '探险',
        selectHerb: '选择药材提取精华', noHerbs: '没有药材，去探险吧！', extract: '提取',
        yourEssences: '— 你的精华 —', noneYet: '暂无',
        select2: '选择2种精华酿造药剂', selectMore: '再选一种精华...',
        noRecipe: '没有已知配方', brew: '酿造',
        discoveredRecipes: '— 已发现配方 —', brewToDiscover: '酿造来发现配方！',
        yourPotions: '你的药剂 — 探险前使用', noPotions: '还没有药剂',
        chooseBiome: '选择探险区域', activeBuffs: '当前增益：', explore: '出发',
        herbs: '药材：', exit: '出口', expFailed: '探险失败', backToLab: '返回炼金室',
        score: '分数', expComplete: '探险完成！查看你的药材。',
        youFell: '你倒下了...但药材还在。',
        newRecipe: '发现新配方：', brewed: '酿造了：',
        revived: '复活！',
        atk: '攻击', def: '防御', hp: '生命',
        biomeForest: '森林', biomeCave: '洞穴', biomeSwamp: '沼泽',
        tier: '阶',
        step1Chop: '第一步：切碎', step1Desc: '快速点击切碎药材！',
        step2Grind: '第二步：研磨', step2Desc: '左右交替点击研磨！',
        step3Distill: '第三步：蒸馏', step3Desc: '保持温度在绿色区间内！',
        chopProgress: '切碎', grindProgress: '研磨', tempLabel: '温度', holdTime: '保持',
        bonusEssence: '额外精华！', extractComplete: '提取完成！',
        extracting: '撤离中…',
        equip: '装备', carriedSlots: '探险腰带', slotEmpty: '空',
        beltFull: '腰带已满！（最多3瓶）',
        quality: '品质', perfect: '完美！', good: '良好', poor: '较差',
        weapon: '武器', weaponFound: '发现武器！', weaponReplace: '替换', weaponKeep: '保留',
        enchant: '附魔', enchantWeapon: '武器附魔', selectPotion: '选择药剂附魔',
        enchanted: '附魔成功！', noWeapon: '未装备武器',
        merchant: '商人', buy: '购买', sell: '出售', gold: '金币',
        notEnoughGold: '金币不足！', soldItem: '已出售！', boughtItem: '已购买！',
        floor: '层', nextFloor: '下一层', bossDefeated: 'BOSS已击败！',
        eliteSlain: '精英已击杀！', bossAppears: 'BOSS出现！',
        exitLocked: '击败Boss后开启撤离点',
        tabWeapons: '武器', tabShop: '商店',
        enchantNone: '无附魔',
        dmg: '伤害', spd: '速度', rng: '范围',
        tabResearch: '研究', researchDesc: '花费金币永久升级属性',
        resHP: '生命上限+1', resDEF: '基础防御+1', resATK: '基础攻击+1', resSpeed: '移速+',
        resLuck: '幸运+', resCarry: '腰带+1格',
        lvl: '级', maxLvl: '满级',
        key: '钥匙', keys: '钥匙', needKey: '需要钥匙(打开宝箱)',
        newRelic: '发现新遗物！',
        relicCase: '遗物柜', relicsFound: '已发现遗物',
        minimap: '地图',
        saved: '已保存！', loaded: '已加载！', saveBtn: '保存', loadSave: '读取存档',
        tabSkills: '技能', skillTree: '技能树', skillDesc: '解锁永久能力',
        skillUnlocked: '已解锁', skillReq: '需要',
        skCombat: '战斗', skPowerStrike: '暴击强化', skPowerStrikeD: '暴击率+10%',
        skLifeSteal: '生命汲取', skLifeStealD: '每5次击杀回复1HP',
        skBerserker: '狂战', skBerserkerD: 'HP<30%时攻击+20%',
        skExecute: '处决', skExecuteD: '对<25%HP敌人+50%伤害',
        skAlchemy: '炼金', skDoubleYield: '双倍产出', skDoubleYieldD: '20%几率双倍精华',
        skPotionMaster: '药剂大师', skPotionMasterD: '药剂效果+50%',
        skTransmute: '转化', skTransmuteD: '3精华转化为任意1种',
        skPhiloStone: '贤者', skPhiloStoneD: '15%几率酿造不消耗精华',
        skSurvival: '生存', skThickSkin: '厚皮', skThickSkinD: '受到伤害-1(最低1)',
        skScavenger: '拾荒', skScavengerD: '敌人掉落金币+30%',
        skDodge: '闪避', skDodgeD: '12%几率闪避攻击',
        skSecondWind: '回春', skSecondWindD: '每层回复30%HP一次',
        settingsTitle: '设 置', bgmVol: '音乐', sfxVol: '音效',
        qualityLow: '低', qualityMed: '中', qualityHigh: '高', qualityLabel: '画质',
        langLabel: '语言', settingsClose: '关闭',
    }
};

// ============ HERB / ESSENCE / RECIPE NAMES ============
const HERB_NAMES_ZH = {
    greenLeaf:'绿叶草', redBerry:'红浆果', yellowRoot:'黄根',
    caveCrystal:'洞穴水晶', blueMush:'蓝蘑菇', firestone:'火石',
    swampGoo:'沼泽粘液', purpleMoss:'紫苔藓'
};
const ESSENCE_NAMES_ZH = {
    vita:'生命', herba:'草木', ignis:'火焰', terra:'大地',
    aqua:'水灵', lux:'光明', toxin:'毒素'
};
const RECIPE_NAMES_ZH = {
    'Healing Brew':'治愈药剂','Strength Elixir':'力量药水','Vitality Tonic':'活力补剂',
    'Iron Skin':'铁皮药膏','Berserker Draft':'狂战药剂','Swift Potion':'迅捷药水',
    'Regen Potion':'回春药水','Venom Blade':'毒刃药剂','Shadow Elixir':'暗影药水',
    'Stone Shield':'石盾药剂','Greater Heal':'强效治愈','Phoenix Draught':'凤凰药剂',
    'Supreme Vitality':'极致活力','Titan Strength':'泰坦之力','Diamond Shield':'钻石护盾',
    'Master Healing':'大师治愈','Deadly Venom':'致命毒液','Rapid Regen':'迅捷回春',
    'Elemental Fury':'元素狂怒','Divine Blessing':'神圣祝福',
    'Fortress Wall':'堡垒之墙','Phoenix Rebirth':'凤凰重生'
};
const RECIPE_DESC_ZH = {
    '+3 HP':'生命+3','+2 ATK':'攻击+2','+2 Max HP':'生命上限+2','+2 DEF':'防御+2',
    '+4 ATK':'攻击+4','+Speed':'速度提升','HP Regen':'生命回复','Poison ATK':'毒素攻击',
    'Stealth':'隐身','+4 DEF':'防御+4','+5 HP':'生命+5','Auto-Revive':'自动复活',
    '+5 Max HP':'最大生命+5','+6 ATK':'攻击+6','+6 DEF':'防御+6','+8 HP':'生命+8',
    'Poison DMG':'毒素伤害','Fast Regen':'快速回春','+10 ATK':'攻击+10',
    '+15 HP':'生命+15','+10 DEF':'防御+10','Revive+Heal':'复活+治愈'
};

// ============ WEAPON NAME TRANSLATIONS ============
const WEAPON_NAMES_ZH = {
    // 白色 (Common)
    'Rusty Dagger':'生锈匕首', 'Wooden Club':'木棍', 'Old Sword':'旧剑', 'Worn Axe':'破旧斧',
    'Hunting Knife':'猎刀', 'Plain Club':'普通棍棒', 'Broken Spear':'断矛', 'Stone Hammer':'石锤',
    // 绿色 (Uncommon)
    'Iron Sword':'铁剑', 'Steel Blade':'钢刃', 'Bronze Spear':'青铜矛', 'Shadow Knife':'暗影短刀',
    'Short Mace':'短锤', 'Elven Blade':'精灵刃', 'Hand Axe':'手斧', 'War Hammer':'战锤',
    // 蓝色 (Rare)
    'War Axe':'战斧', 'Crystal Staff':'水晶法杖', 'Venom Fang':'毒牙刃', 'Broad Axe':'阔斧',
    'Battle Axe':'战斧', 'Flail':'连枷', 'Glaive':'战戟', 'Halberd':'长戟',
    // 紫色 (Epic)
    'Flame Sword':'烈焰剑', 'Frost Mace':'霜冻锤', 'Thunder Spear':'雷霆枪', 'Katana':'武士刀',
    'Great Sword':'巨剑', 'Executioner Axe':'斩首斧', 'Bardiche':'大刀', 'Double Sword':'双刃剑',
    // 金色 (Legendary)
    'Dragon Claw':'龙爪', 'Arcane Blade':'奥术之刃', 'Holy Scourge':'神圣鞭', 'Demon Whip':'恶魔鞭',
    'Lajatang':'两端刃', 'Blessed Blade':'祝福之刃',
    // 红色 (Mythic)
    'Scythe of Curses':'诅咒之镰', 'Sword of Cerebov':'赛瑞伯夫之剑', 'Wrath of Trog':'特罗格之怒',
    'Staff of Dispater':'迪斯佩特之杖', 'Triple Sword':'三重剑',
};

// Rarity system: 0=white, 1=green, 2=blue, 3=purple, 4=gold, 5=red
const RARITY_COLORS = ['#cccccc','#44ee44','#4488ff','#cc44ff','#ffcc00','#ff2222'];
const RARITY_NAMES  = ['Common','Uncommon','Rare','Epic','Legendary','Mythic'];
const RARITY_NAMES_ZH = ['普通','优秀','稀有','史诗','传说','神话'];

// ============ WEAPONS ============
const WEAPONS = [
    // === TIER 0 — White (Common) ===
    { name:'Rusty Dagger',      rarity:0, tier:0, dmg:1,  speed:1.2, range:42, color:RARITY_COLORS[0], type:'dagger', sprite:'dagger.png' },
    { name:'Wooden Club',       rarity:0, tier:0, dmg:1,  speed:0.8, range:38, color:RARITY_COLORS[0], type:'mace',   sprite:'club.png' },
    { name:'Old Sword',         rarity:0, tier:0, dmg:1,  speed:1.0, range:44, color:RARITY_COLORS[0], type:'sword',  sprite:'short_sword1.png' },
    { name:'Worn Axe',          rarity:0, tier:0, dmg:2,  speed:0.7, range:40, color:RARITY_COLORS[0], type:'axe',    sprite:'hand_axe1.png' },
    { name:'Hunting Knife',     rarity:0, tier:0, dmg:1,  speed:1.3, range:38, color:RARITY_COLORS[0], type:'dagger', sprite:'knife.png' },
    { name:'Plain Club',        rarity:0, tier:0, dmg:2,  speed:0.7, range:36, color:RARITY_COLORS[0], type:'mace',   sprite:'giant_club.png' },
    { name:'Broken Spear',      rarity:0, tier:0, dmg:1,  speed:1.1, range:50, color:RARITY_COLORS[0], type:'spear',  sprite:'spear2.png' },
    { name:'Stone Hammer',      rarity:0, tier:0, dmg:3,  speed:0.6, range:36, color:RARITY_COLORS[0], type:'mace',   sprite:'hammer1.png' },

    // === TIER 1 — Green (Uncommon) ===
    { name:'Iron Sword',        rarity:1, tier:1, dmg:2,  speed:1.0, range:50, color:RARITY_COLORS[1], type:'sword',  sprite:'long_sword1.png' },
    { name:'Steel Blade',       rarity:1, tier:1, dmg:3,  speed:0.9, range:52, color:RARITY_COLORS[1], type:'sword',  sprite:'falchion1.png' },
    { name:'Bronze Spear',      rarity:1, tier:1, dmg:2,  speed:0.9, range:58, color:RARITY_COLORS[1], type:'spear',  sprite:'spear1_elven.png' },
    { name:'Shadow Knife',      rarity:1, tier:1, dmg:2,  speed:1.4, range:40, color:RARITY_COLORS[1], type:'dagger', sprite:'elven_dagger.png' },
    { name:'Short Mace',        rarity:1, tier:1, dmg:3,  speed:0.8, range:44, color:RARITY_COLORS[1], type:'mace',   sprite:'mace1.png' },
    { name:'Elven Blade',       rarity:1, tier:1, dmg:3,  speed:1.1, range:48, color:RARITY_COLORS[1], type:'sword',  sprite:'elven_short_sword.png' },
    { name:'Hand Axe',          rarity:1, tier:1, dmg:3,  speed:0.9, range:44, color:RARITY_COLORS[1], type:'axe',    sprite:'hand_axe2.png' },
    { name:'War Hammer',        rarity:1, tier:1, dmg:4,  speed:0.7, range:46, color:RARITY_COLORS[1], type:'mace',   sprite:'hammer2.png' },

    // === TIER 2 — Blue (Rare) ===
    { name:'War Axe',           rarity:2, tier:2, dmg:5,  speed:0.7, range:48, color:RARITY_COLORS[2], type:'axe',    sprite:'war_axe1.png' },
    { name:'Crystal Staff',     rarity:2, tier:2, dmg:4,  speed:1.0, range:62, color:RARITY_COLORS[2], type:'staff',  sprite:'quarterstaff.png' },
    { name:'Venom Fang',        rarity:2, tier:2, dmg:4,  speed:1.1, range:44, color:RARITY_COLORS[2], type:'dagger', sprite:'ankus.png' },
    { name:'Broad Axe',         rarity:2, tier:2, dmg:5,  speed:0.7, range:50, color:RARITY_COLORS[2], type:'axe',    sprite:'broad_axe1.png' },
    { name:'Battle Axe',        rarity:2, tier:2, dmg:6,  speed:0.6, range:52, color:RARITY_COLORS[2], type:'axe',    sprite:'battle_axe1.png' },
    { name:'Flail',             rarity:2, tier:2, dmg:5,  speed:0.8, range:50, color:RARITY_COLORS[2], type:'mace',   sprite:'flail1.png' },
    { name:'Glaive',            rarity:2, tier:2, dmg:5,  speed:0.8, range:60, color:RARITY_COLORS[2], type:'spear',  sprite:'glaive1.png' },
    { name:'Halberd',           rarity:2, tier:2, dmg:6,  speed:0.7, range:64, color:RARITY_COLORS[2], type:'spear',  sprite:'halberd1.png' },

    // === TIER 3 — Purple (Epic) ===
    { name:'Flame Sword',       rarity:3, tier:3, dmg:7,  speed:0.8, range:55, color:RARITY_COLORS[3], type:'sword',  sprite:'demon_blade.png' },
    { name:'Frost Mace',        rarity:3, tier:3, dmg:6,  speed:0.7, range:50, color:RARITY_COLORS[3], type:'mace',   sprite:'great_flail1.png' },
    { name:'Thunder Spear',     rarity:3, tier:3, dmg:8,  speed:0.6, range:68, color:RARITY_COLORS[3], type:'spear',  sprite:'demon_trident.png' },
    { name:'Katana',            rarity:3, tier:3, dmg:7,  speed:1.0, range:56, color:RARITY_COLORS[3], type:'sword',  sprite:'katana1.png' },
    { name:'Great Sword',       rarity:3, tier:3, dmg:9,  speed:0.6, range:58, color:RARITY_COLORS[3], type:'sword',  sprite:'greatsword1.png' },
    { name:'Executioner Axe',   rarity:3, tier:3, dmg:10, speed:0.5, range:56, color:RARITY_COLORS[3], type:'axe',    sprite:'executioner_axe1.png' },
    { name:'Bardiche',          rarity:3, tier:3, dmg:8,  speed:0.6, range:66, color:RARITY_COLORS[3], type:'spear',  sprite:'bardiche1.png' },
    { name:'Double Sword',      rarity:3, tier:3, dmg:8,  speed:0.9, range:52, color:RARITY_COLORS[3], type:'sword',  sprite:'double_sword.png' },

    // === TIER 4 — Gold (Legendary) ===
    { name:'Dragon Claw',       rarity:4, tier:4, dmg:10, speed:0.9, range:58, color:RARITY_COLORS[4], type:'claw',   sprite:'triple_sword.png' },
    { name:'Arcane Blade',      rarity:4, tier:4, dmg:12, speed:0.8, range:62, color:RARITY_COLORS[4], type:'sword',  sprite:'blessed_blade.png' },
    { name:'Holy Scourge',      rarity:4, tier:4, dmg:11, speed:0.8, range:60, color:RARITY_COLORS[4], type:'mace',   sprite:'holy_scourge.png' },
    { name:'Demon Whip',        rarity:4, tier:4, dmg:10, speed:1.1, range:64, color:RARITY_COLORS[4], type:'mace',   sprite:'demon_whip.png' },
    { name:'Lajatang',          rarity:4, tier:4, dmg:11, speed:0.9, range:62, color:RARITY_COLORS[4], type:'spear',  sprite:'lajatang1.png' },

    // === TIER 5 — Red (Mythic) ===
    { name:'Scythe of Curses',  rarity:5, tier:5, dmg:15, speed:0.7, range:72, color:RARITY_COLORS[5], type:'spear',  sprite:'artefact/spwpn_scythe_of_curses.png' },
    { name:'Sword of Cerebov',  rarity:5, tier:5, dmg:18, speed:0.8, range:68, color:RARITY_COLORS[5], type:'sword',  sprite:'artefact/spwpn_sword_of_cerebov.png' },
    { name:'Wrath of Trog',     rarity:5, tier:5, dmg:16, speed:0.9, range:62, color:RARITY_COLORS[5], type:'mace',   sprite:'artefact/spwpn_wrath_of_trog.png' },
    { name:'Staff of Dispater', rarity:5, tier:5, dmg:14, speed:1.0, range:76, color:RARITY_COLORS[5], type:'staff',  sprite:'artefact/spwpn_staff_of_dispater.png' },
];

// ============ WEAPON ON-HIT EFFECTS ============
const WEAPON_EFFECTS = {
    'Hunting Knife':  ['poison'],
    'Venom Fang':     ['poison','dizzy'],
    'Shadow Knife':   ['poison'],
    'Flame Sword':    ['burn'],
    'Wrath of Trog':  ['burn'],
    'Scythe of Curses':['burn','poison'],
    'Frost Mace':     ['freeze','dizzy'],
    'Crystal Staff':  ['freeze','dizzy'],
    'Thunder Spear':  ['paralyze'],
    'Lajatang':       ['paralyze'],
    'Staff of Dispater':['paralyze','freeze'],
    'Stone Hammer':   ['dizzy'],
    'War Hammer':     ['dizzy'],
    'Executioner Axe':['dizzy'],
    'Great Sword':    ['dizzy'],
    'Arcane Blade':   ['sleep'],
    'Katana':         ['dizzy'],
    'Blessed Blade':  ['sleep'],
    'Dragon Claw':    ['burn','paralyze'],
    'Holy Scourge':   ['dizzy','paralyze'],
    'Demon Whip':     ['burn','poison'],
    'Sword of Cerebov':['burn','paralyze'],
};

// ============ BIOMES ============
const BIOMES = [
    { name:'Forest', color:'#0f2a0f', floorColor:'#0a1a08', wallColor:'#1e3a1a',
      floorAccent:'rgba(40,90,30,0.08)', gridColor:'rgba(60,140,40,0.015)',
      wallTint:'rgba(30,80,20,0.15)', wallHighlight:'rgba(80,180,60,0.06)',
      herbs:['greenLeaf','redBerry','yellowRoot'], enemyType:'forest' },
    { name:'Cave',   color:'#0e0e24', floorColor:'#08081a', wallColor:'#1a1a40',
      floorAccent:'rgba(40,40,100,0.08)', gridColor:'rgba(60,60,180,0.02)',
      wallTint:'rgba(30,30,90,0.15)', wallHighlight:'rgba(80,80,220,0.06)',
      herbs:['caveCrystal','blueMush','firestone'], enemyType:'cave' },
    { name:'Swamp',  color:'#1a2010', floorColor:'#0e1608', wallColor:'#2a3018',
      floorAccent:'rgba(80,90,30,0.08)', gridColor:'rgba(100,120,40,0.015)',
      wallTint:'rgba(60,70,20,0.15)', wallHighlight:'rgba(120,140,40,0.06)',
      herbs:['swampGoo','purpleMoss','greenLeaf'], enemyType:'swamp' }
];

// ============ ENEMY TYPES ============
const ENEMY_TYPES = {
    // === Forest ===
    rat:      { name:'Rat',       nameZh:'老鼠',     hp:1.0, atk:0.8, spd:1.1, color:'#996644', sprite:'grey_rat.png',       desc:'A common pest, weak but numerous.',     descZh:'常见害虫，弱但数量众多。', skills:[] },
    wolf:     { name:'Wolf',      nameZh:'狼',       hp:1.5, atk:1.3, spd:1.2, color:'#888888', sprite:'wolf.png',            desc:'Hunts in packs, fast and fierce.',       descZh:'成群狩猎，速度极快。', skills:['charge'] },
    bear:     { name:'Bear',      nameZh:'熊',       hp:3.0, atk:1.8, spd:0.7, color:'#885533', sprite:'bear.png',            desc:'A massive beast with thunderous swipes.', descZh:'体型巨大，横扫一切。', skills:['slam'] },
    bee:      { name:'Giant Bee', nameZh:'巨蜂',    hp:0.8, atk:1.0, spd:1.4, color:'#ffcc00', sprite:'killer_bee.png',      desc:'Stings and leaves venom behind.',         descZh:'蜂刺留下毒素。', skills:['poison'] },
    hound:    { name:'Hound',     nameZh:'猎犬',    hp:1.2, atk:1.2, spd:1.3, color:'#aa6633', sprite:'hound.png',           desc:'Trained for war, charges without fear.',  descZh:'受训战犬，无惧冲锋。', skills:['charge'] },
    wolf_pack:{ name:'Wolf Pack Alpha', nameZh:'狼群首领', hp:2.5, atk:1.8, spd:1.2, color:'#aaaaaa', sprite:'jackal.png', isEliteType:true,
                desc:'The alpha of the pack. Summons wolves and charges from afar.', descZh:'狼群首领，召唤狼群并从远处冲锋。',
                skills:['charge','summon'] },
    grizzly:  { name:'Ancient Grizzly', nameZh:'远古灰熊', hp:8.0, atk:2.5, spd:0.8, color:'#885533', sprite:'grizzly_bear.png', isBossType:true,
                desc:'An ancient bear awakened from centuries of slumber. Its roar shakes the earth.', descZh:'沉睡数百年的远古灰熊，怒吼使大地颤抖。',
                skills:['slam','charge','rage'], skillDescs:['Ground Slam: deals AoE damage','Furious Charge: rushes the player','Enrage: doubles speed below 40% HP'] },
    // === Cave ===
    bat:      { name:'Giant Bat',    nameZh:'巨蝙蝠',  hp:0.7, atk:0.9, spd:1.5, color:'#664488', sprite:'giant_bat.png',      desc:'Swoops from the darkness without warning.', descZh:'从黑暗中突然俯冲。', skills:[] },
    spider:   { name:'Wolf Spider',  nameZh:'狼蛛',    hp:1.0, atk:1.1, spd:1.1, color:'#886644', sprite:'wolf_spider.png',    desc:'Weaves webs to slow prey.',                 descZh:'结网减缓猎物。', skills:['poison'] },
    centipede:{ name:'Centipede',    nameZh:'蜈蚣',    hp:1.3, atk:1.0, spd:1.0, color:'#447744', sprite:'giant_centipede.png',desc:'Coils around victims, hard to shake off.',   descZh:'缠绕猎物，难以摆脱。', skills:['poison'] },
    beetle:   { name:'Boulder Beetle',nameZh:'磐石甲虫',hp:2.5, atk:1.4, spd:0.6, color:'#557733', sprite:'boulder_beetle.png',desc:'Armored shell deflects weak blows.',        descZh:'装甲外壳偏转弱攻击。', skills:['shield'] },
    tarantella:{ name:'Tarantella',  nameZh:'毒舞蜘蛛', hp:2.0, atk:1.6, spd:1.3, color:'#aa4488', sprite:'tarantella.png', isEliteType:true,
                desc:'A venomous dance spider that poisons and teleports.', descZh:'有毒的舞蹈蜘蛛，下毒并瞬移。',
                skills:['poison','teleport'] },
    kraken:   { name:'Cave Kraken',  nameZh:'洞穴克拉肯', hp:10.0, atk:2.2, spd:0.6, color:'#224488', sprite:'kraken_head.png', isBossType:true,
                desc:'A tentacled horror from the deep cave. Its ink blinds, its grip crushes.', descZh:'来自深洞的触手恐魔，墨汁致盲，握力粉碎一切。',
                skills:['slam','shoot','summon'], skillDescs:['Ink Blast: blinds player briefly','Tentacle Slam: crushes nearby enemies','Summon Spawn: calls small tentacles'] },
    // === Swamp ===
    frog:     { name:'Giant Frog',   nameZh:'巨蛙',    hp:1.0, atk:1.0, spd:0.9, color:'#448833', sprite:'giant_frog.png',    desc:'Leaps unexpectedly at prey.',              descZh:'出人意料地跳向猎物。', skills:[] },
    lizard:   { name:'Komodo Dragon',nameZh:'科莫多龙', hp:2.0, atk:1.5, spd:0.8, color:'#668833', sprite:'komodo_dragon.png', desc:'Venomous bite causes lasting damage.',      descZh:'毒性咬伤造成持续伤害。', skills:['poison'] },
    leech:    { name:'Giant Leech',  nameZh:'巨蚂蟥',  hp:1.5, atk:0.9, spd:0.7, color:'#884433', sprite:'giant_leech.png',   desc:'Drains life force from its victim.',        descZh:'吸取受害者的生命力。', skills:['leech'] },
    croc:     { name:'Crocodile',    nameZh:'鳄鱼',    hp:2.5, atk:1.6, spd:0.7, color:'#446633', sprite:'crocodile.png',     desc:'Lurks in water, ambushes from close range.', descZh:'潜伏水中，近距离伏击。', skills:['charge'] },
    anaconda: { name:'Anaconda',     nameZh:'水蟒',    hp:3.0, atk:1.7, spd:0.9, color:'#336644', sprite:'anaconda.png', isEliteType:true,
                desc:'A massive serpent that squeezes the life from prey.', descZh:'巨型蛇类，将猎物活活压死。',
                skills:['leech','charge'] },
    dragon:   { name:'Swamp Dragon', nameZh:'沼泽龙',  hp:12.0, atk:3.0, spd:0.9, color:'#228844', sprite:'komodo_dragon.png', isBossType:true,
                desc:'An ancient dragon that has claimed the swamp as its domain.', descZh:'古老的龙，以沼泽为领地。喷射酸液，召唤仆从，受伤后狂怒。',
                skills:['shoot','summon','rage'], skillDescs:['Acid Breath: deals poison damage in cone','Call Minions: summons lizards and frogs','Blood Rage: +50% ATK below 30% HP'] },
};

// ============ ENEMY ON-HIT EFFECTS ============
const ENEMY_TYPE_EFFECTS = {
    bee:['poison'], spider:['poison'], centipede:['poison'], lizard:['poison'], leech:['poison'],
    bat:['dizzy'], frog:['sleep'], croc:['dizzy'], bear:['dizzy'], wolf:['paralyze'],
    tarantella:['poison','sleep'], anaconda:['paralyze','dizzy'],
    grizzly:['dizzy','burn'], kraken:['paralyze','freeze'], dragon:['burn','poison'],
};

// ============ STATUS EFFECTS ============
const STATUS_DEFS = {
    poison:   { name:'Poison',   nameZh:'中毒',  color:'#aa44dd', icon:'☠', duration:180, tickDmg:1,  tickRate:60, desc:'Deals damage over time',         descZh:'持续造成伤害' },
    paralyze: { name:'Paralyze', nameZh:'麻痹',  color:'#ffee44', icon:'⚡', duration:120, speedMul:0, desc:'Cannot move for duration',       descZh:'无法移动' },
    sleep:    { name:'Sleep',    nameZh:'睡眠',  color:'#8888ff', icon:'💤', duration:180, speedMul:0, noAlert:true, desc:'Falls asleep, wakes on hit',     descZh:'入睡，受击醒来' },
    dizzy:    { name:'Dizzy',    nameZh:'眩晕',  color:'#ffaa44', icon:'🌀', duration:90,  speedMul:0.3, aimPenalty:true, desc:'Confused movement, reduced accuracy', descZh:'移动混乱，命中降低' },
    freeze:   { name:'Freeze',   nameZh:'冰冻',  color:'#44ddff', icon:'❄', duration:150, speedMul:0, defBuff:2,  desc:'Frozen solid, extra defense',    descZh:'冻结，额外防御' },
    burn:     { name:'Burn',     nameZh:'灼烧',  color:'#ff6622', icon:'🔥', duration:150, tickDmg:2,  tickRate:40, defPenalty:1, desc:'Burning, reduces defense', descZh:'燃烧，降低防御' },
};

// ============ HERBS ============
const HERBS = {
    greenLeaf:  { name:'Green Leaf',   yields:['vita','herba'],  biome:'Forest' },
    redBerry:   { name:'Red Berry',    yields:['vita','ignis'],  biome:'Forest' },
    yellowRoot: { name:'Yellow Root',  yields:['terra','herba'], biome:'Forest' },
    caveCrystal:{ name:'Cave Crystal', yields:['aqua','lux'],    biome:'Cave' },
    blueMush:   { name:'Blue Mushroom',yields:['aqua','toxin'],  biome:'Cave' },
    firestone:  { name:'Firestone',    yields:['ignis','terra'], biome:'Cave' },
    swampGoo:   { name:'Swamp Goo',    yields:['toxin','aqua'],  biome:'Swamp' },
    purpleMoss: { name:'Purple Moss',  yields:['lux','toxin'],   biome:'Swamp' }
};

// ============ ESSENCES ============
const ESSENCES = {
    vita: { name:'Vita', color:'#ee4444' }, herba:{ name:'Herba', color:'#44dd88' },
    ignis:{ name:'Ignis', color:'#ff6622' }, terra:{ name:'Terra', color:'#ddaa22' },
    aqua: { name:'Aqua', color:'#4488ee' }, lux:  { name:'Lux', color:'#ddddff' },
    toxin:{ name:'Toxin', color:'#aa44dd' }
};

// ============ RECIPES ============
const RECIPES = [
    { ingredients:['vita','herba'],  name:'Healing Brew',    effect:'heal',   tier:1, value:10, color:'#ee4444', desc:'+10 HP' },
    { ingredients:['vita','ignis'],  name:'Strength Elixir', effect:'attack', tier:1, value:5,  color:'#ff6622', desc:'+5 ATK' },
    { ingredients:['vita','aqua'],   name:'Vitality Tonic',  effect:'maxhp',  tier:1, value:5,  color:'#44dd88', desc:'+5 Max HP' },
    { ingredients:['herba','terra'], name:'Iron Skin',       effect:'defense',tier:1, value:5,  color:'#ddaa22', desc:'+5 DEF' },
    { ingredients:['ignis','terra'], name:'Berserker Draft', effect:'attack', tier:2, value:10, color:'#ff4400', desc:'+10 ATK' },
    { ingredients:['aqua','lux'],    name:'Swift Potion',    effect:'speed',  tier:1, value:3,  color:'#88ccff', desc:'+Speed' },
    { ingredients:['lux','herba'],   name:'Regen Potion',    effect:'regen',  tier:1, value:3,  color:'#aaffaa', desc:'HP Regen' },
    { ingredients:['toxin','ignis'], name:'Venom Blade',     effect:'poison', tier:1, value:3,  color:'#aa44dd', desc:'Poison ATK' },
    { ingredients:['toxin','lux'],   name:'Shadow Elixir',   effect:'stealth',tier:1, value:1,  color:'#6644aa', desc:'Stealth' },
    { ingredients:['aqua','terra'],  name:'Stone Shield',    effect:'defense',tier:2, value:10, color:'#8899aa', desc:'+10 DEF' },
    { ingredients:['vita','lux'],    name:'Greater Heal',    effect:'heal',   tier:2, value:25, color:'#ff88aa', desc:'+25 HP' },
    { ingredients:['ignis','lux'],   name:'Phoenix Draught', effect:'revive', tier:2, value:1,  color:'#ffaa00', desc:'Auto-Revive' },
    // 3-ingredient advanced potions
    { ingredients:['vita','herba','aqua'],  name:'Supreme Vitality', effect:'maxhp', tier:3, value:15, color:'#44ffaa', desc:'+15 Max HP' },
    { ingredients:['ignis','terra','vita'], name:'Titan Strength',   effect:'attack',tier:3, value:18, color:'#ff3300', desc:'+18 ATK' },
    { ingredients:['aqua','terra','lux'],   name:'Diamond Shield',   effect:'defense',tier:3, value:18, color:'#aaddff', desc:'+18 DEF' },
    { ingredients:['vita','lux','herba'],   name:'Master Healing',   effect:'heal',  tier:3, value:40, color:'#ffaacc', desc:'+40 HP' },
    { ingredients:['toxin','ignis','lux'],  name:'Deadly Venom',     effect:'poison',tier:2, value:5,  color:'#dd44ff', desc:'Poison DMG' },
    { ingredients:['aqua','lux','herba'],   name:'Rapid Regen',      effect:'regen', tier:2, value:6,  color:'#88ffcc', desc:'Fast Regen' },
    // 4-ingredient legendary potions
    { ingredients:['vita','ignis','aqua','terra'], name:'Elemental Fury',  effect:'attack', tier:4, value:30, color:'#ff00ff', desc:'+30 ATK' },
    { ingredients:['vita','herba','lux','aqua'],   name:'Divine Blessing', effect:'heal',   tier:4, value:60, color:'#ffffaa', desc:'+60 HP' },
    { ingredients:['terra','aqua','lux','herba'],  name:'Fortress Wall',   effect:'defense',tier:4, value:30, color:'#6699ff', desc:'+30 DEF' },
    { ingredients:['vita','ignis','lux','toxin'],  name:'Phoenix Rebirth', effect:'revive', tier:3, value:2,  color:'#ffaa44', desc:'Revive+Heal' }
];

// ============ RESEARCH (permanent upgrades) ============
const RESEARCH = [
    { id:'hp',    key:'resHP',    maxLvl:10, baseCost:12, costMul:1.4, apply:function(lv){ return {maxHp:lv}; } },
    { id:'atk',   key:'resATK',   maxLvl:8,  baseCost:15, costMul:1.5, apply:function(lv){ return {atk:lv}; } },
    { id:'def',   key:'resDEF',   maxLvl:8,  baseCost:15, costMul:1.5, apply:function(lv){ return {def:lv}; } },
    { id:'speed', key:'resSpeed', maxLvl:5,  baseCost:20, costMul:1.6, apply:function(lv){ return {speed:lv*0.3}; } },
    { id:'luck',  key:'resLuck',  maxLvl:5,  baseCost:20, costMul:1.6, apply:function(lv){ return {luck:lv}; } },
    { id:'carry', key:'resCarry', maxLvl:2,  baseCost:35, costMul:2.0, apply:function(lv){ return {carry:lv}; } },
];

// ============ COLLECTIBLES (relics) ============
const COLLECTIBLES = [
    { id:'ancient_coin',   name:'Ancient Coin',   nameZh:'远古金币',   color:'#ffd700', sprite:'res/item/misc/gold_pile.png',
      skill:'passive', skillName:'Golden Fortune', skillNameZh:'黄金财运', skillDesc:'+15% gold from all sources', skillDescZh:'所有来源的金币+15%', effect:{goldBonus:0.15} },
    { id:'crystal_skull',  name:'Crystal Skull',  nameZh:'水晶头骨',   color:'#88ccff', sprite:'res/item/misc/misc_crystal.png',
      skill:'passive', skillName:"Mind's Eye", skillNameZh:'心灵之眼', skillDesc:'Reveals enemy HP bars', skillDescZh:'显示敌人血量条', effect:{showEnemyHP:true} },
    { id:'dragon_scale',   name:'Dragon Scale',   nameZh:'龙鳞',       color:'#ff6622', sprite:'res/item/amulet/celtic_red.png',
      skill:'passive', skillName:'Dragon Hide', skillNameZh:'龙之甲', skillDesc:'+3 Defense', skillDescZh:'防御+3', effect:{defenseBonus:3} },
    { id:'shadow_gem',     name:'Shadow Gem',     nameZh:'暗影宝石',   color:'#6644aa', sprite:'res/item/amulet/stone2_blue.png',
      skill:'passive', skillName:'Shadow Step', skillNameZh:'暗影步', skillDesc:'+20% movement speed', skillDescZh:'移动速度+20%', effect:{speedBonus:0.5} },
    { id:'phoenix_feather',name:'Phoenix Feather', nameZh:'凤凰羽',    color:'#ffaa00', sprite:'res/item/amulet/i-rage.png',
      skill:'passive', skillName:'Rebirth', skillNameZh:'重生', skillDesc:'Revive once per expedition with 50% HP', skillDescZh:'每次探险复活一次，恢复50%血量', effect:{autoRevive:true} },
    { id:'frost_heart',    name:'Frost Heart',    nameZh:'霜之心',     color:'#44ddff', sprite:'res/item/amulet/crystal_white.png',
      skill:'passive', skillName:'Frost Aura', skillNameZh:'霜冻光环', skillDesc:'Slow nearby enemies by 30%', skillDescZh:'减缓附近敌人30%速度', effect:{enemySlow:0.3} },
    { id:'earth_rune',     name:'Earth Rune',     nameZh:'大地符文',   color:'#ddaa22', sprite:'res/item/misc/misc_rune.png',
      skill:'passive', skillName:'Stone Skin', skillNameZh:'石肤', skillDesc:'+5 Max HP', skillDescZh:'最大生命+5', effect:{maxHpBonus:5} },
    { id:'void_shard',     name:'Void Shard',     nameZh:'虚空碎片',   color:'#aa44dd', sprite:'res/item/misc/misc_stone.png',
      skill:'passive', skillName:'Void Walk', skillNameZh:'虚空行走', skillDesc:'15% chance to dodge attacks', skillDescZh:'15%几率闪避攻击', effect:{dodgeChance:0.15} },
    { id:'star_fragment',  name:'Star Fragment',  nameZh:'星辰碎片',   color:'#ddddff', sprite:'res/item/amulet/eye_cyan.png',
      skill:'passive', skillName:'Star Light', skillNameZh:'星光', skillDesc:'+25% potion effectiveness', skillDescZh:'药剂效果+25%', effect:{potionBonus:0.25} },
    { id:'blood_ruby',     name:'Blood Ruby',     nameZh:'血红宝石',   color:'#ee4444', sprite:'res/item/amulet/crystal_red.png',
      skill:'passive', skillName:'Blood Thirst', skillNameZh:'嗜血', skillDesc:'Heal 1 HP per kill', skillDescZh:'每次击杀回复1生命', effect:{lifeSteal:1} },
    { id:'moss_agate',     name:'Moss Agate',     nameZh:'苔藓玛瑙',   color:'#44dd88', sprite:'res/item/amulet/stone1_green.png',
      skill:'passive', skillName:"Nature's Blessing", skillNameZh:'自然祝福', skillDesc:'+1 HP regen per 5s', skillDescZh:'每5秒回复1生命', effect:{regenBonus:1} },
    { id:'thunder_pearl',  name:'Thunder Pearl',  nameZh:'雷霆珍珠',   color:'#ffdd44', sprite:'res/item/amulet/eye_magenta.png',
      skill:'passive', skillName:'Lightning Strike', skillNameZh:'雷击', skillDesc:'10% chance to deal double damage', skillDescZh:'10%几率造成双倍伤害', effect:{critChance:0.1} },
    { id:'iron_ring',      name:'Iron Ring',      nameZh:'铁环',       color:'#aaaaaa', sprite:'res/item/ring/iron.png',
      skill:'passive', skillName:'Iron Will', skillNameZh:'铁意志', skillDesc:'+2 Attack', skillDescZh:'攻击+2', effect:{atkBonus:2} },
    { id:'jade_amulet',    name:'Jade Amulet',    nameZh:'翡翠护符',   color:'#44dd88', sprite:'res/item/ring/jade.png',
      skill:'passive', skillName:'Jade Barrier', skillNameZh:'翡翠屏障', skillDesc:'Absorb first hit each floor', skillDescZh:'每层第一次攻击免伤', effect:{absorbFirst:true} },
    { id:'void_orb',       name:'Void Orb',       nameZh:'虚空法球',   color:'#7744ff', sprite:'res/item/misc/misc_orb.png',
      skill:'passive', skillName:'Arcane Echo', skillNameZh:'奥术回响', skillDesc:'+20% weapon range', skillDescZh:'武器范围+20%', effect:{rangeBonus:0.2} },
    { id:'mystic_lamp',    name:'Mystic Lamp',    nameZh:'神秘灯',      color:'#ffee88', sprite:'res/item/misc/misc_lamp.png',
      skill:'passive', skillName:'Light the Way', skillNameZh:'照亮前路', skillDesc:'Increase vision radius by 2', skillDescZh:'视野范围+2格', effect:{visionBonus:2} },
    { id:'war_horn',       name:'War Horn',       nameZh:'战争号角',    color:'#ff8844', sprite:'res/item/misc/misc_horn.png',
      skill:'passive', skillName:'Battle Cry', skillNameZh:'战吼', skillDesc:'+15% attack speed', skillDescZh:'攻击速度+15%', effect:{atkSpeedBonus:0.15} },
    { id:'emerald_ring',   name:'Emerald Ring',   nameZh:'翡翠戒指',   color:'#44ff88', sprite:'res/item/ring/emerald.png',
      skill:'passive', skillName:'Emerald Fortune', skillNameZh:'翡翠幸运', skillDesc:'+10% herb yield', skillDescZh:'草药产量+10%', effect:{herbBonus:0.1} },
    { id:'silver_ring',    name:'Silver Ring',    nameZh:'银戒指',     color:'#ccccff', sprite:'res/item/ring/silver.png',
      skill:'passive', skillName:'Silver Tongue', skillNameZh:'银舌', skillDesc:'-15% shop prices', skillDescZh:'商店价格-15%', effect:{shopDiscount:0.15} },
    { id:'pearl_ring',     name:'Pearl Ring',     nameZh:'珍珠戒指',   color:'#eeeeff', sprite:'res/item/ring/pearl.png',
      skill:'passive', skillName:"Ocean's Grace", skillNameZh:'海洋恩典', skillDesc:'+2 HP regen per 10s', skillDescZh:'每10秒回复2生命', effect:{regenBonus:2} },
    { id:'chaos_fan',      name:'Chaos Fan',      nameZh:'混沌扇',     color:'#ff44aa', sprite:'res/item/misc/misc_fan.png',
      skill:'passive', skillName:'Chaos Burst', skillNameZh:'混沌爆发', skillDesc:'5% chance to stun on hit', skillDescZh:'攻击5%几率眩晕', effect:{stunChance:0.05} },
    { id:'rune_disc',      name:'Rune Disc',      nameZh:'符文圆盘',   color:'#44aaff', sprite:'res/item/misc/misc_disc.png',
      skill:'passive', skillName:'Runic Shield', skillNameZh:'符文护盾', skillDesc:'+1 Defense per 3 floors', skillDescZh:'每3层+1防御', effect:{defPerFloor:true} },
];

// ============ TUTORIAL TEXT ============
const TUTORIAL_LAB = [
    {key:'bench',    zh:'这是提取台。\n把药材放在这里提取精华。'},
    {key:'cauldron', zh:'这是炼金锅。\n将2种精华组合酿造药剂。'},
    {key:'shelf',    zh:'这是药剂架。\n出发前把药剂装到腰带上。'},
    {key:'rack',     zh:'这是武器架。\n在这里管理和附魔武器。'},
    {key:'merch',    zh:'这是商店。\n用金币买卖物品。'},
    {key:'research', zh:'这是研究台。\n花费金币永久升级属性。'},
    {key:'door',     zh:'这是出口大门。\n选择区域开始探险！\n我们去探险吧！'},
];
const TUTORIAL_EXP = [
    {zh:'欢迎来到探险！\n用WASD键或左侧摇杆移动角色。'},
    {zh:'靠近敌人自动攻击，或用右侧摇杆瞄准攻击。'},
    {zh:'击败敌人获得金币和药材。\n收集药材带回炼金室。'},
    {zh:'小地图在右上角。\n找到出口（绿色）前往下一层。\n在最后一层击败Boss！'},
    {zh:'祝你好运，炼金术士！\n酿造药剂让自己变强。'},
];
