// ============ Alchemist's Path ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
var pixelRatio = window.devicePixelRatio || 1;
var qualityLevel = 2; // 0=low, 1=medium, 2=high
var sfxVolume = 1.0;
var showSettings = false;
function applyQuality(){
    if(qualityLevel===0) pixelRatio=1;
    else if(qualityLevel===1) pixelRatio=Math.min(window.devicePixelRatio||1, 2);
    else pixelRatio=window.devicePixelRatio||1;
    resize();
}
function resize() {
    var w=window.innerWidth, h=window.innerHeight;
    canvas.width = w * pixelRatio;
    canvas.height = h * pixelRatio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}
// Override canvas width/height getters to return logical pixels for game code
Object.defineProperty(canvas, '_pw', {get: function(){ return this.getAttribute('width')|0; }});
Object.defineProperty(canvas, '_ph', {get: function(){ return this.getAttribute('height')|0; }});
var _origWidthDesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
var _origHeightDesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');
Object.defineProperty(canvas, 'width', {
    get: function(){ return Math.round(this._pw / pixelRatio); },
    set: function(v){ _origWidthDesc.set.call(this, v); }
});
Object.defineProperty(canvas, 'height', {
    get: function(){ return Math.round(this._ph / pixelRatio); },
    set: function(v){ _origHeightDesc.set.call(this, v); }
});
resize(); window.addEventListener('resize', resize);

// ============ LANGUAGE SYSTEM ============
let lang = 'en';
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
        // New strings
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
        // Research & Collectibles
        tabResearch: 'Research', researchDesc: 'Spend gold to permanently upgrade',
        resHP: 'Max HP +1', resDEF: 'Base DEF +1', resATK: 'Base ATK +1', resSpeed: 'Move Speed +',
        resLuck: 'Luck +', resCarry: 'Belt +1 Slot',
        lvl: 'Lv', maxLvl: 'MAX',
        key: 'Key', keys: 'Keys', needKey: 'Need a key',
        newRelic: 'New Relic Found!',
        relicCase: 'Relic Case', relicsFound: 'Relics Found',
        minimap: 'Map',
        saved: 'Saved!', loaded: 'Loaded!', saveBtn: 'Save', loadSave: 'Load Save',
        // Skill tree
        tabSkills: 'Skills', skillTree: 'Skill Tree', skillDesc: 'Unlock permanent abilities',
        skillUnlocked: 'Unlocked', skillReq: 'Requires',
        // Combat branch
        skCombat: 'Combat', skPowerStrike: 'Power Strike', skPowerStrikeD: 'Crit chance +10%',
        skLifeSteal: 'Life Steal', skLifeStealD: 'Heal 1 HP per 5 kills',
        skBerserker: 'Berserker', skBerserkerD: 'ATK +20% when HP<30%',
        skExecute: 'Execute', skExecuteD: '+50% DMG to enemies <25% HP',
        // Alchemy branch
        skAlchemy: 'Alchemy', skDoubleYield: 'Double Yield', skDoubleYieldD: '20% chance double essence',
        skPotionMaster: 'Potion Master', skPotionMasterD: 'Potions +50% effect',
        skTransmute: 'Transmute', skTransmuteD: 'Convert 3 essences to any 1',
        skPhiloStone: 'Philosopher', skPhiloStoneD: 'Brew costs no essences 15%',
        // Survival branch
        skSurvival: 'Survival', skThickSkin: 'Thick Skin', skThickSkinD: 'Take -1 DMG (min 1)',
        skScavenger: 'Scavenger', skScavengerD: '+30% gold from enemies',
        skDodge: 'Dodge', skDodgeD: '12% chance to dodge attacks',
        skSecondWind: 'Second Wind', skSecondWindD: 'Heal 30% HP once per floor',
        // Settings
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
        // Research & Collectibles
        tabResearch: '研究', researchDesc: '花费金币永久升级属性',
        resHP: '生命上限+1', resDEF: '基础防御+1', resATK: '基础攻击+1', resSpeed: '移速+',
        resLuck: '幸运+', resCarry: '腰带+1格',
        lvl: '级', maxLvl: '满级',
        key: '钥匙', keys: '钥匙', needKey: '需要钥匙',
        newRelic: '发现新遗物！',
        relicCase: '遗物柜', relicsFound: '已发现遗物',
        minimap: '地图',
        saved: '已保存！', loaded: '已加载！', saveBtn: '保存', loadSave: '读取存档',
        // Skill tree
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
        // Settings
        settingsTitle: '设 置', bgmVol: '音乐', sfxVol: '音效',
        qualityLow: '低', qualityMed: '中', qualityHigh: '高', qualityLabel: '画质',
        langLabel: '语言', settingsClose: '关闭',
    }
};
function T(key) { return LANG[lang][key] || LANG.en[key] || key; }
function getBiomeName(b) {
    if (lang === 'zh') {
        if (b.name === 'Forest') return T('biomeForest');
        if (b.name === 'Cave') return T('biomeCave');
        if (b.name === 'Swamp') return T('biomeSwamp');
    }
    return b.name;
}
const HERB_NAMES_ZH = { greenLeaf:'绿叶草', redBerry:'红浆果', yellowRoot:'黄根', caveCrystal:'洞穴水晶', blueMush:'蓝蘑菇', firestone:'火石', swampGoo:'沼泽粘液', purpleMoss:'紫苔藓' };
const ESSENCE_NAMES_ZH = { vita:'生命', herba:'草木', ignis:'火焰', terra:'大地', aqua:'水灵', lux:'光明', toxin:'毒素' };
const RECIPE_NAMES_ZH = { 'Healing Brew':'治愈药剂','Strength Elixir':'力量药水','Vitality Tonic':'活力补剂','Iron Skin':'铁皮药膏','Berserker Draft':'狂战药剂','Swift Potion':'迅捷药水','Regen Potion':'回春药水','Venom Blade':'毒刃药剂','Shadow Elixir':'暗影药水','Stone Shield':'石盾药剂','Greater Heal':'强效治愈','Phoenix Draught':'凤凰药剂' };
const RECIPE_DESC_ZH = { '+3 HP':'生命+3','+2 ATK':'攻击+2','+2 Max HP':'生命上限+2','+2 DEF':'防御+2','+4 ATK':'攻击+4','+Speed':'速度提升','HP Regen':'生命回复','Poison ATK':'毒素攻击','Stealth':'隐身','+4 DEF':'防御+4','+5 HP':'生命+5','Auto-Revive':'自动复活' };
function herbName(key) { return lang==='zh' ? (HERB_NAMES_ZH[key]||HERBS[key].name) : HERBS[key].name; }
function essenceName(key) { return lang==='zh' ? (ESSENCE_NAMES_ZH[key]||ESSENCES[key].name) : ESSENCES[key].name; }
function recipeName(r) { return lang==='zh' ? (RECIPE_NAMES_ZH[r.name]||r.name) : r.name; }
function recipeDesc(r) { return lang==='zh' ? (RECIPE_DESC_ZH[r.desc]||r.desc) : r.desc; }

// ============ CONSTANTS ============
const TILE = 32;
const MAP_W = 36, MAP_H = 28;
const PLAYER_SPEED = 2.5;
const ENEMY_SPEED = 1.0;
const MAX_FLOORS = 3;

// ============ WEAPON DATA ============
const WEAPON_NAMES_ZH = {
    'Rusty Dagger':'生锈匕首','Iron Sword':'铁剑','Steel Blade':'钢刃','War Axe':'战斧',
    'Crystal Staff':'水晶法杖','Shadow Knife':'暗影短刀','Flame Sword':'烈焰剑',
    'Frost Mace':'霜冻锤','Venom Fang':'毒牙刃','Thunder Spear':'雷霆枪',
    'Dragon Claw':'龙爪','Arcane Blade':'奥术之刃'
};
function weaponName(w) { return lang==='zh' ? (WEAPON_NAMES_ZH[w.name]||w.name) : w.name; }

const WEAPONS = [
    { name:'Rusty Dagger', tier:0, dmg:1, speed:1.2, range:42, color:'#888888', type:'dagger' },
    { name:'Iron Sword',   tier:1, dmg:2, speed:1.0, range:50, color:'#aabbcc', type:'sword' },
    { name:'Steel Blade',  tier:1, dmg:3, speed:0.9, range:52, color:'#ccddee', type:'sword' },
    { name:'War Axe',      tier:2, dmg:5, speed:0.7, range:48, color:'#dd8844', type:'axe' },
    { name:'Crystal Staff', tier:2, dmg:4, speed:1.0, range:62, color:'#88ccff', type:'staff' },
    { name:'Shadow Knife', tier:1, dmg:2, speed:1.4, range:40, color:'#6644aa', type:'dagger' },
    { name:'Flame Sword',  tier:3, dmg:7, speed:0.8, range:55, color:'#ff6622', type:'sword' },
    { name:'Frost Mace',   tier:3, dmg:6, speed:0.7, range:50, color:'#44ddff', type:'mace' },
    { name:'Venom Fang',   tier:2, dmg:4, speed:1.1, range:44, color:'#aa44dd', type:'dagger' },
    { name:'Thunder Spear',tier:3, dmg:8, speed:0.6, range:68, color:'#ffdd44', type:'spear' },
    { name:'Dragon Claw',  tier:4, dmg:10, speed:0.9, range:58, color:'#ff4400', type:'claw' },
    { name:'Arcane Blade', tier:4, dmg:12, speed:0.8, range:62, color:'#ddaaff', type:'sword' },
];

function makeWeapon(template) {
    return { name:template.name, tier:template.tier, dmg:template.dmg, speed:template.speed, range:template.range, color:template.color, type:template.type, enchant:null };
}

function getWeaponDropPool(floor, isBoss) {
    if (isBoss) return WEAPONS.filter(function(w){ return w.tier >= floor && w.tier <= floor+1; });
    return WEAPONS.filter(function(w){ return w.tier >= Math.max(0,floor-1) && w.tier <= floor; });
}

// ============ GAME DATA ============
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
const ESSENCES = {
    vita: { name:'Vita', color:'#ee4444' }, herba:{ name:'Herba', color:'#44dd88' },
    ignis:{ name:'Ignis', color:'#ff6622' }, terra:{ name:'Terra', color:'#ddaa22' },
    aqua: { name:'Aqua', color:'#4488ee' }, lux:  { name:'Lux', color:'#ddddff' },
    toxin:{ name:'Toxin', color:'#aa44dd' }
};
const RECIPES = [
    { ingredients:['vita','herba'],  name:'Healing Brew',    effect:'heal',   tier:1, value:2, color:'#ee4444', desc:'+3 HP' },
    { ingredients:['vita','ignis'],  name:'Strength Elixir', effect:'attack', tier:1, value:2, color:'#ff6622', desc:'+2 ATK' },
    { ingredients:['vita','aqua'],   name:'Vitality Tonic',  effect:'maxhp',  tier:1, value:2, color:'#44dd88', desc:'+2 Max HP' },
    { ingredients:['herba','terra'], name:'Iron Skin',       effect:'defense',tier:1, value:2, color:'#ddaa22', desc:'+2 DEF' },
    { ingredients:['ignis','terra'], name:'Berserker Draft', effect:'attack', tier:2, value:4, color:'#ff4400', desc:'+4 ATK' },
    { ingredients:['aqua','lux'],    name:'Swift Potion',    effect:'speed',  tier:1, value:1, color:'#88ccff', desc:'+Speed' },
    { ingredients:['lux','herba'],   name:'Regen Potion',    effect:'regen',  tier:1, value:1, color:'#aaffaa', desc:'HP Regen' },
    { ingredients:['toxin','ignis'], name:'Venom Blade',     effect:'poison', tier:1, value:1, color:'#aa44dd', desc:'Poison ATK' },
    { ingredients:['toxin','lux'],   name:'Shadow Elixir',   effect:'stealth',tier:1, value:1, color:'#6644aa', desc:'Stealth' },
    { ingredients:['aqua','terra'],  name:'Stone Shield',    effect:'defense',tier:2, value:4, color:'#8899aa', desc:'+4 DEF' },
    { ingredients:['vita','lux'],    name:'Greater Heal',    effect:'heal',   tier:2, value:5, color:'#ff88aa', desc:'+5 HP' },
    { ingredients:['ignis','lux'],   name:'Phoenix Draught', effect:'revive', tier:2, value:1, color:'#ffaa00', desc:'Auto-Revive' },
    // 3-ingredient advanced potions
    { ingredients:['vita','herba','aqua'],  name:'Supreme Vitality', effect:'maxhp', tier:3, value:5, color:'#44ffaa', desc:'+5 Max HP' },
    { ingredients:['ignis','terra','vita'], name:'Titan Strength',   effect:'attack',tier:3, value:6, color:'#ff3300', desc:'+6 ATK' },
    { ingredients:['aqua','terra','lux'],   name:'Diamond Shield',   effect:'defense',tier:3, value:6, color:'#aaddff', desc:'+6 DEF' },
    { ingredients:['vita','lux','herba'],   name:'Master Healing',   effect:'heal',  tier:3, value:8, color:'#ffaacc', desc:'+8 HP' },
    { ingredients:['toxin','ignis','lux'],  name:'Deadly Venom',     effect:'poison',tier:2, value:2, color:'#dd44ff', desc:'Poison DMG' },
    { ingredients:['aqua','lux','herba'],   name:'Rapid Regen',      effect:'regen', tier:2, value:2, color:'#88ffcc', desc:'Fast Regen' },
    // 4-ingredient legendary potions
    { ingredients:['vita','ignis','aqua','terra'], name:'Elemental Fury',  effect:'attack', tier:4, value:10, color:'#ff00ff', desc:'+10 ATK' },
    { ingredients:['vita','herba','lux','aqua'],   name:'Divine Blessing', effect:'heal',   tier:4, value:15, color:'#ffffaa', desc:'+15 HP' },
    { ingredients:['terra','aqua','lux','herba'],  name:'Fortress Wall',   effect:'defense',tier:4, value:10, color:'#6699ff', desc:'+10 DEF' },
    { ingredients:['vita','ignis','lux','toxin'],  name:'Phoenix Rebirth', effect:'revive', tier:3, value:2, color:'#ffaa44', desc:'Revive+Heal' }
];

// ============ GAME STATE ============
let state = 'menu';
let expeditionNum = 0, frameCount = 0;
let inventory = { herbs:{}, essences:{}, potions:[], weapons:[] };
let equippedWeapon = makeWeapon(WEAPONS[0]); // start with rusty dagger
let gold = 0;
let discoveredRecipes = [];
let totalScore = 0;
let player = null;
let playerStats = { hp:8, maxHp:8, atk:2, def:0, speed:0, regen:0, poison:0, stealth:0, revive:false };
let activeBuffs = [];
let map = [], rooms = [];
let enemies = [], herbDrops = [], particles = [], floatingTexts = [];
let chests = [], merchants = [];
let camera = { x:0, y:0 };
let ambientParts = []; // ambient dust/firefly particles
let keys = {}, mouse = { x:0, y:0, down:false };
let screenShake = 0, missionTimer = 0;
let mobileStick = { active:false, sx:0, sy:0, cx:0, cy:0, id:-1 };
let mobileAimStick = { active:false, sx:0, sy:0, cx:0, cy:0, id:-1 };
let currentBiome = null;
let exitZone = null;
let attackCooldown = 0, regenTimer = 0;
let extracting = 0;
let carriedPotions = [];
const MAX_CARRY = 3;
let currentFloor = 0;
let stairsZone = null; // stairs to next floor
let bossDefeated = false;
let weaponPopup = null; // {weapon, x, y} — found weapon popup
let merchantPopup = null; // active merchant interaction
let buffPopup = null; // selected buff for detail view
let shopStock = []; // merchant stock, refreshed each expedition
let nearMerchantRef = null; // merchant NPC player is near
let bossRef = null; // reference to boss enemy for special AI
let bossSummonTimer = 0; // timer for boss summoning minions
let bossPhase = 0; // 0=normal, 1=enraged

// ============ RESEARCH (permanent upgrades) ============
const RESEARCH = [
    { id:'hp',    key:'resHP',    maxLvl:10, baseCost:15, costMul:1.6, apply:function(lv){ return {maxHp:lv}; } },
    { id:'atk',   key:'resATK',   maxLvl:8,  baseCost:20, costMul:1.7, apply:function(lv){ return {atk:lv}; } },
    { id:'def',   key:'resDEF',   maxLvl:8,  baseCost:20, costMul:1.7, apply:function(lv){ return {def:lv}; } },
    { id:'speed', key:'resSpeed', maxLvl:5,  baseCost:25, costMul:2.0, apply:function(lv){ return {speed:lv*0.3}; } },
    { id:'luck',  key:'resLuck',  maxLvl:5,  baseCost:30, costMul:2.0, apply:function(lv){ return {luck:lv}; } },
    { id:'carry', key:'resCarry', maxLvl:2,  baseCost:50, costMul:2.5, apply:function(lv){ return {carry:lv}; } },
];
let researchLevels = {}; // {hp:0, atk:0, ...}
function initResearch(){ for(var r of RESEARCH) if(!researchLevels[r.id]) researchLevels[r.id]=0; }
function getResearchCost(r){ return Math.floor(r.baseCost*Math.pow(r.costMul, researchLevels[r.id]||0)); }
function getMaxCarry(){ return MAX_CARRY+(researchLevels.carry||0); }
function getResearchBonus(stat){
    var total=0;
    for(var r of RESEARCH){
        var lv=researchLevels[r.id]||0;
        if(lv>0){ var b=r.apply(lv); if(b[stat]) total+=b[stat]; }
    }
    return total;
}

// ============ COLLECTIBLES (relics) ============
const COLLECTIBLES = [
    { id:'ancient_coin',   name:'Ancient Coin',   nameZh:'远古金币',   color:'#ffd700', desc:'A coin from a forgotten age', descZh:'来自遗忘时代的金币' },
    { id:'crystal_skull',  name:'Crystal Skull',  nameZh:'水晶头骨',   color:'#88ccff', desc:'Glows faintly in the dark', descZh:'在黑暗中微微发光' },
    { id:'dragon_scale',   name:'Dragon Scale',   nameZh:'龙鳞',       color:'#ff6622', desc:'Warm to the touch', descZh:'触感温热' },
    { id:'shadow_gem',     name:'Shadow Gem',     nameZh:'暗影宝石',   color:'#6644aa', desc:'Absorbs light around it', descZh:'吸收周围的光线' },
    { id:'phoenix_feather',name:'Phoenix Feather', nameZh:'凤凰羽',    color:'#ffaa00', desc:'Never stops smoldering', descZh:'永远在燃烧' },
    { id:'frost_heart',    name:'Frost Heart',    nameZh:'霜之心',     color:'#44ddff', desc:'Cold as the void', descZh:'冰冷如虚空' },
    { id:'earth_rune',     name:'Earth Rune',     nameZh:'大地符文',   color:'#ddaa22', desc:'Hums with deep energy', descZh:'嗡嗡作响的深层能量' },
    { id:'void_shard',     name:'Void Shard',     nameZh:'虚空碎片',   color:'#aa44dd', desc:'Seems to bend space', descZh:'似乎在扭曲空间' },
    { id:'star_fragment',  name:'Star Fragment',  nameZh:'星辰碎片',   color:'#ddddff', desc:'Fallen from the sky', descZh:'从天而降' },
    { id:'blood_ruby',     name:'Blood Ruby',     nameZh:'血红宝石',   color:'#ee4444', desc:'Pulses like a heartbeat', descZh:'像心跳一样脉动' },
    { id:'moss_agate',     name:'Moss Agate',     nameZh:'苔藓玛瑙',   color:'#44dd88', desc:'Living stone', descZh:'活着的石头' },
    { id:'thunder_pearl',  name:'Thunder Pearl',  nameZh:'雷霆珍珠',   color:'#ffdd44', desc:'Crackles with static', descZh:'噼啪作响的静电' },
];
let foundCollectibles = []; // array of collectible ids
function collectibleName(c){ return lang==='zh'?c.nameZh:c.name; }
function collectibleDesc(c){ return lang==='zh'?c.descZh:c.desc; }

// ============ KEYS & LOCKED ROOMS ============
let playerKeys = 0;
let lockedDoors = []; // {x,y,roomIdx,unlocked}
let collectibleDrops = []; // {x,y,collectibleId,collected}

// ============ SKILL TREE ============
const SKILL_BRANCHES = [
    { id:'combat', key:'skCombat', color:'#ee4444', skills:[
        { id:'powerStrike', key:'skPowerStrike', descKey:'skPowerStrikeD', cost:25 },
        { id:'lifeSteal',   key:'skLifeSteal',   descKey:'skLifeStealD',  cost:50 },
        { id:'berserker',   key:'skBerserker',   descKey:'skBerserkerD',  cost:80 },
        { id:'execute',     key:'skExecute',     descKey:'skExecuteD',    cost:120 },
    ]},
    { id:'alchemy', key:'skAlchemy', color:'#44dd88', skills:[
        { id:'doubleYield',  key:'skDoubleYield',  descKey:'skDoubleYieldD',  cost:25 },
        { id:'potionMaster', key:'skPotionMaster', descKey:'skPotionMasterD', cost:50 },
        { id:'transmute',    key:'skTransmute',    descKey:'skTransmuteD',    cost:80 },
        { id:'philoStone',   key:'skPhiloStone',   descKey:'skPhiloStoneD',   cost:120 },
    ]},
    { id:'survival', key:'skSurvival', color:'#4488ee', skills:[
        { id:'thickSkin',  key:'skThickSkin',  descKey:'skThickSkinD',  cost:25 },
        { id:'scavenger',  key:'skScavenger',  descKey:'skScavengerD',  cost:50 },
        { id:'dodge',      key:'skDodge',      descKey:'skDodgeD',      cost:80 },
        { id:'secondWind', key:'skSecondWind', descKey:'skSecondWindD', cost:120 },
    ]}
];
let unlockedSkills = {}; // {skillId: true}
let killCounter = 0; // for lifeSteal tracking
let secondWindUsed = false; // reset per floor
function hasSkill(id){ return !!unlockedSkills[id]; }
function applyDamageToPlayer(dmg){
    // Skill: dodge (12% chance)
    if(hasSkill('dodge')&&Math.random()<0.12){spawnFloat(player.x,player.y-20,lang==='zh'?'闪避！':'DODGE!','#4488ee');return false;}
    // Skill: thickSkin (-1 damage, min 1)
    if(hasSkill('thickSkin')) dmg=Math.max(1,dmg-1);
    playerStats.hp-=dmg;
    // Skill: secondWind (heal 30% HP once per floor when HP drops to 0)
    if(playerStats.hp<=0&&hasSkill('secondWind')&&!secondWindUsed){
        secondWindUsed=true;
        playerStats.hp=Math.floor(playerStats.maxHp*0.3);
        spawnFloat(player.x,player.y-20,lang==='zh'?'绝处逢生！':'SECOND WIND!','#4488ee');
        spawnParticles(player.x,player.y,'#4488ee',12);
        return dmg;
    }
    return dmg;
}
function getSkillCost(skill){
    // Skills in same branch must be unlocked in order
    return skill.cost;
}
function canUnlockSkill(branch, skillIdx){
    if(skillIdx>0){
        var prev=branch.skills[skillIdx-1];
        if(!hasSkill(prev.id)) return false;
    }
    return !hasSkill(branch.skills[skillIdx].id);
}

// ============ EXPLORED MAP (for minimap) ============
let explored = []; // 2D array same size as map

// Lab UI state
let labTab = null;
let selectedEssences = [];
let labScrollY = 0, labScrollTouchId = -1, labScrollLastY = 0, labScrollMoved = false;
let merchantScrollY = 0, merchantScrollTouchId = -1, merchantScrollLastY = 0, merchantScrollMoved = false;
let labMessage = '', labMessageTimer = 0;
let extractMini = null;
let labShopStock = []; // lab merchant stock

// ============ TUTORIAL SYSTEM ============
var tutorialDone = false;
var tutorialStep = 0; // 0=not started
var tutorialPhase = ''; // 'lab' or 'expedition'
var tutorialBlink = 0;
var TUTORIAL_LAB = [
    {key:'bench', en:'This is the Extraction Bench.\nPlace herbs here to extract essences.', zh:'这是提取台。\n把药材放在这里提取精华。'},
    {key:'cauldron', en:'This is the Cauldron.\nCombine 2 essences to brew potions.', zh:'这是炼金锅。\n将2种精华组合酿造药剂。'},
    {key:'shelf', en:'This is the Potion Shelf.\nEquip potions to your belt before expeditions.', zh:'这是药剂架。\n出发前把药剂装到腰带上。'},
    {key:'rack', en:'This is the Weapon Rack.\nManage and enchant your weapons here.', zh:'这是武器架。\n在这里管理和附魔武器。'},
    {key:'merch', en:'This is the Shop.\nBuy and sell items with gold.', zh:'这是商店。\n用金币买卖物品。'},
    {key:'research', en:'This is the Research Desk.\nSpend gold to permanently upgrade stats.', zh:'这是研究台。\n花费金币永久升级属性。'},
    {key:'door', en:'This is the Exit Door.\nChoose a biome and start an expedition!\nLet\'s go explore!', zh:'这是出口大门。\n选择区域开始探险！\n我们去探险吧！'},
];
var TUTORIAL_EXP = [
    {en:'Welcome to the expedition!\n'+('ontouchstart' in window?'Use the LEFT joystick to move.':'Use WASD keys to move around.'), zh:'欢迎来到探险！\n'+('ontouchstart' in window?'用左侧摇杆移动角色。':'用WASD键移动角色。')},
    {en:('ontouchstart' in window?'Use the RIGHT joystick to aim and attack.\nDrag it to change facing direction.':'Click to attack in the mouse direction.\nHold to keep attacking.'), zh:('ontouchstart' in window?'用右侧摇杆瞄准和攻击。\n拖动改变朝向。':'点击鼠标攻击。\n按住持续攻击。')},
    {en:'Defeat enemies to earn gold and find herbs.\nCollect herbs to bring back to the lab.', zh:'击败敌人获得金币和药材。\n收集药材带回炼金室。'},
    {en:'The minimap is in the top-right corner.\nFind the exit (green) to go to the next floor.\nDefeat the boss on the final floor!', zh:'小地图在右上角。\n找到出口（绿色）前往下一层。\n在最后一层击败Boss！'},
    {en:'Good luck, Alchemist!\nBrew potions to grow stronger.', zh:'祝你好运，炼金术士！\n酿造药剂让自己变强。'},
];

// ============ HELPERS ============
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function dist(a,b){ return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2); }
function angleTo(a,b){ return Math.atan2(b.y-a.y,b.x-a.x); }
function addHerb(key,count){ inventory.herbs[key]=(inventory.herbs[key]||0)+(count||1); }
function addEssence(key,count){ inventory.essences[key]=(inventory.essences[key]||0)+(count||1); }
function hasEssence(key){ return (inventory.essences[key]||0)>0; }
function findRecipe(e1,e2){
    for(var i=0;i<RECIPES.length;i++){ var r=RECIPES[i].ingredients; if((r[0]===e1&&r[1]===e2)||(r[0]===e2&&r[1]===e1)) return i; }
    return -1;
}
function findRecipeMulti(selected){
    // Find recipe matching any number of ingredients (2-4)
    for(var i=0;i<RECIPES.length;i++){
        var r=RECIPES[i].ingredients;
        if(r.length!==selected.length) continue;
        var sortedR=r.slice().sort();
        var sortedS=selected.slice().sort();
        var match=true;
        for(var j=0;j<sortedR.length;j++){
            if(sortedR[j]!==sortedS[j]){match=false;break;}
        }
        if(match) return i;
    }
    return -1;
}
function applyBuffs(){
    playerStats.atk=2+getResearchBonus('atk'); playerStats.def=0+getResearchBonus('def'); playerStats.speed=0+getResearchBonus('speed');
    playerStats.regen=0; playerStats.poison=0; playerStats.stealth=0;
    playerStats.revive=false; playerStats.maxHp=8+getResearchBonus('maxHp');
    var best={};
    for(var b of activeBuffs){ if(!best[b.effect]||b.tier>best[b.effect].tier) best[b.effect]=b; }
    for(var eff in best){
        var b=best[eff];
        if(eff==='attack') playerStats.atk+=b.value;
        else if(eff==='defense') playerStats.def+=b.value;
        else if(eff==='speed') playerStats.speed+=b.value;
        else if(eff==='maxhp'){ playerStats.maxHp+=b.value; playerStats.hp=Math.min(playerStats.hp,playerStats.maxHp); }
        else if(eff==='regen') playerStats.regen+=b.value;
        else if(eff==='poison') playerStats.poison+=b.value;
        else if(eff==='stealth') playerStats.stealth+=b.value;
        else if(eff==='revive') playerStats.revive=true;
    }
}
function spawnParticles(x,y,color,count){
    for(var i=0;i<count;i++){ var a=Math.random()*Math.PI*2,sp=Math.random()*3+1;
        particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:randInt(10,25),maxLife:25,size:Math.random()*3+1,color:color});
    }
}
function spawnFloat(x,y,text,color){ floatingTexts.push({x:x,y:y,text:text,color:color||'#fff',life:40,vy:-1.5}); }

// ============ SHOP / MERCHANT ============
function generateShopStock(biomeIdx, floorNum){
    shopStock = [];
    var bHerbs = BIOMES[biomeIdx].herbs;
    for(var i=0;i<2;i++){
        var hk = bHerbs[randInt(0,bHerbs.length-1)];
        shopStock.push({type:'herb', key:hk, price:randInt(3,8), count:randInt(1,3)});
    }
    var ri = randInt(0,RECIPES.length-1);
    var r = RECIPES[ri];
    shopStock.push({type:'potion', recipe:r, price:randInt(8,20)});
    var pool = WEAPONS.filter(function(w){ return w.tier>=Math.max(0,floorNum-1)&&w.tier<=floorNum+1; });
    if(pool.length>0){
        var wt = pool[randInt(0,pool.length-1)];
        shopStock.push({type:'weapon', weapon:makeWeapon(wt), price: 10+wt.tier*12+randInt(0,8)});
    }
    // Keys for locked rooms
    shopStock.push({type:'key', price:randInt(5,12+floorNum*3), count:1});
    return shopStock;
}

function refreshLabShop(){
    labShopStock = [];
    for(var i=0;i<2;i++){
        var bi=randInt(0,BIOMES.length-1);
        var hk=BIOMES[bi].herbs[randInt(0,BIOMES[bi].herbs.length-1)];
        labShopStock.push({type:'herb', key:hk, price:randInt(3,8), count:randInt(1,3)});
    }
    var ri=randInt(0,RECIPES.length-1), r=RECIPES[ri];
    labShopStock.push({type:'potion', recipe:r, price:randInt(8,20)});
    var maxTier=Math.min(4, Math.floor(expeditionNum/2)+1);
    var pool=WEAPONS.filter(function(w){return w.tier<=maxTier;});
    if(pool.length>0){
        var wt=pool[randInt(0,pool.length-1)];
        labShopStock.push({type:'weapon', weapon:makeWeapon(wt), price:10+wt.tier*12+randInt(0,8)});
    }
    labShopStock.push({type:'key', price:randInt(8,15), count:1});
}


// ============ MAP GENERATION ============
function generateMap(){
    map=[]; rooms=[];
    for(var y=0;y<MAP_H;y++){ map[y]=[]; for(var x=0;x<MAP_W;x++) map[y][x]=1; }
    var attempts=0, roomCount=randInt(6,10);
    while(rooms.length<roomCount&&attempts<200){
        attempts++;
        var rw=randInt(4,8),rh=randInt(4,7);
        var rx=randInt(1,MAP_W-rw-1),ry=randInt(1,MAP_H-rh-1);
        var overlap=false;
        for(var r of rooms){ if(rx-1<r.x+r.w&&rx+rw+1>r.x&&ry-1<r.y+r.h&&ry+rh+1>r.y){overlap=true;break;} }
        if(overlap) continue;
        for(var dy=0;dy<rh;dy++) for(var dx=0;dx<rw;dx++) map[ry+dy][rx+dx]=0;
        rooms.push({x:rx,y:ry,w:rw,h:rh,cx:rx+Math.floor(rw/2),cy:ry+Math.floor(rh/2)});
    }
    for(var i=1;i<rooms.length;i++) carveCorridor(rooms[i-1].cx,rooms[i-1].cy,rooms[i].cx,rooms[i].cy);
    for(var i=0;i<Math.floor(rooms.length/3);i++){
        var a=rooms[randInt(0,rooms.length-1)],b=rooms[randInt(0,rooms.length-1)];
        if(a!==b) carveCorridor(a.cx,a.cy,b.cx,b.cy);
    }
}
function carveCorridor(x1,y1,x2,y2){
    var x=x1,y=y1;
    while(x!==x2){if(y>=0&&y<MAP_H&&x>=0&&x<MAP_W){map[y][x]=0;if(y+1<MAP_H)map[y+1][x]=0;}x+=x<x2?1:-1;}
    while(y!==y2){if(y>=0&&y<MAP_H&&x>=0&&x<MAP_W){map[y][x]=0;if(x+1<MAP_W)map[y][x+1]=0;}y+=y<y2?1:-1;}
}
function findOpenTile(r){
    for(var i=0;i<50;i++){
        var tx=r.x+randInt(1,r.w-2),ty=r.y+randInt(1,r.h-2);
        if(map[ty][tx]===0) return {x:tx*TILE+TILE/2,y:ty*TILE+TILE/2};
    }
    return {x:r.cx*TILE+TILE/2,y:r.cy*TILE+TILE/2};
}
function isSolid(px,py){
    var tx=Math.floor(px/TILE),ty=Math.floor(py/TILE);
    if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H) return true;
    return map[ty][tx]>=1;
}
function tryMove(entity,dx,dy){
    var r=entity.radius||6;
    var nx=entity.x+dx,ny=entity.y+dy;
    if(!isSolid(nx-r,entity.y-r)&&!isSolid(nx+r,entity.y-r)&&!isSolid(nx-r,entity.y+r)&&!isSolid(nx+r,entity.y+r)) entity.x=nx;
    if(!isSolid(entity.x-r,ny-r)&&!isSolid(entity.x+r,ny-r)&&!isSolid(entity.x-r,ny+r)&&!isSolid(entity.x+r,ny+r)) entity.y=ny;
}
function lineOfSight(x1,y1,x2,y2){
    var dx=x2-x1,dy=y2-y1,d=Math.sqrt(dx*dx+dy*dy),steps=Math.ceil(d/(TILE/2));
    for(var i=0;i<=steps;i++){var t=i/steps;if(isSolid(x1+dx*t,y1+dy*t))return false;}
    return true;
}

// ============ BOSS ARENA ============
function generateBossArena(){
    map=[]; rooms=[];
    for(var y=0;y<MAP_H;y++){ map[y]=[]; for(var x=0;x<MAP_W;x++) map[y][x]=1; }
    // One big room filling most of the map
    var pad=2;
    var rx=pad, ry=pad, rw=MAP_W-pad*2, rh=MAP_H-pad*2;
    for(var dy=0;dy<rh;dy++) for(var dx=0;dx<rw;dx++) map[ry+dy][rx+dx]=0;
    rooms.push({x:rx,y:ry,w:rw,h:rh,cx:rx+Math.floor(rw/2),cy:ry+Math.floor(rh/2)});
    // Pillars (4 symmetrical pillars for cover)
    var cx=Math.floor(MAP_W/2), cy=Math.floor(MAP_H/2);
    var pillarOff=5;
    var pillars=[
        {x:cx-pillarOff,y:cy-pillarOff},{x:cx+pillarOff,y:cy-pillarOff},
        {x:cx-pillarOff,y:cy+pillarOff},{x:cx+pillarOff,y:cy+pillarOff}
    ];
    for(var p of pillars){
        for(var py2=p.y-1;py2<=p.y+1;py2++){
            for(var px2=p.x-1;px2<=p.x+1;px2++){
                if(py2>=0&&py2<MAP_H&&px2>=0&&px2<MAP_W) map[py2][px2]=1;
            }
        }
    }
    // Small decorative wall notches on edges for visual interest
    var notches=[[cx,pad],[cx,MAP_H-pad-1],[pad,cy],[MAP_W-pad-1,cy]];
    for(var n of notches) map[n[1]][n[0]]=1;
}

// ============ EXPEDITION SETUP ============
function setupFloor(biomeIdx, floor){
    var isBossFloor = (floor === MAX_FLOORS-1);
    if(isBossFloor) generateBossArena(); else generateMap();
    enemies=[]; herbDrops=[]; chests=[]; merchants=[];
    particles=[]; floatingTexts=[];
    lockedDoors=[]; collectibleDrops=[];
    stairsZone=null; exitZone=null;
    bossRef=null; bossSummonTimer=0; bossPhase=0;
    ambientParts=[];
    secondWindUsed=false; // reset per floor
    // Init explored map
    explored=[];
    for(var y=0;y<MAP_H;y++){ explored[y]=[]; for(var x=0;x<MAP_W;x++) explored[y][x]=isBossFloor?true:false; }

    var startRoom = rooms[0];
    var sp;
    if(isBossFloor){
        // Player starts at bottom center of arena
        sp={x:Math.floor(MAP_W/2)*TILE+TILE/2, y:(MAP_H-4)*TILE+TILE/2};
    } else {
        sp = findOpenTile(startRoom);
    }
    if(!player) player={x:sp.x,y:sp.y,angle:0,radius:6,animFrame:0,moving:false,attackAnim:0};
    else { player.x=sp.x; player.y=sp.y; }

    if(isBossFloor){
        // Boss floor: exit appears after boss defeated
        exitZone = {x:-999,y:-999}; // hidden until boss dies
        bossDefeated = false;
    } else {
        // Stairs or exit in last room
        var lastRoom = rooms[rooms.length-1];
        var ep = findOpenTile(lastRoom);
        stairsZone = {x:ep.x, y:ep.y};
    }

    // Spawn enemies
    var baseHP = 2+Math.floor(expeditionNum*0.5)+floor*2;
    var baseATK = 1+Math.floor(expeditionNum*0.3)+floor;
    if(!isBossFloor){
        var enemyCount = Math.min(2+expeditionNum+floor, 6);
        for(var i=1;i<rooms.length;i++){
            var r=rooms[i], cnt=randInt(1,enemyCount);
            for(var j=0;j<cnt;j++){
                var pos=findOpenTile(r);
                var isElite = (j===0 && i>1 && Math.random()<0.3+floor*0.15);
                var hpMul = isElite?2.5:1, atkMul = isElite?1.8:1;
                enemies.push({
                    x:pos.x,y:pos.y,angle:Math.random()*Math.PI*2,
                    hp:Math.ceil(baseHP*hpMul), maxHp:Math.ceil(baseHP*hpMul),
                    radius:isElite?9:7, alert:false, alertTimer:0,
                    patrolAngle:Math.random()*Math.PI*2, patrolTimer:randInt(60,180),
                    animFrame:0, attackCD:0, atk:Math.ceil(baseATK*atkMul),
                    isElite:isElite, isBoss:false
                });
            }
        }
    }

    // Spawn boss in arena center
    if(isBossFloor){
        var bossHP = baseHP*6+expeditionNum*3;
        var bossATK = Math.ceil(baseATK*2.5);
        var bcx=Math.floor(MAP_W/2)*TILE+TILE/2, bcy=Math.floor(MAP_H/2)*TILE+TILE/2;
        var boss={
            x:bcx,y:bcy,angle:0,
            hp:bossHP, maxHp:bossHP,
            radius:16, alert:true, alertTimer:9999,
            patrolAngle:0, patrolTimer:60,
            animFrame:0, attackCD:0, atk:bossATK,
            isElite:false, isBoss:true,
            // Boss special properties
            chargeCD:0, charging:false, chargeAngle:0, chargeTimer:0,
            slamCD:0
        };
        enemies.push(boss);
        bossRef=boss;
        // Boss entrance text
        spawnFloat(bcx,bcy-30,T('bossAppears'),'#ff4444');
        playBGM('boss');
    }

    // Spawn herb pickups (not on boss floor)
    if(!isBossFloor){
    var biomeHerbs = currentBiome.herbs;
    for(var i=1;i<rooms.length;i++){
        var r=rooms[i], hCount=randInt(1,3);
        for(var h=0;h<hCount;h++){
            var pos=findOpenTile(r);
            herbDrops.push({x:pos.x,y:pos.y,herbKey:biomeHerbs[randInt(0,biomeHerbs.length-1)],bobOffset:Math.random()*6.28,collected:false});
        }
    }

    // Spawn chests (weapon/gold drops)
    var chestCount = randInt(1,2+floor);
    for(var i=0;i<chestCount;i++){
        var cr = rooms[randInt(1,rooms.length-1)];
        var cp = findOpenTile(cr);
        var pool = getWeaponDropPool(floor, false);
        var hasWeapon = Math.random()<0.4;
        chests.push({
            x:cp.x, y:cp.y, opened:false,
            goldReward: randInt(3+floor*2, 8+floor*5),
            weaponReward: hasWeapon&&pool.length>0 ? makeWeapon(pool[randInt(0,pool.length-1)]) : null
        });
    }

    // Spawn merchant on floor 0 or 1 (not boss floor)
    if(rooms.length>3){
        var mr = rooms[Math.min(2, rooms.length-2)];
        var mp = findOpenTile(mr);
        merchants.push({x:mp.x, y:mp.y, interacted:false});
    }

    // Locked rooms with collectibles (1-2 per floor, skip start/end rooms)
    var lockCandidates = [];
    for(var ri=2;ri<rooms.length-1;ri++) lockCandidates.push(ri);
    var lockCount = Math.min(lockCandidates.length, randInt(1,2));
    for(var li=0;li<lockCount&&lockCandidates.length>0;li++){
        var pick = randInt(0,lockCandidates.length-1);
        var lri = lockCandidates.splice(pick,1)[0];
        var lr = rooms[lri];
        // Find corridor entry point to this room and block it
        var doorPlaced = false;
        for(var dy=0;dy<lr.h&&!doorPlaced;dy++){
            for(var dx=0;dx<lr.w&&!doorPlaced;dx++){
                var tx=lr.x+dx, ty=lr.y+dy;
                if(map[ty][tx]!==0) continue;
                // Check if this tile is on the room border and adjacent to a corridor
                var onEdge = (dx===0||dx===lr.w-1||dy===0||dy===lr.h-1);
                if(!onEdge) continue;
                var adjWall = 0, adjFloor = 0;
                var dirs = [{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}];
                for(var di=0;di<dirs.length;di++){
                    var nx=tx+dirs[di].x, ny=ty+dirs[di].y;
                    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) continue;
                    if(map[ny][nx]===0) adjFloor++;
                    else adjWall++;
                }
                if(adjWall>=2 && adjFloor>=1){
                    map[ty][tx]=2; // locked door tile
                    lockedDoors.push({tx:tx,ty:ty,roomIdx:lri,unlocked:false});
                    doorPlaced=true;
                }
            }
        }
        if(doorPlaced){
            // Place collectible inside locked room
            var cp = findOpenTile(lr);
            var available = COLLECTIBLES.filter(function(c){ return foundCollectibles.indexOf(c.id)<0; });
            if(available.length===0) available = COLLECTIBLES; // all found, allow duplicates
            var coll = available[randInt(0,available.length-1)];
            collectibleDrops.push({x:cp.x,y:cp.y,collectibleId:coll.id,collected:false});
            // Also add extra gold chest
            chests.push({x:cp.x+TILE,y:cp.y,opened:false,goldReward:randInt(10+floor*5,25+floor*10),weaponReward:null});
        }
    }
    } // end if(!isBossFloor)
}

function startExpedition(biomeIdx){
    currentBiome = BIOMES[biomeIdx];
    expeditionNum++;
    currentFloor = 0;
    bossDefeated = false;
    weaponPopup = null;
    merchantPopup = null;
    attackCooldown=0; regenTimer=0; screenShake=0; extracting=0;
    killCounter=0; // reset for lifeSteal tracking
    missionTimer = 90*60; // 90 seconds total

    // Generate shop stock for merchant
    generateShopStock(biomeIdx, 0);

    // Process carried potions - activate buffs but keep all potions
    activeBuffs=[];
    for(var i=0;i<carriedPotions.length;i++){
        var p=carriedPotions[i];
        if(p.effect!=='heal'&&p.effect!=='revive'){
            var existing=activeBuffs.findIndex(function(b){return b.effect===p.effect;});
            if(existing>=0){ if(p.tier>=activeBuffs[existing].tier) activeBuffs[existing]={effect:p.effect,tier:p.tier,value:p.value,name:p.name}; }
            else activeBuffs.push({effect:p.effect,tier:p.tier,value:p.value,name:p.name});
        }
    }
    applyBuffs();
    playerStats.hp=playerStats.maxHp;
    player=null;
    setupFloor(biomeIdx, 0);
    state='expedition';
    if(!tutorialDone&&tutorialPhase===''){tutorialPhase='expedition';tutorialStep=0;}
    // Play biome BGM
    playBGM(currentBiome.enemyType);
}

function goNextFloor(){
    currentFloor++;
    if(currentFloor>=MAX_FLOORS){ endExpedition(); return; }
    generateShopStock(BIOMES.indexOf(currentBiome), currentFloor);
    setupFloor(BIOMES.indexOf(currentBiome), currentFloor);
    spawnFloat(player.x,player.y-20, T('floor')+' '+(currentFloor+1), '#ffdd44');
}

// ============ INPUT ============
window.addEventListener('keydown',function(e){
    keys[e.code]=true;
    if(state==='expedition'){
        if(e.code==='Digit1') useCarriedPotion(0);
        else if(e.code==='Digit2') useCarriedPotion(1);
        else if(e.code==='Digit3') useCarriedPotion(2);
        else if(e.code==='KeyE'&&nearMerchantRef&&!weaponPopup&&!merchantPopup){
            merchantPopup=nearMerchantRef;
            merchantScrollY=0;
            generateShopStock(BIOMES.indexOf(currentBiome), currentFloor);
            playSound('click');
        }
    }
});
window.addEventListener('keyup',function(e){keys[e.code]=false;});
canvas.addEventListener('mousemove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;});
canvas.addEventListener('mousedown',function(e){mouse.down=true;});
canvas.addEventListener('mouseup',function(e){mouse.down=false;});
canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
canvas.addEventListener('wheel',function(e){
    if(state==='lab'&&labTab){
        labScrollY-=e.deltaY;
        if(labScrollY>0) labScrollY=0;
        if(labScrollY<-600) labScrollY=-600;
        e.preventDefault();
    }
    if(state==='expedition'&&merchantPopup){
        merchantScrollY-=e.deltaY;
        if(merchantScrollY>0) merchantScrollY=0;
        if(merchantScrollY<-600) merchantScrollY=-600;
        e.preventDefault();
    }
},{passive:false});

canvas.addEventListener('touchstart',function(e){
    e.preventDefault();
    if(!audioCtx) initAudio();
    var t0=e.changedTouches[0];
    if(state==='menu'){handleMenuTouch(t0.clientX,t0.clientY);return;}
    if(state==='lab'){
        if(showSettings){handleSettingsClick(t0.clientX,t0.clientY);return;}
        if(tutorialPhase==='lab'){handleTutorialClick(t0.clientX,t0.clientY);return;}
        if(labTab){
            var W=canvas.width,H=canvas.height;
            var pw=Math.min(W-40,520),ph=Math.min(H-60,500);
            var ppx=(W-pw)/2,ppy=(H-ph)/2;
            if(t0.clientX>=ppx&&t0.clientX<=ppx+pw&&t0.clientY>=ppy&&t0.clientY<=ppy+ph){
                labScrollTouchId=t0.identifier;labScrollLastY=t0.clientY;labScrollMoved=false;
                return;
            }
        }
        handleLabClick(t0.clientX,t0.clientY);return;
    }
    if(state==='gameover'){handleGameOverTouch(t0.clientX,t0.clientY);return;}
    if(state!=='expedition') return;
    if(showSettings){handleSettingsClick(t0.clientX,t0.clientY);return;}
    if(tutorialPhase==='expedition'){handleTutorialClick(t0.clientX,t0.clientY);return;}
    // Handle popups first
    if(weaponPopup||merchantPopup||buffPopup){
        if(buffPopup){
            var W=canvas.width,H=canvas.height;
            var pw3=280,ph3=200,px3=(W-pw3)/2,py3=(H-ph3)/2;
            if(cx<px3||cx>px3+pw3||cy<py3||cy>py3+ph3){buffPopup=null;playSound('click');return;}
        }
        if(merchantPopup){
            var W=canvas.width,H=canvas.height;
            var pw2=Math.min(W-40,420),ph2=Math.min(H-60,400),px2=(W-pw2)/2,py2=(H-ph2)/2;
            if(t0.clientX>=px2&&t0.clientX<=px2+pw2&&t0.clientY>=py2&&t0.clientY<=py2+ph2){
                merchantScrollTouchId=t0.identifier;merchantScrollLastY=t0.clientY;merchantScrollMoved=false;
                return;
            }
        }
        handleExpeditionPopupClick(t0.clientX,t0.clientY);return;
    }
    // Tap near merchant to interact
    if(nearMerchantRef&&!weaponPopup&&!merchantPopup){
        var mx2=nearMerchantRef.x-camera.x,my2=nearMerchantRef.y-camera.y;
        if(Math.abs(t0.clientX-mx2)<50&&Math.abs(t0.clientY-my2)<50){
            merchantPopup=nearMerchantRef;
            merchantScrollY=0;
            generateShopStock(BIOMES.indexOf(currentBiome), currentFloor);
            playSound('click');return;
        }
    }
    for(var i=0;i<e.changedTouches.length;i++){
        var t=e.changedTouches[i];
        if(carriedPotions.length>0){
            var qbSlotW=48,qbSlotH=48,qbGap=6;
            var qbTotalW=carriedPotions.length*(qbSlotW+qbGap)-qbGap;
            var qbX=Math.floor((canvas.width-qbTotalW)/2),qbY=canvas.height-(isMobile?55:60);
            var hitSlot=false;
            for(var pi=0;pi<carriedPotions.length;pi++){
                var sx=qbX+pi*(qbSlotW+qbGap);
                if(t.clientX>=sx&&t.clientX<=sx+qbSlotW&&t.clientY>=qbY&&t.clientY<=qbY+qbSlotH){useCarriedPotion(pi);hitSlot=true;break;}
            }
            if(hitSlot) continue;
        }
        if(t.clientX<canvas.width/2){
            mobileStick.active=true;mobileStick.sx=t.clientX;mobileStick.sy=t.clientY;
            mobileStick.cx=t.clientX;mobileStick.cy=t.clientY;mobileStick.id=t.identifier;
        } else {
            mobileAimStick.active=true;mobileAimStick.sx=t.clientX;mobileAimStick.sy=t.clientY;
            mobileAimStick.cx=t.clientX;mobileAimStick.cy=t.clientY;mobileAimStick.id=t.identifier;
            mouse.down=true;
        }
    }
},{passive:false});
canvas.addEventListener('touchmove',function(e){
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
        var t=e.changedTouches[i];
        if(t.identifier===labScrollTouchId&&state==='lab'&&labTab){
            var dy=t.clientY-labScrollLastY;
            if(Math.abs(dy)>3) labScrollMoved=true;
            labScrollY+=dy;
            if(labScrollY>0) labScrollY=0;
            if(labScrollY<-600) labScrollY=-600;
            labScrollLastY=t.clientY;
            continue;
        }
        if(t.identifier===merchantScrollTouchId&&state==='expedition'&&merchantPopup){
            var dy=t.clientY-merchantScrollLastY;
            if(Math.abs(dy)>3) merchantScrollMoved=true;
            merchantScrollY+=dy;
            if(merchantScrollY>0) merchantScrollY=0;
            if(merchantScrollY<-600) merchantScrollY=-600;
            merchantScrollLastY=t.clientY;
            continue;
        }
        if(t.identifier===mobileStick.id){mobileStick.cx=t.clientX;mobileStick.cy=t.clientY;}
        else if(t.identifier===mobileAimStick.id){mobileAimStick.cx=t.clientX;mobileAimStick.cy=t.clientY;}
        else{mouse.x=t.clientX;mouse.y=t.clientY;}
    }
},{passive:false});
canvas.addEventListener('touchend',function(e){
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
        var t=e.changedTouches[i];
        if(t.identifier===labScrollTouchId){
            labScrollTouchId=-1;
            if(!labScrollMoved){
                handleLabClick(t.clientX, t.clientY);
            }
            continue;
        }
        if(t.identifier===merchantScrollTouchId){
            merchantScrollTouchId=-1;
            if(!merchantScrollMoved){
                handleExpeditionPopupClick(t.clientX, t.clientY);
            }
            continue;
        }
        if(t.identifier===mobileStick.id) mobileStick.active=false;
        else if(t.identifier===mobileAimStick.id){ mobileAimStick.active=false; mouse.down=false; }
        else mouse.down=false;
    }
},{passive:false});

// ============ EXPEDITION UPDATE ============
function update(){
    // Pause game during tutorial
    if(tutorialPhase==='expedition') return;
    // Lab extraction minigame update
    if(state==='lab'&&extractMini&&extractMini.step===3){
        var em=extractMini;
        if(em.heatOn) em.temp+=em.tempSpeed*1.8; else em.temp-=em.tempSpeed*0.7;
        em.temp=Math.max(0,Math.min(100,em.temp));
        for(var zi=em.tempZones.length-1;zi>=0;zi--){
            var z=em.tempZones[zi];
            if(em.temp>=z.lo&&em.temp<=z.hi){ em.holdTimer++; em.distillScore+=z.rate; break; }
        }
        if(em.holdTimer>=em.holdTarget) finishExtraction();
        if(em.temp>=95||em.temp<=5) em.quality-=0.3;
    }
    if(state!=='expedition') return;
    if(weaponPopup||merchantPopup||buffPopup) return; // pause while popup open
    frameCount++;
    if(currentFloor<MAX_FLOORS-1) missionTimer--; // no timer on boss floor
    if(missionTimer<=0){endExpedition();return;}

    // Movement
    var mx=0,my=0;
    if(keys['KeyW']||keys['ArrowUp']) my=-1;
    if(keys['KeyS']||keys['ArrowDown']) my=1;
    if(keys['KeyA']||keys['ArrowLeft']) mx=-1;
    if(keys['KeyD']||keys['ArrowRight']) mx=1;
    if(mobileStick.active){
        var sdx=mobileStick.cx-mobileStick.sx,sdy=mobileStick.cy-mobileStick.sy;
        var sd=Math.sqrt(sdx*sdx+sdy*sdy);
        if(sd>10){mx=sdx/sd;my=sdy/sd;}
    }
    player.moving=(mx!==0||my!==0);
    if(player.moving){
        var len=Math.sqrt(mx*mx+my*my);mx/=len;my/=len;
        var spd=PLAYER_SPEED+playerStats.speed*0.5;
        tryMove(player,mx*spd,my*spd);
        if(frameCount%6===0) player.animFrame=(player.animFrame+1)%4;
    }
    if(isMobile&&mobileAimStick.active){
        var adx=mobileAimStick.cx-mobileAimStick.sx,ady=mobileAimStick.cy-mobileAimStick.sy;
        var ad=Math.sqrt(adx*adx+ady*ady);
        if(ad>10) player.angle=Math.atan2(ady,adx);
    } else {
        player.angle=Math.atan2(mouse.y+camera.y-player.y,mouse.x+camera.x-player.x);
    }

    // Attack
    if(attackCooldown>0) attackCooldown--;
    var wepSpeedMul = equippedWeapon ? equippedWeapon.speed : 1;
    var wepRange = equippedWeapon ? equippedWeapon.range : 35;
    var wepDmg = equippedWeapon ? equippedWeapon.dmg : 1;
    var baseCooldown = Math.max(8, Math.round(18/wepSpeedMul));
    if(mouse.down&&attackCooldown<=0){
        attackCooldown=baseCooldown;
        player.attackAnim=8;
        playSound('swing');
        var atkRange=wepRange+player.radius+8, atkArc=1.0;
        for(var i=enemies.length-1;i>=0;i--){
            var e=enemies[i];
            var d=dist(player,e);
            if(d<atkRange){
                var a=angleTo(player,e);
                var diff=Math.abs(a-player.angle);
                if(diff>Math.PI) diff=Math.PI*2-diff;
                if(diff<atkArc){
                    var dmg=Math.max(1, playerStats.atk+wepDmg-Math.floor(e.maxHp*0.05));
                    if(playerStats.poison>0) dmg+=1;
                    // Skill: powerStrike (10% crit)
                    if(hasSkill('powerStrike')&&Math.random()<0.1){dmg=Math.floor(dmg*1.8);spawnFloat(e.x,e.y-20,'CRIT!','#ffdd00');}
                    // Skill: berserker (+20% ATK when HP<30%)
                    if(hasSkill('berserker')&&playerStats.hp<playerStats.maxHp*0.3) dmg=Math.floor(dmg*1.2);
                    // Skill: execute (+50% DMG to enemies <25% HP)
                    if(hasSkill('execute')&&e.hp<e.maxHp*0.25) dmg=Math.floor(dmg*1.5);
                    // Enchant bonus
                    if(equippedWeapon&&equippedWeapon.enchant){
                        var ench=equippedWeapon.enchant;
                        if(ench.effect==='attack') dmg+=ench.value;
                        else if(ench.effect==='poison') dmg+=2;
                    }
                    e.hp-=dmg;
                    spawnParticles(e.x,e.y,'#ff0',4);
                    spawnFloat(e.x,e.y-10,'-'+dmg,'#ff4444');
                    playSound('enemyHit');
                    screenShake=3;
                    e.alert=true;e.alertTimer=180;
                    if(e.hp<=0){
                        spawnParticles(e.x,e.y,'#ffd700',8);
                        var luckBonus = getResearchBonus('luck');
                        var goldDrop = e.isBoss?randInt(15,30+luckBonus*3):(e.isElite?randInt(5,12+luckBonus*2):randInt(1,4+luckBonus));
                        // Skill: scavenger (+30% gold)
                        if(hasSkill('scavenger')) goldDrop=Math.floor(goldDrop*1.3);
                        gold+=goldDrop;
                        spawnFloat(e.x,e.y-10,'+'+goldDrop+' G','#ffd700');
                        totalScore+=e.isBoss?50:(e.isElite?25:10);
                        // Skill: lifeSteal (heal 1 HP per 5 kills)
                        if(hasSkill('lifeSteal')){killCounter++;if(killCounter>=5){killCounter=0;if(playerStats.hp<playerStats.maxHp){playerStats.hp=Math.min(playerStats.maxHp,playerStats.hp+1);spawnFloat(player.x,player.y-20,'+1 HP','#ee4444');}}}
                        // Weapon drop chance (luck increases chance)
                        if(e.isBoss||e.isElite||(Math.random()<0.1+luckBonus*0.04)){
                            var pool=getWeaponDropPool(currentFloor,e.isBoss);
                            if(pool.length>0){
                                var wt=pool[randInt(0,pool.length-1)];
                                var dropped=makeWeapon(wt);
                                weaponPopup={weapon:dropped,x:e.x,y:e.y};
                            }
                        }
                        if(e.isBoss){
                            bossDefeated=true;
                            bossRef=null;
                            // Reveal exit in arena center
                            exitZone={x:Math.floor(MAP_W/2)*TILE+TILE/2,y:Math.floor(MAP_H/2)*TILE+TILE/2};
                            spawnFloat(player.x,player.y-30,T('bossDefeated'),'#ffdd44');
                            spawnParticles(e.x,e.y,'#ffdd44',20);
                            playSound('levelUp');
                        } else if(e.isElite){
                            spawnFloat(e.x,e.y-25,T('eliteSlain'),'#ffaa00');
                        }
                        enemies.splice(i,1);
                    }
                }
            }
        }
    }
    if(player.attackAnim>0) player.attackAnim--;

    // Camera
    camera.x=player.x-canvas.width/2;
    camera.y=player.y-canvas.height/2;

    // Enemy AI
    for(var e of enemies){
        var d=dist(e,player);

        // ===== BOSS SPECIAL AI =====
        if(e.isBoss&&bossRef===e){
            e.alert=true;e.alertTimer=9999;
            e.angle=angleTo(e,player);
            // Phase check: enrage below 40% HP
            if(bossPhase===0&&e.hp<e.maxHp*0.4){
                bossPhase=1;
                spawnFloat(e.x,e.y-30,lang==='zh'?'狂暴！':'ENRAGED!','#ff0000');
                spawnParticles(e.x,e.y,'#ff0000',15);
                screenShake=8;playSound('levelUp');
            }
            var spdMul=bossPhase===1?1.3:1.0;
            // Charge attack
            if(e.charging){
                e.chargeTimer--;
                var cspd=4.5*spdMul;
                tryMove(e,Math.cos(e.chargeAngle)*cspd,Math.sin(e.chargeAngle)*cspd);
                spawnParticles(e.x,e.y,bossPhase===1?'#ff4400':'#ff8800',1);
                if(d<30){
                    var dmg=Math.max(1,Math.ceil(e.atk*1.5)-playerStats.def);
                    var actualDmg=applyDamageToPlayer(dmg);
                    if(actualDmg!==false){spawnFloat(player.x,player.y-10,'-'+actualDmg,'#ff4444');
                    spawnParticles(player.x,player.y,'#ff4444',8);
                    screenShake=6;playSound('hit');}
                    e.charging=false;e.chargeCD=180;e.attackCD=30;
                    if(playerStats.hp<=0){
                        if(playerStats.revive){playerStats.revive=false;playerStats.hp=Math.floor(playerStats.maxHp/2);spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');spawnParticles(player.x,player.y,'#ffaa00',12);activeBuffs=activeBuffs.filter(function(b){return b.effect!=='revive';});}
                        else{state='gameover';return;}
                    }
                }
                if(e.chargeTimer<=0) e.charging=false;
            } else {
                // Normal movement toward player
                var espd=ENEMY_SPEED*0.8*spdMul;
                if(d>35) tryMove(e,Math.cos(e.angle)*espd,Math.sin(e.angle)*espd);
                // Melee attack
                if(d<40&&e.attackCD<=0){
                    var dmg=Math.max(1,e.atk-playerStats.def);
                    var actualDmg=applyDamageToPlayer(dmg);
                    if(actualDmg!==false){spawnFloat(player.x,player.y-10,'-'+actualDmg,'#ee4444');
                    spawnParticles(player.x,player.y,'#ee4444',4);
                    screenShake=4;playSound('hit');}
                    e.attackCD=bossPhase===1?22:30;
                    if(playerStats.hp<=0){
                        if(playerStats.revive){playerStats.revive=false;playerStats.hp=Math.floor(playerStats.maxHp/2);spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');spawnParticles(player.x,player.y,'#ffaa00',12);activeBuffs=activeBuffs.filter(function(b){return b.effect!=='revive';});}
                        else{state='gameover';return;}
                    }
                }
                // Initiate charge when far enough
                if(e.chargeCD<=0&&d>100&&d<300){
                    e.charging=true;e.chargeAngle=e.angle;e.chargeTimer=30;
                    e.chargeCD=bossPhase===1?120:200;
                    spawnFloat(e.x,e.y-20,lang==='zh'?'冲锋！':'CHARGE!','#ff8800');
                    playSound('swing');
                }
                // Ground slam (AoE) when close
                if(e.slamCD<=0&&d<60){
                    e.slamCD=bossPhase===1?150:240;
                    // Damage all nearby
                    var slamDmg=Math.max(1,Math.ceil(e.atk*0.8)-playerStats.def);
                    if(d<50){
                        var actualSlam=applyDamageToPlayer(slamDmg);
                        if(actualSlam!==false){spawnFloat(player.x,player.y-10,'-'+actualSlam,'#ff6644');
                        screenShake=6;playSound('hit');}
                        if(playerStats.hp<=0){
                            if(playerStats.revive){playerStats.revive=false;playerStats.hp=Math.floor(playerStats.maxHp/2);spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');spawnParticles(player.x,player.y,'#ffaa00',12);activeBuffs=activeBuffs.filter(function(b){return b.effect!=='revive';});}
                            else{state='gameover';return;}
                        }
                    }
                    // Visual slam ring
                    for(var si=0;si<20;si++){var sa=Math.PI*2*si/20;particles.push({x:e.x+Math.cos(sa)*40,y:e.y+Math.sin(sa)*40,vx:Math.cos(sa)*2,vy:Math.sin(sa)*2,life:20,maxLife:20,size:3,color:bossPhase===1?'#ff4400':'#ff8844'});}
                    spawnFloat(e.x,e.y-20,lang==='zh'?'震地！':'SLAM!','#ff6644');
                }
            }
            if(e.chargeCD>0) e.chargeCD--;
            if(e.slamCD>0) e.slamCD--;
            // Summon minions periodically
            bossSummonTimer++;
            var summonInterval=bossPhase===1?360:540; // faster in enrage
            var maxMinions=bossPhase===1?5:3;
            var minionCount=enemies.filter(function(en){return !en.isBoss&&!en.isElite;}).length;
            if(bossSummonTimer>=summonInterval&&minionCount<maxMinions){
                bossSummonTimer=0;
                var summonCount=bossPhase===1?3:2;
                var baseHP2=2+Math.floor(expeditionNum*0.5)+currentFloor*2;
                var baseATK2=1+Math.floor(expeditionNum*0.3)+currentFloor;
                for(var si=0;si<summonCount;si++){
                    var sa=Math.random()*Math.PI*2, sr=60+Math.random()*40;
                    var sx2=e.x+Math.cos(sa)*sr, sy2=e.y+Math.sin(sa)*sr;
                    if(!isSolid(sx2,sy2)){
                        enemies.push({
                            x:sx2,y:sy2,angle:Math.random()*Math.PI*2,
                            hp:Math.ceil(baseHP2*0.8),maxHp:Math.ceil(baseHP2*0.8),
                            radius:6,alert:true,alertTimer:180,
                            patrolAngle:Math.random()*Math.PI*2,patrolTimer:60,
                            animFrame:0,attackCD:0,atk:Math.ceil(baseATK2*0.7),
                            isElite:false,isBoss:false
                        });
                        spawnParticles(sx2,sy2,'#aa44dd',6);
                    }
                }
                spawnFloat(e.x,e.y-25,lang==='zh'?'召唤！':'SUMMON!','#aa44dd');
                playSound('craft');
            }
            if(e.attackCD>0) e.attackCD--;
            if(frameCount%6===0) e.animFrame=(e.animFrame+1)%3;
            continue; // skip normal AI for boss
        }

        // ===== NORMAL ENEMY AI =====
        var sightRange = e.isElite?180:150;
        var canSee=d<sightRange&&lineOfSight(e.x,e.y,player.x,player.y);
        if(playerStats.stealth>0&&!e.alert) canSee=canSee&&d<60;
        if(canSee||(e.alert&&d<200)){
            e.alert=true;e.alertTimer=180;
            e.angle=angleTo(e,player);
            var espd = e.isElite?ENEMY_SPEED*1.1:ENEMY_SPEED*1.2;
            if(d>28) tryMove(e,Math.cos(e.angle)*espd,Math.sin(e.angle)*espd);
            if(d<30&&e.attackCD<=0){
                var dmg=Math.max(1,e.atk-playerStats.def);
                var actualDmg=applyDamageToPlayer(dmg);
                if(actualDmg!==false){spawnFloat(player.x,player.y-10,'-'+actualDmg,'#ee4444');
                spawnParticles(player.x,player.y,'#ee4444',4);
                screenShake=4; playSound('hit');}
                e.attackCD=40;
                if(playerStats.hp<=0){
                    if(playerStats.revive){
                        playerStats.revive=false;
                        playerStats.hp=Math.floor(playerStats.maxHp/2);
                        spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');
                        spawnParticles(player.x,player.y,'#ffaa00',12);
                        activeBuffs=activeBuffs.filter(function(b){return b.effect!=='revive';});
                    } else { state='gameover'; return; }
                }
            }
        } else {
            if(e.alertTimer>0){e.alertTimer--;if(e.alertTimer<=0)e.alert=false;}
            e.patrolTimer--;
            if(e.patrolTimer<=0){e.patrolAngle=Math.random()*Math.PI*2;e.patrolTimer=randInt(60,180);}
            tryMove(e,Math.cos(e.patrolAngle)*ENEMY_SPEED*0.3,Math.sin(e.patrolAngle)*ENEMY_SPEED*0.3);
        }
        if(e.attackCD>0) e.attackCD--;
        if(frameCount%8===0) e.animFrame=(e.animFrame+1)%3;
        if(e.alert){for(var o of enemies){if(o!==e&&!o.alert&&dist(e,o)<100){o.alert=true;o.alertTimer=120;}}}
    }

    // Regen
    if(playerStats.regen>0){
        regenTimer++;
        if(regenTimer>=120){regenTimer=0;if(playerStats.hp<playerStats.maxHp){playerStats.hp++;spawnFloat(player.x,player.y-10,'+1','#44dd88');}}
    }

    // Herb pickup
    for(var h of herbDrops){
        if(!h.collected&&dist(player,h)<22){
            h.collected=true; addHerb(h.herbKey,1);
            spawnFloat(h.x,h.y-10,'+'+herbName(h.herbKey),'#44dd88');
            spawnParticles(h.x,h.y,'#44dd88',5); playSound('pickup');
        }
    }

    // Chest interaction
    for(var ch of chests){
        if(!ch.opened&&dist(player,ch)<24){
            ch.opened=true;
            gold+=ch.goldReward;
            spawnFloat(ch.x,ch.y-10,'+'+ch.goldReward+' G','#ffd700');
            spawnParticles(ch.x,ch.y,'#ffd700',6);
            playSound('pickup');
            if(ch.weaponReward){
                weaponPopup={weapon:ch.weaponReward,x:ch.x,y:ch.y};
            }
        }
    }

    // Merchant interaction — show prompt when near, open on E key or click
    var nearMerchant = null;
    for(var m of merchants){
        if(dist(player,m)<50) nearMerchant=m;
    }
    nearMerchantRef = nearMerchant;

    // Locked door interaction — press E or walk into to use key
    for(var ld of lockedDoors){
        if(ld.unlocked) continue;
        var ldx=ld.tx*TILE+TILE/2, ldy=ld.ty*TILE+TILE/2;
        if(dist(player,{x:ldx,y:ldy})<30){
            if(playerKeys>0){
                playerKeys--;
                ld.unlocked=true;
                map[ld.ty][ld.tx]=0;
                spawnFloat(ldx,ldy-10,T('key')+' -1','#ffcc44');
                spawnParticles(ldx,ldy,'#ffcc44',8);
                playSound('craft');
            } else {
                // Show hint (only once per second)
                if(frameCount%60===0) spawnFloat(ldx,ldy-10,T('needKey'),'#ff4444');
            }
        }
    }

    // Collectible pickup
    for(var cd of collectibleDrops){
        if(!cd.collected&&dist(player,cd)<22){
            cd.collected=true;
            if(foundCollectibles.indexOf(cd.collectibleId)<0) foundCollectibles.push(cd.collectibleId);
            var coll=COLLECTIBLES.find(function(c){return c.id===cd.collectibleId;});
            spawnFloat(cd.x,cd.y-10,T('newRelic')+' '+collectibleName(coll),coll.color);
            spawnParticles(cd.x,cd.y,coll.color,10);
            playSound('levelUp');
            totalScore+=30;
        }
    }

    // Update explored map (reveal tiles around player)
    var ptx=Math.floor(player.x/TILE), pty=Math.floor(player.y/TILE);
    for(var ey=pty-4;ey<=pty+4;ey++){
        for(var ex=ptx-4;ex<=ptx+4;ex++){
            if(ex>=0&&ex<MAP_W&&ey>=0&&ey<MAP_H) explored[ey][ex]=true;
        }
    }

    // Stairs zone (next floor)
    if(stairsZone){
        if(dist(player,stairsZone)<24){
            extracting++;
            if(extracting>=120){extracting=0;goNextFloor();return;}
        } else extracting=0;
    }

    // Exit zone (after boss)
    if(exitZone&&bossDefeated){
        if(dist(player,exitZone)<24){
            extracting++;
            if(extracting>=180){extracting=0;endExpedition();return;}
        } else extracting=0;
    }

    // Particles & floats
    for(var i=particles.length-1;i>=0;i--){
        var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.92;p.vy*=0.92;p.life--;
        if(p.life<=0) particles.splice(i,1);
    }
    for(var i=floatingTexts.length-1;i>=0;i--){
        var f=floatingTexts[i];f.y+=f.vy;f.life--;
        if(f.life<=0) floatingTexts.splice(i,1);
    }
    // Ambient particles (dust/fireflies) — biome-specific
    if(ambientParts.length<30&&frameCount%6===0){
        var ax=player.x+randInt(-200,200), ay=player.y+randInt(-150,150);
        if(!isSolid(ax,ay)){
            var isBright=Math.random()<0.3;
            var pColor,pSize,pVy;
            if(currentBiome.name==='Forest'){
                // Fireflies and pollen
                pColor=isBright?'#88ffaa':'#aabb66';
                pSize=isBright?2.5:1;
                pVy=-0.1-Math.random()*0.15;
            } else if(currentBiome.name==='Cave'){
                // Floating crystal dust and sparks
                pColor=isBright?(Math.random()<0.5?'#aaccff':'#bb88ee'):'#556688';
                pSize=isBright?2:1.2;
                pVy=-0.2-Math.random()*0.1;
            } else {
                // Swamp spores and toxic mist
                pColor=isBright?'#ccee44':'#889944';
                pSize=isBright?2.5:1.5;
                pVy=-0.05-Math.random()*0.1;
            }
            ambientParts.push({x:ax,y:ay,vx:(Math.random()-0.5)*0.3,vy:pVy,
                life:randInt(80,220),maxLife:220,size:pSize,
                color:pColor,bright:isBright,phase:Math.random()*6.28});
        }
    }
    for(var i=ambientParts.length-1;i>=0;i--){
        var ap=ambientParts[i];ap.x+=ap.vx+Math.sin(frameCount*0.02+ap.phase)*0.15;ap.y+=ap.vy;ap.life--;
        if(ap.life<=0) ambientParts.splice(i,1);
    }
    if(screenShake>0) screenShake*=0.85;
}

function endExpedition(){
    activeBuffs=[];
    carriedPotions=[]; // Clear used potions after expedition
    state='lab'; labTab=null;
    labMessage=T('expComplete');
    labMessageTimer=180;
    refreshLabShop();
    saveGame();
    playBGM('lab');
}

// ============ RENDER — EXPEDITION ============
function getWallTile(x,y){
    // Use biome-tinted wall set if available
    var biomeKey=currentBiome?currentBiome.enemyType:null;
    var wSet=SPR.wallSets&&SPR.wallSets[biomeKey]?SPR.wallSets[biomeKey]:SPR;
    var ws=wSet.wallSet;
    var U=(y>0&&map[y-1][x]>=1),D=(y<MAP_H-1&&map[y+1][x]>=1);
    var L=(x>0&&map[y][x-1]>=1),R=(x<MAP_W-1&&map[y][x+1]>=1);
    var eU=!U,eD=!D,eL=!L,eR=!R;
    if(eU&&eD&&eL&&eR) return wSet.wallSingle;
    if(eU&&eD){var hs=wSet.hStrip;if(eL)return hs.l;if(eR)return hs.r;return hs.c;}
    if(eL&&eR){var vs=wSet.vStrip;if(eU)return vs.t;if(eD)return vs.b;return vs.c;}
    if(eU&&eL)return ws.tl;if(eU&&eR)return ws.tr;
    if(eD&&eL)return ws.bl;if(eD&&eR)return ws.br;
    if(eU)return ws.t;if(eD)return ws.b;
    if(eL)return ws.l;if(eR)return ws.r;
    return ws.c;
}

// ============ BIOME-SPECIFIC DECORATIONS ============
function drawBiomeFloorDeco(px,py,x,y,biome){
    var seed=(x*7919+y*104729)%1000;
    var seed2=(x*3571+y*7127)%1000;
    if(biome.name==='Forest'){
        // Grass tufts
        if(seed<120){
            ctx.save();ctx.globalAlpha=0.18+seed2%10*0.01;
            var gc=seed2%2===0?'#2a5a1a':'#1a4a12';
            ctx.fillStyle=gc;
            var gx=px+seed%TILE,gy=py+TILE-4;
            for(var gi=0;gi<3;gi++){
                var gw=1,gh=4+seed2%4;
                ctx.fillRect(gx-3+gi*3,gy-gh,gw,gh);
            }
            ctx.restore();
        }
        // Fallen leaves
        if(seed>900){
            ctx.save();ctx.globalAlpha=0.12;
            ctx.fillStyle=seed2%3===0?'#8a4422':'#6a6622';
            var lx=px+seed2%24+4,ly=py+seed%20+6;
            ctx.beginPath();ctx.ellipse(lx,ly,3,2,seed*0.1,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        // Tree roots near walls
        if(y>0&&map[y-1][x]>=1&&seed<300){
            ctx.save();ctx.globalAlpha=0.15;ctx.strokeStyle='#3a2a18';ctx.lineWidth=1.5;
            ctx.beginPath();ctx.moveTo(px+seed%20+6,py);
            ctx.quadraticCurveTo(px+seed%20+6+5,py+8,px+seed%20+12,py+14);ctx.stroke();
            ctx.restore();
        }
    } else if(biome.name==='Cave'){
        // Crystal shards on floor
        if(seed<80){
            ctx.save();ctx.globalAlpha=0.2+seed2%10*0.02;
            var cc=seed2%3===0?'#6666cc':(seed2%3===1?'#8844aa':'#4488bb');
            ctx.fillStyle=cc;
            var cx2=px+seed%24+4,cy2=py+seed2%20+6;
            ctx.beginPath();ctx.moveTo(cx2,cy2-5-seed2%3);ctx.lineTo(cx2+2,cy2);ctx.lineTo(cx2-2,cy2);ctx.closePath();ctx.fill();
            // Crystal glow
            ctx.globalAlpha=0.06;
            var cg=ctx.createRadialGradient(cx2,cy2-2,0,cx2,cy2-2,8);
            cg.addColorStop(0,cc);cg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=cg;ctx.fillRect(cx2-8,cy2-10,16,16);
            ctx.restore();
        }
        // Small rocks/pebbles
        if(seed>850&&seed<950){
            ctx.save();ctx.globalAlpha=0.12;ctx.fillStyle='#2a2a3a';
            ctx.beginPath();ctx.arc(px+seed2%24+4,py+seed%20+8,2+seed2%2,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        // Glowing mineral veins on walls
        if(y>0&&map[y-1][x]>=1&&seed<200){
            ctx.save();ctx.globalAlpha=0.08+Math.sin(frameCount*0.03+seed)*0.04;
            ctx.strokeStyle=seed2%2===0?'#6688cc':'#8866aa';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(px+seed%28+2,py);
            ctx.lineTo(px+seed%20+8,py+6);ctx.lineTo(px+seed%24+4,py+10);ctx.stroke();
            ctx.restore();
        }
    } else if(biome.name==='Swamp'){
        // Water puddles
        if(seed<100){
            ctx.save();ctx.globalAlpha=0.12+seed2%8*0.01;
            var wc=seed2%2===0?'rgba(40,60,30,0.5)':'rgba(50,70,20,0.4)';
            ctx.fillStyle=wc;
            ctx.beginPath();ctx.ellipse(px+TILE/2+seed%8-4,py+TILE/2+seed2%8-4,6+seed%4,4+seed2%3,seed*0.05,0,Math.PI*2);ctx.fill();
            // Puddle highlight
            ctx.globalAlpha=0.06;ctx.fillStyle='rgba(120,160,60,0.5)';
            ctx.beginPath();ctx.ellipse(px+TILE/2+seed%8-6,py+TILE/2+seed2%8-6,3,2,0,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        // Toxic bubbles (animated)
        if(seed>920){
            var bubPhase=(frameCount*0.02+seed)%6.28;
            ctx.save();ctx.globalAlpha=0.15+Math.sin(bubPhase)*0.08;
            ctx.fillStyle='#88aa22';
            var bx=px+seed2%24+4,by=py+seed%20+4;
            ctx.beginPath();ctx.arc(bx,by+Math.sin(bubPhase)*2,2+Math.sin(bubPhase+1),0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        // Moss/slime on walls
        if(y>0&&map[y-1][x]>=1&&seed<250){
            ctx.save();ctx.globalAlpha=0.14;ctx.fillStyle='#4a6a18';
            for(var mi=0;mi<3;mi++){
                var mx=px+seed%8+mi*10,mh=3+seed2%5;
                ctx.fillRect(mx,py,3,mh);
            }
            ctx.restore();
        }
        // Fog wisps (near floor)
        if(seed>700&&seed<780){
            ctx.save();ctx.globalAlpha=0.04+Math.sin(frameCount*0.015+seed)*0.02;
            var fg=ctx.createRadialGradient(px+TILE/2,py+TILE/2,0,px+TILE/2,py+TILE/2,TILE);
            fg.addColorStop(0,'rgba(140,160,80,0.3)');fg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=fg;ctx.fillRect(px-TILE/2,py-TILE/2,TILE*2,TILE*2);
            ctx.restore();
        }
    }
}

function drawBiomeWallDeco(px,py,x,y,biome){
    var seed=(x*4919+y*8731)%1000;
    if(biome.name==='Forest'){
        // Vine hanging from wall bottom
        if(y<MAP_H-1&&map[y+1][x]===0&&seed<200){
            ctx.save();ctx.globalAlpha=0.2;ctx.strokeStyle='#2a6a1a';ctx.lineWidth=1;
            var vx=px+seed%20+6;
            ctx.beginPath();ctx.moveTo(vx,py+TILE);
            ctx.quadraticCurveTo(vx+Math.sin(seed)*4,py+TILE+8,vx+2,py+TILE+12+seed%6);ctx.stroke();
            // Tiny leaf on vine
            ctx.fillStyle='#3a8a2a';ctx.beginPath();
            ctx.ellipse(vx+2,py+TILE+10+seed%4,2,3,0.5,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        // Moss patches on wall face
        if(seed>600&&seed<700){
            ctx.save();ctx.globalAlpha=0.1;ctx.fillStyle='#2a5a1a';
            ctx.fillRect(px+seed%20+2,py+seed%16+4,6+seed%6,4+seed%4);
            ctx.restore();
        }
    } else if(biome.name==='Cave'){
        // Stalactite drips from wall bottom
        if(y<MAP_H-1&&map[y+1][x]===0&&seed<180){
            ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#3a3a5a';
            var sx2=px+seed%22+5;
            ctx.beginPath();ctx.moveTo(sx2-2,py+TILE);ctx.lineTo(sx2+2,py+TILE);
            ctx.lineTo(sx2,py+TILE+6+seed%8);ctx.closePath();ctx.fill();
            ctx.restore();
            // Drip animation
            if(seed<60){
                var dripY=(frameCount*0.5+seed)%(16+seed%8);
                ctx.save();ctx.globalAlpha=0.15*(1-dripY/(16+seed%8));
                ctx.fillStyle='#6688aa';
                ctx.beginPath();ctx.ellipse(sx2,py+TILE+6+dripY,1.5,2,0,0,Math.PI*2);ctx.fill();
                ctx.restore();
            }
        }
        // Glowing ore veins on wall
        if(seed>500&&seed<600){
            ctx.save();ctx.globalAlpha=0.08+Math.sin(frameCount*0.025+seed)*0.04;
            ctx.fillStyle=seed%2===0?'#5566bb':'#7744aa';
            ctx.fillRect(px+seed%18+4,py+seed%14+4,4+seed%5,2);
            ctx.fillRect(px+seed%18+6,py+seed%14+6,2,4+seed%3);
            ctx.restore();
        }
    } else if(biome.name==='Swamp'){
        // Dripping slime from wall bottom
        if(y<MAP_H-1&&map[y+1][x]===0&&seed<200){
            ctx.save();ctx.globalAlpha=0.18;ctx.fillStyle='#5a7a18';
            var sx2=px+seed%22+5;
            ctx.beginPath();ctx.moveTo(sx2-3,py+TILE);ctx.lineTo(sx2+3,py+TILE);
            ctx.quadraticCurveTo(sx2+2,py+TILE+6,sx2,py+TILE+8+seed%6);ctx.quadraticCurveTo(sx2-2,py+TILE+6,sx2-3,py+TILE);ctx.fill();
            ctx.restore();
        }
        // Fungus/mushroom on wall
        if(seed>400&&seed<480){
            ctx.save();ctx.globalAlpha=0.2;
            ctx.fillStyle=seed%2===0?'#8a6a44':'#6a8a22';
            var fx=px+seed%20+6,fy=py+seed%16+8;
            // Stem
            ctx.fillRect(fx-1,fy,2,5);
            // Cap
            ctx.beginPath();ctx.ellipse(fx,fy,4,3,0,Math.PI,Math.PI*2);ctx.fill();
            ctx.restore();
        }
    }
}

function renderExpedition(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=currentBiome.color;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    var sx=screenShake>0.5?(Math.random()-0.5)*screenShake*2:0;
    var sy=screenShake>0.5?(Math.random()-0.5)*screenShake*2:0;
    ctx.save();
    ctx.translate(-camera.x+sx,-camera.y+sy);

    // Map tiles with improved lighting
    var startX=Math.max(0,Math.floor(camera.x/TILE));
    var startY=Math.max(0,Math.floor(camera.y/TILE));
    var endX=Math.min(MAP_W,Math.ceil((camera.x+canvas.width)/TILE)+1);
    var endY=Math.min(MAP_H,Math.ceil((camera.y+canvas.height)/TILE)+1);
    ctx.imageSmoothingEnabled=false;
    for(var y=startY;y<endY;y++){
        for(var x=startX;x<endX;x++){
            var px=x*TILE,py=y*TILE;
            if(map[y][x]===0){
                ctx.fillStyle=currentBiome.floorColor;
                ctx.fillRect(px,py,TILE,TILE);
                // Biome-tinted grid lines
                ctx.fillStyle=currentBiome.gridColor||'rgba(255,255,255,0.012)';
                ctx.fillRect(px,py,TILE,1);ctx.fillRect(px,py,1,TILE);
                // Biome floor accent (subtle color variation)
                if(((x+y)%2===0)){ctx.fillStyle=currentBiome.floorAccent||'rgba(255,255,255,0.02)';ctx.fillRect(px,py,TILE,TILE);}
                // Floor deco (tilesheet)
                if(SPR.ready&&((x*7+y*13)%17===0)){
                    ctx.save();ctx.globalAlpha=0.1;
                    ctx.drawImage(SPR.floorDeco[(x*3+y*5)%SPR.floorDeco.length],px,py,TILE,TILE);
                    ctx.restore();
                }
                // Biome-specific floor decorations
                drawBiomeFloorDeco(px,py,x,y,currentBiome);
                // Boss arena floor pattern (circular runes) — biome-tinted
                if(currentFloor===MAX_FLOORS-1){
                    var acx=MAP_W/2, acy=MAP_H/2;
                    var adx=x-acx, ady=y-acy, adist=Math.sqrt(adx*adx+ady*ady);
                    var runeColor=currentBiome.name==='Forest'?'rgba(60,200,80,':'rgba(200,60,40,';
                    if(currentBiome.name==='Cave') runeColor='rgba(100,80,220,';
                    if(currentBiome.name==='Swamp') runeColor='rgba(180,200,40,';
                    // Concentric rings
                    if(Math.abs(adist-8)<0.6||Math.abs(adist-4)<0.6){
                        ctx.fillStyle=runeColor+'0.06)';ctx.fillRect(px,py,TILE,TILE);
                    }
                    // Cross pattern
                    if((x===Math.floor(acx)||y===Math.floor(acy))&&adist<10&&adist>2){
                        ctx.fillStyle=runeColor+'0.04)';ctx.fillRect(px,py,TILE,TILE);
                    }
                }
                // Wall edge shadow — biome-tinted
                var shadowBase=currentBiome.name==='Forest'?'0,15,0':(currentBiome.name==='Cave'?'0,0,15':'10,12,0');
                if(y>0&&map[y-1][x]>=1){ctx.fillStyle='rgba('+shadowBase+',0.28)';ctx.fillRect(px,py,TILE,6);ctx.fillStyle='rgba('+shadowBase+',0.12)';ctx.fillRect(px,py+6,TILE,4);}
                if(y<MAP_H-1&&map[y+1][x]>=1){ctx.fillStyle='rgba('+shadowBase+',0.18)';ctx.fillRect(px,py+TILE-4,TILE,4);}
                if(x>0&&map[y][x-1]>=1){ctx.fillStyle='rgba('+shadowBase+',0.2)';ctx.fillRect(px,py,5,TILE);}
                if(x<MAP_W-1&&map[y][x+1]>=1){ctx.fillStyle='rgba('+shadowBase+',0.2)';ctx.fillRect(px+TILE-5,py,5,TILE);}
            } else {
                if(SPR.ready) ctx.drawImage(getWallTile(x,y),px,py,TILE,TILE);
                else{ctx.fillStyle=currentBiome.wallColor;ctx.fillRect(px,py,TILE,TILE);}
                // Biome wall tint overlay
                ctx.save();ctx.globalAlpha=1;ctx.fillStyle=currentBiome.wallTint||'rgba(0,0,0,0)';ctx.fillRect(px,py,TILE,TILE);ctx.restore();
                // Wall top highlight (biome-colored)
                if(y>0&&map[y-1][x]===0){ctx.fillStyle=currentBiome.wallHighlight||'rgba(255,255,255,0.04)';ctx.fillRect(px,py,TILE,2);}
                // Biome-specific wall decorations
                drawBiomeWallDeco(px,py,x,y,currentBiome);
            }
        }
    }

    // Ambient particles (behind entities)
    for(var ap of ambientParts){
        var alpha=(ap.life/ap.maxLife)*(ap.bright?(0.4+Math.sin(frameCount*0.08+ap.phase)*0.25):0.15);
        ctx.save();ctx.globalAlpha=alpha;
        ctx.fillStyle=ap.color;
        if(ap.bright){
            var glow=ctx.createRadialGradient(ap.x,ap.y,0,ap.x,ap.y,ap.size*3);
            glow.addColorStop(0,ap.color);glow.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=glow;ctx.fillRect(ap.x-ap.size*3,ap.y-ap.size*3,ap.size*6,ap.size*6);
        }
        ctx.beginPath();ctx.arc(ap.x,ap.y,ap.size,0,Math.PI*2);ctx.fill();
        ctx.restore();
    }

    // Herb drops (improved glow)
    for(var h of herbDrops){
        if(h.collected) continue;
        var bob=Math.sin(frameCount*0.06+h.bobOffset)*3;
        var hx=h.x,hy=h.y+bob;
        // Ground shadow
        ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#000';
        ctx.beginPath();ctx.ellipse(h.x,h.y+8,8,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
        // Glow ring
        ctx.save();ctx.globalAlpha=0.12+Math.sin(frameCount*0.04+h.bobOffset)*0.06;
        var hGlow=ctx.createRadialGradient(hx,hy,2,hx,hy,16);
        hGlow.addColorStop(0,HERBS[h.herbKey]?ESSENCES[HERBS[h.herbKey].yields[0]].color:'#44dd88');
        hGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=hGlow;ctx.fillRect(hx-16,hy-16,32,32);ctx.restore();
        if(SPR.ready&&SPR.herbs[h.herbKey]) ctx.drawImage(SPR.herbs[h.herbKey],hx-10,hy-10,20,20);
        else{ctx.fillStyle='#44dd88';ctx.beginPath();ctx.arc(hx,hy,6,0,Math.PI*2);ctx.fill();}
    }

    // Chests (improved 3D look)
    for(var ch of chests){
        var cx2=ch.x,cy2=ch.y;
        // Shadow
        ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#000';
        ctx.beginPath();ctx.ellipse(cx2,cy2+10,12,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
        if(ch.opened){
            ctx.fillStyle='#2a2018';ctx.fillRect(cx2-10,cy2-4,20,12);
            ctx.fillStyle='#3a3020';ctx.fillRect(cx2-10,cy2-4,20,3);
            ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(cx2-10,cy2-4,20,12);
        } else {
            // Chest body
            ctx.fillStyle='#8a6622';ctx.fillRect(cx2-10,cy2-4,20,14);
            // Lid
            ctx.fillStyle='#bb9933';ctx.fillRect(cx2-11,cy2-8,22,8);
            ctx.fillStyle='#ddbb44';ctx.fillRect(cx2-11,cy2-8,22,2);
            // Metal bands
            ctx.fillStyle='#665522';ctx.fillRect(cx2-11,cy2-2,22,2);
            // Lock
            ctx.fillStyle='#ffd700';ctx.fillRect(cx2-2,cy2-3,4,4);
            ctx.strokeStyle='#775511';ctx.lineWidth=1;ctx.strokeRect(cx2-10,cy2-8,20,20);
            // Glow
            ctx.save();ctx.globalAlpha=0.1+Math.sin(frameCount*0.08)*0.06;
            var chGlow=ctx.createRadialGradient(cx2,cy2,3,cx2,cy2,22);
            chGlow.addColorStop(0,'#ffd700');chGlow.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=chGlow;ctx.fillRect(cx2-22,cy2-22,44,44);ctx.restore();
        }
    }

    // Locked doors (improved)
    for(var ld of lockedDoors){
        if(ld.unlocked) continue;
        var ldx=ld.tx*TILE,ldy=ld.ty*TILE;
        // Door base
        var doorG=ctx.createLinearGradient(ldx,ldy,ldx+TILE,ldy+TILE);
        doorG.addColorStop(0,'#5a3a20');doorG.addColorStop(0.5,'#4a2a18');doorG.addColorStop(1,'#3a2010');
        ctx.fillStyle=doorG;ctx.fillRect(ldx,ldy,TILE,TILE);
        // Planks
        ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(ldx+TILE/3,ldy);ctx.lineTo(ldx+TILE/3,ldy+TILE);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ldx+TILE*2/3,ldy);ctx.lineTo(ldx+TILE*2/3,ldy+TILE);ctx.stroke();
        // Metal band
        ctx.fillStyle='#665533';ctx.fillRect(ldx+2,ldy+TILE/2-2,TILE-4,4);
        // Lock
        ctx.fillStyle='#ffd700';
        ctx.beginPath();ctx.arc(ldx+TILE/2,ldy+TILE/2,5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#cc9900';ctx.fillRect(ldx+TILE/2-3,ldy+TILE/2,6,6);
        ctx.fillStyle='#000';ctx.fillRect(ldx+TILE/2-1,ldy+TILE/2+2,2,3);
        // Border
        ctx.strokeStyle='#886622';ctx.lineWidth=2;ctx.strokeRect(ldx+1,ldy+1,TILE-2,TILE-2);
        // Glow if player near
        var pdist=dist(player,{x:ldx+TILE/2,y:ldy+TILE/2});
        if(pdist<50){
            ctx.save();ctx.globalAlpha=0.15+Math.sin(frameCount*0.1)*0.08;
            var ldGlow=ctx.createRadialGradient(ldx+TILE/2,ldy+TILE/2,3,ldx+TILE/2,ldy+TILE/2,24);
            ldGlow.addColorStop(0,playerKeys>0?'#44dd88':'#ff4444');ldGlow.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=ldGlow;ctx.fillRect(ldx-8,ldy-8,TILE+16,TILE+16);ctx.restore();
        }
    }

    // Collectible drops (improved sparkle)
    for(var cd of collectibleDrops){
        if(cd.collected) continue;
        var coll=COLLECTIBLES.find(function(c){return c.id===cd.collectibleId;});
        var bob=Math.sin(frameCount*0.08)*4;
        var rot=frameCount*0.03;
        // Ground shadow
        ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#000';
        ctx.beginPath();ctx.ellipse(cd.x,cd.y+12,7,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
        // Outer glow
        ctx.save();ctx.globalAlpha=0.12+Math.sin(frameCount*0.06)*0.06;
        var cdGlow=ctx.createRadialGradient(cd.x,cd.y+bob,2,cd.x,cd.y+bob,20);
        cdGlow.addColorStop(0,coll.color);cdGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=cdGlow;ctx.fillRect(cd.x-20,cd.y+bob-20,40,40);ctx.restore();
        // Diamond shape with rotation
        ctx.save();ctx.translate(cd.x,cd.y+bob);ctx.rotate(rot);
        ctx.fillStyle=coll.color;
        ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
        // Inner highlight
        ctx.fillStyle='rgba(255,255,255,0.3)';
        ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(4,0);ctx.lineTo(0,2);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.stroke();
        ctx.restore();
        // Sparkle particles
        for(var si=0;si<3;si++){
            var sa=frameCount*0.05+si*2.1, sr=12+Math.sin(frameCount*0.03+si)*4;
            var spx=cd.x+Math.cos(sa)*sr, spy=cd.y+bob+Math.sin(sa)*sr;
            ctx.save();ctx.globalAlpha=0.4+Math.sin(frameCount*0.1+si)*0.3;
            ctx.fillStyle='#fff';ctx.fillRect(spx-1,spy-1,2,2);ctx.restore();
        }
    }

    // Merchants (improved with shadow and better visuals)
    for(var m of merchants){
        var mx2=m.x,my2=m.y;
        // Ground shadow
        ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#000';
        ctx.beginPath();ctx.ellipse(mx2,my2+14,14,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
        // Ambient glow
        ctx.save();ctx.globalAlpha=0.06;
        var mGlow=ctx.createRadialGradient(mx2,my2,3,mx2,my2,35);
        mGlow.addColorStop(0,'#ffcc44');mGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=mGlow;ctx.fillRect(mx2-35,my2-35,70,70);ctx.restore();
        // Hood
        ctx.fillStyle='#5a4a7a';
        ctx.beginPath();ctx.arc(mx2,my2-8,11,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#4a3a6a';
        ctx.beginPath();ctx.ellipse(mx2,my2-12,12,8,0,Math.PI,Math.PI*2);ctx.fill();
        // Robe body
        ctx.fillStyle='#3a2a5a';
        ctx.beginPath();ctx.moveTo(mx2-9,my2-2);ctx.lineTo(mx2+9,my2-2);
        ctx.lineTo(mx2+10,my2+14);ctx.lineTo(mx2-10,my2+14);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ffcc44';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText('$',mx2,my2-4);
        // Label
        ctx.fillStyle='#ffcc44';ctx.font='bold 9px monospace';
        ctx.fillText(T('merchant'),mx2,my2+28);
        // Interaction prompt when near
        if(nearMerchantRef===m){
            var promptY=my2-30;
            var pulse=0.6+Math.sin(frameCount*0.1)*0.3;
            ctx.save();ctx.globalAlpha=pulse;
            // Background pill for prompt
            var promptText=isMobile?(lang==='zh'?'点击交互':'TAP'):(lang==='zh'?'按E交互':'Press E');
            ctx.font='bold 11px monospace';
            var ptW=ctx.measureText(promptText).width+12;
            ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(mx2-ptW/2,promptY-10,ptW,16);
            ctx.fillStyle='#ffcc44';ctx.textAlign='center';
            ctx.fillText(promptText,mx2,promptY);
            ctx.restore();
            // Highlight ring (animated)
            ctx.save();
            ctx.globalAlpha=0.2+Math.sin(frameCount*0.08)*0.1;
            ctx.strokeStyle='#ffcc44';ctx.lineWidth=2;
            ctx.beginPath();ctx.arc(mx2,my2,28+Math.sin(frameCount*0.06)*3,0,Math.PI*2);ctx.stroke();
            ctx.restore();
        }
    }

    // Stairs zone (improved portal effect)
    if(stairsZone){
        var pulse=Math.sin(frameCount*0.06)*5;
        var prog=extracting/120;
        // Outer glow ring
        ctx.save();ctx.globalAlpha=0.08+prog*0.1;
        var stGlow=ctx.createRadialGradient(stairsZone.x,stairsZone.y,5,stairsZone.x,stairsZone.y,30+pulse);
        stGlow.addColorStop(0,'#ffdd44');stGlow.addColorStop(0.6,'rgba(255,180,40,0.3)');stGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=stGlow;ctx.fillRect(stairsZone.x-40,stairsZone.y-40,80,80);ctx.restore();
        // Rotating rune circle
        ctx.save();ctx.translate(stairsZone.x,stairsZone.y);ctx.rotate(frameCount*0.02);
        ctx.strokeStyle='rgba(255,221,68,0.3)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.stroke();
        for(var si=0;si<4;si++){var sa=si*Math.PI/2;ctx.fillStyle='rgba(255,221,68,0.5)';ctx.fillRect(Math.cos(sa)*18-2,Math.sin(sa)*18-2,4,4);}
        ctx.restore();
        // Stairs icon
        for(var si=0;si<3;si++){
            ctx.fillStyle='rgba(255,221,68,'+(0.5-si*0.1)+')';
            ctx.fillRect(stairsZone.x-8+si*3,stairsZone.y-4+si*5,16-si*6,3);
        }
        if(extracting>0){
            ctx.strokeStyle='#ffdd44';ctx.lineWidth=4;
            ctx.beginPath();ctx.arc(stairsZone.x,stairsZone.y,28,-Math.PI/2,-Math.PI/2+Math.PI*2*prog);ctx.stroke();
            var secLeft=Math.ceil((120-extracting)/60);
            ctx.fillStyle='#ffdd44';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText(secLeft,stairsZone.x,stairsZone.y+5);
        }
        ctx.fillStyle='#ffdd44';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(T('nextFloor'),stairsZone.x,stairsZone.y-30);
    }

    // Exit zone (improved portal)
    if(exitZone&&bossDefeated){
        var pulse=Math.sin(frameCount*0.06)*5;
        var prog=extracting/180;
        // Swirling portal effect
        ctx.save();ctx.globalAlpha=0.1+prog*0.15;
        var exGlow=ctx.createRadialGradient(exitZone.x,exitZone.y,3,exitZone.x,exitZone.y,32+pulse);
        exGlow.addColorStop(0,'#00ffcc');exGlow.addColorStop(0.5,'rgba(0,180,255,0.3)');exGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=exGlow;ctx.fillRect(exitZone.x-40,exitZone.y-40,80,80);ctx.restore();
        // Rotating rings
        ctx.save();ctx.translate(exitZone.x,exitZone.y);
        ctx.rotate(frameCount*0.025);ctx.strokeStyle='rgba(0,212,255,0.35)';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*1.2);ctx.stroke();
        ctx.rotate(-frameCount*0.05);ctx.strokeStyle='rgba(0,255,200,0.25)';
        ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*0.8);ctx.stroke();
        ctx.restore();
        if(extracting>0){
            ctx.strokeStyle='#00ffcc';ctx.lineWidth=4;
            ctx.beginPath();ctx.arc(exitZone.x,exitZone.y,30,-Math.PI/2,-Math.PI/2+Math.PI*2*prog);ctx.stroke();
            var secLeft=Math.ceil((180-extracting)/60);
            ctx.fillStyle='#00ffcc';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText(secLeft,exitZone.x,exitZone.y+5);
        }
        ctx.fillStyle='#00d4ff';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(extracting>0?T('extracting'):T('exit'),exitZone.x,exitZone.y-34);
    }

    // Enemies (improved with shadows and better effects)
    for(var e of enemies){
        // Ground shadow
        var eShadowR=e.isBoss?16:(e.isElite?10:8);
        ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#000';
        ctx.beginPath();ctx.ellipse(e.x,e.y+e.radius+2,eShadowR,eShadowR*0.35,0,0,Math.PI*2);ctx.fill();ctx.restore();
        // Alert glow
        if(e.alert){
            ctx.save();ctx.globalAlpha=0.12+Math.sin(frameCount*0.1)*0.06;
            var eGlow=ctx.createRadialGradient(e.x,e.y,3,e.x,e.y,e.isBoss?28:(e.isElite?20:16));
            eGlow.addColorStop(0,e.isBoss?'#ff0000':(e.isElite?'#ff8800':'#ff4500'));
            eGlow.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=eGlow;ctx.fillRect(e.x-30,e.y-30,60,60);ctx.restore();
            // Alert indicator
            ctx.fillStyle=e.isBoss?'#ff0000':'#ff4500';ctx.font='bold 12px monospace';ctx.textAlign='center';
            ctx.fillText(e.isBoss?'\u2620':'!',e.x,e.y-20-(e.isBoss?6:0));
        }
        if(SPR.ready){
            var et=SPR.enemies[currentBiome.enemyType];
            var spr=et.frames[e.animFrame%et.frames.length];
            ctx.save();ctx.translate(e.x,e.y);
            var scale=e.isBoss?2.0:(e.isElite?1.4:1.0);
            var flip=(e.angle>Math.PI/2||e.angle<-Math.PI/2)?-1:1;
            ctx.scale(flip*scale,scale);
            ctx.drawImage(spr,-TILE/2,-TILE/2,TILE,TILE);
            ctx.restore();
        } else {
            ctx.fillStyle=e.isBoss?'#ff0000':(e.isElite?'#ff8800':(e.alert?'#ff4500':'#ffd700'));
            ctx.beginPath();ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);ctx.fill();
        }
        // HP bar (improved with border and gradient)
        if(e.hp<e.maxHp){
            var bw2=e.isBoss?52:(e.isElite?36:26),bh2=e.isBoss?6:4;
            var hpBarY=e.y-(e.isBoss?30:18);
            ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(e.x-bw2/2-1,hpBarY-1,bw2+2,bh2+2);
            var hpRatio=e.hp/e.maxHp;
            var hpColor=hpRatio>0.5?'#44dd88':(hpRatio>0.25?'#ddaa22':'#ee4444');
            ctx.fillStyle=hpColor;
            ctx.fillRect(e.x-bw2/2,hpBarY,bw2*hpRatio,bh2);
            ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(e.x-bw2/2,hpBarY,bw2*hpRatio,bh2/2);
        }
        // Elite/Boss label with glow
        if(e.isElite){
            ctx.save();ctx.shadowColor='#ff8800';ctx.shadowBlur=4;
            ctx.fillStyle='#ff8800';ctx.font='bold 8px monospace';ctx.textAlign='center';
            ctx.fillText('ELITE',e.x,e.y+e.radius+10);ctx.restore();
        }
        if(e.isBoss){
            ctx.save();ctx.shadowColor=bossPhase===1?'#ff4400':'#ff4444';ctx.shadowBlur=8;
            ctx.fillStyle=bossPhase===1?'#ff4400':'#ff4444';ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText('BOSS',e.x,e.y+e.radius+14);ctx.restore();
            // Charge trail effect
            if(e.charging){
                ctx.save();ctx.globalAlpha=0.3;
                for(var ci=1;ci<=4;ci++){
                    var cx3=e.x-Math.cos(e.chargeAngle)*ci*10, cy3=e.y-Math.sin(e.chargeAngle)*ci*10;
                    ctx.globalAlpha=0.3-ci*0.06;
                    ctx.fillStyle=bossPhase===1?'#ff4400':'#ff8844';
                    ctx.beginPath();ctx.arc(cx3,cy3,e.radius-ci,0,Math.PI*2);ctx.fill();
                }
                ctx.restore();
            }
            // Enrage aura
            if(bossPhase===1){
                ctx.save();ctx.globalAlpha=0.08+Math.sin(frameCount*0.12)*0.04;
                var enrG=ctx.createRadialGradient(e.x,e.y,e.radius,e.x,e.y,e.radius*3);
                enrG.addColorStop(0,'#ff4400');enrG.addColorStop(1,'rgba(0,0,0,0)');
                ctx.fillStyle=enrG;ctx.fillRect(e.x-50,e.y-50,100,100);ctx.restore();
            }
        }
    }

    // Player (improved with dynamic light and shadow)
    var ppx=player.x,ppy=player.y;
    // Ground shadow
    ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(ppx,ppy+10,10,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
    // Player light aura — biome-tinted
    ctx.save();ctx.globalAlpha=0.08+Math.sin(frameCount*0.04)*0.03;
    var pGlowColor=currentBiome.name==='Forest'?'#44dd88':(currentBiome.name==='Cave'?'#8888ee':'#aacc44');
    var pGlow=ctx.createRadialGradient(ppx,ppy,4,ppx,ppy,40);
    pGlow.addColorStop(0,pGlowColor);pGlow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=pGlow;ctx.fillRect(ppx-40,ppy-40,80,80);ctx.restore();
    if(SPR.ready){
        var spr=player.moving?SPR.playerFrames[player.animFrame%SPR.playerFrames.length]:SPR.playerIdle;
        ctx.save();ctx.translate(ppx,ppy);
        var flip=(player.angle>Math.PI/2||player.angle<-Math.PI/2)?-1:1;
        ctx.scale(flip,1);
        ctx.drawImage(spr,-TILE/2,-TILE/2,TILE,TILE);
        ctx.restore();
    } else {
        ctx.fillStyle='#44dd88';ctx.beginPath();ctx.arc(ppx,ppy,player.radius,0,Math.PI*2);ctx.fill();
    }
    // Attack swing (improved arc with trail)
    if(player.attackAnim>0){
        var swingAlpha=player.attackAnim/8;
        ctx.save();ctx.translate(ppx,ppy);ctx.rotate(player.angle);
        var wc=equippedWeapon?equippedWeapon.color:'#fff';
        var wRange=equippedWeapon?equippedWeapon.range:30;
        var wType=equippedWeapon?equippedWeapon.type:'sword';
        
        // Weapon-specific rendering
        if(wType==='sword'){
            // Sword: Arc slash with blade trail
            ctx.globalAlpha=swingAlpha*0.3;
            ctx.strokeStyle=wc;ctx.lineWidth=8;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.7,0.7);ctx.stroke();
            ctx.globalAlpha=swingAlpha;
            ctx.strokeStyle=wc;ctx.lineWidth=3;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.5,0.5);ctx.stroke();
            // Blade edge
            ctx.globalAlpha=swingAlpha*0.9;
            ctx.strokeStyle='#fff';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(wRange-5,0);ctx.stroke();
            ctx.fillStyle='#fff';
            ctx.beginPath();ctx.arc(wRange,0,2,0,Math.PI*2);ctx.fill();
        } else if(wType==='dagger'){
            // Dagger: Quick stab motion
            ctx.globalAlpha=swingAlpha*0.5;
            ctx.strokeStyle=wc;ctx.lineWidth=6;
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(wRange*0.8,0);ctx.stroke();
            ctx.globalAlpha=swingAlpha;
            ctx.fillStyle=wc;
            ctx.beginPath();ctx.moveTo(wRange*0.7,-3);ctx.lineTo(wRange,0);ctx.lineTo(wRange*0.7,3);ctx.fill();
            // Twin gleam
            for(var i=0;i<2;i++){
                ctx.fillStyle='#fff';ctx.globalAlpha=swingAlpha*0.6;
                ctx.beginPath();ctx.arc(wRange*0.5+i*8,-2+i*4,1.5,0,Math.PI*2);ctx.fill();
            }
        } else if(wType==='axe'){
            // Axe: Heavy swing with wide arc
            ctx.globalAlpha=swingAlpha*0.4;
            ctx.strokeStyle=wc;ctx.lineWidth=12;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.9,0.9);ctx.stroke();
            ctx.globalAlpha=swingAlpha*0.8;
            ctx.strokeStyle=wc;ctx.lineWidth=5;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.6,0.6);ctx.stroke();
            // Axe head
            ctx.globalAlpha=swingAlpha;
            ctx.fillStyle=wc;
            ctx.beginPath();ctx.moveTo(wRange-10,-8);ctx.lineTo(wRange,-3);ctx.lineTo(wRange,3);ctx.lineTo(wRange-10,8);ctx.fill();
        } else if(wType==='staff'){
            // Staff: Magic orb at tip
            ctx.globalAlpha=swingAlpha*0.2;
            ctx.strokeStyle=wc;ctx.lineWidth=4;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.5,0.5);ctx.stroke();
            // Staff shaft
            ctx.globalAlpha=swingAlpha*0.7;
            ctx.strokeStyle='#8b7355';ctx.lineWidth=3;
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(wRange*0.8,0);ctx.stroke();
            // Magic orb
            ctx.globalAlpha=swingAlpha;
            var orbGlow=ctx.createRadialGradient(wRange,0,0,wRange,0,8);
            orbGlow.addColorStop(0,wc);orbGlow.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=orbGlow;ctx.fillRect(wRange-8,-8,16,16);
            ctx.fillStyle=wc;
            ctx.beginPath();ctx.arc(wRange,0,4,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#fff';ctx.globalAlpha=swingAlpha*0.8;
            ctx.beginPath();ctx.arc(wRange,0,2,0,Math.PI*2);ctx.fill();
        } else if(wType==='mace'){
            // Mace: Crushing impact visual
            ctx.globalAlpha=swingAlpha*0.5;
            ctx.strokeStyle=wc;ctx.lineWidth=10;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.8,0.8);ctx.stroke();
            ctx.globalAlpha=swingAlpha;
            ctx.strokeStyle='#6b5b4a';ctx.lineWidth=4;
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(wRange*0.75,0);ctx.stroke();
            // Mace head
            ctx.fillStyle=wc;
            ctx.beginPath();ctx.arc(wRange,0,6,0,Math.PI*2);ctx.fill();
            for(var s=0;s<4;s++){
                var ang=s*Math.PI/2;
                ctx.fillStyle=wc;ctx.globalAlpha=swingAlpha*0.7;
                ctx.fillRect(wRange+Math.cos(ang)*6-1,-1+Math.sin(ang)*6,3,3);
            }
        } else if(wType==='spear'){
            // Spear: Long thrust
            ctx.globalAlpha=swingAlpha*0.4;
            ctx.strokeStyle=wc;ctx.lineWidth=5;
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(wRange*1.1,0);ctx.stroke();
            ctx.globalAlpha=swingAlpha;
            ctx.strokeStyle='#8b7355';ctx.lineWidth=3;
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(wRange*0.9,0);ctx.stroke();
            // Spear tip
            ctx.fillStyle=wc;
            ctx.beginPath();ctx.moveTo(wRange*0.85,-4);ctx.lineTo(wRange*1.05,0);ctx.lineTo(wRange*0.85,4);ctx.fill();
            ctx.fillStyle='#fff';ctx.globalAlpha=swingAlpha*0.9;
            ctx.beginPath();ctx.arc(wRange*1.05,0,2,0,Math.PI*2);ctx.fill();
        } else if(wType==='claw'){
            // Claw: Triple slash marks
            for(var cl=0;cl<3;cl++){
                ctx.globalAlpha=swingAlpha*0.6;
                ctx.strokeStyle=wc;ctx.lineWidth=3;
                var clOff=(cl-1)*5;
                ctx.beginPath();ctx.moveTo(wRange*0.3,clOff);ctx.lineTo(wRange,clOff);ctx.stroke();
            }
            ctx.globalAlpha=swingAlpha;
            for(var cl=0;cl<3;cl++){
                ctx.fillStyle=wc;
                var clOff=(cl-1)*5;
                ctx.beginPath();ctx.moveTo(wRange-8,clOff-2);ctx.lineTo(wRange,clOff);ctx.lineTo(wRange-8,clOff+2);ctx.fill();
            }
        } else {
            // Default: simple arc
            ctx.globalAlpha=swingAlpha*0.3;
            ctx.strokeStyle=wc;ctx.lineWidth=8;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.7,0.7);ctx.stroke();
            ctx.globalAlpha=swingAlpha;
            ctx.strokeStyle=wc;ctx.lineWidth=3;
            ctx.beginPath();ctx.arc(0,0,wRange,-0.5,0.5);ctx.stroke();
            ctx.fillStyle='#fff';ctx.globalAlpha=swingAlpha*0.8;
            ctx.beginPath();ctx.arc(wRange,0,2,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
    }

    // Particles & floats (improved with glow)
    for(var p of particles){
        ctx.save();ctx.globalAlpha=p.life/p.maxLife;
        if(p.size>2){
            var pGl=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2);
            pGl.addColorStop(0,p.color);pGl.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=pGl;ctx.fillRect(p.x-p.size*2,p.y-p.size*2,p.size*4,p.size*4);
        }
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(var f of floatingTexts){
        ctx.save();ctx.globalAlpha=f.life/40;
        ctx.shadowColor=f.color;ctx.shadowBlur=4;
        ctx.fillStyle=f.color;ctx.font='bold 12px monospace';ctx.textAlign='center';
        ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0;ctx.restore();
    }
    ctx.restore();

    // Vignette overlay — biome-tinted atmosphere
    var vigW=canvas.width,vigH=canvas.height;
    var vig=ctx.createRadialGradient(vigW/2,vigH/2,Math.min(vigW,vigH)*0.3,vigW/2,vigH/2,Math.max(vigW,vigH)*0.7);
    vig.addColorStop(0,'rgba(0,0,0,0)');
    if(currentBiome.name==='Forest') vig.addColorStop(1,'rgba(5,20,5,0.4)');
    else if(currentBiome.name==='Cave') vig.addColorStop(1,'rgba(5,5,20,0.45)');
    else vig.addColorStop(1,'rgba(15,18,5,0.4)');
    ctx.fillStyle=vig;ctx.fillRect(0,0,vigW,vigH);

    // HUD
    drawExpeditionHUD();
    if(isMobile) drawMobileStick();

    // Popups (drawn on top of everything)
    if(weaponPopup) drawWeaponPopup();
    if(merchantPopup) drawMerchantPopup();
    if(buffPopup) drawBuffPopup();

    // Minimap
    drawMinimap();
    if(tutorialPhase==='expedition') drawTutorialExp();
    if(showSettings) drawSettings();
}

function drawMinimap(){
    var mmS=3; // pixel size per tile
    var mmW=MAP_W*mmS, mmH=MAP_H*mmS;
    var mmX=canvas.width-mmW-12, mmY=12;
    // Background with rounded feel
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(mmX-4,mmY-4,mmW+8,mmH+8);
    ctx.fillStyle='rgba(10,10,20,0.9)';ctx.fillRect(mmX-2,mmY-2,mmW+4,mmH+4);
    // Border glow
    ctx.strokeStyle='rgba(68,221,136,0.25)';ctx.lineWidth=1;ctx.strokeRect(mmX-3,mmY-3,mmW+6,mmH+6);
    ctx.strokeStyle='rgba(68,221,136,0.5)';ctx.lineWidth=1;ctx.strokeRect(mmX-2,mmY-2,mmW+4,mmH+4);
    for(var y=0;y<MAP_H;y++){
        for(var x=0;x<MAP_W;x++){
            if(!explored[y]||!explored[y][x]) continue;
            var px=mmX+x*mmS, py=mmY+y*mmS;
            if(map[y][x]===0) ctx.fillStyle='rgba(80,90,110,0.6)';
            else if(map[y][x]===2) ctx.fillStyle='rgba(255,200,50,0.8)';
            else ctx.fillStyle='rgba(35,35,50,0.6)';
            ctx.fillRect(px,py,mmS,mmS);
        }
    }
    // Player dot (pulsing)
    var ptx=Math.floor(player.x/TILE), pty=Math.floor(player.y/TILE);
    var pPulse=0.7+Math.sin(frameCount*0.1)*0.3;
    ctx.fillStyle='rgba(68,221,136,'+pPulse+')';ctx.fillRect(mmX+ptx*mmS-1,mmY+pty*mmS-1,mmS+2,mmS+2);
    // Stairs/exit
    if(stairsZone){
        var stx=Math.floor(stairsZone.x/TILE),sty=Math.floor(stairsZone.y/TILE);
        if(explored[sty]&&explored[sty][stx]){ctx.fillStyle='#ffdd44';ctx.fillRect(mmX+stx*mmS,mmY+sty*mmS,mmS,mmS);}
    }
    if(exitZone&&bossDefeated){
        var etx=Math.floor(exitZone.x/TILE),ety=Math.floor(exitZone.y/TILE);
        if(explored[ety]&&explored[ety][etx]){ctx.fillStyle='#00d4ff';ctx.fillRect(mmX+etx*mmS,mmY+ety*mmS,mmS,mmS);}
    }
    // Enemies as red dots (pulsing for boss)
    for(var e of enemies){
        var ex=Math.floor(e.x/TILE),ey=Math.floor(e.y/TILE);
        if(explored[ey]&&explored[ey][ex]){
            if(e.isBoss){
                var bPulse=0.6+Math.sin(frameCount*0.12)*0.4;
                ctx.fillStyle='rgba(255,0,0,'+bPulse+')';
                ctx.fillRect(mmX+ex*mmS-1,mmY+ey*mmS-1,mmS+2,mmS+2);
            } else {
                ctx.fillStyle=e.isElite?'#ff8800':'#ff4444';
                ctx.fillRect(mmX+ex*mmS,mmY+ey*mmS,mmS,mmS);
            }
        }
    }
    // Collectibles as colored dots
    for(var cd of collectibleDrops){
        if(cd.collected) continue;
        var cdx=Math.floor(cd.x/TILE),cdy=Math.floor(cd.y/TILE);
        if(explored[cdy]&&explored[cdy][cdx]){
            var coll=COLLECTIBLES.find(function(c){return c.id===cd.collectibleId;});
            ctx.fillStyle=coll.color;ctx.fillRect(mmX+cdx*mmS,mmY+cdy*mmS,mmS,mmS);
        }
    }
    // Label
    ctx.fillStyle='rgba(200,200,200,0.35)';ctx.font='8px monospace';ctx.textAlign='right';
    ctx.fillText(T('minimap'),mmX+mmW,mmY-5);
}

function drawExpeditionHUD(){
    var W=canvas.width;
    // HP bar (improved with gradient and glow)
    var hpW=120,hpH=10,hpX=15,hpY=15;
    var hpRatio=playerStats.hp/playerStats.maxHp;
    // Background
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(hpX-2,hpY-2,hpW+4,hpH+4);
    // HP fill with gradient
    if(hpRatio>0){
        var hpGrad=ctx.createLinearGradient(hpX,hpY,hpX,hpY+hpH);
        if(hpRatio>0.3){hpGrad.addColorStop(0,'#ff6666');hpGrad.addColorStop(1,'#cc2222');}
        else{hpGrad.addColorStop(0,'#ff3333');hpGrad.addColorStop(1,'#aa0000');}
        ctx.fillStyle=hpGrad;ctx.fillRect(hpX,hpY,hpW*hpRatio,hpH);
        // Shine
        ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(hpX,hpY,hpW*hpRatio,hpH/2);
    }
    // Low HP pulse
    if(hpRatio<=0.3){
        ctx.save();ctx.globalAlpha=0.15+Math.sin(frameCount*0.15)*0.1;
        ctx.fillStyle='#ff0000';ctx.fillRect(hpX-2,hpY-2,hpW+4,hpH+4);ctx.restore();
    }
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.strokeRect(hpX-2,hpY-2,hpW+4,hpH+4);
    // Stats text with shadow
    ctx.fillStyle='#000';ctx.font='11px monospace';ctx.textAlign='left';
    ctx.fillText(T('hp')+': '+playerStats.hp+'/'+playerStats.maxHp,hpX+1,hpY+hpH+15);
    ctx.fillStyle='#fff';ctx.fillText(T('hp')+': '+playerStats.hp+'/'+playerStats.maxHp,hpX,hpY+hpH+14);
    ctx.fillStyle='#000';ctx.fillText(T('atk')+':'+(playerStats.atk+(equippedWeapon?equippedWeapon.dmg:0))+' '+T('def')+':'+playerStats.def,hpX+1,hpY+hpH+29);
    ctx.fillStyle='#ddd';ctx.fillText(T('atk')+':'+(playerStats.atk+(equippedWeapon?equippedWeapon.dmg:0))+' '+T('def')+':'+playerStats.def,hpX,hpY+hpH+28);

    // Weapon display (with color indicator)
    if(equippedWeapon){
        ctx.fillStyle='#000';ctx.font='10px monospace';
        ctx.fillText('\u2694 '+weaponName(equippedWeapon)+(equippedWeapon.enchant?' \u2726':''),hpX+1,hpY+hpH+43);
        ctx.fillStyle=equippedWeapon.color;
        ctx.fillText('\u2694 '+weaponName(equippedWeapon)+(equippedWeapon.enchant?' \u2726':''),hpX,hpY+hpH+42);
    }

    // Gold + Keys (with icons)
    ctx.fillStyle='#000';ctx.font='11px monospace';ctx.textAlign='left';
    ctx.fillText(T('gold')+': '+gold+'  '+T('keys')+': '+playerKeys,hpX+1,hpY+hpH+57);
    ctx.fillStyle='#ffd700';ctx.fillText(T('gold')+': '+gold,hpX,hpY+hpH+56);
    ctx.fillStyle='#ffcc44';ctx.fillText('  '+T('keys')+': '+playerKeys,hpX+ctx.measureText(T('gold')+': '+gold).width,hpY+hpH+56);

    // Timer (improved with background)
    var secs=Math.ceil(missionTimer/60),mins=Math.floor(secs/60),s=secs%60;
    var timeStr=mins+':'+(s<10?'0':'')+s;
    var timeW=ctx.measureText(timeStr).width+20;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(W/2-timeW/2,8,timeW,24);
    ctx.font='bold 16px monospace';ctx.textAlign='center';
    if(secs<15){ctx.save();ctx.shadowColor='#ff0000';ctx.shadowBlur=8;ctx.fillStyle='#ee4444';ctx.fillText(timeStr,W/2,26);ctx.restore();}
    else{ctx.fillStyle='#fff';ctx.fillText(timeStr,W/2,26);}

    // Floor + Biome (with background)
    var infoStr=getBiomeName(currentBiome)+' '+T('floor')+' '+(currentFloor+1)+'/'+MAX_FLOORS;
    ctx.font='11px monospace';ctx.fillStyle='rgba(0,0,0,0.4)';
    var infoW=ctx.measureText(infoStr).width+16;
    ctx.fillRect(W/2-infoW/2,32,infoW,16);
    ctx.fillStyle='#aaa';ctx.fillText(infoStr,W/2,44);

    // Boss floor hint
    if(currentFloor===MAX_FLOORS-1&&!bossDefeated){
        ctx.fillStyle='#ff4444';ctx.font='bold 11px monospace';
        ctx.fillText(T('exitLocked'),W/2,58);
    }

    // Boss HP bar (big bar at top of screen)
    if(bossRef&&!bossDefeated){
        var bhpW=Math.min(300,W*0.5),bhpH=12,bhpX=W/2-bhpW/2,bhpY=62;
        var bRatio=bossRef.hp/bossRef.maxHp;
        // Background
        ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(bhpX-2,bhpY-2,bhpW+4,bhpH+4);
        // HP fill
        if(bRatio>0){
            var bHpG=ctx.createLinearGradient(bhpX,bhpY,bhpX,bhpY+bhpH);
            if(bossPhase===1){bHpG.addColorStop(0,'#ff4400');bHpG.addColorStop(1,'#aa0000');}
            else{bHpG.addColorStop(0,'#ff6666');bHpG.addColorStop(1,'#cc2222');}
            ctx.fillStyle=bHpG;ctx.fillRect(bhpX,bhpY,bhpW*bRatio,bhpH);
            ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(bhpX,bhpY,bhpW*bRatio,bhpH/2);
        }
        ctx.strokeStyle=bossPhase===1?'#ff4400':'rgba(255,100,100,0.5)';ctx.lineWidth=1;ctx.strokeRect(bhpX-2,bhpY-2,bhpW+4,bhpH+4);
        // Boss name
        ctx.fillStyle=bossPhase===1?'#ff4400':'#ff6666';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText('BOSS'+(bossPhase===1?(lang==='zh'?' [狂暴]':' [ENRAGED]'):''),W/2,bhpY-4);
        // HP text
        ctx.fillStyle='#fff';ctx.font='9px monospace';
        ctx.fillText(bossRef.hp+'/'+bossRef.maxHp,W/2,bhpY+bhpH+10);
    }

    // Active buffs (top-right)
    // Active buffs as icons at top
    if(activeBuffs.length>0){
        var buffIconSize=36,buffGap=4;
        var buffStartX=W/2-activeBuffs.length*(buffIconSize+buffGap)/2;
        var buffY=8;
        for(var bi=0;bi<activeBuffs.length;bi++){
            var b=activeBuffs[bi];
            var bix=buffStartX+bi*(buffIconSize+buffGap);
            // Find buff color
            var buffColor='#88aaff';
            for(var ri=0;ri<RECIPES.length;ri++){
                if(RECIPES[ri].effect===b.effect&&RECIPES[ri].tier===b.tier){buffColor=RECIPES[ri].color;break;}
            }
            // Icon background with glow
            ctx.save();
            ctx.shadowColor=buffColor;ctx.shadowBlur=8;
            ctx.fillStyle='rgba(20,20,30,0.9)';
            ctx.fillRect(bix,buffY,buffIconSize,buffIconSize);
            ctx.shadowBlur=0;
            ctx.strokeStyle=buffColor;ctx.lineWidth=2;
            ctx.strokeRect(bix,buffY,buffIconSize,buffIconSize);
            // Tier indicator
            ctx.fillStyle=buffColor;ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText('T'+b.tier,bix+buffIconSize/2,buffY+12);
            // Effect icon/symbol
            ctx.font='bold 16px monospace';
            var symbol='?';
            if(b.effect==='attack') symbol='⚔';
            else if(b.effect==='defense') symbol='🛡';
            else if(b.effect==='speed') symbol='⚡';
            else if(b.effect==='regen') symbol='❤';
            else if(b.effect==='poison') symbol='☠';
            else if(b.effect==='stealth') symbol='👁';
            else if(b.effect==='revive') symbol='⭐';
            else if(b.effect==='maxhp') symbol='♥';
            ctx.fillText(symbol,bix+buffIconSize/2,buffY+28);
            ctx.restore();
        }
    }

    // Potion quickbar (improved with glow and better visuals)
    if(carriedPotions.length>0){
        var qbSlotW=48,qbSlotH=48,qbGap=6;
        var qbTotalW=carriedPotions.length*(qbSlotW+qbGap)-qbGap;
        var qbX=Math.floor((W-qbTotalW)/2),qbY=canvas.height-(isMobile?55:60);
        for(var i=0;i<carriedPotions.length;i++){
            var p=carriedPotions[i];
            var sx2=qbX+i*(qbSlotW+qbGap),sy2=qbY;
            // Slot background with gradient
            var slotG=ctx.createLinearGradient(sx2,sy2,sx2,sy2+qbSlotH);
            slotG.addColorStop(0,'rgba(15,15,30,0.8)');slotG.addColorStop(1,'rgba(5,5,15,0.9)');
            ctx.fillStyle=slotG;ctx.fillRect(sx2,sy2,qbSlotW,qbSlotH);
            // Potion bottle (improved shape)
            var bx2=sx2+14,by2=sy2+8;
            ctx.fillStyle=p.color||'#44dd88';
            // Bottle body
            ctx.beginPath();ctx.moveTo(bx2+2,by2+8);ctx.lineTo(bx2,by2+12);ctx.lineTo(bx2,by2+26);
            ctx.lineTo(bx2+20,by2+26);ctx.lineTo(bx2+20,by2+12);ctx.lineTo(bx2+18,by2+8);ctx.closePath();ctx.fill();
            // Bottle neck
            ctx.fillRect(bx2+6,by2,8,10);
            // Cork
            ctx.fillStyle='#8a6a3a';ctx.fillRect(bx2+5,by2-2,10,4);
            // Liquid shine
            ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(bx2+2,by2+14,5,10);
            // Border glow
            ctx.strokeStyle=p.color||'#44dd88';ctx.lineWidth=1.5;ctx.strokeRect(sx2,sy2,qbSlotW,qbSlotH);
            // Slot number
            ctx.fillStyle='#aaa';ctx.font='9px monospace';ctx.textAlign='center';
            ctx.fillText((i+1)+'',sx2+qbSlotW/2,sy2+qbSlotH+10);
            // Potion name
            ctx.fillStyle='#ccc';ctx.font='8px monospace';
            ctx.fillText(recipeName(p).substring(0,6),sx2+qbSlotW/2,sy2-3);
        }
    }
    // Settings gear in expedition
    drawSettingsGear(W-38,15,26);
}

function useCarriedPotion(index){
    if(index<0||index>=carriedPotions.length) return;
    var p=carriedPotions[index];
    if(p.effect==='heal'){
        if(playerStats.hp>=playerStats.maxHp) return;
        var healAmt=p.value;
        if(hasSkill('potionMaster')) healAmt=Math.floor(healAmt*1.5);
        playerStats.hp=Math.min(playerStats.maxHp,playerStats.hp+healAmt);
        spawnFloat(player.x,player.y-20,'+'+healAmt+' HP','#ee4444');
    } else if(p.effect==='revive'){
        playerStats.revive=true;
        spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');
    } else {
        var buffVal=p.value;
        if(hasSkill('potionMaster')) buffVal=Math.floor(buffVal*1.5);
        var buffP={effect:p.effect,tier:p.tier,value:buffVal,name:p.name};
        var existing=activeBuffs.findIndex(function(b){return b.effect===p.effect;});
        if(existing>=0){if(p.tier>=activeBuffs[existing].tier) activeBuffs[existing]=buffP;}
        else activeBuffs.push(buffP);
        applyBuffs();
        spawnFloat(player.x,player.y-20,recipeName(p),p.color||'#fff');
    }
    carriedPotions.splice(index,1);
    playSound('drink');
}

// ============ WEAPON POPUP ============
function drawWeaponPopup(){
    var W=canvas.width,H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var pw=300,ph=220,px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='rgba(14,14,26,0.95)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);

    var w=weaponPopup.weapon;
    ctx.fillStyle='#ffd700';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText(T('weaponFound'),W/2,py+28);

    // New weapon
    ctx.fillStyle=w.color;ctx.font='bold 14px monospace';
    ctx.fillText(weaponName(w),W/2,py+58);
    ctx.fillStyle='#aaa';ctx.font='11px monospace';
    ctx.fillText(T('dmg')+':'+w.dmg+' '+T('spd')+':'+w.speed.toFixed(1)+' '+T('rng')+':'+w.range+' T'+w.tier,W/2,py+76);

    // Current weapon
    if(equippedWeapon){
        ctx.fillStyle='#888';ctx.font='11px monospace';
        ctx.fillText('— '+T('weapon')+' —',W/2,py+100);
        ctx.fillStyle=equippedWeapon.color;ctx.font='12px monospace';
        ctx.fillText(weaponName(equippedWeapon),W/2,py+116);
        ctx.fillStyle='#777';ctx.font='10px monospace';
        ctx.fillText(T('dmg')+':'+equippedWeapon.dmg+' '+T('spd')+':'+equippedWeapon.speed.toFixed(1)+' '+T('rng')+':'+equippedWeapon.range,W/2,py+132);
    }

    // Buttons
    var btnW=110,btnH=34,gap=20;
    var b1x=W/2-btnW-gap/2,b2x=W/2+gap/2,bty=py+ph-50;
    ctx.fillStyle='#44dd88';ctx.fillRect(b1x,bty,btnW,btnH);
    ctx.fillStyle='#000';ctx.font='bold 12px monospace';ctx.textAlign='center';
    ctx.fillText(T('weaponReplace'),b1x+btnW/2,bty+btnH/2+4);

    ctx.fillStyle='#555';ctx.fillRect(b2x,bty,btnW,btnH);
    ctx.fillStyle='#ddd';ctx.font='bold 12px monospace';
    ctx.fillText(T('weaponKeep'),b2x+btnW/2,bty+btnH/2+4);
}

function drawMerchantPopup(){
    var W=canvas.width,H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var pw=Math.min(W-40,420),ph=Math.min(H-60,400),px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='rgba(14,14,26,0.95)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#ffcc44';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);

    ctx.fillStyle='#ffcc44';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText(T('merchant'),W/2,py+28);
    ctx.fillStyle='#ffd700';ctx.font='11px monospace';
    ctx.fillText(T('gold')+': '+gold,W/2,py+46);

    // Close X
    var cbS=28,cbX=px+pw-cbS-6,cbY=py+6;
    ctx.fillStyle='rgba(255,60,60,0.15)';ctx.fillRect(cbX,cbY,cbS,cbS);
    ctx.strokeStyle='#ff4444';ctx.lineWidth=1;ctx.strokeRect(cbX,cbY,cbS,cbS);
    ctx.fillStyle='#ff6666';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText('X',cbX+cbS/2,cbY+cbS/2+5);

    // Clip content area
    ctx.save();
    ctx.beginPath();ctx.rect(px,py+55,pw,ph-70);ctx.clip();
    ctx.translate(0, merchantScrollY);

    // Shop items
    var iy=py+65, itemH=50;
    for(var i=0;i<shopStock.length;i++){
        var item=shopStock[i];
        var y2=iy+i*(itemH+4);
        ctx.fillStyle='#111118';ctx.fillRect(px+10,y2,pw-20,itemH);
        ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.strokeRect(px+10,y2,pw-20,itemH);

        ctx.textAlign='left';
        if(item.type==='herb'){
            ctx.fillStyle='#44dd88';ctx.font='12px monospace';
            ctx.fillText(herbName(item.key)+' x'+item.count,px+20,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText('→ '+HERBS[item.key].yields.map(function(e){return essenceName(e);}).join('+'),px+20,y2+36);
        } else if(item.type==='potion'){
            ctx.fillStyle=item.recipe.color;ctx.font='12px monospace';
            ctx.fillText(recipeName(item.recipe),px+20,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText(recipeDesc(item.recipe),px+20,y2+36);
        } else if(item.type==='weapon'){
            ctx.fillStyle=item.weapon.color;ctx.font='12px monospace';
            ctx.fillText(weaponName(item.weapon),px+20,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText(T('dmg')+':'+item.weapon.dmg+' '+T('spd')+':'+item.weapon.speed.toFixed(1)+' T'+item.weapon.tier,px+20,y2+36);
        } else if(item.type==='key'){
            ctx.fillStyle='#ffcc44';ctx.font='12px monospace';
            ctx.fillText('🔑 '+T('key')+' x'+(item.count||1),px+20,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText(lang==='zh'?'打开锁住的房间':'Opens locked rooms',px+20,y2+36);
        }

        // Price + buy button
        var btnW2=70,btnH2=28,btnX=px+pw-btnW2-20,btnY=y2+10;
        var canAfford=gold>=item.price;
        ctx.fillStyle=canAfford?'#44dd88':'#444';ctx.fillRect(btnX,btnY,btnW2,btnH2);
        ctx.fillStyle=canAfford?'#000':'#888';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(item.price+'G '+T('buy'),btnX+btnW2/2,btnY+btnH2/2+4);
    }

    // Sell section — sell herbs, potions, weapons for gold
    var sellY=iy+shopStock.length*(itemH+4)+10;
    ctx.fillStyle='#888';ctx.font='11px monospace';ctx.textAlign='center';
    ctx.fillText('— '+T('sell')+' —',W/2,sellY);
    sellY+=18;
    
    // Sell herbs
    var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
    for(var i=0;i<Math.min(herbKeys.length,3);i++){
        var k=herbKeys[i];
        var sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(px+10,sy2,pw-20,28);
        ctx.fillStyle='#44dd88';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(herbName(k)+' x'+inventory.herbs[k],px+20,sy2+18);
        var sellPrice=3;
        var sbX=px+pw-80,sbW=60,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText(sellPrice+'G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }
    sellY+=Math.min(herbKeys.length,3)*32+8;
    
    // Sell potions
    for(var i=0;i<Math.min(inventory.potions.length,3);i++){
        var pot=inventory.potions[i];
        var sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(px+10,sy2,pw-20,28);
        ctx.fillStyle=pot.color||'#88aaff';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(recipeName(pot),px+20,sy2+18);
        var sellPrice=5+pot.tier*3;
        var sbX=px+pw-80,sbW=60,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText(sellPrice+'G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }
    sellY+=Math.min(inventory.potions.length,3)*32+8;
    
    // Sell weapons
    for(var i=0;i<Math.min(inventory.weapons.length,3);i++){
        var wep=inventory.weapons[i];
        var sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(px+10,sy2,pw-20,28);
        ctx.fillStyle=wep.color||'#aabbcc';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(weaponName(wep)+' (T'+wep.tier+')',px+20,sy2+18);
        var sellPrice=8+wep.tier*8;
        var sbX=px+pw-80,sbW=60,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText(sellPrice+'G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }

    ctx.restore();
}

function drawBuffPopup(){
    var W=canvas.width,H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var pw=280,ph=200,px=(W-pw)/2,py=(H-ph)/2;
    // Background
    ctx.fillStyle='#0f0f18';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#44dd88';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
    // Title
    ctx.fillStyle='#44dd88';ctx.font='bold 14px monospace';ctx.textAlign='center';
    ctx.fillText(lang==='zh'?'增益详情':'Buff Details',W/2,py+25);
    // Close button
    var cbS=24,cbX=px+pw-cbS-8,cbY=py+8;
    ctx.fillStyle='#aa4444';ctx.fillRect(cbX,cbY,cbS,cbS);
    ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='center';
    ctx.fillText('×',cbX+cbS/2,cbY+cbS/2+5);
    // Buff info
    var b=buffPopup;
    var buffColor='#88aaff';
    for(var ri=0;ri<RECIPES.length;ri++){
        if(RECIPES[ri].effect===b.effect&&RECIPES[ri].tier===b.tier){buffColor=RECIPES[ri].color;break;}
    }
    ctx.fillStyle=buffColor;ctx.font='bold 16px monospace';
    ctx.fillText(b.name,W/2,py+60);
    ctx.fillStyle='#aaa';ctx.font='12px monospace';
    ctx.fillText('Tier '+b.tier,W/2,py+80);
    // Effect description
    ctx.fillStyle='#ddd';ctx.font='11px monospace';
    var desc='';
    if(b.effect==='attack') desc='ATK +'+b.value;
    else if(b.effect==='defense') desc='DEF +'+b.value;
    else if(b.effect==='maxhp') desc='Max HP +'+b.value;
    else if(b.effect==='speed') desc='Speed +'+b.value;
    else if(b.effect==='regen') desc='HP Regen +'+b.value+'/s';
    else if(b.effect==='poison') desc='Poison Damage +'+b.value;
    else if(b.effect==='stealth') desc='Stealth';
    else if(b.effect==='revive') desc='Auto-Revive once';
    ctx.fillText(desc,W/2,py+100);
    // Remove button
    var rmBtnW=120,rmBtnH=32,rmBtnX=(W-rmBtnW)/2,rmBtnY=py+ph-50;
    ctx.fillStyle='#dd4444';ctx.fillRect(rmBtnX,rmBtnY,rmBtnW,rmBtnH);
    ctx.fillStyle='#fff';ctx.font='bold 11px monospace';
    ctx.fillText(lang==='zh'?'移除增益':'Remove Buff',rmBtnX+rmBtnW/2,rmBtnY+rmBtnH/2+4);
}

function handleExpeditionPopupClick(cx,cy){
    var W=canvas.width,H=canvas.height;
    if(buffPopup){
        var pw=280,ph=200,px=(W-pw)/2,py=(H-ph)/2;
        // Close button
        var cbS=24,cbX=px+pw-cbS-8,cbY=py+8;
        if(cx>=cbX&&cx<=cbX+cbS&&cy>=cbY&&cy<=cbY+cbS){buffPopup=null;playSound('click');return;}
        // Remove button
        var rmBtnW=120,rmBtnH=32,rmBtnX=(W-rmBtnW)/2,rmBtnY=py+ph-50;
        if(cx>=rmBtnX&&cx<=rmBtnX+rmBtnW&&cy>=rmBtnY&&cy<=rmBtnY+rmBtnH){
            var idx=activeBuffs.indexOf(buffPopup);
            if(idx>=0){
                activeBuffs.splice(idx,1);
                applyBuffs();
                spawnFloat(player.x,player.y-20,lang==='zh'?'移除增益':'Buff Removed','#ffaa44');
            }
            buffPopup=null;playSound('click');return;
        }
        // Click outside
        if(cx<px||cx>px+pw||cy<py||cy>py+ph){buffPopup=null;playSound('click');return;}
        return;
    }
    if(weaponPopup){
        var pw=300,ph=220,px=(W-pw)/2,py=(H-ph)/2;
        var btnW=110,btnH=34,gap=20;
        var b1x=W/2-btnW-gap/2,b2x=W/2+gap/2,bty=py+ph-50;
        if(cx>=b1x&&cx<=b1x+btnW&&cy>=bty&&cy<=bty+btnH){
            // Replace weapon — old goes to inventory
            if(equippedWeapon&&equippedWeapon.name!=='Rusty Dagger') inventory.weapons.push(equippedWeapon);
            equippedWeapon=weaponPopup.weapon;
            weaponPopup=null; playSound('craft'); return;
        }
        if(cx>=b2x&&cx<=b2x+btnW&&cy>=bty&&cy<=bty+btnH){
            // Keep current — new goes to inventory
            inventory.weapons.push(weaponPopup.weapon);
            weaponPopup=null; playSound('click'); return;
        }
        return;
    }
    if(merchantPopup){
        var pw2=Math.min(W-40,420),ph2=Math.min(H-60,400),px2=(W-pw2)/2,py2=(H-ph2)/2;
        // Close button (not affected by scroll)
        var cbS=28,cbX=px2+pw2-cbS-6,cbY=py2+6;
        if(cx>=cbX&&cx<=cbX+cbS&&cy>=cbY&&cy<=cbY+cbS){merchantPopup=null;merchantScrollY=0;playSound('click');return;}
        // Click outside
        if(cx<px2||cx>px2+pw2||cy<py2||cy>py2+ph2){merchantPopup=null;merchantScrollY=0;playSound('click');return;}

        // Apply scroll offset for content clicks
        cy = cy - merchantScrollY;

        // Buy items
        var iy=py2+65,itemH=50;
        for(var i=0;i<shopStock.length;i++){
            var item=shopStock[i];
            var y2=iy+i*(itemH+4);
            var btnW2=70,btnH2=28,btnX=px2+pw2-btnW2-20,btnY=y2+10;
            if(cx>=btnX&&cx<=btnX+btnW2&&cy>=btnY&&cy<=btnY+btnH2){
                if(gold<item.price){
                    spawnFloat(player.x,player.y-20,T('notEnoughGold'),'#ff4444');
                    playSound('error'); return;
                }
                gold-=item.price;
                if(item.type==='herb') addHerb(item.key,item.count);
                else if(item.type==='potion'){
                    var r=item.recipe;
                    inventory.potions.push({name:r.name,effect:r.effect,tier:r.tier,value:r.value,color:r.color,desc:r.desc});
                }
                else if(item.type==='weapon') inventory.weapons.push(item.weapon);
                else if(item.type==='key') playerKeys+=(item.count||1);
                shopStock.splice(i,1);
                spawnFloat(player.x,player.y-20,T('boughtItem'),'#44dd88');
                playSound('craft'); return;
            }
        }

        // Sell herbs
        var sellY=iy+shopStock.length*(itemH+4)+28;
        var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
        for(var i=0;i<Math.min(herbKeys.length,3);i++){
            var k=herbKeys[i];
            var sy2=sellY+i*32;
            var sbX=px2+pw2-80,sbW=60,sbH=22;
            if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                inventory.herbs[k]--;
                if(inventory.herbs[k]<=0) delete inventory.herbs[k];
                gold+=3;
                spawnFloat(player.x,player.y-20,T('soldItem')+' +3G','#ffd700');
                playSound('pickup'); return;
            }
        }
        sellY+=Math.min(herbKeys.length,3)*32+8;
        
        // Sell potions
        for(var i=0;i<Math.min(inventory.potions.length,3);i++){
            var pot=inventory.potions[i];
            var sy2=sellY+i*32;
            var sbX=px2+pw2-80,sbW=60,sbH=22;
            if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                var sellPrice=5+pot.tier*3;
                inventory.potions.splice(i,1);
                gold+=sellPrice;
                spawnFloat(player.x,player.y-20,T('soldItem')+' +'+sellPrice+'G','#ffd700');
                playSound('pickup'); return;
            }
        }
        sellY+=Math.min(inventory.potions.length,3)*32+8;
        
        // Sell weapons
        for(var i=0;i<Math.min(inventory.weapons.length,3);i++){
            var wep=inventory.weapons[i];
            var sy2=sellY+i*32;
            var sbX=px2+pw2-80,sbW=60,sbH=22;
            if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                var sellPrice=8+wep.tier*8;
                inventory.weapons.splice(i,1);
                gold+=sellPrice;
                spawnFloat(player.x,player.y-20,T('soldItem')+' +'+sellPrice+'G','#ffd700');
                playSound('pickup'); return;
            }
        }
    }
}

function drawMobileStick(){
    var lx=80,ly=canvas.height-100,lr=45;
    ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(lx,ly,lr,0,Math.PI*2);ctx.fill();ctx.restore();
    if(mobileStick.active){
        var dx=mobileStick.cx-mobileStick.sx,dy=mobileStick.cy-mobileStick.sy;
        var d=Math.sqrt(dx*dx+dy*dy);if(d>lr){dx=dx/d*lr;dy=dy/d*lr;}
        ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle='#fff';
        ctx.beginPath();ctx.arc(lx+dx,ly+dy,18,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    var rx=canvas.width-80,ry=canvas.height-100,rr=40;
    ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#ee4444';
    ctx.beginPath();ctx.arc(rx,ry,rr,0,Math.PI*2);ctx.fill();ctx.restore();
    if(mobileAimStick.active){
        var adx=mobileAimStick.cx-mobileAimStick.sx,ady=mobileAimStick.cy-mobileAimStick.sy;
        var ad=Math.sqrt(adx*adx+ady*ady);if(ad>rr){adx=adx/ad*rr;ady=ady/ad*rr;}
        ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle='#ee4444';
        ctx.beginPath();ctx.arc(rx+adx,ry+ady,16,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.save();ctx.globalAlpha=0.7;ctx.fillStyle='#fff';ctx.font='bold 12px monospace';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('ATK',rx,ry);ctx.restore();
}

// ============ LAB UI ============
var labHover = null;
var labFurniture = {};

function getLabLayout(){
    var W=canvas.width,H=canvas.height;
    var vpx=W/2,vpy=H*0.28;
    var bwW=W*0.28,bwH=H*0.18;
    var exitW=bwW*0.4,exitH=bwH*0.7;
    var exitX=vpx-exitW/2,exitY=vpy-bwH/2+bwH*0.1;
    var cR=Math.min(40,W*0.05,H*0.06);
    var cX=vpx,cY=H*0.62;
    var benchW=Math.min(130,W*0.15),benchH=Math.min(80,H*0.12);
    var benchX=W*0.1,benchY=H*0.52;
    var shelfW=Math.min(110,W*0.13),shelfH=Math.min(110,H*0.18);
    var shelfX=W*0.82-shelfW/2,shelfY=H*0.44;
    // Weapon rack (left of alembic)
    var rackW=Math.min(80,W*0.1),rackH=Math.min(90,H*0.14);
    var rackX=W*0.32,rackY=H*0.48;
    // Merchant corner (right side, near shelf)
    var merchW=Math.min(70,W*0.08),merchH=Math.min(80,H*0.12);
    var merchX=W*0.68,merchY=H*0.62;
    return {
        vp:{x:vpx,y:vpy}, backWall:{x:vpx-bwW/2,y:vpy-bwH/2,w:bwW,h:bwH},
        door:{x:exitX,y:exitY,w:exitW,h:exitH},
        cauldron:{x:cX-cR*1.2,y:cY-cR,w:cR*2.4,h:cR*2,cx:cX,cy:cY,r:cR},
        bench:{x:benchX,y:benchY,w:benchW,h:benchH},
        shelf:{x:shelfX,y:shelfY,w:shelfW,h:shelfH},
        rack:{x:rackX,y:rackY,w:rackW,h:rackH},
        merch:{x:merchX,y:merchY,w:merchW,h:merchH},
        research:{x:W*0.18,y:H*0.72,w:Math.min(90,W*0.1),h:Math.min(60,H*0.09)},
        relicCase:{x:W*0.78,y:H*0.72,w:Math.min(80,W*0.09),h:Math.min(60,H*0.09)},
        skillBook:{x:W*0.48,y:H*0.78,w:Math.min(80,W*0.09),h:Math.min(55,H*0.08)}
    };
}

function drawCaveScene(){
    var W=canvas.width,H=canvas.height;
    var t=Date.now()*0.001;
    var lay=getLabLayout();
    labFurniture=lay;
    var vpx=lay.vp.x,vpy=lay.vp.y;
    var bw=lay.backWall;
    ctx.fillStyle='#050508';ctx.fillRect(0,0,W,H);
    // Back wall
    var wallGrad=ctx.createRadialGradient(vpx,vpy,10,vpx,vpy,bw.w*0.7);
    wallGrad.addColorStop(0,'#1a1518');wallGrad.addColorStop(1,'#0e0b10');
    ctx.fillStyle=wallGrad;ctx.fillRect(bw.x,bw.y,bw.w,bw.h);
    ctx.save();ctx.globalAlpha=0.06;
    for(var i=0;i<20;i++){var rx=bw.x+(i*37)%bw.w,ry=bw.y+(i*23)%bw.h;ctx.fillStyle=i%2?'#443322':'#332244';ctx.beginPath();ctx.ellipse(rx,ry,3+i%5,(3+i%5)*0.7,i*0.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    // Floor
    ctx.fillStyle='#12100e';
    ctx.beginPath();ctx.moveTo(bw.x,bw.y+bw.h);ctx.lineTo(0,H);ctx.lineTo(W,H);ctx.lineTo(bw.x+bw.w,bw.y+bw.h);ctx.closePath();ctx.fill();
    ctx.save();ctx.globalAlpha=0.04;
    for(var i=0;i<40;i++){ctx.fillStyle='#886644';ctx.beginPath();ctx.ellipse((i*173)%W,H*0.4+(i*97)%(H*0.6),8+i%12,4+i%6,i*0.3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    ctx.save();ctx.globalAlpha=0.025;ctx.strokeStyle='#887766';ctx.lineWidth=1;
    for(var i=0;i<8;i++){ctx.beginPath();ctx.moveTo(W*(i/7),H);ctx.lineTo(vpx,vpy);ctx.stroke();}
    for(var i=1;i<=5;i++){var ratio=i/6,ly2=bw.y+bw.h+(H-bw.y-bw.h)*ratio;ctx.beginPath();ctx.moveTo(bw.x-bw.x*ratio,ly2);ctx.lineTo(bw.x+bw.w+(W-bw.x-bw.w)*ratio,ly2);ctx.stroke();}
    ctx.restore();
    // Ceiling
    ctx.fillStyle='#0a0810';
    ctx.beginPath();ctx.moveTo(bw.x,bw.y);ctx.lineTo(0,0);ctx.lineTo(W,0);ctx.lineTo(bw.x+bw.w,bw.y);ctx.closePath();ctx.fill();
    ctx.save();
    for(var i=0;i<12;i++){var sx2=W*0.05+(i*W*0.9/11),depth=Math.abs(sx2-vpx)/(W/2);var sLen=15+depth*30+Math.sin(i*2.7)*10,sTop=depth*bw.y*0.3;ctx.fillStyle='rgba(20,16,28,'+(0.6+depth*0.3)+')';ctx.beginPath();ctx.moveTo(sx2-4-depth*3,sTop);ctx.lineTo(sx2+4+depth*3,sTop);ctx.lineTo(sx2+Math.sin(i)*2,sTop+sLen);ctx.closePath();ctx.fill();}
    ctx.restore();
    // Side walls
    ctx.fillStyle='#0d0b12';
    ctx.beginPath();ctx.moveTo(bw.x,bw.y);ctx.lineTo(0,0);ctx.lineTo(0,H);ctx.lineTo(bw.x,bw.y+bw.h);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(bw.x+bw.w,bw.y);ctx.lineTo(W,0);ctx.lineTo(W,H);ctx.lineTo(bw.x+bw.w,bw.y+bw.h);ctx.closePath();ctx.fill();
    ctx.save();ctx.globalAlpha=0.035;
    for(var side=0;side<2;side++) for(var i=0;i<25;i++){var wx=side===0?(i*43)%bw.x:bw.x+bw.w+(i*43)%(W-bw.x-bw.w);ctx.fillStyle=i%3===0?'#554433':'#332244';ctx.beginPath();ctx.ellipse(wx,(i*67)%H,5+i%8,(5+i%8)*0.6,i,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    // Cave exit tunnel
    var d=lay.door,doorHov=labHover==='expedition';
    ctx.save();
    ctx.beginPath();ctx.moveTo(d.x,d.y+d.h);ctx.lineTo(d.x,d.y+d.h*0.3);
    ctx.quadraticCurveTo(d.x,d.y-d.h*0.05,d.x+d.w/2,d.y-d.h*0.05);
    ctx.quadraticCurveTo(d.x+d.w,d.y-d.h*0.05,d.x+d.w,d.y+d.h*0.3);
    ctx.lineTo(d.x+d.w,d.y+d.h);ctx.closePath();
    var tunG=ctx.createRadialGradient(d.x+d.w/2,d.y+d.h*0.3,2,d.x+d.w/2,d.y+d.h*0.3,d.w*0.8);
    tunG.addColorStop(0,doorHov?'#3a4a3a':'#1a2a1a');tunG.addColorStop(0.5,doorHov?'#1a2a1a':'#0a150a');tunG.addColorStop(1,'#050808');
    ctx.fillStyle=tunG;ctx.fill();
    ctx.save();ctx.globalAlpha=doorHov?0.35:0.15;
    var dlG=ctx.createRadialGradient(d.x+d.w/2,d.y+d.h*0.25,1,d.x+d.w/2,d.y+d.h*0.25,d.w*0.4);
    dlG.addColorStop(0,'#aaddaa');dlG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dlG;ctx.fill();ctx.restore();
    ctx.strokeStyle=doorHov?'#4a5a4a':'#2a2a2a';ctx.lineWidth=2;ctx.stroke();ctx.restore();
    ctx.fillStyle=doorHov?'#88ddaa':'#557755';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabExpedition'),d.x+d.w/2,d.y+d.h+14);

    // Alembic
    var c=lay.cauldron,cR=c.r,cauldHov=labHover==='brew';
    for(var i=0;i<4;i++){var ffx=c.cx+Math.sin(t*3+i*1.5)*cR*0.2,ffy=c.cy+cR*0.7+Math.sin(t*4+i)*2;var fG=ctx.createRadialGradient(ffx,ffy,1,ffx,ffy,6+Math.sin(t*5+i)*2);fG.addColorStop(0,'rgba(255,150,30,0.6)');fG.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=fG;ctx.beginPath();ctx.arc(ffx,ffy,6+Math.sin(t*5+i)*2,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#3a3030';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(c.cx-cR*0.5,c.cy+cR*0.8);ctx.lineTo(c.cx-cR*0.15,c.cy+cR*0.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(c.cx+cR*0.5,c.cy+cR*0.8);ctx.lineTo(c.cx+cR*0.15,c.cy+cR*0.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(c.cx-cR*0.3,c.cy+cR*0.35);ctx.lineTo(c.cx+cR*0.3,c.cy+cR*0.35);ctx.stroke();
    ctx.fillStyle=cauldHov?'rgba(50,55,80,0.85)':'rgba(35,38,60,0.85)';
    ctx.beginPath();ctx.ellipse(c.cx,c.cy+cR*0.15,cR*0.4,cR*0.35,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=cauldHov?'rgba(55,60,85,0.8)':'rgba(40,43,65,0.8)';
    ctx.fillRect(c.cx-cR*0.1,c.cy-cR*0.55,cR*0.2,cR*0.4);
    ctx.fillStyle=cauldHov?'#4a4a5e':'#333348';
    ctx.beginPath();ctx.ellipse(c.cx,c.cy-cR*0.55,cR*0.22,cR*0.2,0,Math.PI,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(c.cx,c.cy-cR*0.55,cR*0.22,cR*0.08,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=cauldHov?'#5a5a6e':'#3a3a50';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(c.cx+cR*0.2,c.cy-cR*0.55);ctx.quadraticCurveTo(c.cx+cR*0.7,c.cy-cR*0.6,c.cx+cR*0.8,c.cy-cR*0.2);ctx.quadraticCurveTo(c.cx+cR*0.85,c.cy+cR*0.1,c.cx+cR*0.7,c.cy+cR*0.3);ctx.stroke();
    ctx.fillStyle=cauldHov?'rgba(50,55,80,0.7)':'rgba(35,38,60,0.7)';
    ctx.beginPath();ctx.ellipse(c.cx+cR*0.7,c.cy+cR*0.45,cR*0.2,cR*0.18,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(c.cx+cR*0.65,c.cy+cR*0.2,cR*0.1,cR*0.15);
    var liqG=ctx.createRadialGradient(c.cx,c.cy+cR*0.2,1,c.cx,c.cy+cR*0.2,cR*0.35);
    liqG.addColorStop(0,cauldHov?'rgba(68,255,150,0.6)':'rgba(68,221,136,0.4)');liqG.addColorStop(0.6,'rgba(170,68,221,0.15)');liqG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=liqG;ctx.beginPath();ctx.ellipse(c.cx,c.cy+cR*0.2,cR*0.3,cR*0.2,0,0,Math.PI*2);ctx.fill();
    var dLiq=ctx.createRadialGradient(c.cx+cR*0.7,c.cy+cR*0.45,1,c.cx+cR*0.7,c.cy+cR*0.45,cR*0.15);
    dLiq.addColorStop(0,'rgba(68,221,200,0.5)');dLiq.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dLiq;ctx.beginPath();ctx.ellipse(c.cx+cR*0.7,c.cy+cR*0.48,cR*0.13,cR*0.08,0,0,Math.PI*2);ctx.fill();
    for(var i=0;i<5;i++){ctx.save();ctx.globalAlpha=0.25-((t*25+i*18)%(cR*0.8))/(cR*3);ctx.fillStyle=i%2===0?'rgba(180,220,255,0.5)':'rgba(200,180,255,0.4)';var vx=c.cx+Math.sin(t*2+i*1.5)*cR*0.15;var vy=c.cy-cR*0.7-((t*25+i*18)%(cR*0.8));ctx.beginPath();ctx.arc(vx,vy,Math.max(0,2+Math.sin(t+i)*1.5),0,Math.PI*2);ctx.fill();ctx.restore();}
    var dripT=(t*2)%2;
    if(dripT<1){var dx2=c.cx+cR*0.2+(c.cx+cR*0.7-c.cx-cR*0.2)*dripT;var dy2=c.cy-cR*0.55+(c.cy+cR*0.3-c.cy+cR*0.55)*dripT*dripT;ctx.save();ctx.globalAlpha=0.5*(1-dripT);ctx.fillStyle='#88ffcc';ctx.beginPath();ctx.arc(dx2,dy2,2,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.save();ctx.globalAlpha=0.12;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(c.cx-cR*0.15,c.cy,cR*0.08,cR*0.25,-0.2,0,Math.PI*2);ctx.fill();ctx.restore();
    var cGlow=ctx.createRadialGradient(c.cx,c.cy+cR*0.2,3,c.cx,c.cy+cR*0.2,cR*2.5);
    cGlow.addColorStop(0,'rgba(68,221,136,0.06)');cGlow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cGlow;ctx.fillRect(c.cx-cR*3,c.cy-cR,cR*6,cR*3);
    ctx.fillStyle=cauldHov?'#44dd88':'#44aa77';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabBrew'),c.cx,c.cy+cR+18);

    // Workbench
    var b=lay.bench,benchHov=labHover==='extract';
    ctx.fillStyle=benchHov?'#2a2520':'#1e1a16';
    ctx.beginPath();ctx.moveTo(b.x,b.y+b.h*0.4);ctx.lineTo(b.x+b.w,b.y+b.h*0.4);ctx.lineTo(b.x+b.w-5,b.y+b.h);ctx.lineTo(b.x+5,b.y+b.h);ctx.closePath();ctx.fill();
    ctx.fillStyle=benchHov?'#3a3028':'#2a2420';ctx.fillRect(b.x-3,b.y+b.h*0.35,b.w+6,8);
    var mx2=b.x+b.w*0.3,my2=b.y+b.h*0.1;
    ctx.fillStyle='#555';ctx.beginPath();ctx.ellipse(mx2,my2+10,12,7,0,0,Math.PI);ctx.fill();
    ctx.beginPath();ctx.ellipse(mx2,my2+10,12,4,0,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(68,221,136,0.4)';ctx.beginPath();ctx.ellipse(mx2,my2+8,8,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#777';ctx.save();ctx.translate(mx2+7,my2-4);ctx.rotate(0.5);ctx.fillRect(-2,-10,4,16);ctx.restore();
    var hCols=['#44dd88','#ee4444','#4488ee','#ddaa22'];
    for(var i=0;i<3;i++){ctx.save();ctx.globalAlpha=0.7;ctx.fillStyle=hCols[i];ctx.beginPath();ctx.ellipse(b.x+b.w*0.6+i*16,b.y+b.h*0.15,3,7,-0.3+i*0.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(b.x+b.w*0.6+i*16+3,b.y+b.h*0.17,2,5,0.5+i*0.2,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.fillStyle=benchHov?'#44dd88':'#44aa77';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabExtract'),b.x+b.w/2,b.y+b.h+16);

    // Weapon rack
    var rk=lay.rack,rackHov=labHover==='weapons';
    ctx.fillStyle=rackHov?'#2a2018':'#1a1610';
    ctx.fillRect(rk.x,rk.y,rk.w,rk.h);
    ctx.strokeStyle=rackHov?'#4a3a28':'#2a2218';ctx.lineWidth=2;ctx.strokeRect(rk.x,rk.y,rk.w,rk.h);
    // Horizontal bars
    for(var i=1;i<=2;i++){ctx.fillStyle='#3a3020';ctx.fillRect(rk.x+4,rk.y+rk.h*i/3-2,rk.w-8,4);}
    // Draw equipped weapon
    if(equippedWeapon){
        ctx.save();ctx.translate(rk.x+rk.w/2,rk.y+rk.h*0.4);ctx.rotate(-0.5);
        ctx.strokeStyle=equippedWeapon.color;ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(0,20);ctx.stroke();
        ctx.fillStyle=equippedWeapon.color;ctx.fillRect(-4,-22,8,8);
        ctx.restore();
    }
    ctx.fillStyle=rackHov?'#44dd88':'#44aa77';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabWeapons'),rk.x+rk.w/2,rk.y+rk.h+16);

    // Potion shelf
    var s=lay.shelf,shelfHov=labHover==='potions';
    ctx.fillStyle=shelfHov?'#1a1618':'#121014';
    ctx.beginPath();ctx.moveTo(s.x-5,s.y-5);ctx.quadraticCurveTo(s.x+s.w/2,s.y-15,s.x+s.w+5,s.y-5);ctx.lineTo(s.x+s.w+5,s.y+s.h+5);ctx.lineTo(s.x-5,s.y+s.h+5);ctx.closePath();ctx.fill();
    ctx.strokeStyle=shelfHov?'#3a3030':'#2a2020';ctx.lineWidth=2;ctx.stroke();
    for(var i=1;i<=3;i++){ctx.fillStyle='#2a2218';ctx.fillRect(s.x-2,s.y+(s.h/3)*i-2,s.w+4,4);}
    var potCols=['#ee4444','#4488ee','#44dd88','#aa44dd','#ddaa22','#ff8833'];
    for(var row=0;row<3;row++){var rowY=s.y+(s.h/3)*row+(s.h/3)*0.25,cnt=2+(row+1)%2;for(var j=0;j<cnt;j++){var ppx2=s.x+10+j*(s.w-20)/cnt;ctx.save();ctx.globalAlpha=0.65+Math.sin(t*0.8+row+j)*0.15;ctx.fillStyle=potCols[(row*3+j)%6];ctx.fillRect(ppx2,rowY+5,8,12);ctx.fillRect(ppx2+2,rowY-1,4,7);ctx.fillStyle='#6a5a3a';ctx.fillRect(ppx2+1,rowY-3,6,4);ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(ppx2+1,rowY+7,2,7);ctx.restore();}}
    ctx.fillStyle=shelfHov?'#44dd88':'#44aa77';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabPotions'),s.x+s.w/2,s.y+s.h+16);

    // Merchant NPC in cave
    var mc=lay.merch,merchHov=labHover==='shop';
    // Carpet/rug
    ctx.fillStyle=merchHov?'#2a1a2a':'#1a1018';
    ctx.beginPath();ctx.ellipse(mc.x+mc.w/2,mc.y+mc.h*0.7,mc.w*0.6,mc.h*0.25,0,0,Math.PI*2);ctx.fill();
    // Hooded figure
    ctx.fillStyle=merchHov?'#5a4a7a':'#3a2a5a';
    ctx.beginPath();ctx.arc(mc.x+mc.w/2,mc.y+mc.h*0.3,mc.w*0.22,0,Math.PI*2);ctx.fill();
    // Hood
    ctx.beginPath();ctx.ellipse(mc.x+mc.w/2,mc.y+mc.h*0.25,mc.w*0.25,mc.w*0.18,0,Math.PI,Math.PI*2);ctx.fill();
    // Robe body
    ctx.fillStyle=merchHov?'#4a3a6a':'#2a1a4a';
    ctx.beginPath();ctx.moveTo(mc.x+mc.w*0.28,mc.y+mc.h*0.4);ctx.lineTo(mc.x+mc.w*0.72,mc.y+mc.h*0.4);
    ctx.lineTo(mc.x+mc.w*0.78,mc.y+mc.h*0.85);ctx.lineTo(mc.x+mc.w*0.22,mc.y+mc.h*0.85);ctx.closePath();ctx.fill();
    // Gold coin symbol
    ctx.fillStyle='#ffd700';ctx.font='bold '+Math.max(10,mc.w*0.18)+'px monospace';ctx.textAlign='center';
    ctx.fillText('$',mc.x+mc.w/2,mc.y+mc.h*0.35);
    // Small goods on carpet
    var goodCols=['#ee4444','#4488ee','#ddaa22'];
    for(var gi=0;gi<3;gi++){ctx.save();ctx.globalAlpha=0.6;ctx.fillStyle=goodCols[gi];ctx.fillRect(mc.x+mc.w*0.2+gi*mc.w*0.2,mc.y+mc.h*0.75,6,8);ctx.fillRect(mc.x+mc.w*0.2+gi*mc.w*0.2+1,mc.y+mc.h*0.7,4,6);ctx.restore();}
    // Glow
    if(merchHov){ctx.save();ctx.globalAlpha=0.08;var mG=ctx.createRadialGradient(mc.x+mc.w/2,mc.y+mc.h/2,5,mc.x+mc.w/2,mc.y+mc.h/2,mc.w);mG.addColorStop(0,'#ffcc44');mG.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=mG;ctx.fillRect(mc.x-mc.w*0.3,mc.y-mc.h*0.2,mc.w*1.6,mc.h*1.4);ctx.restore();}
    ctx.fillStyle=merchHov?'#ffcc44':'#aa8844';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabShop'),mc.x+mc.w/2,mc.y+mc.h+16);

    // Research table
    var rt=lay.research,resHov=labHover==='research';
    ctx.fillStyle=resHov?'#1a2028':'#101418';
    ctx.fillRect(rt.x,rt.y,rt.w,rt.h);
    ctx.strokeStyle=resHov?'#4488ee':'#223344';ctx.lineWidth=2;ctx.strokeRect(rt.x,rt.y,rt.w,rt.h);
    // Books/scrolls on table
    ctx.fillStyle='#334466';ctx.fillRect(rt.x+6,rt.y+8,rt.w*0.3,rt.h*0.5);
    ctx.fillStyle='#445577';ctx.fillRect(rt.x+rt.w*0.4,rt.y+6,rt.w*0.25,rt.h*0.55);
    ctx.fillStyle='#4488ee';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText('✦',rt.x+rt.w*0.75,rt.y+rt.h*0.45);
    if(resHov){ctx.save();ctx.globalAlpha=0.06;var rG=ctx.createRadialGradient(rt.x+rt.w/2,rt.y+rt.h/2,3,rt.x+rt.w/2,rt.y+rt.h/2,rt.w*0.8);rG.addColorStop(0,'#4488ee');rG.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rG;ctx.fillRect(rt.x-10,rt.y-10,rt.w+20,rt.h+20);ctx.restore();}
    ctx.fillStyle=resHov?'#4488ee':'#336699';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabResearch'),rt.x+rt.w/2,rt.y+rt.h+16);

    // Relic case
    var rc=lay.relicCase,relicHov=labHover==='relics';
    ctx.fillStyle=relicHov?'#1a1820':'#10101a';
    ctx.fillRect(rc.x,rc.y,rc.w,rc.h);
    ctx.strokeStyle=relicHov?'#aa88ff':'#332244';ctx.lineWidth=2;ctx.strokeRect(rc.x,rc.y,rc.w,rc.h);
    // Display relics as colored dots
    var relicCols=['#ffd700','#88ccff','#ff6622','#6644aa','#ffaa00','#44ddff'];
    for(var gi=0;gi<Math.min(foundCollectibles.length,6);gi++){
        var gx=rc.x+8+gi*(rc.w-16)/6, gy=rc.y+rc.h*0.4;
        ctx.fillStyle=relicCols[gi%relicCols.length];ctx.beginPath();ctx.arc(gx,gy,4,0,Math.PI*2);ctx.fill();
    }
    if(relicHov){ctx.save();ctx.globalAlpha=0.06;var rcG=ctx.createRadialGradient(rc.x+rc.w/2,rc.y+rc.h/2,3,rc.x+rc.w/2,rc.y+rc.h/2,rc.w*0.8);rcG.addColorStop(0,'#aa88ff');rcG.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rcG;ctx.fillRect(rc.x-10,rc.y-10,rc.w+20,rc.h+20);ctx.restore();}
    ctx.fillStyle=relicHov?'#aa88ff':'#665588';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('relicCase'),rc.x+rc.w/2,rc.y+rc.h+16);

    // Skill book (ancient tome on pedestal)
    var sb=lay.skillBook,skillHov=labHover==='skills';
    ctx.fillStyle=skillHov?'#1a1420':'#0e0a14';
    ctx.fillRect(sb.x,sb.y,sb.w,sb.h);
    ctx.strokeStyle=skillHov?'#dd8844':'#332218';ctx.lineWidth=2;ctx.strokeRect(sb.x,sb.y,sb.w,sb.h);
    // Pedestal
    ctx.fillStyle='#2a2020';ctx.fillRect(sb.x+sb.w*0.3,sb.y+sb.h*0.6,sb.w*0.4,sb.h*0.35);
    // Book
    ctx.fillStyle=skillHov?'#6a3a1a':'#4a2a12';
    ctx.fillRect(sb.x+sb.w*0.2,sb.y+sb.h*0.15,sb.w*0.6,sb.h*0.5);
    ctx.fillStyle='#ffd700';ctx.font='bold '+Math.max(8,sb.w*0.12)+'px monospace';ctx.textAlign='center';
    ctx.fillText('✦',sb.x+sb.w/2,sb.y+sb.h*0.45);
    // Page lines
    ctx.strokeStyle='rgba(255,200,100,0.15)';ctx.lineWidth=0.5;
    for(var li=0;li<3;li++){ctx.beginPath();ctx.moveTo(sb.x+sb.w*0.28,sb.y+sb.h*0.25+li*6);ctx.lineTo(sb.x+sb.w*0.72,sb.y+sb.h*0.25+li*6);ctx.stroke();}
    if(skillHov){ctx.save();ctx.globalAlpha=0.08;var sbG=ctx.createRadialGradient(sb.x+sb.w/2,sb.y+sb.h/2,3,sb.x+sb.w/2,sb.y+sb.h/2,sb.w*0.8);sbG.addColorStop(0,'#dd8844');sbG.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sbG;ctx.fillRect(sb.x-10,sb.y-10,sb.w+20,sb.h+20);ctx.restore();}
    ctx.fillStyle=skillHov?'#dd8844':'#886633';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(T('tabSkills'),sb.x+sb.w/2,sb.y+sb.h+16);

    // Torches
    var torchSpots=[{x:bw.x-W*0.08,y:bw.y+bw.h*0.3},{x:bw.x+bw.w+W*0.08,y:bw.y+bw.h*0.3},{x:W*0.06,y:H*0.45},{x:W*0.94,y:H*0.45}];
    for(var i=0;i<torchSpots.length;i++){var tp=torchSpots[i];ctx.fillStyle='#3a3030';ctx.fillRect(tp.x-2,tp.y+3,4,8);ctx.fillStyle='#4a3318';ctx.fillRect(tp.x-2,tp.y-10,4,16);var flk=Math.sin(t*7+i*2.3)*2,fSz=8+Math.sin(t*4+i)*2;var fGr=ctx.createRadialGradient(tp.x,tp.y-12+flk,1,tp.x,tp.y-12+flk,fSz);fGr.addColorStop(0,'rgba(255,200,50,0.85)');fGr.addColorStop(0.4,'rgba(255,120,20,0.35)');fGr.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=fGr;ctx.beginPath();ctx.arc(tp.x,tp.y-12+flk,fSz,0,Math.PI*2);ctx.fill();var wG=ctx.createRadialGradient(tp.x,tp.y,5,tp.x,tp.y,80+i*10);wG.addColorStop(0,'rgba(255,160,50,0.06)');wG.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=wG;ctx.fillRect(tp.x-90,tp.y-80,180,160);}
    // Stalagmites
    var stals=[{x:W*0.02,h:35},{x:W*0.08,h:22},{x:W*0.92,h:28},{x:W*0.97,h:40},{x:W*0.15,h:15},{x:W*0.85,h:18}];
    for(var i=0;i<stals.length;i++){var sm=stals[i];ctx.fillStyle='#1a1616';ctx.beginPath();ctx.moveTo(sm.x-6-sm.h*0.15,H);ctx.lineTo(sm.x+6+sm.h*0.15,H);ctx.lineTo(sm.x+Math.sin(i)*2,H-sm.h);ctx.closePath();ctx.fill();}
    // Dust & drip
    ctx.save();for(var i=0;i<15;i++){ctx.globalAlpha=0.06+Math.sin(t*0.4+i)*0.03;ctx.fillStyle='#ddccaa';ctx.beginPath();ctx.arc(W*0.1+(i*197)%(W*0.8),H*0.15+((t*6+i*53)%(H*0.7)),1+(i%3)*0.5,0,Math.PI*2);ctx.fill();}ctx.restore();
    var dripPhase=(t*1.5)%3;
    if(dripPhase<1){ctx.save();ctx.globalAlpha=0.2*(1-dripPhase);ctx.fillStyle='#6688aa';ctx.beginPath();ctx.ellipse(bw.x+bw.w*0.2,bw.y+dripPhase*(H*0.3),1.5,2.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    // Vignette
    var vig=ctx.createRadialGradient(vpx,H*0.45,Math.min(W,H)*0.2,vpx,H*0.45,Math.max(W,H)*0.7);
    vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,0.5)');
    ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
}

function renderLab(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var W=canvas.width,H=canvas.height;
    drawCaveScene();

    // Score + Gold + Keys
    ctx.fillStyle='rgba(200,200,200,0.4)';ctx.font='10px monospace';ctx.textAlign='right';
    ctx.fillText(T('score')+': '+totalScore+'  '+T('gold')+': '+gold+'  '+T('keys')+': '+playerKeys,W-15,25);

    // Save/Load buttons
    var svW=45,svH=22,svX=15,svY=15;
    ctx.fillStyle='rgba(10,10,20,0.6)';ctx.fillRect(svX,svY,svW,svH);
    ctx.strokeStyle='#4488ee';ctx.lineWidth=1;ctx.strokeRect(svX,svY,svW,svH);
    ctx.fillStyle='#4488ee';ctx.font='bold 9px monospace';ctx.textAlign='center';
    ctx.fillText(T('saveBtn'),svX+svW/2,svY+svH/2+3);

    // Settings gear
    drawSettingsGear(70,15,22);

    // Carried potions belt
    if(carriedPotions.length>0){
        var beltW=carriedPotions.length*50+80;
        ctx.fillStyle='rgba(10,10,20,0.6)';ctx.fillRect(W/2-beltW/2,H-30,beltW,22);
        ctx.fillStyle='#44dd88';ctx.font='10px monospace';ctx.textAlign='center';
        ctx.fillText(T('carriedSlots')+': '+carriedPotions.map(function(p){return recipeName(p);}).join(', '),W/2,H-15);
    }

    // Panel overlay
    if(labTab){
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);
        var pw=Math.min(W-40,520),ph=Math.min(H-60,500);
        var ppx=(W-pw)/2,ppy=(H-ph)/2;
        ctx.fillStyle='rgba(14,14,26,0.95)';ctx.fillRect(ppx,ppy,pw,ph);
        ctx.strokeStyle='#44dd88';ctx.lineWidth=2;ctx.strokeRect(ppx,ppy,pw,ph);
        ctx.fillStyle='#44dd88';ctx.fillRect(ppx,ppy,pw,3);
        // Close X
        var cbS=28,cbX=ppx+pw-cbS-6,cbY=ppy+6;
        ctx.fillStyle='rgba(255,60,60,0.15)';ctx.fillRect(cbX,cbY,cbS,cbS);
        ctx.strokeStyle='#ff4444';ctx.lineWidth=1;ctx.strokeRect(cbX,cbY,cbS,cbS);
        ctx.fillStyle='#ff6666';ctx.font='bold 16px monospace';ctx.textAlign='center';
        ctx.fillText('X',cbX+cbS/2,cbY+cbS/2+5);
        // Title
        var panelTitles={extract:T('tabExtract'),brew:T('tabBrew'),potions:T('tabPotions'),expedition:T('tabExpedition'),weapons:T('tabWeapons'),shop:T('tabShop'),research:T('tabResearch'),relics:T('relicCase'),skills:T('skillTree')};
        ctx.fillStyle='#44dd88';ctx.font='bold 18px monospace';ctx.textAlign='center';
        ctx.fillText(panelTitles[labTab]||'',W/2,ppy+30);
        var contentY=ppy+50;
        ctx.save();
        ctx.beginPath();ctx.rect(ppx,ppy+40,pw,ph-55);ctx.clip();
        ctx.translate(0, labScrollY);
        if(labTab==='extract') drawLabExtract(contentY);
        else if(labTab==='brew') drawLabBrew(contentY);
        else if(labTab==='potions') drawLabPotions(contentY);
        else if(labTab==='expedition') drawLabExpedition(contentY);
        else if(labTab==='weapons') drawLabWeapons(contentY);
        else if(labTab==='shop') drawLabShop(contentY);
        else if(labTab==='research') drawLabResearch(contentY);
        else if(labTab==='relics') drawLabRelics(contentY);
        else if(labTab==='skills') drawLabSkills(contentY);
        ctx.restore();
    }

    // Message toast
    if(labMessageTimer>0){
        labMessageTimer--;
        ctx.save();ctx.globalAlpha=Math.min(1,labMessageTimer/30);
        ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(W/2-200,H*0.08,400,30);
        ctx.strokeStyle='rgba(68,221,136,0.4)';ctx.lineWidth=1;ctx.strokeRect(W/2-200,H*0.08,400,30);
        ctx.fillStyle='#44dd88';ctx.font='12px monospace';ctx.textAlign='center';
        ctx.fillText(labMessage,W/2,H*0.08+19);
        ctx.restore();
    }
    if(showSettings) drawSettings();
    if(tutorialPhase==='lab') drawTutorialLab();
}

// ============ EXTRACTION MINIGAME ============
function startExtractMini(herbKey){
    var difficulty={greenLeaf:0,redBerry:0,yellowRoot:0,caveCrystal:1,blueMush:1,firestone:1,swampGoo:2,purpleMoss:2};
    var diff=difficulty[herbKey]||0;
    var center=45+Math.random()*20;
    var outerHalf=16-diff*2,midHalf=10-diff*1.5,innerHalf=5-diff*0.8;
    extractMini={
        herb:herbKey, step:1,
        chops:0, chopTarget:10+diff*3,
        grinds:0, grindTarget:8+diff*2, grindSide:'left',
        temp:30,
        tempZones:[
            {lo:center-outerHalf,hi:center+outerHalf,rate:0.5,color:'rgba(180,120,60,0.25)',border:'#b0783c',label:'×1'},
            {lo:center-midHalf,hi:center+midHalf,rate:1.0,color:'rgba(160,170,190,0.25)',border:'#a0aabe',label:'×2'},
            {lo:center-innerHalf,hi:center+innerHalf,rate:2.0,color:'rgba(255,210,60,0.30)',border:'#ffd23c',label:'×3'}
        ],
        tempSpeed:0.3+diff*0.1, heatOn:false,
        holdTimer:0, holdTarget:150+diff*30,
        quality:0, distillScore:0
    };
    playSound('click');
}

function finishExtraction(){
    if(!extractMini) return;
    var em=extractMini, h=HERBS[em.herb];
    var distillMax=em.holdTarget*2.0;
    var distillQ=Math.min(34,(em.distillScore/distillMax)*34);
    em.quality+=distillQ;
    var q=Math.max(0,Math.min(100,Math.round(em.quality)));
    inventory.herbs[em.herb]--;
    if(inventory.herbs[em.herb]<=0) delete inventory.herbs[em.herb];
    for(var i=0;i<h.yields.length;i++) addEssence(h.yields[i],1);
    // Skill: doubleYield (20% chance double essence)
    if(hasSkill('doubleYield')&&Math.random()<0.2){for(var i=0;i<h.yields.length;i++) addEssence(h.yields[i],1);labMessage=T('skDoubleYield')+'!';labMessageTimer=90;}
    var msg=T('extractComplete')+' ';
    if(q>=90){
        for(var i=0;i<h.yields.length;i++) addEssence(h.yields[i],1);
        msg+=T('quality')+': '+T('perfect')+' ×2 '+T('bonusEssence');
        playSound('levelUp');
    } else if(q>=70){
        var bonusE=h.yields[Math.floor(Math.random()*h.yields.length)];
        addEssence(bonusE,1);
        msg+=T('quality')+': '+T('good')+' +'+T('bonusEssence');
        playSound('craft');
    } else if(q>=40){
        msg+=T('quality')+': '+T('good'); playSound('craft');
    } else {
        msg+=T('quality')+': '+T('poor'); playSound('craft');
    }
    labMessage=msg; labMessageTimer=150; extractMini=null;
}

function drawLabExtract(cy){
    var W=canvas.width,H=canvas.height;
    var pw=Math.min(W-40,520),ppx=(W-pw)/2;
    var t=Date.now()*0.001;
    if(extractMini){
        var em=extractMini,h=HERBS[em.herb];
        var centerX=W/2,areaW=pw-40;
        ctx.fillStyle='#44dd88';ctx.font='bold 14px monospace';ctx.textAlign='center';
        ctx.fillText(herbName(em.herb),centerX,cy+5);
        for(var si=1;si<=3;si++){var dotX=centerX+(si-2)*40,dotY=cy+25;ctx.fillStyle=si<em.step?'#44dd88':(si===em.step?'#fff':'#333');ctx.beginPath();ctx.arc(dotX,dotY,6,0,Math.PI*2);ctx.fill();if(si<3){ctx.fillStyle='#333';ctx.fillRect(dotX+8,dotY-1,24,2);}ctx.fillStyle=si<=em.step?'#aaa':'#444';ctx.font='9px monospace';ctx.fillText(si,dotX,dotY+3);}
        var miniY=cy+50;
        if(em.step===1){
            ctx.fillStyle='#ffaa44';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText(T('step1Chop'),centerX,miniY);
            ctx.fillStyle='#888';ctx.font='11px monospace';ctx.fillText(T('step1Desc'),centerX,miniY+18);
            var boardY=miniY+40,boardW=areaW*0.6,boardH=80,boardX=centerX-boardW/2;
            ctx.fillStyle='#2a2218';ctx.fillRect(boardX,boardY,boardW,boardH);
            ctx.strokeStyle='#4a3a28';ctx.lineWidth=2;ctx.strokeRect(boardX,boardY,boardW,boardH);
            var pieces=Math.min(em.chops,em.chopTarget);
            for(var pi=0;pi<pieces;pi++){var px2=boardX+15+(pi*31+pi*pi*7)%(boardW-30);var py2=boardY+15+(pi*23+pi*17)%(boardH-30);ctx.save();ctx.globalAlpha=0.7;ctx.fillStyle=HERBS[em.herb].yields[0]?ESSENCES[HERBS[em.herb].yields[0]].color:'#44dd88';ctx.fillRect(px2-4,py2-3,8+pi%4,6+pi%3);ctx.restore();}
            if(em._chopAnim&&em._chopAnim>0){em._chopAnim--;var kx=centerX+Math.sin(em._chopAnim*0.5)*10;var ky=boardY+boardH/2-em._chopAnim*0.5;ctx.strokeStyle='#aaa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(kx-8,ky-15);ctx.lineTo(kx+8,ky+15);ctx.stroke();ctx.fillStyle='#888';ctx.fillRect(kx+5,ky+12,4,12);}
            var barY=boardY+boardH+15,barW=boardW,barH=14,barX=centerX-barW/2;
            ctx.fillStyle='#1a1a2a';ctx.fillRect(barX,barY,barW,barH);
            var prog=Math.min(1,em.chops/em.chopTarget);
            ctx.fillStyle=prog>=1?'#44dd88':'#ffaa44';ctx.fillRect(barX,barY,barW*prog,barH);
            ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(barX,barY,barW,barH);
            ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.textAlign='center';
            ctx.fillText(T('chopProgress')+' '+Math.min(em.chops,em.chopTarget)+'/'+em.chopTarget,centerX,barY+11);
            ctx.strokeStyle='rgba(255,170,68,0.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.strokeRect(boardX-2,boardY-2,boardW+4,boardH+4);ctx.setLineDash([]);
        } else if(em.step===2){
            ctx.fillStyle='#aa88ff';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText(T('step2Grind'),centerX,miniY);
            ctx.fillStyle='#888';ctx.font='11px monospace';ctx.fillText(T('step2Desc'),centerX,miniY+18);
            var mortarY=miniY+50,mortarR=45;
            ctx.fillStyle='#3a3a4a';ctx.beginPath();ctx.ellipse(centerX,mortarY+20,mortarR,mortarR*0.7,0,0,Math.PI);ctx.fill();
            ctx.beginPath();ctx.ellipse(centerX,mortarY+20,mortarR,mortarR*0.25,0,Math.PI,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(centerX,mortarY+20,mortarR+2,mortarR*0.27,0,0,Math.PI*2);ctx.stroke();
            var grindProg=Math.min(1,em.grinds/em.grindTarget);
            var matCol=HERBS[em.herb].yields[0]?ESSENCES[HERBS[em.herb].yields[0]].color:'#44dd88';
            ctx.save();ctx.globalAlpha=0.4+grindProg*0.4;ctx.fillStyle=matCol;ctx.beginPath();ctx.ellipse(centerX,mortarY+18,mortarR*0.6*grindProg+10,mortarR*0.15,0,0,Math.PI*2);ctx.fill();ctx.restore();
            var pestleAngle=em.grindSide==='left'?-0.4:0.4;
            if(em._grindAnim&&em._grindAnim>0){em._grindAnim--;pestleAngle+=Math.sin(em._grindAnim*0.8)*0.15;}
            ctx.save();ctx.translate(centerX,mortarY+10);ctx.rotate(pestleAngle);ctx.fillStyle='#666';ctx.fillRect(-5,-45,10,50);ctx.fillStyle='#555';ctx.beginPath();ctx.ellipse(0,8,8,6,0,0,Math.PI*2);ctx.fill();ctx.restore();
            var zoneW=areaW*0.3,zoneH=50;
            var lzX=centerX-areaW*0.35,rzX=centerX+areaW*0.05;
            var zoneY=mortarY+mortarR+20;
            ctx.fillStyle=em.grindSide==='left'?'rgba(170,136,255,0.2)':'rgba(170,136,255,0.08)';ctx.fillRect(lzX,zoneY,zoneW,zoneH);ctx.strokeStyle=em.grindSide==='left'?'#aa88ff':'#444';ctx.lineWidth=1;ctx.strokeRect(lzX,zoneY,zoneW,zoneH);ctx.fillStyle=em.grindSide==='left'?'#aa88ff':'#666';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('← '+T('grindProgress'),lzX+zoneW/2,zoneY+zoneH/2+5);
            ctx.fillStyle=em.grindSide==='right'?'rgba(170,136,255,0.2)':'rgba(170,136,255,0.08)';ctx.fillRect(rzX,zoneY,zoneW,zoneH);ctx.strokeStyle=em.grindSide==='right'?'#aa88ff':'#444';ctx.lineWidth=1;ctx.strokeRect(rzX,zoneY,zoneW,zoneH);ctx.fillStyle=em.grindSide==='right'?'#aa88ff':'#666';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(T('grindProgress')+' →',rzX+zoneW/2,zoneY+zoneH/2+5);
            var barY=zoneY+zoneH+12,barW=areaW*0.6,barH=14,barX=centerX-barW/2;
            ctx.fillStyle='#1a1a2a';ctx.fillRect(barX,barY,barW,barH);
            var prog=Math.min(1,em.grinds/em.grindTarget);
            ctx.fillStyle=prog>=1?'#44dd88':'#aa88ff';ctx.fillRect(barX,barY,barW*prog,barH);
            ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(barX,barY,barW,barH);
            ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.textAlign='center';
            ctx.fillText(T('grindProgress')+' '+Math.min(em.grinds,em.grindTarget)+'/'+em.grindTarget,centerX,barY+11);
        } else if(em.step===3){
            ctx.fillStyle='#44bbee';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText(T('step3Distill'),centerX,miniY);
            ctx.fillStyle='#888';ctx.font='11px monospace';ctx.fillText(T('step3Desc'),centerX,miniY+18);
            var gaugeY=miniY+40,gaugeW=areaW*0.7,gaugeH=28,gaugeX=centerX-gaugeW/2;
            ctx.fillStyle='#1a1a2a';ctx.fillRect(gaugeX,gaugeY,gaugeW,gaugeH);
            ctx.fillStyle='rgba(255,60,60,0.1)';ctx.fillRect(gaugeX,gaugeY,gaugeW,gaugeH);
            var zones=em.tempZones,currentZone=-1;
            for(var zi=0;zi<zones.length;zi++){var z=zones[zi];var zx0=gaugeX+gaugeW*(z.lo/100);var zx1=gaugeX+gaugeW*(z.hi/100);ctx.fillStyle=z.color;ctx.fillRect(zx0,gaugeY,zx1-zx0,gaugeH);ctx.strokeStyle=z.border;ctx.lineWidth=1;ctx.strokeRect(zx0,gaugeY,zx1-zx0,gaugeH);ctx.fillStyle=z.border;ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(z.label,(zx0+zx1)/2,gaugeY-3);if(em.temp>=z.lo&&em.temp<=z.hi) currentZone=zi;}
            var needleX=gaugeX+gaugeW*(em.temp/100);
            var inAny=currentZone>=0;
            var needleCol=!inAny?(em.temp>zones[0].hi?'#ff4444':'#4488ee'):zones[currentZone].border;
            ctx.fillStyle=needleCol;ctx.beginPath();ctx.moveTo(needleX,gaugeY-4);ctx.lineTo(needleX-5,gaugeY-12);ctx.lineTo(needleX+5,gaugeY-12);ctx.closePath();ctx.fill();
            ctx.fillRect(needleX-2,gaugeY,4,gaugeH);
            if(currentZone===zones.length-1){ctx.save();ctx.globalAlpha=0.3+Math.sin(t*8)*0.15;var nG=ctx.createRadialGradient(needleX,gaugeY+gaugeH/2,2,needleX,gaugeY+gaugeH/2,20);nG.addColorStop(0,'rgba(255,210,60,0.5)');nG.addColorStop(1,'rgba(255,210,60,0)');ctx.fillStyle=nG;ctx.fillRect(needleX-20,gaugeY-5,40,gaugeH+10);ctx.restore();}
            ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(gaugeX,gaugeY,gaugeW,gaugeH);
            ctx.fillStyle='#666';ctx.font='9px monospace';ctx.textAlign='left';ctx.fillText('0°',gaugeX,gaugeY+gaugeH+12);ctx.textAlign='right';ctx.fillText('100°',gaugeX+gaugeW,gaugeY+gaugeH+12);ctx.textAlign='center';
            ctx.fillStyle=inAny?needleCol:'#aaa';ctx.font='11px monospace';
            var zoneLabel=currentZone>=0?' ['+zones[currentZone].label+']':'';
            ctx.fillText(T('tempLabel')+': '+Math.round(em.temp)+'°'+zoneLabel,centerX,gaugeY+gaugeH+12);
            var hbY=gaugeY+gaugeH+24,hbW=areaW*0.5,hbH=50,hbX=centerX-hbW/2;
            ctx.fillStyle=em.heatOn?'rgba(255,100,30,0.3)':'rgba(40,30,20,0.5)';ctx.fillRect(hbX,hbY,hbW,hbH);
            ctx.strokeStyle=em.heatOn?'#ff8833':'#555';ctx.lineWidth=2;ctx.strokeRect(hbX,hbY,hbW,hbH);
            if(em.heatOn){for(var fi=0;fi<3;fi++){var fx=hbX+hbW/2+(fi-1)*18,fy=hbY+hbH/2;var fG=ctx.createRadialGradient(fx,fy,1,fx,fy,10+Math.sin(t*8+fi)*3);fG.addColorStop(0,'rgba(255,180,50,0.7)');fG.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=fG;ctx.beginPath();ctx.arc(fx,fy,10+Math.sin(t*8+fi)*3,0,Math.PI*2);ctx.fill();}}
            ctx.fillStyle=em.heatOn?'#ffaa44':'#888';ctx.font='bold 13px monospace';ctx.textAlign='center';
            ctx.fillText(em.heatOn?'🔥 HEATING 🔥':T('step3Desc').split('!')[0],hbX+hbW/2,hbY+hbH/2+5);
            var holdY=hbY+hbH+15,holdW=areaW*0.7,holdH=14,holdX=centerX-holdW/2;
            ctx.fillStyle='#1a1a2a';ctx.fillRect(holdX,holdY,holdW,holdH);
            var holdProg=Math.min(1,em.holdTimer/em.holdTarget);
            ctx.fillStyle=inAny?needleCol:'#333';ctx.fillRect(holdX,holdY,holdW*holdProg,holdH);
            ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(holdX,holdY,holdW,holdH);
            ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.textAlign='center';
            ctx.fillText(T('holdTime')+' '+Math.round(holdProg*100)+'%',centerX,holdY+11);
        }
        var qy=cy+310,qw=areaW*0.4,qh=8,qx=centerX-qw/2;
        ctx.fillStyle='#1a1a2a';ctx.fillRect(qx,qy,qw,qh);
        var qProg=Math.min(1,Math.max(0,em.quality/100));
        var qCol=qProg>=0.9?'#44dd88':(qProg>=0.5?'#ddaa22':'#ff4444');
        ctx.fillStyle=qCol;ctx.fillRect(qx,qy,qw*qProg,qh);
        ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.strokeRect(qx,qy,qw,qh);
        ctx.fillStyle='#666';ctx.font='9px monospace';ctx.textAlign='center';
        ctx.fillText(T('quality')+' '+Math.round(qProg*100)+'%',centerX,qy+qh+12);
        return;
    }
    // Normal herb list
    ctx.fillStyle='#aaa';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(T('selectHerb'),W/2,cy);cy+=25;
    var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
    if(herbKeys.length===0){ctx.fillStyle='#555';ctx.fillText(T('noHerbs'),W/2,cy+30);return;}
    var itemH=44,startX=W/2-160;
    for(var i=0;i<herbKeys.length;i++){
        var k=herbKeys[i],h2=HERBS[k],count=inventory.herbs[k];
        var iy=cy+i*(itemH+4);
        ctx.fillStyle='#111118';ctx.fillRect(startX,iy,320,itemH);
        ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.strokeRect(startX,iy,320,itemH);
        if(SPR.ready&&SPR.herbs[k]) ctx.drawImage(SPR.herbs[k],startX+8,iy+6,28,28);
        ctx.fillStyle='#ddd';ctx.font='12px monospace';ctx.textAlign='left';
        ctx.fillText(herbName(k)+' x'+count,startX+44,iy+18);
        ctx.fillStyle='#888';ctx.font='10px monospace';
        ctx.fillText('→ '+h2.yields.map(function(e){return essenceName(e);}).join(' + '),startX+44,iy+34);
        var btnX=startX+240,btnY=iy+8,btnW=70,btnH=28;
        ctx.fillStyle='#44dd88';ctx.fillRect(btnX,btnY,btnW,btnH);
        ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(T('extract'),btnX+btnW/2,btnY+btnH/2+4);
    }
    cy+=herbKeys.length*(itemH+4)+20;
    ctx.fillStyle='#888';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(T('yourEssences'),W/2,cy);cy+=18;
    var essKeys=Object.keys(inventory.essences).filter(function(k){return inventory.essences[k]>0;});
    if(essKeys.length===0){ctx.fillStyle='#444';ctx.fillText(T('noneYet'),W/2,cy+10);return;}
    var ex=W/2-essKeys.length*45;
    for(var i=0;i<essKeys.length;i++){var ek=essKeys[i],ess=ESSENCES[ek];ctx.fillStyle=ess.color;ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText(essenceName(ek),ex+i*90,cy);ctx.fillStyle='#aaa';ctx.font='11px monospace';ctx.fillText('x'+inventory.essences[ek],ex+i*90,cy+14);}
}

function drawLabBrew(cy){
    var W=canvas.width;
    var maxEss=4; // Maximum essences for advanced recipes
    ctx.fillStyle='#aaa';ctx.font='13px monospace';ctx.textAlign='center';
    ctx.fillText('Select 2-4 essences to brew',W/2,cy);cy+=25;
    var essKeys=Object.keys(inventory.essences).filter(function(k){return inventory.essences[k]>0;});
    var btnW=80,btnH=50,gap=8;
    var totalW=essKeys.length*(btnW+gap);
    var sx=W/2-totalW/2;
    for(var i=0;i<essKeys.length;i++){var ek=essKeys[i],ess=ESSENCES[ek];var bx=sx+i*(btnW+gap),by=cy;var isSelected=selectedEssences.indexOf(ek)>=0;ctx.fillStyle=isSelected?'#2a2a3e':'#111118';ctx.fillRect(bx,by,btnW,btnH);ctx.strokeStyle=isSelected?'#44dd88':ess.color;ctx.lineWidth=isSelected?2:1;ctx.strokeRect(bx,by,btnW,btnH);ctx.fillStyle=ess.color;ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(essenceName(ek),bx+btnW/2,by+20);ctx.fillStyle='#aaa';ctx.font='11px monospace';ctx.fillText('x'+inventory.essences[ek],bx+btnW/2,by+36);}
    cy+=btnH+20;
    if(selectedEssences.length>=2){
        var ri=findRecipeMulti(selectedEssences);
        if(ri>=0){var r=RECIPES[ri];ctx.fillStyle=r.color;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('= '+recipeName(r)+' =',W/2,cy);ctx.fillStyle='#aaa';ctx.font='12px monospace';ctx.fillText(recipeDesc(r),W/2,cy+18);ctx.fillStyle='#888';ctx.font='10px monospace';ctx.fillText('Tier '+r.tier+' | '+r.ingredients.length+' ingredients',W/2,cy+32);var bbx=W/2-50,bby=cy+42,bbw=100,bbh=34;ctx.fillStyle=r.color;ctx.fillRect(bbx,bby,bbw,bbh);ctx.fillStyle='#000';ctx.font='bold 12px monospace';ctx.fillText(T('brew'),W/2,bby+bbh/2+4);}
        else{ctx.fillStyle='#ff4444';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(T('noRecipe'),W/2,cy);}
    } else if(selectedEssences.length===1){ctx.fillStyle='#666';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(T('selectMore'),W/2,cy);}
    cy+=80;
    ctx.fillStyle='#666';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(T('discoveredRecipes'),W/2,cy);cy+=16;
    if(discoveredRecipes.length===0){ctx.fillStyle='#444';ctx.fillText(T('brewToDiscover'),W/2,cy+10);return;}
    for(var i=0;i<discoveredRecipes.length;i++){var r=RECIPES[discoveredRecipes[i]];ctx.fillStyle=r.color;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(r.ingredients.map(function(e){return essenceName(e);}).join(' + ')+' → '+recipeName(r)+' ('+recipeDesc(r)+')',W/2,cy+i*16);}
    // Transmute section (if skill unlocked)
    if(hasSkill('transmute')){
        var ty=cy+discoveredRecipes.length*16+20;
        ctx.fillStyle='#dd8844';ctx.font='bold 12px monospace';ctx.textAlign='center';
        ctx.fillText('— '+T('skTransmute')+' —',W/2,ty);ty+=18;
        ctx.fillStyle='#aaa';ctx.font='10px monospace';
        ctx.fillText(T('skTransmuteD'),W/2,ty);ty+=20;
        var allEss=Object.keys(ESSENCES);
        var tBtnW=60,tGap=4,tTotalW=allEss.length*(tBtnW+tGap);
        var tsx=W/2-tTotalW/2;
        for(var i=0;i<allEss.length;i++){
            var ek=allEss[i],ess=ESSENCES[ek];
            var tbx=tsx+i*(tBtnW+tGap);
            var totalOwned=0;for(var ok in inventory.essences) totalOwned+=inventory.essences[ok];
            var canTrans=totalOwned>=3;
            ctx.fillStyle='#111118';ctx.fillRect(tbx,ty,tBtnW,32);
            ctx.strokeStyle=ess.color;ctx.lineWidth=1;ctx.strokeRect(tbx,ty,tBtnW,32);
            ctx.fillStyle=canTrans?ess.color:'#555';ctx.font='9px monospace';ctx.textAlign='center';
            ctx.fillText(essenceName(ek),tbx+tBtnW/2,ty+14);
            ctx.fillText('3→1',tbx+tBtnW/2,ty+26);
        }
    }
}

function drawLabPotions(cy){
    var W=canvas.width;
    ctx.fillStyle='#aaa';ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText(T('carriedSlots')+' ('+carriedPotions.length+'/'+getMaxCarry()+')',W/2,cy);cy+=8;
    var slotW=80,slotH=36,slotGap=8;
    var slotStartX=W/2-(getMaxCarry()*(slotW+slotGap)-slotGap)/2;
    for(var i=0;i<getMaxCarry();i++){var sx=slotStartX+i*(slotW+slotGap),sy=cy;var p=carriedPotions[i];ctx.fillStyle=p?'rgba(30,30,50,0.8)':'rgba(20,20,30,0.5)';ctx.fillRect(sx,sy,slotW,slotH);ctx.strokeStyle=p?(p.color||'#44dd88'):'#333';ctx.lineWidth=1;ctx.strokeRect(sx,sy,slotW,slotH);if(p){ctx.fillStyle=p.color||'#ddd';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(recipeName(p),sx+slotW/2,sy+14);ctx.fillStyle='#888';ctx.font='9px monospace';ctx.fillText(recipeDesc(p),sx+slotW/2,sy+26);ctx.fillStyle='#ff6666';ctx.font='bold 10px monospace';ctx.fillText('×',sx+slotW-8,sy+12);}else{ctx.fillStyle='#444';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(T('slotEmpty'),sx+slotW/2,sy+slotH/2+3);}}
    cy+=slotH+15;
    ctx.fillStyle='#aaa';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(T('yourPotions'),W/2,cy);cy+=20;
    if(inventory.potions.length===0&&carriedPotions.length===0){ctx.fillStyle='#555';ctx.fillText(T('noPotions'),W/2,cy+20);return;}
    var itemH=40,startX=W/2-160;
    for(var i=0;i<inventory.potions.length;i++){var p=inventory.potions[i];var iy=cy+i*(itemH+4);ctx.fillStyle='#111118';ctx.fillRect(startX,iy,320,itemH);ctx.strokeStyle=p.color||'#333';ctx.lineWidth=1;ctx.strokeRect(startX,iy,320,itemH);ctx.fillStyle=p.color||'#ddd';ctx.font='12px monospace';ctx.textAlign='left';ctx.fillText(recipeName(p),startX+14,iy+16);ctx.fillStyle='#888';ctx.font='10px monospace';ctx.fillText(recipeDesc(p)+' ('+T('tier')+' '+p.tier+')',startX+14,iy+32);var btnX=startX+240,btnY=iy+6,btnW=70,btnH=28;var full=carriedPotions.length>=getMaxCarry();ctx.fillStyle=full?'#555':'#44dd88';ctx.fillRect(btnX,btnY,btnW,btnH);ctx.fillStyle=full?'#888':'#000';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(T('equip'),btnX+btnW/2,btnY+btnH/2+4);}
}

// ============ WEAPONS LAB PANEL ============
function drawLabWeapons(cy){
    var W=canvas.width;
    // Equipped weapon
    ctx.fillStyle='#aaa';ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText('— '+T('weapon')+' —',W/2,cy);cy+=20;
    if(equippedWeapon){
        ctx.fillStyle=equippedWeapon.color;ctx.font='bold 14px monospace';
        ctx.fillText(weaponName(equippedWeapon),W/2,cy);
        ctx.fillStyle='#aaa';ctx.font='11px monospace';
        ctx.fillText(T('dmg')+':'+equippedWeapon.dmg+' '+T('spd')+':'+equippedWeapon.speed.toFixed(1)+' '+T('rng')+':'+equippedWeapon.range+' T'+equippedWeapon.tier,W/2,cy+16);
        ctx.fillStyle='#888';ctx.font='10px monospace';
        ctx.fillText(T('enchant')+': '+(equippedWeapon.enchant?recipeName(equippedWeapon.enchant):T('enchantNone')),W/2,cy+32);
        cy+=50;

        // Enchant section
        ctx.fillStyle='#aa88ff';ctx.font='bold 12px monospace';
        ctx.fillText(T('enchantWeapon'),W/2,cy);cy+=18;
        ctx.fillStyle='#888';ctx.font='10px monospace';
        ctx.fillText(T('selectPotion'),W/2,cy);cy+=18;
        // Show potions that can enchant (attack, poison, speed, defense)
        var enchantable=inventory.potions.filter(function(p){return p.effect==='attack'||p.effect==='poison'||p.effect==='speed'||p.effect==='defense';});
        if(enchantable.length===0){
            ctx.fillStyle='#444';ctx.font='10px monospace';ctx.fillText(T('noPotions'),W/2,cy+10);
        } else {
            var startX=W/2-160;
            for(var i=0;i<enchantable.length;i++){
                var p=enchantable[i];
                var iy=cy+i*36;
                ctx.fillStyle='#111118';ctx.fillRect(startX,iy,320,32);
                ctx.strokeStyle=p.color||'#333';ctx.lineWidth=1;ctx.strokeRect(startX,iy,320,32);
                ctx.fillStyle=p.color||'#ddd';ctx.font='11px monospace';ctx.textAlign='left';
                ctx.fillText(recipeName(p)+' ('+recipeDesc(p)+')',startX+14,iy+20);
                var btnX=startX+240,btnY=iy+4,btnW=70,btnH=24;
                ctx.fillStyle='#aa88ff';ctx.fillRect(btnX,btnY,btnW,btnH);
                ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.textAlign='center';
                ctx.fillText(T('enchant'),btnX+btnW/2,btnY+btnH/2+4);
            }
            cy+=enchantable.length*36+10;
        }
    } else {
        ctx.fillStyle='#555';ctx.fillText(T('noWeapon'),W/2,cy+10);
        cy+=30;
    }

    // Inventory weapons
    cy+=20;
    ctx.fillStyle='#888';ctx.font='11px monospace';ctx.textAlign='center';
    ctx.fillText('— '+T('weapon')+' ('+inventory.weapons.length+') —',W/2,cy);cy+=18;
    var startX=W/2-160;
    for(var i=0;i<inventory.weapons.length;i++){
        var w=inventory.weapons[i];
        var iy=cy+i*40;
        ctx.fillStyle='#111118';ctx.fillRect(startX,iy,320,36);
        ctx.strokeStyle=w.color;ctx.lineWidth=1;ctx.strokeRect(startX,iy,320,36);
        ctx.fillStyle=w.color;ctx.font='12px monospace';ctx.textAlign='left';
        ctx.fillText(weaponName(w),startX+14,iy+16);
        ctx.fillStyle='#888';ctx.font='10px monospace';
        ctx.fillText(T('dmg')+':'+w.dmg+' '+T('spd')+':'+w.speed.toFixed(1)+' T'+w.tier,startX+14,iy+30);
        var btnX=startX+240,btnY=iy+6,btnW=70,btnH=24;
        ctx.fillStyle='#44dd88';ctx.fillRect(btnX,btnY,btnW,btnH);
        ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(T('equip'),btnX+btnW/2,btnY+btnH/2+4);
    }
}

function drawLabShop(cy){
    var W=canvas.width;
    ctx.fillStyle='#ffd700';ctx.font='11px monospace';ctx.textAlign='center';
    ctx.fillText(T('gold')+': '+gold,W/2,cy);cy+=20;
    if(labShopStock.length===0){
        ctx.fillStyle='#555';ctx.font='12px monospace';
        ctx.fillText(lang==='zh'?'商品已售罄':'Sold out',W/2,cy+20);
        return;
    }
    var startX=W/2-160,itemH=50;
    for(var i=0;i<labShopStock.length;i++){
        var item=labShopStock[i];
        var y2=cy+i*(itemH+4);
        ctx.fillStyle='#111118';ctx.fillRect(startX,y2,320,itemH);
        ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.strokeRect(startX,y2,320,itemH);
        ctx.textAlign='left';
        if(item.type==='herb'){
            ctx.fillStyle='#44dd88';ctx.font='12px monospace';
            ctx.fillText(herbName(item.key)+' x'+item.count,startX+14,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText('→ '+HERBS[item.key].yields.map(function(e){return essenceName(e);}).join('+'),startX+14,y2+36);
        } else if(item.type==='potion'){
            ctx.fillStyle=item.recipe.color;ctx.font='12px monospace';
            ctx.fillText(recipeName(item.recipe),startX+14,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText(recipeDesc(item.recipe),startX+14,y2+36);
        } else if(item.type==='weapon'){
            ctx.fillStyle=item.weapon.color;ctx.font='12px monospace';
            ctx.fillText(weaponName(item.weapon),startX+14,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText(T('dmg')+':'+item.weapon.dmg+' '+T('spd')+':'+item.weapon.speed.toFixed(1)+' T'+item.weapon.tier,startX+14,y2+36);
        } else if(item.type==='key'){
            ctx.fillStyle='#ffcc44';ctx.font='12px monospace';
            ctx.fillText('🔑 '+T('key')+' x'+(item.count||1),startX+14,y2+20);
            ctx.fillStyle='#888';ctx.font='10px monospace';
            ctx.fillText(lang==='zh'?'打开锁住的房间':'Opens locked rooms',startX+14,y2+36);
        }
        var btnW2=70,btnH2=28,btnX=startX+240,btnY=y2+10;
        var canAfford=gold>=item.price;
        ctx.fillStyle=canAfford?'#44dd88':'#444';ctx.fillRect(btnX,btnY,btnW2,btnH2);
        ctx.fillStyle=canAfford?'#000':'#888';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(item.price+'G '+T('buy'),btnX+btnW2/2,btnY+btnH2/2+4);
    }
    // Sell section
    var sellY=cy+labShopStock.length*(itemH+4)+10;
    ctx.fillStyle='#888';ctx.font='11px monospace';ctx.textAlign='center';
    ctx.fillText('— '+T('sell')+' —',W/2,sellY);sellY+=18;
    var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
    for(var i=0;i<Math.min(herbKeys.length,5);i++){
        var k=herbKeys[i],sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(startX,sy2,320,28);
        ctx.fillStyle='#44dd88';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(herbName(k)+' x'+inventory.herbs[k],startX+14,sy2+18);
        var sbX=startX+240,sbW=70,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText('3G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }
}

function drawLabResearch(cy){
    var W=canvas.width;
    ctx.fillStyle='#aaa';ctx.font='12px monospace';ctx.textAlign='center';
    ctx.fillText(T('researchDesc'),W/2,cy);
    ctx.fillStyle='#ffd700';ctx.font='11px monospace';
    ctx.fillText(T('gold')+': '+gold,W/2,cy+18);cy+=40;
    var startX=W/2-160;
    for(var i=0;i<RESEARCH.length;i++){
        var r=RESEARCH[i], lv=researchLevels[r.id]||0;
        var isMax=lv>=r.maxLvl;
        var cost=isMax?0:getResearchCost(r);
        var iy=cy+i*44;
        ctx.fillStyle='#111118';ctx.fillRect(startX,iy,320,40);
        ctx.strokeStyle=isMax?'#44dd88':'#333';ctx.lineWidth=1;ctx.strokeRect(startX,iy,320,40);
        ctx.fillStyle=isMax?'#44dd88':'#ddd';ctx.font='12px monospace';ctx.textAlign='left';
        ctx.fillText(T(r.key),startX+14,iy+18);
        ctx.fillStyle='#888';ctx.font='10px monospace';
        ctx.fillText(T('lvl')+' '+lv+'/'+r.maxLvl,startX+14,iy+32);
        // Level bar
        var barX=startX+120,barW=80,barH=8,barY=iy+26;
        ctx.fillStyle='#1a1a2a';ctx.fillRect(barX,barY,barW,barH);
        ctx.fillStyle='#4488ee';ctx.fillRect(barX,barY,barW*(lv/r.maxLvl),barH);
        ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.strokeRect(barX,barY,barW,barH);
        // Upgrade button
        var btnX=startX+240,btnY=iy+6,btnW=70,btnH=28;
        if(isMax){
            ctx.fillStyle='#333';ctx.fillRect(btnX,btnY,btnW,btnH);
            ctx.fillStyle='#44dd88';ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText(T('maxLvl'),btnX+btnW/2,btnY+btnH/2+4);
        } else {
            var canAfford=gold>=cost;
            ctx.fillStyle=canAfford?'#4488ee':'#333';ctx.fillRect(btnX,btnY,btnW,btnH);
            ctx.fillStyle=canAfford?'#fff':'#666';ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText(cost+'G',btnX+btnW/2,btnY+btnH/2+4);
        }
    }
}

function drawLabRelics(cy){
    var W=canvas.width;
    ctx.fillStyle='#aaa';ctx.font='12px monospace';ctx.textAlign='center';
    ctx.fillText(T('relicsFound')+': '+foundCollectibles.length+'/'+COLLECTIBLES.length,W/2,cy);cy+=25;
    var startX=W/2-160, cols=3, cellW=100, cellH=70;
    for(var i=0;i<COLLECTIBLES.length;i++){
        var c=COLLECTIBLES[i];
        var found=foundCollectibles.indexOf(c.id)>=0;
        var col=i%cols, row=Math.floor(i/cols);
        var cx2=startX+col*(cellW+8), cy2=cy+row*(cellH+8);
        ctx.fillStyle=found?'#111120':'#0a0a12';ctx.fillRect(cx2,cy2,cellW,cellH);
        ctx.strokeStyle=found?c.color:'#222';ctx.lineWidth=1;ctx.strokeRect(cx2,cy2,cellW,cellH);
        if(found){
            // Diamond icon
            ctx.fillStyle=c.color;
            ctx.beginPath();ctx.moveTo(cx2+cellW/2,cy2+10);ctx.lineTo(cx2+cellW/2+10,cy2+25);
            ctx.lineTo(cx2+cellW/2,cy2+40);ctx.lineTo(cx2+cellW/2-10,cy2+25);ctx.closePath();ctx.fill();
            ctx.fillStyle='#ddd';ctx.font='9px monospace';ctx.textAlign='center';
            ctx.fillText(collectibleName(c),cx2+cellW/2,cy2+55);
        } else {
            ctx.fillStyle='#333';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText('?',cx2+cellW/2,cy2+30);
            ctx.fillStyle='#333';ctx.font='9px monospace';
            ctx.fillText('???',cx2+cellW/2,cy2+55);
        }
    }
}

function drawLabSkills(cy){
    var W=canvas.width;
    var pw=Math.min(W-40,520),ppx=(W-pw)/2;
    ctx.fillStyle='#aaa';ctx.font='12px monospace';ctx.textAlign='center';
    ctx.fillText(T('skillDesc')+'  '+T('gold')+': '+gold,W/2,cy);cy+=10;
    var branchW=Math.floor((pw-60)/3);
    for(var bi=0;bi<SKILL_BRANCHES.length;bi++){
        var branch=SKILL_BRANCHES[bi];
        var bx=ppx+20+bi*(branchW+10);
        // Branch header
        ctx.fillStyle=branch.color;ctx.font='bold 13px monospace';ctx.textAlign='center';
        ctx.fillText(T(branch.key),bx+branchW/2,cy+20);
        // Skills
        for(var si=0;si<branch.skills.length;si++){
            var skill=branch.skills[si];
            var ny=cy+40+si*70;
            var unlocked=hasSkill(skill.id);
            var canBuy=canUnlockSkill(branch,si);
            var nodeR=18,nodeCx=bx+branchW/2,nodeCy=ny+nodeR;
            // Connector line
            if(si>0){ctx.strokeStyle=hasSkill(branch.skills[si-1].id)?branch.color:'#333';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(nodeCx,ny-32+nodeR);ctx.lineTo(nodeCx,nodeCy-nodeR);ctx.stroke();}
            // Node circle
            ctx.beginPath();ctx.arc(nodeCx,nodeCy,nodeR,0,Math.PI*2);
            ctx.fillStyle=unlocked?branch.color:(canBuy?'#1a1a2a':'#0e0e16');ctx.fill();
            ctx.strokeStyle=unlocked?branch.color:(canBuy?'#666':'#333');ctx.lineWidth=unlocked?2:1;ctx.stroke();
            // Icon
            ctx.fillStyle=unlocked?'#fff':(canBuy?'#ccc':'#555');ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText(T(skill.key),nodeCx,nodeCy+3);
            // Desc + cost below
            ctx.fillStyle=unlocked?'#888':'#666';ctx.font='9px monospace';
            ctx.fillText(T(skill.descKey),nodeCx,nodeCy+nodeR+12);
            if(!unlocked){
                ctx.fillStyle=canBuy&&gold>=skill.cost?'#ffd700':'#555';ctx.font='bold 9px monospace';
                ctx.fillText(skill.cost+'G',nodeCx,nodeCy+nodeR+24);
            } else {
                ctx.fillStyle='#44dd88';ctx.font='bold 9px monospace';
                ctx.fillText('✓',nodeCx,nodeCy+nodeR+24);
            }
        }
    }
}

function drawLabExpedition(cy){
    var W=canvas.width,H=canvas.height;
    var pw=Math.min(W-40,520),ppx=(W-pw)/2;
    ctx.fillStyle='#aaa';ctx.font='13px monospace';ctx.textAlign='center';
    ctx.fillText(T('chooseBiome'),W/2,cy);cy+=30;
    if(activeBuffs.length>0){ctx.fillStyle='#888';ctx.font='11px monospace';ctx.fillText(T('activeBuffs')+activeBuffs.map(function(b){return recipeName(b);}).join(', '),W/2,cy);cy+=20;}
    var pad=12,gap=10;
    var availW=pw-pad*2;
    var cardW=Math.floor((availW-gap*(BIOMES.length-1))/BIOMES.length);
    var cardH=140,sx=ppx+pad;
    for(var i=0;i<BIOMES.length;i++){
        var b=BIOMES[i];
        var cx2=sx+i*(cardW+gap),ccy=cy;
        ctx.fillStyle=b.color;ctx.fillRect(cx2,ccy,cardW,cardH);
        ctx.strokeStyle='#44dd88';ctx.lineWidth=1;ctx.strokeRect(cx2,ccy,cardW,cardH);
        ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='center';
        ctx.fillText(getBiomeName(b),cx2+cardW/2,ccy+28);
        ctx.fillStyle='#aaa';ctx.font='10px monospace';
        ctx.fillText(T('herbs'),cx2+cardW/2,ccy+50);
        for(var j=0;j<b.herbs.length;j++) ctx.fillText(herbName(b.herbs[j]),cx2+cardW/2,ccy+64+j*13);
        ctx.fillStyle='#888';ctx.font='9px monospace';
        ctx.fillText(MAX_FLOORS+' '+T('floor'),cx2+cardW/2,ccy+64+b.herbs.length*13+4);
        var btnY=ccy+cardH-36,btnH=28,btnPad=Math.min(20,cardW*0.12);
        ctx.fillStyle='#44dd88';ctx.fillRect(cx2+btnPad,btnY,cardW-btnPad*2,btnH);
        ctx.fillStyle='#000';ctx.font='bold 12px monospace';
        ctx.fillText(T('explore'),cx2+cardW/2,btnY+btnH/2+4);
    }
}

// ============ TUTORIAL OVERLAY ============
function drawTutorialLab(){
    if(tutorialDone || tutorialPhase!=='lab') return;
    var step=TUTORIAL_LAB[tutorialStep];
    if(!step) return;
    var lay=labFurniture;
    var target=lay[step.key];
    if(!target) return;
    var W=canvas.width,H=canvas.height;
    tutorialBlink=(tutorialBlink+1)%60;
    // Dim everything except target
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.rect(0,0,W,H);
    // Cut out the target area
    var pad=8;
    ctx.rect(target.x-pad,target.y-pad+target.h+pad*2, target.w+pad*2, -(target.h+pad*2));
    ctx.fill('evenodd');
    // Pulsing border around target
    var alpha=0.5+Math.sin(tutorialBlink*0.1)*0.3;
    ctx.strokeStyle='rgba(68,221,136,'+alpha+')';ctx.lineWidth=3;
    ctx.strokeRect(target.x-pad,target.y-pad,target.w+pad*2,target.h+pad*2);
    ctx.restore();
    // Text bubble
    var text=lang==='zh'?step.zh:step.en;
    var lines=text.split('\n');
    var bubW=Math.min(W-40,320),bubH=lines.length*22+50,bubX=(W-bubW)/2,bubY=Math.min(target.y-bubH-20, H-bubH-60);
    if(bubY<10) bubY=target.y+target.h+20;
    ctx.fillStyle='rgba(14,14,26,0.95)';ctx.fillRect(bubX,bubY,bubW,bubH);
    ctx.strokeStyle='#44dd88';ctx.lineWidth=2;ctx.strokeRect(bubX,bubY,bubW,bubH);
    ctx.fillStyle='#44dd88';ctx.font='bold 13px monospace';ctx.textAlign='center';
    for(var i=0;i<lines.length;i++){
        ctx.fillText(lines[i],W/2,bubY+25+i*22);
    }
    // Step indicator
    ctx.fillStyle='#888';ctx.font='10px monospace';
    ctx.fillText((tutorialStep+1)+'/'+TUTORIAL_LAB.length,W/2,bubY+bubH-12);
    // Next button
    var btnW=100,btnH=28,btnX=W/2-btnW/2,btnY=bubY+bubH-40;
    ctx.fillStyle='#44dd88';ctx.fillRect(btnX,btnY,btnW,btnH);
    ctx.fillStyle='#000';ctx.font='bold 12px monospace';
    ctx.fillText(tutorialStep<TUTORIAL_LAB.length-1?(lang==='zh'?'下一步':'Next'):(lang==='zh'?'开始探险！':'Go!'),W/2,btnY+btnH/2+4);
}
function drawTutorialExp(){
    if(tutorialDone || tutorialPhase!=='expedition') return;
    var step=TUTORIAL_EXP[tutorialStep];
    if(!step) return;
    var W=canvas.width,H=canvas.height;
    tutorialBlink=(tutorialBlink+1)%60;
    var text=lang==='zh'?step.zh:step.en;
    var lines=text.split('\n');
    var bubW=Math.min(W-40,340),bubH=lines.length*22+50,bubX=(W-bubW)/2,bubY=H*0.15;
    ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.restore();
    ctx.fillStyle='rgba(14,14,26,0.95)';ctx.fillRect(bubX,bubY,bubW,bubH);
    ctx.strokeStyle='#4488ee';ctx.lineWidth=2;ctx.strokeRect(bubX,bubY,bubW,bubH);
    ctx.fillStyle='#fff';ctx.font='bold 13px monospace';ctx.textAlign='center';
    for(var i=0;i<lines.length;i++){
        ctx.fillText(lines[i],W/2,bubY+25+i*22);
    }
    ctx.fillStyle='#888';ctx.font='10px monospace';
    ctx.fillText((tutorialStep+1)+'/'+TUTORIAL_EXP.length,W/2,bubY+bubH-12);
    var btnW=100,btnH=28,btnX=W/2-btnW/2,btnY=bubY+bubH-40;
    ctx.fillStyle='#4488ee';ctx.fillRect(btnX,btnY,btnW,btnH);
    ctx.fillStyle='#fff';ctx.font='bold 12px monospace';
    ctx.fillText(tutorialStep<TUTORIAL_EXP.length-1?(lang==='zh'?'下一步':'Next'):(lang==='zh'?'出发！':'Go!'),W/2,btnY+btnH/2+4);
}
function handleTutorialClick(cx,cy){
    var W=canvas.width,H=canvas.height;
    // Find the next button and check click
    var lines,bubH,bubY,bubW;
    if(tutorialPhase==='lab'){
        var step=TUTORIAL_LAB[tutorialStep];if(!step) return false;
        var text=lang==='zh'?step.zh:step.en;
        lines=text.split('\n');
        bubW=Math.min(W-40,320);bubH=lines.length*22+50;
        var lay=labFurniture;var target=lay[step.key];
        bubY=target?Math.min(target.y-bubH-20,H-bubH-60):H/2-bubH/2;
        if(bubY<10&&target) bubY=target.y+target.h+20;
    } else {
        var step=TUTORIAL_EXP[tutorialStep];if(!step) return false;
        var text=lang==='zh'?step.zh:step.en;
        lines=text.split('\n');
        bubW=Math.min(W-40,340);bubH=lines.length*22+50;bubY=H*0.15;
    }
    var btnW=100,btnH=28,btnX=W/2-btnW/2,btnY=bubY+bubH-40;
    if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){
        playSound('click');
        var maxSteps=tutorialPhase==='lab'?TUTORIAL_LAB.length:TUTORIAL_EXP.length;
        tutorialStep++;
        if(tutorialStep>=maxSteps){
            if(tutorialPhase==='lab'){
                // End lab tutorial, expedition tutorial starts when first expedition begins
                tutorialPhase='';tutorialStep=0;
                // Auto-open expedition panel
                labTab='expedition';labScrollY=0;
            } else {
                tutorialPhase='';tutorialStep=0;tutorialDone=true;
                saveTutorialState();
            }
        }
        return true;
    }
    // Click anywhere else also advances (more forgiving)
    playSound('click');
    var maxSteps2=tutorialPhase==='lab'?TUTORIAL_LAB.length:TUTORIAL_EXP.length;
    tutorialStep++;
    if(tutorialStep>=maxSteps2){
        if(tutorialPhase==='lab'){
            tutorialPhase='';tutorialStep=0;
            labTab='expedition';labScrollY=0;
        } else {
            tutorialPhase='';tutorialStep=0;tutorialDone=true;
            saveTutorialState();
        }
    }
    return true;
}
function saveTutorialState(){
    try{localStorage.setItem('alchemist_tutorial','done');}catch(e){}
}
function loadTutorialState(){
    try{
        var v=localStorage.getItem('alchemist_tutorial');
        if(v==='done') tutorialDone=true;
    }catch(e){}
}

// ============ SETTINGS PANEL ============
function drawSettingsGear(x, y, s){
    ctx.save();ctx.fillStyle='rgba(10,10,20,0.6)';ctx.fillRect(x,y,s,s);
    ctx.strokeStyle='#888';ctx.lineWidth=1;ctx.strokeRect(x,y,s,s);
    ctx.fillStyle='#aaa';ctx.font='bold '+(s-6)+'px monospace';ctx.textAlign='center';
    ctx.fillText('⚙',x+s/2,y+s/2+5);ctx.restore();
}
function drawSettings(){
    var W=canvas.width,H=canvas.height;
    var compact=H<550;
    var lh=compact?28:42, titleH=compact?22:30, padY=compact?12:20;
    var ph=Math.min(H-padY*2,compact?280:380);
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var pw=Math.min(W-30,340),px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='rgba(14,14,26,0.97)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#44dd88';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
    ctx.fillStyle='#44dd88';ctx.fillRect(px,py,pw,3);
    // Title
    ctx.fillStyle='#44dd88';ctx.font='bold '+(compact?14:18)+'px monospace';ctx.textAlign='center';
    ctx.fillText(T('settingsTitle'),W/2,py+titleH);
    var cy=py+titleH+20, sliderW=pw-100, sliderX=px+85;
    // Language
    var fSz=compact?11:13, lbW=compact?50:60, lbH=compact?22:26;
    ctx.fillStyle='#aaa';ctx.font=fSz+'px monospace';ctx.textAlign='left';
    ctx.fillText(T('langLabel'),px+12,cy+(compact?3:5));
    var lbX=sliderX,lbY=cy-(compact?8:10);
    ctx.fillStyle='#222';ctx.fillRect(lbX,lbY,lbW,lbH);ctx.strokeStyle='#44dd88';ctx.lineWidth=1;ctx.strokeRect(lbX,lbY,lbW,lbH);
    ctx.fillStyle='#44dd88';ctx.font='bold '+(compact?10:11)+'px monospace';ctx.textAlign='center';
    ctx.fillText(lang==='zh'?'中文':'EN',lbX+lbW/2,lbY+lbH/2+4);
    cy+=lh;
    // BGM Volume
    ctx.fillStyle='#aaa';ctx.font=fSz+'px monospace';ctx.textAlign='left';
    ctx.fillText(T('bgmVol'),px+12,cy+(compact?3:5));
    var trackH=compact?8:10, thumbR=compact?5:7;
    ctx.fillStyle='#333';ctx.fillRect(sliderX,cy-4,sliderW,trackH);
    ctx.fillStyle='#44dd88';ctx.fillRect(sliderX,cy-4,sliderW*bgmVolume,trackH);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sliderX+sliderW*bgmVolume,cy+trackH/2-2,thumbR,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#aaa';ctx.font=(compact?9:10)+'px monospace';ctx.textAlign='right';
    ctx.fillText(Math.round(bgmVolume*100)+'%',px+pw-10,cy+(compact?3:5));
    cy+=lh;
    // SFX Volume
    ctx.fillStyle='#aaa';ctx.font=fSz+'px monospace';ctx.textAlign='left';
    ctx.fillText(T('sfxVol'),px+12,cy+(compact?3:5));
    ctx.fillStyle='#333';ctx.fillRect(sliderX,cy-4,sliderW,trackH);
    ctx.fillStyle='#4488ee';ctx.fillRect(sliderX,cy-4,sliderW*sfxVolume,trackH);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sliderX+sliderW*sfxVolume,cy+trackH/2-2,thumbR,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#aaa';ctx.font=(compact?9:10)+'px monospace';ctx.textAlign='right';
    ctx.fillText(Math.round(sfxVolume*100)+'%',px+pw-10,cy+(compact?3:5));
    cy+=lh;
    // Quality
    ctx.fillStyle='#aaa';ctx.font=fSz+'px monospace';ctx.textAlign='left';
    ctx.fillText(T('qualityLabel'),px+12,cy+(compact?3:5));
    var qLabels=[T('qualityLow'),T('qualityMed'),T('qualityHigh')];
    var qBtnW=Math.floor((sliderW-8)/3),qBtnH=compact?22:26;
    for(var i=0;i<3;i++){
        var qx=sliderX+i*(qBtnW+4),qy=cy-(compact?8:10);
        ctx.fillStyle=qualityLevel===i?'#44dd88':'#222';ctx.fillRect(qx,qy,qBtnW,qBtnH);
        ctx.strokeStyle=qualityLevel===i?'#88ffbb':'#555';ctx.lineWidth=1;ctx.strokeRect(qx,qy,qBtnW,qBtnH);
        ctx.fillStyle=qualityLevel===i?'#000':'#888';ctx.font='bold '+(compact?10:11)+'px monospace';ctx.textAlign='center';
        ctx.fillText(qLabels[i],qx+qBtnW/2,qy+qBtnH/2+4);
    }
    cy+=lh+(compact?6:10);
    // Save & Load buttons
    var sbW=Math.floor((pw-40)/2),sbH=compact?24:28;
    var saveX=px+12,loadX=px+20+sbW,sbY=cy;
    ctx.fillStyle='#44dd88';ctx.fillRect(saveX,sbY,sbW,sbH);
    ctx.fillStyle='#000';ctx.font='bold '+(compact?10:11)+'px monospace';ctx.textAlign='center';
    ctx.fillText(T('saveBtn'),saveX+sbW/2,sbY+sbH/2+4);
    ctx.fillStyle='#4488ee';ctx.fillRect(loadX,sbY,sbW,sbH);
    ctx.fillStyle='#fff';ctx.font='bold '+(compact?10:11)+'px monospace';
    ctx.fillText(T('loadSave'),loadX+sbW/2,sbY+sbH/2+4);
    cy+=lh;
    // Close button
    var cbW=compact?100:120,cbH=compact?28:34,cbX=W/2-cbW/2,cbY=cy;
    ctx.fillStyle='#44dd88';ctx.fillRect(cbX,cbY,cbW,cbH);
    ctx.fillStyle='#000';ctx.font='bold '+(compact?12:14)+'px monospace';ctx.textAlign='center';
    ctx.fillText(T('settingsClose'),W/2,cbY+cbH/2+5);
}
function handleSettingsClick(cx,cy){
    var W=canvas.width,H=canvas.height;
    var compact=H<550;
    var lh=compact?28:42, titleH=compact?22:30, padY=compact?12:20;
    var ph=Math.min(H-padY*2,compact?280:380);
    var pw=Math.min(W-30,340),px=(W-pw)/2,py=(H-ph)/2;
    var cyy=py+titleH+20, sliderW=pw-100, sliderX=px+85;
    // Language toggle
    var lbW=compact?50:60,lbH=compact?22:26,lbX=sliderX,lbY=cyy-(compact?8:10);
    if(cx>=lbX&&cx<=lbX+lbW&&cy>=lbY&&cy<=lbY+lbH){lang=lang==='en'?'zh':'en';playSound('click');return;}
    cyy+=lh;
    // BGM slider
    var trackH=compact?8:10;
    if(cy>=cyy-12&&cy<=cyy+12&&cx>=sliderX&&cx<=sliderX+sliderW){
        bgmVolume=Math.max(0,Math.min(1,(cx-sliderX)/sliderW));
        if(bgmAudio) bgmAudio.volume=bgmVolume;
        return;
    }
    cyy+=lh;
    // SFX slider
    if(cy>=cyy-12&&cy<=cyy+12&&cx>=sliderX&&cx<=sliderX+sliderW){
        sfxVolume=Math.max(0,Math.min(1,(cx-sliderX)/sliderW));
        return;
    }
    cyy+=lh;
    // Quality buttons
    var qBtnW=Math.floor((sliderW-8)/3),qBtnH=compact?22:26;
    for(var i=0;i<3;i++){
        var qx=sliderX+i*(qBtnW+4),qy=cyy-(compact?8:10);
        if(cx>=qx&&cx<=qx+qBtnW&&cy>=qy&&cy<=qy+qBtnH){
            qualityLevel=i;applyQuality();playSound('click');return;
        }
    }
    cyy+=lh+(compact?6:10);
    // Save & Load buttons
    var sbW2=Math.floor((pw-40)/2),sbH2=compact?24:28;
    var saveX2=px+12,loadX2=px+20+sbW2,sbY2=cyy;
    if(cx>=saveX2&&cx<=saveX2+sbW2&&cy>=sbY2&&cy<=sbY2+sbH2){saveGame();playSound('click');return;}
    if(cx>=loadX2&&cx<=loadX2+sbW2&&cy>=sbY2&&cy<=sbY2+sbH2){loadGame();playSound('click');return;}
    cyy+=lh;
    // Close button
    var cbW=compact?100:120,cbH=compact?28:34,cbX=W/2-cbW/2,cbY=cyy;
    if(cx>=cbX&&cx<=cbX+cbW&&cy>=cbY&&cy<=cbY+cbH){showSettings=false;saveSettings();playSound('click');return;}
    // Click outside panel to close
    if(cx<px||cx>px+pw||cy<py||cy>py+ph){showSettings=false;saveSettings();playSound('click');return;}
}
function saveSettings(){
    try{localStorage.setItem('alchemist_settings',JSON.stringify({lang:lang,bgmVolume:bgmVolume,sfxVolume:sfxVolume,qualityLevel:qualityLevel}));}catch(e){}
}
function loadSettings(){
    try{
        var raw=localStorage.getItem('alchemist_settings');
        if(!raw) return;
        var d=JSON.parse(raw);
        if(d.lang) lang=d.lang;
        if(d.bgmVolume!==undefined) bgmVolume=d.bgmVolume;
        if(d.sfxVolume!==undefined) sfxVolume=d.sfxVolume;
        if(d.qualityLevel!==undefined){ qualityLevel=d.qualityLevel; applyQuality(); }
    }catch(e){}
}

// ============ CLICK / TOUCH HANDLERS ============
function hitBox(cx,cy,box){ return cx>=box.x&&cx<=box.x+box.w&&cy>=box.y&&cy<=box.y+box.h; }

function handleLabClick(cx,cy){
    if(showSettings){handleSettingsClick(cx,cy);return;}
    if(tutorialPhase==='lab'){handleTutorialClick(cx,cy);return;}
    var W=canvas.width,H=canvas.height;
    // Save button
    var svW=45,svH=22,svX=15,svY=15;
    if(cx>=svX&&cx<=svX+svW&&cy>=svY&&cy<=svY+svH){saveGame();playSound('click');return;}
    // Settings gear
    if(cx>=70&&cx<=92&&cy>=15&&cy<=37){showSettings=true;playSound('click');return;}

    if(labTab){
        var pw=Math.min(W-40,520),ph=Math.min(H-60,500);
        var ppx=(W-pw)/2,ppy=(H-ph)/2;
        var cbS=28,cbX=ppx+pw-cbS-6,cbY=ppy+6;
        if(cx>=cbX&&cx<=cbX+cbS&&cy>=cbY&&cy<=cbY+cbS){labTab=null;labScrollY=0;selectedEssences=[];extractMini=null;playSound('click');return;}
        if(cx<ppx||cx>ppx+pw||cy<ppy||cy>ppy+ph){labTab=null;labScrollY=0;selectedEssences=[];extractMini=null;playSound('click');return;}
        // Apply scroll offset for content area clicks
        cy = cy - labScrollY;
        var contentY=ppy+50;

        if(labTab==='extract'){
            if(extractMini){
                var em=extractMini,pw2=Math.min(W-40,520),areaW=pw2-40,centerX=W/2,miniY=contentY+50;
                if(em.step===1){
                    var boardW=areaW*0.6,boardH=80,boardX=centerX-boardW/2,boardY=miniY+40;
                    if(cx>=boardX-10&&cx<=boardX+boardW+10&&cy>=boardY-10&&cy<=boardY+boardH+10){
                        em.chops++;em._chopAnim=8;em.quality+=(33/em.chopTarget);playSound('swing');
                        if(em.chops>=em.chopTarget){em.step=2;playSound('click');}return;
                    }
                } else if(em.step===2){
                    var zoneW=areaW*0.3,zoneH=50,lzX=centerX-areaW*0.35,rzX=centerX+areaW*0.05;
                    var mortarR=45,zoneY=miniY+50+mortarR+20;
                    if(em.grindSide==='left'&&cx>=lzX&&cx<=lzX+zoneW&&cy>=zoneY&&cy<=zoneY+zoneH){
                        em.grinds++;em.grindSide='right';em._grindAnim=8;em.quality+=(33/em.grindTarget);playSound('hit');
                        if(em.grinds>=em.grindTarget){em.step=3;em.temp=30;playSound('click');}return;
                    }
                    if(em.grindSide==='right'&&cx>=rzX&&cx<=rzX+zoneW&&cy>=zoneY&&cy<=zoneY+zoneH){
                        em.grinds++;em.grindSide='left';em._grindAnim=8;em.quality+=(33/em.grindTarget);playSound('hit');
                        if(em.grinds>=em.grindTarget){em.step=3;em.temp=30;playSound('click');}return;
                    }
                } else if(em.step===3){
                    var gaugeH=28,hbY=miniY+40+gaugeH+24,hbW=areaW*0.5,hbH=50,hbX=centerX-hbW/2;
                    if(cx>=hbX&&cx<=hbX+hbW&&cy>=hbY&&cy<=hbY+hbH){em.heatOn=!em.heatOn;playSound('click');return;}
                }
            } else {
                var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
                var itemH=44,startX=W/2-160;
                for(var i=0;i<herbKeys.length;i++){
                    var iy=contentY+25+i*(itemH+4);
                    var btnX=startX+240,btnY=iy+8,btnW=70,btnH=28;
                    if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){startExtractMini(herbKeys[i]);return;}
                }
            }
        } else if(labTab==='brew'){
            var essKeys=Object.keys(inventory.essences).filter(function(k){return inventory.essences[k]>0;});
            var btnW=80,btnH=50,gap=8,totalW=essKeys.length*(btnW+gap),sx=W/2-totalW/2;
            for(var i=0;i<essKeys.length;i++){
                var bx=sx+i*(btnW+gap),by=contentY+25;
                if(cx>=bx&&cx<=bx+btnW&&cy>=by&&cy<=by+btnH){
                    var ek=essKeys[i],idx=selectedEssences.indexOf(ek);
                    if(idx>=0) selectedEssences.splice(idx,1); else if(selectedEssences.length<4) selectedEssences.push(ek);
                    playSound('click');return;
                }
            }
            if(selectedEssences.length>=2){
                var ri=findRecipeMulti(selectedEssences);
                if(ri>=0){
                    var bbx=W/2-50,bby=contentY+25+btnH+62,bbw=100,bbh=34;
                    if(cx>=bbx&&cx<=bbx+bbw&&cy>=bby&&cy<=bby+bbh){
                        // Skill: philoStone (15% chance no essence cost)
                        var freeBrewPS=hasSkill('philoStone')&&Math.random()<0.15;
                        if(!freeBrewPS){
                            for(var ei=0;ei<selectedEssences.length;ei++){
                                var ek=selectedEssences[ei];
                                inventory.essences[ek]--;
                                if(inventory.essences[ek]<=0) delete inventory.essences[ek];
                            }
                        }
                        var r=RECIPES[ri];
                        inventory.potions.push({name:r.name,effect:r.effect,tier:r.tier,value:r.value,color:r.color,desc:r.desc});
                        if(freeBrewPS) labMessage=T('skPhiloStone')+'! '+recipeName(r);
                        else if(discoveredRecipes.indexOf(ri)<0){discoveredRecipes.push(ri);labMessage=T('newRecipe')+recipeName(r)+'!';}
                        else labMessage=T('brewed')+recipeName(r);
                        labMessageTimer=120;selectedEssences=[];playSound('craft');return;
                    }
                }
            }
            // Transmute click handling
            if(hasSkill('transmute')){
                var totalOwned=0;for(var ok in inventory.essences) totalOwned+=inventory.essences[ok];
                if(totalOwned>=3){
                    var allEss=Object.keys(ESSENCES);
                    var tBtnW=60,tGap=4,tTotalW=allEss.length*(tBtnW+tGap);
                    var tsx=W/2-tTotalW/2;
                    var dRecLen=discoveredRecipes.length;
                    var ty=contentY+25+50+80+80+16+dRecLen*16+20+18+20;
                    for(var i=0;i<allEss.length;i++){
                        var tbx=tsx+i*(tBtnW+tGap);
                        if(cx>=tbx&&cx<=tbx+tBtnW&&cy>=ty&&cy<=ty+32){
                            var ek=allEss[i];
                            // Consume 3 essences (from any types)
                            var spent=0;
                            var eKeys=Object.keys(inventory.essences);
                            for(var j=0;j<eKeys.length&&spent<3;j++){
                                var take=Math.min(inventory.essences[eKeys[j]],3-spent);
                                inventory.essences[eKeys[j]]-=take;spent+=take;
                                if(inventory.essences[eKeys[j]]<=0) delete inventory.essences[eKeys[j]];
                            }
                            addEssence(ek,1);
                            labMessage=T('skTransmute')+'! +1 '+essenceName(ek);labMessageTimer=90;playSound('craft');return;
                        }
                    }
                }
            }
        } else if(labTab==='potions'){
            var slotW=80,slotH=36,slotGap=8,slotStartX=W/2-(getMaxCarry()*(slotW+slotGap)-slotGap)/2,slotY=contentY+8;
            for(var i=0;i<carriedPotions.length;i++){
                var sx=slotStartX+i*(slotW+slotGap);
                if(cx>=sx&&cx<=sx+slotW&&cy>=slotY&&cy<=slotY+slotH){inventory.potions.push(carriedPotions[i]);carriedPotions.splice(i,1);playSound('click');return;}
            }
            var listY=slotY+slotH+35,itemH=40,startX=W/2-160;
            for(var i=0;i<inventory.potions.length;i++){
                var iy=listY+i*(itemH+4);
                var btnX=startX+240,btnY=iy+6,btnW=70,btnH=28;
                if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){
                    if(carriedPotions.length>=getMaxCarry()){labMessage=T('beltFull');labMessageTimer=90;playSound('error');return;}
                    carriedPotions.push(inventory.potions[i]);inventory.potions.splice(i,1);playSound('click');return;
                }
            }
        } else if(labTab==='weapons'){
            // Enchant buttons
            if(equippedWeapon){
                var enchCy=contentY+106;
                var enchantable=inventory.potions.filter(function(p){return p.effect==='attack'||p.effect==='poison'||p.effect==='speed'||p.effect==='defense';});
                var startX=W/2-160;
                for(var i=0;i<enchantable.length;i++){
                    var iy=enchCy+i*36;
                    var btnX=startX+240,btnY=iy+4,btnW=70,btnH=24;
                    if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){
                        equippedWeapon.enchant=enchantable[i];
                        // Remove potion from inventory
                        var idx=inventory.potions.indexOf(enchantable[i]);
                        if(idx>=0) inventory.potions.splice(idx,1);
                        labMessage=T('enchanted');labMessageTimer=120;playSound('levelUp');return;
                    }
                }
                // Swap weapon from inventory
                var invY=enchCy+enchantable.length*36+48;
                for(var i=0;i<inventory.weapons.length;i++){
                    var iy=invY+i*40;
                    var btnX=startX+240,btnY=iy+6,btnW=70,btnH=24;
                    if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){
                        var old=equippedWeapon;
                        equippedWeapon=inventory.weapons[i];
                        inventory.weapons.splice(i,1);
                        if(old&&old.name!=='Rusty Dagger') inventory.weapons.push(old);
                        playSound('craft');return;
                    }
                }
            }
        } else if(labTab==='expedition'){
            var pw2=Math.min(W-40,520),ppx2=(W-pw2)/2;
            var pad2=12,gap2=10,availW2=pw2-pad2*2;
            var cardW=Math.floor((availW2-gap2*(BIOMES.length-1))/BIOMES.length);
            var cardH=140,sx=ppx2+pad2;
            var cy2=contentY+30+(activeBuffs.length>0?20:0);
            for(var i=0;i<BIOMES.length;i++){
                var ccx=sx+i*(cardW+gap2);
                var btnPad2=Math.min(20,cardW*0.12);
                var btnY=cy2+cardH-36,btnH=28;
                if(cx>=ccx+btnPad2&&cx<=ccx+cardW-btnPad2&&cy>=btnY&&cy<=btnY+btnH){startExpedition(i);playSound('click');return;}
            }
        } else if(labTab==='shop'){
            var startX=W/2-160,itemH=50;
            for(var i=0;i<labShopStock.length;i++){
                var y2=contentY+20+i*(itemH+4);
                var btnX=startX+240,btnY=y2+10,btnW2=70,btnH2=28;
                if(cx>=btnX&&cx<=btnX+btnW2&&cy>=btnY&&cy<=btnY+btnH2){
                    var item=labShopStock[i];
                    if(gold<item.price){labMessage=T('notEnoughGold');labMessageTimer=90;playSound('error');return;}
                    gold-=item.price;
                    if(item.type==='herb') addHerb(item.key,item.count);
                    else if(item.type==='potion'){var r=item.recipe;inventory.potions.push({name:r.name,effect:r.effect,tier:r.tier,value:r.value,color:r.color,desc:r.desc});}
                    else if(item.type==='weapon') inventory.weapons.push(item.weapon);
                    else if(item.type==='key') playerKeys+=(item.count||1);
                    labShopStock.splice(i,1);
                    labMessage=T('boughtItem');labMessageTimer=90;playSound('craft');return;
                }
            }
            // Sell herbs
            var sellY=contentY+20+labShopStock.length*(itemH+4)+28;
            var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
            for(var i=0;i<Math.min(herbKeys.length,5);i++){
                var k=herbKeys[i],sy2=sellY+i*32;
                var sbX=startX+240,sbW=70,sbH=22;
                if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                    inventory.herbs[k]--;if(inventory.herbs[k]<=0) delete inventory.herbs[k];
                    gold+=3;labMessage=T('soldItem');labMessageTimer=60;playSound('pickup');return;
                }
            }
        } else if(labTab==='research'){
            var startX=W/2-160;
            for(var i=0;i<RESEARCH.length;i++){
                var r=RESEARCH[i], lv=researchLevels[r.id]||0;
                if(lv>=r.maxLvl) continue;
                var cost=getResearchCost(r);
                var iy=contentY+40+i*44;
                var btnX=startX+240,btnY=iy+6,btnW=70,btnH=28;
                if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){
                    if(gold<cost){labMessage=T('notEnoughGold');labMessageTimer=90;playSound('error');return;}
                    gold-=cost;
                    researchLevels[r.id]=(researchLevels[r.id]||0)+1;
                    labMessage=T(r.key)+' '+T('lvl')+' '+researchLevels[r.id];
                    labMessageTimer=120;playSound('levelUp');return;
                }
            }
        } else if(labTab==='skills'){
            var pw2=Math.min(W-40,520),ppx2=(W-pw2)/2;
            var branchW=Math.floor((pw2-60)/3);
            for(var bi=0;bi<SKILL_BRANCHES.length;bi++){
                var branch=SKILL_BRANCHES[bi];
                var bx=ppx2+20+bi*(branchW+10);
                for(var si=0;si<branch.skills.length;si++){
                    var skill=branch.skills[si];
                    var ny=contentY+40+si*70;
                    var nodeR=18;
                    var nodeCx=bx+branchW/2,nodeCy=ny+nodeR;
                    if(cx>=nodeCx-nodeR-10&&cx<=nodeCx+nodeR+10&&cy>=nodeCy-nodeR-5&&cy<=nodeCy+nodeR+20){
                        if(hasSkill(skill.id)){labMessage=T('skillUnlocked');labMessageTimer=60;playSound('error');return;}
                        if(!canUnlockSkill(branch,si)){labMessage=T('skillReq')+': '+T(branch.skills[si-1].key);labMessageTimer=90;playSound('error');return;}
                        if(gold<skill.cost){labMessage=T('notEnoughGold');labMessageTimer=90;playSound('error');return;}
                        gold-=skill.cost;
                        unlockedSkills[skill.id]=true;
                        labMessage=T(skill.key)+' '+T('skillUnlocked');labMessageTimer=120;playSound('levelUp');return;
                    }
                }
            }
        }
    } else {
        var lay=labFurniture;
        if(lay.door&&hitBox(cx,cy,lay.door)){labTab='expedition';labScrollY=0;selectedEssences=[];playSound('click');return;}
        if(lay.cauldron&&hitBox(cx,cy,lay.cauldron)){labTab='brew';labScrollY=0;selectedEssences=[];playSound('click');return;}
        if(lay.bench&&hitBox(cx,cy,lay.bench)){labTab='extract';labScrollY=0;selectedEssences=[];extractMini=null;playSound('click');return;}
        if(lay.shelf&&hitBox(cx,cy,lay.shelf)){labTab='potions';labScrollY=0;selectedEssences=[];playSound('click');return;}
        if(lay.rack&&hitBox(cx,cy,lay.rack)){labTab='weapons';labScrollY=0;playSound('click');return;}
        if(lay.merch&&hitBox(cx,cy,lay.merch)){labTab='shop';labScrollY=0;playSound('click');return;}
        if(lay.research&&hitBox(cx,cy,lay.research)){labTab='research';labScrollY=0;playSound('click');return;}
        if(lay.relicCase&&hitBox(cx,cy,lay.relicCase)){labTab='relics';labScrollY=0;playSound('click');return;}
        if(lay.skillBook&&hitBox(cx,cy,lay.skillBook)){labTab='skills';labScrollY=0;playSound('click');return;}
    }
}

function handleMenuTouch(cx,cy){
    if(!audioCtx) initAudio();
    if(showSettings){handleSettingsClick(cx,cy);return;}
    playBGM('lab');
    var W=canvas.width;
    // Settings gear
    var gX=W-50,gY=15,gS=26;
    if(cx>=gX&&cx<=gX+gS&&cy>=gY&&cy<=gY+gS){showSettings=true;playSound('click');return;}
    var bw=200,bh=44,bx=W/2-bw/2,by=canvas.height*0.88;
    // Load save button
    var hasSave=!!localStorage.getItem('alchemist_save');
    if(hasSave){
        var lsW=140,lsH=32,lsX=W/2-lsW/2,lsY=by-42;
        if(cx>=lsX&&cx<=lsX+lsW&&cy>=lsY&&cy<=lsY+lsH){
            loadGame();state='lab';playSound('click');playBGM('lab');
            tutorialDone=true;return;
        }
    }
    if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh){
        state='lab';playSound('click');playBGM('lab');
        if(!tutorialDone&&tutorialPhase===''){tutorialPhase='lab';tutorialStep=0;}
    }
}

function handleGameOverTouch(cx,cy){
    var bw=180,bh=40,bx=canvas.width/2-bw/2,by=canvas.height/2+40;
    if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh){
        activeBuffs=[];state='lab';labTab=null;
        labMessage=T('youFell');labMessageTimer=180;playSound('click');
        refreshLabShop();
        saveGame();
        playBGM('lab');
    }
}

canvas.addEventListener('click',function(e){
    if(!audioCtx) initAudio();
    var cx=e.clientX,cy=e.clientY;
    if(state==='menu') handleMenuTouch(cx,cy);
    else if(state==='lab') handleLabClick(cx,cy);
    else if(state==='gameover') handleGameOverTouch(cx,cy);
    else if(state==='expedition'){
        if(showSettings){handleSettingsClick(cx,cy);return;}
        if(tutorialPhase==='expedition'){handleTutorialClick(cx,cy);return;}
        if(weaponPopup||merchantPopup||buffPopup){handleExpeditionPopupClick(cx,cy);return;}
        // Settings gear
        var W=canvas.width;
        if(cx>=W-38&&cx<=W-12&&cy>=15&&cy<=41){showSettings=true;playSound('click');return;}
        // Click on buff icons
        if(activeBuffs.length>0){
            var buffIconSize=36,buffGap=4;
            var buffStartX=W/2-activeBuffs.length*(buffIconSize+buffGap)/2;
            var buffY=8;
            for(var bi=0;bi<activeBuffs.length;bi++){
                var bix=buffStartX+bi*(buffIconSize+buffGap);
                if(cx>=bix&&cx<=bix+buffIconSize&&cy>=buffY&&cy<=buffY+buffIconSize){
                    buffPopup=activeBuffs[bi];
                    playSound('click');return;
                }
            }
        }
        // Click on merchant to interact
        if(nearMerchantRef&&!weaponPopup&&!merchantPopup){
            var mx2=nearMerchantRef.x-camera.x,my2=nearMerchantRef.y-camera.y;
            if(Math.abs(cx-mx2)<40&&Math.abs(cy-my2)<40){
                merchantPopup=nearMerchantRef;
                merchantScrollY=0;
                generateShopStock(BIOMES.indexOf(currentBiome), currentFloor);
                playSound('click');return;
            }
        }
        if(carriedPotions.length>0){
            var qbSlotW=48,qbSlotH=48,qbGap=6;
            var qbTotalW=carriedPotions.length*(qbSlotW+qbGap)-qbGap;
            var qbX=Math.floor((canvas.width-qbTotalW)/2),qbY=canvas.height-(isMobile?55:60);
            for(var pi=0;pi<carriedPotions.length;pi++){
                var sx=qbX+pi*(qbSlotW+qbGap);
                if(cx>=sx&&cx<=sx+qbSlotW&&cy>=qbY&&cy<=qbY+qbSlotH){useCarriedPotion(pi);return;}
            }
        }
    }
});

canvas.addEventListener('mousemove',function(e){
    if(state!=='lab'||labTab){labHover=null;return;}
    var cx=e.clientX,cy=e.clientY;
    var lay=labFurniture;
    if(lay.door&&hitBox(cx,cy,lay.door)) labHover='expedition';
    else if(lay.cauldron&&hitBox(cx,cy,lay.cauldron)) labHover='brew';
    else if(lay.bench&&hitBox(cx,cy,lay.bench)) labHover='extract';
    else if(lay.shelf&&hitBox(cx,cy,lay.shelf)) labHover='potions';
    else if(lay.rack&&hitBox(cx,cy,lay.rack)) labHover='weapons';
    else if(lay.merch&&hitBox(cx,cy,lay.merch)) labHover='shop';
    else if(lay.research&&hitBox(cx,cy,lay.research)) labHover='research';
    else if(lay.relicCase&&hitBox(cx,cy,lay.relicCase)) labHover='relics';
    else if(lay.skillBook&&hitBox(cx,cy,lay.skillBook)) labHover='skills';
    else labHover=null;
    canvas.style.cursor=labHover?'pointer':'default';
});

// ============ SCREENS ============
function drawMenu(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var W=canvas.width,H=canvas.height;
    var bg=ctx.createRadialGradient(W*0.5,H*0.45,0,W*0.5,H*0.45,Math.max(W,H)*0.7);
    bg.addColorStop(0,'#1a0e2e');bg.addColorStop(0.5,'#0e0a1a');bg.addColorStop(1,'#050308');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    var t=Date.now()*0.001;
    for(var i=0;i<30;i++){var px=W*0.2+(i*137.5%W)*0.6;var py=H-((t*30+i*80)%(H*0.8))-H*0.1;var sz=2+(i%5)*1.5;var colors=['#44dd88','#aa44dd','#4488ee','#ddaa22','#ee4444'];ctx.save();ctx.globalAlpha=0.15+Math.sin(t+i)*0.1;ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.arc(px,py,sz,0,Math.PI*2);ctx.fill();ctx.restore();}
    // Alembic silhouette
    var cauldronY=H*0.55;
    ctx.save();
    ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.ellipse(W/2,cauldronY+30,60,50,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(W/2-12,cauldronY-30,24,45);
    ctx.fillStyle='#222240';ctx.beginPath();ctx.ellipse(W/2,cauldronY-30,25,22,0,Math.PI,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(W/2,cauldronY-30,25,8,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#333';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(W/2+23,cauldronY-30);ctx.quadraticCurveTo(W/2+80,cauldronY-40,W/2+90,cauldronY+5);ctx.quadraticCurveTo(W/2+95,cauldronY+30,W/2+80,cauldronY+50);ctx.stroke();
    ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.ellipse(W/2+80,cauldronY+65,25,20,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(W/2+74,cauldronY+42,12,16);
    ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(W/2,cauldronY-30,27,10,0,0,Math.PI*2);ctx.stroke();
    var liquidGrad=ctx.createRadialGradient(W/2,cauldronY+25,5,W/2,cauldronY+25,50);
    liquidGrad.addColorStop(0,'rgba(68,221,136,0.5)');liquidGrad.addColorStop(0.5,'rgba(170,68,221,0.25)');liquidGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=liquidGrad;ctx.beginPath();ctx.ellipse(W/2,cauldronY+30,45,30,0,0,Math.PI*2);ctx.fill();
    var dGrad=ctx.createRadialGradient(W/2+80,cauldronY+65,2,W/2+80,cauldronY+65,18);
    dGrad.addColorStop(0,'rgba(68,221,200,0.4)');dGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dGrad;ctx.beginPath();ctx.ellipse(W/2+80,cauldronY+68,16,10,0,0,Math.PI*2);ctx.fill();
    for(var i=0;i<8;i++){var bx=W/2+Math.sin(t*2+i*1.3)*25;var by=cauldronY-40-((t*30+i*20)%70);var bs=3+Math.sin(t+i)*2;ctx.globalAlpha=0.25-((t*30+i*20)%70)/220;ctx.fillStyle=i%2===0?'rgba(180,220,255,0.6)':'rgba(200,180,255,0.5)';ctx.beginPath();ctx.arc(bx,by,Math.max(0,bs),0,Math.PI*2);ctx.fill();}
    var dripT=(t*1.5)%2;
    if(dripT<1){ctx.globalAlpha=0.5*(1-dripT);ctx.fillStyle='#88ffcc';var dx=W/2+23+(W/2+80-W/2-23)*dripT;var dy=cauldronY-30+(cauldronY+50-cauldronY+30)*dripT*dripT;ctx.beginPath();ctx.arc(dx,dy,2.5,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=0.1;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(W/2-18,cauldronY+15,8,30,-0.2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;ctx.restore();
    if(SPR.ready){var potKeys=['red','blue','green','purple','yellow','orange'];for(var i=0;i<3;i++){ctx.save();ctx.globalAlpha=0.4+Math.sin(t+i*2)*0.1;var bx1=W*0.12+i*45,by1=H*0.6+Math.sin(t*0.8+i)*10;ctx.drawImage(SPR.potions[potKeys[i]],bx1,by1,28,28);var bx2=W*0.78+i*45,by2=H*0.6+Math.sin(t*0.8+i+1)*10;ctx.drawImage(SPR.potions[potKeys[i+3]],bx2,by2,28,28);ctx.restore();}}
    ctx.textAlign='center';ctx.textBaseline='middle';
    var titleSize=Math.min(42,W*0.06);
    ctx.shadowColor='#44dd88';ctx.shadowBlur=30;ctx.fillStyle='#fff';ctx.font='bold '+titleSize+'px monospace';
    ctx.fillText(T('title'),W/2,H*0.18);ctx.shadowBlur=0;
    var sub=T('sub'),subColors=['#4488ee','#44dd88','#aa44dd','#ee4444'];
    var subFont=Math.min(14,W*0.02);ctx.font=subFont+'px monospace';
    var subW=sub.reduce(function(a,s){return a+ctx.measureText(s+'   ').width;},0);
    var subX=W/2-subW/2;
    for(var i=0;i<sub.length;i++){ctx.fillStyle=subColors[i];ctx.textAlign='left';ctx.fillText(sub[i],subX,H*0.26);subX+=ctx.measureText(sub[i]).width;if(i<3){ctx.fillStyle='#333';ctx.fillText('  •  ',subX,H*0.26);subX+=ctx.measureText('  •  ').width;}}
    if(SPR.ready){var orbitR=Math.min(100,W*0.12);var herbKeys=Object.keys(SPR.herbs);for(var i=0;i<herbKeys.length;i++){var angle=t*0.5+(i/herbKeys.length)*Math.PI*2;var ox=W/2+Math.cos(angle)*orbitR;var oy=H*0.4+Math.sin(angle)*orbitR*0.4;ctx.save();ctx.globalAlpha=0.5+Math.sin(angle)*0.2;ctx.drawImage(SPR.herbs[herbKeys[i]],ox-10,oy-10,20,20);ctx.restore();}}
    ctx.textAlign='center';ctx.fillStyle='#555';ctx.font=Math.min(11,W*0.015)+'px monospace';
    ctx.fillText(isMobile?T('controlsMobile'):T('controls'),W/2,H*0.82);
    var bw=200,bh=44,bx=W/2-bw/2,by=H*0.88;
    ctx.shadowColor='#44dd88';ctx.shadowBlur=15;ctx.fillStyle='#44dd88';ctx.fillRect(bx,by,bw,bh);ctx.shadowBlur=0;
    ctx.strokeStyle='#88ffbb';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#000';ctx.font='bold 16px monospace';ctx.fillText(T('enterLab'),W/2,by+bh/2+1);
    // Load save button
    var hasSave=!!localStorage.getItem('alchemist_save');
    if(hasSave){
        var lsW=140,lsH=32,lsX=W/2-lsW/2,lsY=by-42;
        ctx.fillStyle='rgba(68,136,238,0.8)';ctx.fillRect(lsX,lsY,lsW,lsH);
        ctx.strokeStyle='#6699ee';ctx.lineWidth=1;ctx.strokeRect(lsX,lsY,lsW,lsH);
        ctx.fillStyle='#fff';ctx.font='bold 12px monospace';ctx.textAlign='center';
        ctx.fillText(T('loadSave'),W/2,lsY+lsH/2+4);
    }
    // Settings gear
    drawSettingsGear(W-50,15,26);
    ctx.save();ctx.globalAlpha=0.02;ctx.fillStyle='#000';for(var sl=0;sl<H;sl+=3) ctx.fillRect(0,sl,W,1);ctx.restore();
    if(showSettings) drawSettings();
}

function drawGameOver(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var W=canvas.width,H=canvas.height;
    // Dark background with red tint
    var bgG=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.6);
    bgG.addColorStop(0,'rgba(30,5,5,0.95)');bgG.addColorStop(1,'rgba(5,2,2,0.98)');
    ctx.fillStyle=bgG;ctx.fillRect(0,0,W,H);
    // Blood drip particles
    var t=Date.now()*0.001;
    for(var i=0;i<8;i++){
        ctx.save();ctx.globalAlpha=0.1+Math.sin(t+i)*0.05;
        ctx.fillStyle='#440000';
        ctx.beginPath();ctx.arc(W*0.2+i*W*0.08,((t*20+i*50)%H),3+i%4,0,Math.PI*2);ctx.fill();
        ctx.restore();
    }
    ctx.textAlign='center';
    // Title with glow
    ctx.save();ctx.shadowColor='#ff0000';ctx.shadowBlur=20;
    ctx.fillStyle='#ee4444';ctx.font='bold 32px monospace';
    ctx.fillText(T('expFailed'),W/2,H/2-50);ctx.restore();
    // Score
    ctx.fillStyle='#aaa';ctx.font='14px monospace';
    ctx.fillText(T('score')+': '+totalScore,W/2,H/2-10);
    ctx.fillStyle='#ffd700';ctx.font='12px monospace';
    ctx.fillText(T('gold')+': '+gold,W/2,H/2+10);
    // Button
    var bw=180,bh=40,bx=W/2-bw/2,by=H/2+40;
    var btnG=ctx.createLinearGradient(bx,by,bx,by+bh);
    btnG.addColorStop(0,'#55ee99');btnG.addColorStop(1,'#33aa66');
    ctx.fillStyle=btnG;ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(bx,by,bw,bh/2);
    ctx.strokeStyle='#88ffbb';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#000';ctx.font='bold 14px monospace';
    ctx.fillText(T('backToLab'),W/2,by+26);
}

// ============ SAVE / LOAD ============
function saveGame(){
    var data={
        gold:gold, totalScore:totalScore, expeditionNum:expeditionNum,
        inventory:inventory, equippedWeapon:equippedWeapon,
        discoveredRecipes:discoveredRecipes, carriedPotions:carriedPotions,
        researchLevels:researchLevels, foundCollectibles:foundCollectibles,
        playerKeys:playerKeys, lang:lang, unlockedSkills:unlockedSkills
    };
    try{ localStorage.setItem('alchemist_save',JSON.stringify(data)); labMessage=T('saved'); labMessageTimer=90; }
    catch(e){ labMessage='Save failed'; labMessageTimer=90; }
}
function loadGame(){
    try{
        var raw=localStorage.getItem('alchemist_save');
        if(!raw) return false;
        var data=JSON.parse(raw);
        gold=data.gold||0; totalScore=data.totalScore||0; expeditionNum=data.expeditionNum||0;
        inventory=data.inventory||{herbs:{},essences:{},potions:[],weapons:[]};
        equippedWeapon=data.equippedWeapon||makeWeapon(WEAPONS[0]);
        discoveredRecipes=data.discoveredRecipes||[];
        carriedPotions=data.carriedPotions||[];
        researchLevels=data.researchLevels||{};
        foundCollectibles=data.foundCollectibles||[];
        playerKeys=data.playerKeys||0;
        unlockedSkills=data.unlockedSkills||{};
        if(data.lang) lang=data.lang;
        initResearch();
        labMessage=T('loaded'); labMessageTimer=90;
        return true;
    }catch(e){ return false; }
}

// ============ MAIN LOOP ============
function render(){
    if(state==='menu') drawMenu();
    else if(state==='lab') renderLab();
    else if(state==='expedition') renderExpedition();
    else if(state==='gameover') drawGameOver();
}
function gameLoop(){update();render();requestAnimationFrame(gameLoop);}
(async function(){await loadTilesheet();initSprites();initResearch();loadSettings();loadTutorialState();loadGame();refreshLabShop();gameLoop();})();
