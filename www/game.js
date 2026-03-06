// ============ Alchemist's Path ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
var pixelRatio = window.devicePixelRatio || 1;
var qualityLevel = 2; // 0=low, 1=medium, 2=high
var sfxVolume = 1.0;
var godMode = false;
var showSettings = false;
var _settingsRects = {};
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
let lang = 'zh';
// 所有数据常量（LANG, WEAPONS, BIOMES, ENEMY_TYPES, HERBS, ESSENCES, RECIPES,
// RESEARCH, COLLECTIBLES, STATUS_DEFS 等）均在 gamedata.js 中定义，请修改那里。
function T(key) { return LANG[lang][key] || LANG.en[key] || key; }
function getBiomeName(b) {
    if (b.name === 'Forest') return T('biomeForest');
    if (b.name === 'Cave') return T('biomeCave');
    if (b.name === 'Swamp') return T('biomeSwamp');
    return b.name;
}
function herbName(key) { return HERB_NAMES_ZH[key]||HERBS[key].name; }
function essenceName(key) { return ESSENCE_NAMES_ZH[key]||ESSENCES[key].name; }
function recipeName(r) { return RECIPE_NAMES_ZH[r.name]||r.name; }
function recipeDesc(r) { return RECIPE_DESC_ZH[r.desc]||r.desc; }
function weaponName(w) { return WEAPON_NAMES_ZH[w.name]||w.name; }
function rarityName(r) { return RARITY_NAMES_ZH[r]||RARITY_NAMES[r]||''; }
const HERBS_LIST = Object.keys(HERBS).map(function(k){ return Object.assign({key:k},HERBS[k]); });

// ============ GAME CONSTANTS ============
const MAP_W = 32, MAP_H = 22;
const TILE = 32;
const MAX_FLOORS = 6; // floors per expedition (last floor is boss)
const ENEMY_SPEED = 0.9; // base enemy movement speed (px/frame)
const PLAYER_SPEED = 1.8; // base player movement speed (px/frame)
const PLAYER_RADIUS = 10; // player collision radius
const SIGHT_RANGE = 220; // enemy sight range (px)
const ALERT_RANGE = 300; // enemy alert range after being attacked (px)

// ============ GAME STATE ============
// UI toggles
let showBestiary = false;
let state = 'menu';
let expeditionNum = 0, frameCount = 0;
let inventory = { herbs:{}, essences:{}, potions:[], weapons:[] };
let equippedWeapon = makeWeapon(WEAPONS[0]); // start with rusty dagger
let forgedWeapon = null; // weapon forged in alchemy lab, carried into expedition
let gold = 0;
let discoveredRecipes = [];
let totalScore = 0;
let player = null;
let playerStats = { hp:10, maxHp:10, atk:2, def:0, speed:0, regen:0, poison:0, stealth:0, revive:false };
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
let buffTooltipIndex = null; // index of buff to show tooltip for
let shopStock = []; // merchant stock, refreshed each expedition
let nearMerchantRef = null; // merchant NPC player is near
let bossRef = null; // reference to boss enemy for special AI
let bossSummonTimer = 0; // timer for boss summoning minions
let bossPhase = 0; // 0=normal, 1=enraged
let bossFlashColor = '#ff0000';
let bossFlash = 0; // full-screen flash intensity 0~1
let bossShockwave = null; // {x,y,r,maxR,life}
let bossVolleyCD = 0; // projectile volley cooldown
let bossProjectiles = []; // boss scatter projectiles
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
let seenEnemies = {}; // {enemyTypeKey: {count, sprite}} bestiary data
let foundCollectibles = []; // array of collectible ids (all-time)
let expeditionFoundRelics = []; // relics found in current expedition only
function collectibleName(c){ return c.nameZh||c.name; }
function collectibleDesc(c){ return c.descZh||c.desc; }

// ============ KEYS & LOCKED ROOMS ============
let playerKeys = 0;
let lockedDoors = []; // {x,y,roomIdx,unlocked}
let collectibleDrops = []; // {x,y,collectibleId,collected}
let relicChoicePopup = null; // {choices:[collectible,collectible,collectible], source:'chest'|'boss'|'elite'}

// ============ SKILL TREE ============
const SKILL_BRANCHES = [
    { id:'combat', key:'skCombat', color:'#ee4444', skills:[
        { id:'powerStrike', key:'skPowerStrike', descKey:'skPowerStrikeD', cost:25,  icon:'⚡' },
        { id:'lifeSteal',   key:'skLifeSteal',   descKey:'skLifeStealD',  cost:50,  icon:'❤' },
        { id:'berserker',   key:'skBerserker',   descKey:'skBerserkerD',  cost:80,  icon:'🔥' },
        { id:'execute',     key:'skExecute',     descKey:'skExecuteD',    cost:120, icon:'💀' },
    ]},
    { id:'alchemy', key:'skAlchemy', color:'#44dd88', skills:[
        { id:'doubleYield',  key:'skDoubleYield',  descKey:'skDoubleYieldD',  cost:25,  icon:'🌿' },
        { id:'potionMaster', key:'skPotionMaster', descKey:'skPotionMasterD', cost:50,  icon:'🍀' },
        { id:'transmute',    key:'skTransmute',    descKey:'skTransmuteD',    cost:80,  icon:'✨' },
        { id:'philoStone',   key:'skPhiloStone',   descKey:'skPhiloStoneD',   cost:120, icon:'💎' },
    ]},
    { id:'survival', key:'skSurvival', color:'#4488ee', skills:[
        { id:'thickSkin',  key:'skThickSkin',  descKey:'skThickSkinD',  cost:25,  icon:'🌟' },
        { id:'scavenger',  key:'skScavenger',  descKey:'skScavengerD',  cost:50,  icon:'💰' },
        { id:'dodge',        key:'skDodge',     descKey:'skDodgeD',      cost:80,  icon:'💨' },
        { id:'secondWind', key:'skSecondWind', descKey:'skSecondWindD', cost:120, icon:'💫' },
    ]}
];
let unlockedSkills = {}; // {skillId: true}
let killCounter = 0; // for lifeSteal tracking
let secondWindUsed = false; // reset per floor
let playerDebuffs = {}; // {type: {timer, tickTimer}}
function hasSkill(id){ return !!unlockedSkills[id]; }

// ===== STATUS EFFECT FUNCTIONS =====
function applyStatusToEnemy(e, type, sdef){
    if(!e.statuses) e.statuses={};
    if(e.statuses[type]&&e.statuses[type].timer>0) return; // already afflicted
    e.statuses[type]={timer:sdef.duration, tickTimer:sdef.tickRate||60};
    var icon=sdef.icon||'?';
    var color=sdef.color||'#fff';
    spawnFloat(e.x,e.y-16,icon,color);
}

function applyDebuffToPlayer(type){
    var sdef=STATUS_DEFS[type];
    if(!sdef) return;
    if(playerDebuffs[type]&&playerDebuffs[type].timer>0) return; // already active
    playerDebuffs[type]={timer:sdef.duration, tickTimer:sdef.tickRate||60};
    spawnFloat(player.x,player.y-20,sdef.icon+sdef.nameZh,sdef.color);
}

function updateStatusEffects(){
    // Update player debuffs
    var types=Object.keys(playerDebuffs);
    for(var ti=0;ti<types.length;ti++){
        var type=types[ti];
        var db=playerDebuffs[type];
        if(!db||db.timer<=0){delete playerDebuffs[type];continue;}
        db.timer--;
        var sdef=STATUS_DEFS[type];
        if(sdef&&sdef.tickDmg){
            db.tickTimer--;
            if(db.tickTimer<=0){
                db.tickTimer=sdef.tickRate||60;
                if(!godMode){
                    playerStats.hp=Math.max(0,playerStats.hp-sdef.tickDmg);
                    spawnFloat(player.x,player.y-15,'-'+sdef.tickDmg,sdef.color);
                    if(playerStats.hp<=0){state='gameover';playSound('dead');}
                }
            }
        }
        if(db.timer<=0) delete playerDebuffs[type];
    }
    // Update enemy statuses
    for(var ei=0;ei<enemies.length;ei++){
        var e=enemies[ei];
        if(!e.statuses) continue;
        var stypes=Object.keys(e.statuses);
        for(var si=0;si<stypes.length;si++){
            var st=stypes[si];
            var es=e.statuses[st];
            if(!es||es.timer<=0){delete e.statuses[st];continue;}
            es.timer--;
            var esdef=STATUS_DEFS[st];
            if(esdef&&esdef.tickDmg){
                es.tickTimer--;
                if(es.tickTimer<=0){
                    es.tickTimer=esdef.tickRate||60;
                    e.hp-=esdef.tickDmg;
                    spawnFloat(e.x,e.y-10,'-'+esdef.tickDmg,esdef.color);
                    if(e.hp<=0) e.dyingFromDot=true; // mark for removal
                }
            }
            if(es.timer<=0) delete e.statuses[st];
        }
    }
}

// Check if player is paralyzed/frozen/sleeping (can't move)
function playerCanMove(){
    return !((playerDebuffs.paralyze&&playerDebuffs.paralyze.timer>0)||
             (playerDebuffs.freeze&&playerDebuffs.freeze.timer>0)||
             (playerDebuffs.sleep&&playerDebuffs.sleep.timer>0));
}
// Get player speed multiplier from debuffs
function playerSpeedMul(){
    var mul=1;
    if(playerDebuffs.dizzy&&playerDebuffs.dizzy.timer>0) mul*=STATUS_DEFS.dizzy.speedMul;
    return mul;
}

function applyDamageToPlayer(dmg){
    // God Mode: invincibility for testing
    if(godMode){spawnFloat(player.x,player.y-20,'无敌！','#ffd700');return false;}
    // Skill: dodge (12% chance)
    if(hasSkill('dodge')&&Math.random()<0.12){spawnFloat(player.x,player.y-20,'闪避！','#4488ee');return false;}
    // Relic: Void Shard (15% dodge)
    if(foundCollectibles.indexOf('void_shard')>=0&&Math.random()<0.15){spawnFloat(player.x,player.y-20,'虚空闪避！','#aa44dd');return false;}
    // Skill: thickSkin (-1 damage, min 1)
    if(hasSkill('thickSkin')) dmg=Math.max(1,dmg-1);
    playerStats.hp-=dmg;
    // Skill: secondWind (heal 30% HP once per floor when HP drops to 0)
    if(playerStats.hp<=0&&hasSkill('secondWind')&&!secondWindUsed){
        secondWindUsed=true;
        playerStats.hp=Math.floor(playerStats.maxHp*0.3);
        spawnFloat(player.x,player.y-20,'绝处逢生！','#4488ee');
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
let labScrollMax = 0; // dynamic, updated each frame by content height
let labPanelContentY = 0, labPanelVisH = 445; // set each frame by renderLab
let merchantScrollY = 0, merchantScrollTouchId = -1, merchantScrollLastY = 0, merchantScrollMoved = false;
let labMessage = '', labMessageTimer = 0;
let extractMini = null;
let labShopStock = []; // lab merchant stock

// Lab hall player character
var labPlayer = { x:0, y:0, vx:0, vy:0, facing:1, animFrame:0, animTimer:0, initialized:false };
var labNearFurniture = null; // key of nearest interactable furniture
var labHallStick = { active:false, sx:0, sy:0, cx:0, cy:0, id:-1 }; // mobile joystick for lab hall
var labInteractPromptAlpha = 0;
var labInteractBtnBox = null; // mobile interact button hitbox

// ============ TUTORIAL SYSTEM ============
var tutorialDone = false;
var tutorialStep = 0; // 0=not started
var tutorialPhase = ''; // 'lab' or 'expedition'
var tutorialBlink = 0;
// TUTORIAL_LAB and TUTORIAL_EXP are defined in gamedata.js

// ============ WEAPON DROP POOL ============
function getWeaponDropPool(floor, isBoss){
    // tier ranges by floor: 0-1→tier0-1, 2-3→tier1-2, 4-5→tier2-3, boss→+1 tier
    var minTier=Math.floor(floor/2);
    var maxTier=minTier+1;
    if(isBoss){ minTier+=1; maxTier+=2; }
    minTier=Math.max(0,Math.min(5,minTier));
    maxTier=Math.max(0,Math.min(5,maxTier));
    return WEAPONS.filter(function(w){ return w.tier>=minTier && w.tier<=maxTier; });
}

// ============ WEAPON INSTANCE ============
function makeWeapon(template){
    var w = Object.assign({}, template);
    w._enchant = null; // enchantment applied via forge
    w._defBonus = 0;
    return w;
}

// ============ RELIC HELPERS ============
function openRelicChoice(source){
    var pool=COLLECTIBLES.filter(function(c){return expeditionFoundRelics.indexOf(c.id)<0;});
    if(pool.length<3) pool=COLLECTIBLES.slice();
    var choices=[];
    var tmp=pool.slice();
    while(choices.length<3&&tmp.length>0){
        var idx=randInt(0,tmp.length-1);
        choices.push(tmp.splice(idx,1)[0]);
    }
    relicChoicePopup={choices:choices,source:source};
}
function applyRelicEffect(c){
    if(foundCollectibles.indexOf(c.id)<0) foundCollectibles.push(c.id);
    if(expeditionFoundRelics.indexOf(c.id)<0) expeditionFoundRelics.push(c.id);
    var e=c.effect||{};
    if(e.maxHpBonus){ playerStats.maxHp+=e.maxHpBonus; playerStats.hp=Math.min(playerStats.hp+e.maxHpBonus,playerStats.maxHp); }
    if(e.defenseBonus) playerStats.def+=e.defenseBonus;
    if(e.atkBonus) playerStats.atk+=e.atkBonus;
    if(e.regenBonus) playerStats.regen+=e.regenBonus;
    if(e.autoRevive) playerStats.revive=true;
    spawnFloat(player.x,player.y-20,'获得 '+collectibleName(c),'#ffdd44');
    spawnParticles(player.x,player.y,'#ffdd44',12);
    playSound('craft');
}

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
    // Apply relic effects
    for(var cid of foundCollectibles){
        var coll=COLLECTIBLES.find(function(c){return c.id===cid;});
        if(coll&&coll.effect){
            if(coll.effect.defenseBonus) playerStats.def+=coll.effect.defenseBonus;
            if(coll.effect.speedBonus) playerStats.speed+=coll.effect.speedBonus;
            if(coll.effect.maxHpBonus) playerStats.maxHp+=coll.effect.maxHpBonus;
            if(coll.effect.regenBonus) playerStats.regen+=coll.effect.regenBonus;
            if(coll.effect.autoRevive) playerStats.revive=true;
        }
    }
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
    // Apply weapon enchant defense bonus
    if(equippedWeapon&&equippedWeapon._defBonus) playerStats.def+=equippedWeapon._defBonus;
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
    bossProjectiles=[]; bossFlash=0; bossShockwave=null; bossVolleyCD=0;
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

    // Spawn enemies (balanced: harder base, steeper scaling)
    var baseHP = Math.floor((15+Math.floor(expeditionNum*3.6)+floor*9)/2);
    var baseATK = Math.max(1, Math.floor((3+Math.floor(expeditionNum*0.75)+Math.floor(floor*1.8))/10));
    if(!isBossFloor){
        var enemyCount = Math.min(3+expeditionNum+floor, 8);
        for(var i=1;i<rooms.length;i++){
            var r=rooms[i], cnt=randInt(1,enemyCount);
            for(var j=0;j<cnt;j++){
                var pos=findOpenTile(r);
                var isElite = (j===0 && i>1 && Math.random()<0.3+floor*0.15);
                var hpMul = isElite?2.5:1, atkMul = isElite?1.8:1;
                // Assign enemy type key based on biome and elite status
                var biomeEnemyPools={
                    forest:{normal:['rat','wolf','bear','bee','hound'],elite:['wolf_pack']},
                    cave:{normal:['bat','spider','centipede','beetle'],elite:['tarantella']},
                    swamp:{normal:['frog','lizard','leech','croc'],elite:['anaconda']}
                };
                var bName=currentBiome.enemyType||'forest';
                var ePool=biomeEnemyPools[bName]||(biomeEnemyPools.forest);
                var eTypeKey=isElite?ePool.elite[randInt(0,ePool.elite.length-1)]:ePool.normal[randInt(0,ePool.normal.length-1)];
                enemies.push({
                    x:pos.x,y:pos.y,angle:Math.random()*Math.PI*2,
                    hp:Math.ceil(baseHP*hpMul), maxHp:Math.ceil(baseHP*hpMul),
                    radius:isElite?9:7, alert:false, alertTimer:0,
                    patrolAngle:Math.random()*Math.PI*2, patrolTimer:randInt(60,180),
                    animFrame:0, attackCD:0, atk:Math.ceil(baseATK*atkMul),
                    isElite:isElite, isBoss:false, enemyTypeKey:eTypeKey
                });
            }
        }
    }

    // Spawn boss in arena center
    if(isBossFloor){
        var bossHP = baseHP*8+expeditionNum*50;
        var bossATK = Math.ceil(baseATK*3);
        var bcx=Math.floor(MAP_W/2)*TILE+TILE/2, bcy=Math.floor(MAP_H/2)*TILE+TILE/2;
        var bossTypeKeys={forest:'grizzly',cave:'kraken',swamp:'dragon'};
        var bossTypeKey=bossTypeKeys[currentBiome.enemyType]||'grizzly';
        var boss={
            x:bcx,y:bcy,angle:0,
            hp:bossHP, maxHp:bossHP,
            radius:16, alert:true, alertTimer:9999,
            patrolAngle:0, patrolTimer:60,
            animFrame:0, attackCD:0, atk:bossATK,
            isElite:false, isBoss:true, enemyTypeKey:bossTypeKey,
            // Boss special properties
            chargeCD:0, charging:false, chargeAngle:0, chargeTimer:0,
            slamCD:0
        };
        enemies.push(boss);
        bossRef=boss;
        // Record boss to bestiary immediately on spawn
        if(!seenEnemies[bossTypeKey]) seenEnemies[bossTypeKey]={count:0,sprite:null};
        if(!boss._seenRecorded){seenEnemies[bossTypeKey].count++;boss._seenRecorded=true;}
        // Boss entrance text
        spawnFloat(bcx,bcy-30,T('bossAppears'),'#ff4444');
        playBGM('boss');
    }

    // Spawn herb pickups (not on boss floor)
    if(!isBossFloor){
    var biomeHerbs = currentBiome.herbs;
    for(var i=1;i<rooms.length;i++){
        if(Math.random()>0.5) continue; // ~50% rooms have herbs
        var r=rooms[i], hCount=randInt(1,2);
        for(var h=0;h<hCount;h++){
            var pos=findOpenTile(r);
            herbDrops.push({x:pos.x,y:pos.y,herbKey:biomeHerbs[randInt(0,biomeHerbs.length-1)],bobOffset:Math.random()*6.28,collected:false});
        }
    }

    // Spawn chests (weapon/gold drops, 20% chance relic choice)
    var chestCount = randInt(1,2+floor);
    for(var i=0;i<chestCount;i++){
        var cr = rooms[randInt(1,rooms.length-1)];
        var cp = findOpenTile(cr);
        var pool = getWeaponDropPool(floor, false);
        var hasWeapon = Math.random()<0.4;
        chests.push({
            x:cp.x, y:cp.y, opened:false, type:'normal',
            goldReward: randInt(3+floor*2, 8+floor*5),
            weaponReward: hasWeapon&&pool.length>0 ? makeWeapon(pool[randInt(0,pool.length-1)]) : null,
            relicChance: Math.random()<0.08 // 8% chance relic choice
        });
    }

    // Spawn merchant every 2 floors (floor 1, 3, 5), not on boss floor
    var shouldSpawnMerchant = (currentFloor % 2 === 1) && (currentFloor < MAX_FLOORS - 1);
    if(shouldSpawnMerchant && rooms.length>3){
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
            // Store gold reward and relic trigger on the locked door itself
            lockedDoors[lockedDoors.length-1].goldReward = randInt(8+floor*3,18+floor*6);
            lockedDoors[lockedDoors.length-1].relicOnUnlock = true;
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
    expeditionFoundRelics = []; // reset expedition relics
    // Equip forged weapon for this expedition (returns to forgedWeapon after)
    equippedWeapon = forgedWeapon || makeWeapon(WEAPONS[0]);
    missionTimer = 180*60; // 180 seconds per floor

    // Generate shop stock for merchant
    generateShopStock(biomeIdx, 0);

    // Carried potions slots: [{potion, count}] — buffs from non-heal/revive types are pre-applied
    activeBuffs=[];
    for(var i=0;i<carriedPotions.length;i++){
        var p=carriedPotions[i].potion;
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
    missionTimer = 180*60; // reset timer for each new floor
    generateShopStock(BIOMES.indexOf(currentBiome), currentFloor);
    setupFloor(BIOMES.indexOf(currentBiome), currentFloor);
    spawnFloat(player.x,player.y-20, T('floor')+' '+(currentFloor+1), '#ffdd44');
}

// ============ INPUT ============
window.addEventListener('keydown',function(e){
    keys[e.code]=true;
    if(state==='lab'&&!labTab&&!showSettings){
        if(e.code==='KeyE'&&labNearFurniture){
            openLabFurniture(labNearFurniture);
        }
    }
    if(state==='expedition'){
        if(e.code==='Digit1') useCarriedPotion(0);
        else if(e.code==='Digit2') useCarriedPotion(1);
        else if(e.code==='Digit3') useCarriedPotion(2);
        else if(e.code==='KeyE'&&nearMerchantRef&&!weaponPopup&&!merchantPopup){
            merchantPopup=nearMerchantRef;
            merchantScrollY=0;
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
        if(labScrollY<-labScrollMax) labScrollY=-labScrollMax;
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
                labScrollTouchId=-1; // reset first to avoid stale id
                labScrollTouchId=t0.identifier;labScrollLastY=t0.clientY;labScrollMoved=false;
                return;
            } else {
                labScrollTouchId=-1; // touch outside panel, release scroll lock
            }
        } else {
            // No panel: left half = joystick (fixed position), right half = interact btn or UI
            var W2=canvas.clientWidth,H2=canvas.clientHeight;
            var isUIArea=(t0.clientY<=45); // top bar UI buttons
            var isLeftHalf=(t0.clientX<W2/2);
            if(!isUIArea&&isLeftHalf){
                // Fixed joystick center at bottom-left
                var fixedSX=W2*0.15, fixedSY=H2*0.78;
                labHallStick.active=true;
                labHallStick.sx=fixedSX; labHallStick.sy=fixedSY;
                labHallStick.cx=t0.clientX; labHallStick.cy=t0.clientY;
                labHallStick.id=t0.identifier;
                return;
            }
            // Right half / UI: only route to handleLabClick for button hits, ignore open-field taps
            if(!isUIArea&&!isLeftHalf){
                handleLabClick(t0.clientX,t0.clientY);return;
            }
        }
        handleLabClick(t0.clientX,t0.clientY);return;
    }
    if(state==='gameover'){handleGameOverTouch(t0.clientX,t0.clientY);return;}
    if(state!=='expedition') return;
    if(showSettings){handleSettingsClick(t0.clientX,t0.clientY);return;}
    if(tutorialPhase==='expedition'){handleTutorialClick(t0.clientX,t0.clientY);}
    if(relicChoicePopup){handleRelicChoiceClick(t0.clientX,t0.clientY);return;}
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
            playSound('click');return;
        }
    }
    for(var i=0;i<e.changedTouches.length;i++){
        var t=e.changedTouches[i];
        if(carriedPotions.length>0){
            var qbSlotW=54,qbSlotH=52,qbGap=5;
            var qbTotalW=carriedPotions.length*(qbSlotW+qbGap)-qbGap;
            var qbX=Math.floor((canvas.width-qbTotalW)/2),qbY=canvas.height-(isMobile?65:70);
            var hitSlot=false;
            for(var pi=0;pi<carriedPotions.length;pi++){
                var sx=qbX+pi*(qbSlotW+qbGap);
                if(t.clientX>=sx&&t.clientX<=sx+qbSlotW&&t.clientY>=qbY&&t.clientY<=qbY+qbSlotH){useCarriedPotion(pi);hitSlot=true;break;}
            }
            if(hitSlot) continue;
        }
        // Check buff icon tap before activating joystick
        var hitBuff=false;
        if(window.renderedBuffs&&window.renderedBuffs.length>0){
            for(var rbi=0;rbi<window.renderedBuffs.length;rbi++){
                var rb2=window.renderedBuffs[rbi];
                if(t.clientX>=rb2.x&&t.clientX<=rb2.x+rb2.w&&t.clientY>=rb2.y&&t.clientY<=rb2.y+rb2.h){
                    if(buffTooltipIndex===rb2.index) buffTooltipIndex=null;
                    else buffTooltipIndex=rb2.index;
                    playSound('click');hitBuff=true;break;
                }
            }
        }
        if(hitBuff) continue;
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
            if(labScrollY<-labScrollMax) labScrollY=-labScrollMax;
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
        if(state==='lab'&&!labTab&&t.identifier===labHallStick.id){
            labHallStick.cx=t.clientX;labHallStick.cy=t.clientY;continue;
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
        if(state==='lab'&&t.identifier===labHallStick.id){
            labHallStick.active=false;labHallStick.id=-1;
            var dx2=t.clientX-labHallStick.sx,dy2=t.clientY-labHallStick.sy;
            if(Math.sqrt(dx2*dx2+dy2*dy2)<10){
                // Tap: always route through handleLabClick (handles furniture hitbox + UI buttons)
                handleLabClick(t.clientX, t.clientY);
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
    // Tutorial no longer pauses game (non-blocking)
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
    if(weaponPopup||merchantPopup||buffPopup||relicChoicePopup) return; // pause while popup open
    frameCount++;
    if(currentFloor<MAX_FLOORS-1&&!godMode) missionTimer--; // no timer on boss floor or in god mode
    if(missionTimer<=0&&!godMode){endExpedition();return;}

    // Update all status effects (player debuffs + enemy statuses)
    updateStatusEffects();

    // Handle DOT deaths on enemies
    for(var dei=enemies.length-1;dei>=0;dei--){
        if(enemies[dei].dyingFromDot){
            var de=enemies[dei];
            spawnParticles(de.x,de.y,'#aa44dd',6);
            var luckBonus2=getResearchBonus('luck');
            var gdrop=de.isBoss?randInt(15,30):(de.isElite?randInt(5,12):randInt(1,4));
            gold+=gdrop; spawnFloat(de.x,de.y-10,'+'+gdrop+' G','#ffd700');
            totalScore+=de.isBoss?50:(de.isElite?25:10);
            if(de.isBoss){
                bossDefeated=true; bossRef=null;
                exitZone={x:Math.floor(MAP_W/2)*TILE+TILE/2,y:Math.floor(MAP_H/2)*TILE+TILE/2};
                spawnFloat(player.x,player.y-30,T('bossDefeated'),'#ffdd44');
                playSound('levelUp');
                chests.push({x:de.x,y:de.y,opened:false,type:'boss_chest',
                    goldReward:randInt(20+currentFloor*5,40+currentFloor*8),
                    weaponReward:null,relicGuaranteed:true});
            } else if(de.isElite){
                if(Math.random()<0.3) openRelicChoice('elite');
            }
            enemies.splice(dei,1);
        }
    }

    // Movement (blocked by paralyze/freeze/sleep)
    var mx=0,my=0;
    if(playerCanMove()){
        if(keys['KeyW']||keys['ArrowUp']) my=-1;
        if(keys['KeyS']||keys['ArrowDown']) my=1;
        if(keys['KeyA']||keys['ArrowLeft']) mx=-1;
        if(keys['KeyD']||keys['ArrowRight']) mx=1;
        if(mobileStick.active){
            var sdx=mobileStick.cx-mobileStick.sx,sdy=mobileStick.cy-mobileStick.sy;
            var sd=Math.sqrt(sdx*sdx+sdy*sdy);
            if(sd>10){mx=sdx/sd;my=sdy/sd;}
        }
    }
    player.moving=(mx!==0||my!==0);
    if(player.moving){
        var len=Math.sqrt(mx*mx+my*my);mx/=len;my/=len;
        var spd=PLAYER_SPEED+playerStats.speed*0.5;
        tryMove(player,mx*spd,my*spd);
        if(frameCount%6===0) player.animFrame=(player.animFrame+1)%4;
        // Update move facing based on horizontal movement
        if(mx>0.1) player.moveFacing=1;
        else if(mx<-0.1) player.moveFacing=-1;
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
    // Auto-attack with rotating weapons (continuous damage)
    var baseCooldown = Math.max(8, Math.round(18/wepSpeedMul));
    if(attackCooldown<=0){
        attackCooldown=baseCooldown;
        var atkRange=wepRange*1.0+player.radius; // Match weapon circle radius
        for(var i=enemies.length-1;i>=0;i--){
            var e=enemies[i];
            var d=dist(player,e);
            if(d<atkRange){
                var dmg=Math.max(1, playerStats.atk+wepDmg-Math.floor(e.maxHp*0.05));
                if(playerStats.poison>0) dmg+=1;
                // Skill: powerStrike (10% crit)
                if(hasSkill('powerStrike')&&Math.random()<0.1){dmg=Math.floor(dmg*1.8);spawnFloat(e.x,e.y-20,'CRIT!','#ffdd00');}
                // Relic: Thunder Pearl (10% crit double damage)
                if(foundCollectibles.indexOf('thunder_pearl')>=0&&Math.random()<0.1){dmg*=2;spawnFloat(e.x,e.y-20,'⚡CRIT!','#ffdd44');}
                // Skill: berserker (+20% ATK when HP<30%)
                if(hasSkill('berserker')&&playerStats.hp<playerStats.maxHp*0.3) dmg=Math.floor(dmg*1.2);
                // Skill: execute (+50% DMG to enemies <25% HP)
                if(hasSkill('execute')&&e.hp<e.maxHp*0.25) dmg=Math.floor(dmg*1.5);
                e.hp-=dmg;
                // Poison enchant: apply poison on-hit
                if(equippedWeapon&&equippedWeapon.enchant&&equippedWeapon.enchant.effect==='poison'){
                    if(Math.random()<0.4) applyStatusToEnemy(e,'poison',STATUS_DEFS['poison']);
                }
                // Apply weapon on-hit status effect
                if(equippedWeapon){
                    var wfx=WEAPON_EFFECTS[equippedWeapon.name];
                    if(wfx&&wfx.length>0){
                        var fx=wfx[Math.floor(Math.random()*wfx.length)];
                        var sdef=STATUS_DEFS[fx];
                        // Chance to apply: 30% base, higher rarity = higher chance
                        var fxChance=0.25+(equippedWeapon.rarity||0)*0.07;
                        if(Math.random()<fxChance){
                            applyStatusToEnemy(e,fx,sdef);
                        }
                    }
                }
                spawnParticles(e.x,e.y,'#ff0',4);
                spawnFloat(e.x,e.y-10,'-'+dmg,'#ff4444');
                playSound('enemyHit');
                screenShake=3;
                e.alert=true;e.alertTimer=180;
                if(e.hp<=0){
                    spawnParticles(e.x,e.y,'#ffd700',8);
                    var luckBonus = getResearchBonus('luck');
                    var goldDrop = e.isBoss?randInt(30,55+luckBonus*5):(e.isElite?randInt(10,20+luckBonus*3):randInt(2,7+luckBonus));
                    // Skill: scavenger (+30% gold)
                    if(hasSkill('scavenger')) goldDrop=Math.floor(goldDrop*1.3);
                    // Relic: Ancient Coin (+15% gold)
                    if(foundCollectibles.indexOf('ancient_coin')>=0) goldDrop=Math.floor(goldDrop*1.15);
                    gold+=goldDrop;
                    spawnFloat(e.x,e.y-10,'+'+goldDrop+' G','#ffd700');
                    totalScore+=e.isBoss?50:(e.isElite?25:10);
                    // Skill: lifeSteal (heal 1 HP per 5 kills)
                    if(hasSkill('lifeSteal')){killCounter++;if(killCounter>=5){killCounter=0;if(playerStats.hp<playerStats.maxHp){playerStats.hp=Math.min(playerStats.maxHp,playerStats.hp+1);spawnFloat(player.x,player.y-20,'+1 HP','#ee4444');}}}
                    // Relic: Blood Ruby (heal 1 HP per kill)
                    if(foundCollectibles.indexOf('blood_ruby')>=0&&playerStats.hp<playerStats.maxHp){playerStats.hp=Math.min(playerStats.maxHp,playerStats.hp+1);spawnFloat(player.x,player.y-20,'+1 HP','#ee4444');}
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
                        // Spawn boss chest at boss location — guaranteed relic
                        chests.push({x:e.x,y:e.y,opened:false,type:'boss_chest',
                            goldReward:randInt(20+currentFloor*5,40+currentFloor*8),
                            weaponReward:null,relicGuaranteed:true});
                    } else if(e.isElite){
                        spawnFloat(e.x,e.y-25,T('eliteSlain'),'#ffaa00');
                        // 30% chance relic choice
                        if(Math.random()<0.3) openRelicChoice('elite');
                    }
                    enemies.splice(i,1);
                }
            }
        }
    }

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
                spawnFloat(e.x,e.y-30,'狂暴！','#ff0000');
                spawnParticles(e.x,e.y,'#ff0000',30);
                screenShake=20; bossFlash=1.0; bossFlashColor='#ff0000';
                bossShockwave={x:e.x,y:e.y,r:10,maxR:180,life:30};
                playSound('levelUp');
                // Instantly summon 4 minions on enrage
                var baseHPe=2+Math.floor(expeditionNum*0.5)+currentFloor*2;
                var baseATKe=1+Math.floor(expeditionNum*0.3)+currentFloor;
                for(var ei=0;ei<4;ei++){var ea=Math.PI*2*ei/4,er=70;var ex2=e.x+Math.cos(ea)*er,ey2=e.y+Math.sin(ea)*er;if(!isSolid(ex2,ey2)){enemies.push({x:ex2,y:ey2,angle:Math.random()*Math.PI*2,hp:Math.ceil(baseHPe),maxHp:Math.ceil(baseHPe),radius:6,alert:true,alertTimer:180,patrolAngle:Math.random()*Math.PI*2,patrolTimer:60,animFrame:0,attackCD:0,atk:Math.ceil(baseATKe),isElite:false,isBoss:false});spawnParticles(ex2,ey2,'#ff0000',8);}}
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
                    spawnParticles(player.x,player.y,'#ff4444',12);
                    screenShake=14; bossFlash=0.6; bossFlashColor='#ff2200';
                    bossShockwave={x:player.x,y:player.y,r:5,maxR:80,life:15};
                    playSound('hit');}
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
                    spawnFloat(e.x,e.y-20,'冲锋！','#ff8800');
                    playSound('swing');
                }
                // Ground slam (AoE) when close
                if(e.slamCD<=0&&d<60){
                    e.slamCD=bossPhase===1?150:240;
                    var slamDmg=Math.max(1,Math.ceil(e.atk*0.8)-playerStats.def);
                    if(d<50){
                        var actualSlam=applyDamageToPlayer(slamDmg);
                        if(actualSlam!==false){spawnFloat(player.x,player.y-10,'-'+actualSlam,'#ff6644');
                        screenShake=12; bossFlash=0.5; bossFlashColor='#ff6600';
                        bossShockwave={x:e.x,y:e.y,r:10,maxR:120,life:20};
                        playSound('hit');}
                        if(playerStats.hp<=0){
                            if(playerStats.revive){playerStats.revive=false;playerStats.hp=Math.floor(playerStats.maxHp/2);spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');spawnParticles(player.x,player.y,'#ffaa00',12);activeBuffs=activeBuffs.filter(function(b){return b.effect!=='revive';});}
                            else{state='gameover';return;}
                        }
                    }
                    // Visual slam ring (more particles)
                    for(var si=0;si<32;si++){var sa=Math.PI*2*si/32,sr2=40+Math.random()*20;particles.push({x:e.x+Math.cos(sa)*sr2,y:e.y+Math.sin(sa)*sr2,vx:Math.cos(sa)*3,vy:Math.sin(sa)*3,life:25,maxLife:25,size:4,color:bossPhase===1?'#ff4400':'#ff8844'});}
                    spawnFloat(e.x,e.y-20,'震地！','#ff6644');
                }
                // Projectile volley attack (enraged phase)
                if(bossPhase===1&&bossVolleyCD<=0&&d<250&&d>50){
                    bossVolleyCD=90;
                    var vCount=8;
                    bossFlash=0.35; bossFlashColor='#aa00ff';
                    for(var vi=0;vi<vCount;vi++){
                        var va=e.angle+(vi-(vCount-1)/2)*0.28;
                        if(typeof bossProjectiles==='undefined') break;
                        bossProjectiles.push({x:e.x,y:e.y,vx:Math.cos(va)*4.5,vy:Math.sin(va)*4.5,life:60,atk:Math.ceil(e.atk*0.6)});
                    }
                    spawnFloat(e.x,e.y-20,'散弹！','#aa44ff');
                }
            }
            if(e.chargeCD>0) e.chargeCD--;
            if(e.slamCD>0) e.slamCD--;
            // Summon minions periodically
            bossSummonTimer++;
            var summonInterval=bossPhase===1?240:420; // faster in enrage
            var maxMinions=bossPhase===1?10:6;
            var minionCount=enemies.filter(function(en){return !en.isBoss&&!en.isElite;}).length;
            if(bossSummonTimer>=summonInterval&&minionCount<maxMinions){
                bossSummonTimer=0;
                var summonCount=bossPhase===1?5:3;
                var baseHP2=2+Math.floor(expeditionNum*0.5)+currentFloor*2;
                var baseATK2=1+Math.floor(expeditionNum*0.3)+currentFloor;
                // Full-screen summon flash
                bossFlash=0.45; bossFlashColor='#6600cc';
                screenShake=8;
                for(var si=0;si<summonCount;si++){
                    var sa=Math.random()*Math.PI*2, sr=50+Math.random()*80;
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
                        spawnParticles(sx2,sy2,'#aa44dd',10);
                    }
                }
                spawnFloat(e.x,e.y-25,'召唤随从！','#aa44dd');
                playSound('craft');
            }
            if(bossVolleyCD>0) bossVolleyCD--;
            if(e.attackCD>0) e.attackCD--;
            if(frameCount%6===0) e.animFrame=(e.animFrame+1)%3;
            continue; // skip normal AI for boss
        }

        // ===== NORMAL ENEMY AI =====
        // Status effect: freeze/paralyze/sleep = can't move or attack
        if(e.statuses){
            var eCCed=(e.statuses.freeze&&e.statuses.freeze.timer>0)||
                      (e.statuses.paralyze&&e.statuses.paralyze.timer>0)||
                      (e.statuses.sleep&&e.statuses.sleep.timer>0);
            if(eCCed){e.attackCD=Math.max(e.attackCD,10);continue;}
            // Dizzy: move randomly
            if(e.statuses.dizzy&&e.statuses.dizzy.timer>0){
                e.angle+=0.15*((frameCount%2===0)?1:-1);
                tryMove(e,Math.cos(e.angle)*ENEMY_SPEED*0.5,Math.sin(e.angle)*ENEMY_SPEED*0.5);
                if(e.attackCD>0) e.attackCD--;
                continue;
            }
        }
        var sightRange = e.isElite?180:150;
        var canSee=d<sightRange&&lineOfSight(e.x,e.y,player.x,player.y);
        if(playerStats.stealth>0&&!e.alert) canSee=canSee&&d<60;
        if(canSee||(e.alert&&d<200)){
            e.alert=true;e.alertTimer=180;
            // Record to bestiary on first sight (boss/elite: record on alert too)
            if((canSee||e.isBoss||e.isElite)&&e.enemyTypeKey){
                var etKey=e.enemyTypeKey;
                if(!seenEnemies[etKey]) seenEnemies[etKey]={count:0,sprite:e.sprite||null};
                if(!e._seenRecorded){seenEnemies[etKey].count++;e._seenRecorded=true;}
            }
            e.angle=angleTo(e,player);
            var espd = e.isElite?ENEMY_SPEED*1.1:ENEMY_SPEED*1.2;
            if(d>28) tryMove(e,Math.cos(e.angle)*espd,Math.sin(e.angle)*espd);
            if(d<30&&e.attackCD<=0){
                var dmg=Math.max(1,e.atk-playerStats.def);
                var actualDmg=applyDamageToPlayer(dmg);
                if(actualDmg!==false){spawnFloat(player.x,player.y-10,'-'+actualDmg,'#ee4444');
                spawnParticles(player.x,player.y,'#ee4444',4);
                screenShake=4; playSound('hit');
                // Apply enemy on-hit debuff to player
                if(e.enemyTypeKey){
                    var efx=ENEMY_TYPE_EFFECTS[e.enemyTypeKey];
                    if(efx&&efx.length>0&&Math.random()<0.35){
                        applyDebuffToPlayer(efx[Math.floor(Math.random()*efx.length)]);
                    }
                }}
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
            // Relic choice
            if(ch.relicGuaranteed || ch.type==='boss_chest'){
                openRelicChoice(ch.type||'chest');
            } else if(ch.relicChance){
                openRelicChoice('chest');
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
                // Gold + guaranteed relic choice
                if(ld.goldReward){
                    gold+=ld.goldReward;
                    spawnFloat(ldx,ldy-26,'+'+ld.goldReward+'G','#ffd700');
                }
                if(ld.relicOnUnlock){
                    openRelicChoice('key_chest');
                }
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
            if(expeditionFoundRelics.indexOf(cd.collectibleId)<0) expeditionFoundRelics.push(cd.collectibleId);
            var coll=COLLECTIBLES.find(function(c){return c.id===cd.collectibleId;});
            spawnFloat(cd.x,cd.y-10,T('newRelic')+' '+collectibleName(coll),coll.color);
            spawnParticles(cd.x,cd.y,coll.color,10);
            playSound('pickup');
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

    // Stairs zone (next floor) - locked until all enemies defeated
    if(stairsZone){
        if(dist(player,stairsZone)<24){
            if(enemies.length>0){
                // Show locked message
                if(frameCount%60===0) spawnFloat(stairsZone.x,stairsZone.y-20,'消灭所有敌人!','#ff6644');
                extracting=0;
            } else {
                extracting++;
                if(extracting>=120){extracting=0;goNextFloor();return;}
            }
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
    if(bossFlash>0) bossFlash*=0.80;
    if(bossShockwave){
        bossShockwave.r+=bossShockwave.maxR/bossShockwave.life*1.5;
        bossShockwave.life--;
        if(bossShockwave.life<=0||bossShockwave.r>=bossShockwave.maxR) bossShockwave=null;
    }
    for(var bpi=bossProjectiles.length-1;bpi>=0;bpi--){
        var bp=bossProjectiles[bpi];
        bp.x+=bp.vx; bp.y+=bp.vy; bp.life--;
        var bpd=dist({x:bp.x,y:bp.y},player);
        if(bpd<16){
            var bpDmg=Math.max(1,bp.atk-playerStats.def);
            var bpActual=applyDamageToPlayer(bpDmg);
            if(bpActual!==false){spawnFloat(player.x,player.y-10,'-'+bpActual,'#aa44ff');screenShake=5;}
            if(playerStats.hp<=0){if(playerStats.revive){playerStats.revive=false;playerStats.hp=Math.floor(playerStats.maxHp/2);spawnFloat(player.x,player.y-20,T('revived'),'#ffaa00');}else{state='gameover';}}
            bossProjectiles.splice(bpi,1);
        } else if(bp.life<=0||isSolid(bp.x,bp.y)){
            spawnParticles(bp.x,bp.y,'#aa44ff',3);
            bossProjectiles.splice(bpi,1);
        }
    }
}

function endExpedition(){
    activeBuffs=[];
    carriedPotions=[]; // Clear used potions after expedition
    // Restore pre-expedition weapon (expedition weapons are single-use)
    equippedWeapon = forgedWeapon || makeWeapon(WEAPONS[0]);
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
            var isBossC=ch.type==='boss_chest',isKeyC=ch.type==='key_chest';
            var bodyColor=isBossC?'#882222':(isKeyC?'#224488':'#8a6622');
            var lidColor=isBossC?'#aa3333':(isKeyC?'#3355aa':'#bb9933');
            var lidTop=isBossC?'#cc4444':(isKeyC?'#5577cc':'#ddbb44');
            var glowColor=isBossC?'#ff4444':(isKeyC?'#44aaff':'#ffd700');
            // Chest body
            ctx.fillStyle=bodyColor;ctx.fillRect(cx2-10,cy2-4,20,14);
            // Lid
            ctx.fillStyle=lidColor;ctx.fillRect(cx2-11,cy2-8,22,8);
            ctx.fillStyle=lidTop;ctx.fillRect(cx2-11,cy2-8,22,2);
            // Metal bands
            ctx.fillStyle='#665522';ctx.fillRect(cx2-11,cy2-2,22,2);
            // Lock / icon
            if(isKeyC){
                // Key icon over lock
                ctx.fillStyle='#ffd700';ctx.fillRect(cx2-2,cy2-3,4,4);
                ctx.fillStyle='#ffee44';ctx.font='bold 8px monospace';ctx.textAlign='center';
                ctx.fillText('🔑',cx2,cy2+10);
            } else if(isBossC){
                ctx.fillStyle='#ff4444';ctx.fillRect(cx2-2,cy2-3,4,4);
                ctx.fillStyle='#ffdd44';ctx.font='bold 8px monospace';ctx.textAlign='center';
                ctx.fillText('★',cx2,cy2+10);
            } else {
                ctx.fillStyle='#ffd700';ctx.fillRect(cx2-2,cy2-3,4,4);
            }
            ctx.strokeStyle='#775511';ctx.lineWidth=1;ctx.strokeRect(cx2-10,cy2-8,20,20);
            // Glow
            ctx.save();ctx.globalAlpha=0.12+Math.sin(frameCount*0.08)*0.07;
            var chGlow=ctx.createRadialGradient(cx2,cy2,3,cx2,cy2,22);
            chGlow.addColorStop(0,glowColor);chGlow.addColorStop(1,'rgba(0,0,0,0)');
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

    // Collectible drops — sprite icon with glow + bob
    for(var cd of collectibleDrops){
        if(cd.collected) continue;
        var coll=COLLECTIBLES.find(function(c){return c.id===cd.collectibleId;});
        var bob=Math.sin(frameCount*0.08)*3;
        // Ground shadow
        ctx.save();ctx.globalAlpha=0.22;ctx.fillStyle='#000';
        ctx.beginPath();ctx.ellipse(cd.x,cd.y+13,8,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
        // Outer glow pulse
        ctx.save();ctx.globalAlpha=0.15+Math.sin(frameCount*0.06)*0.07;
        var cdGlow=ctx.createRadialGradient(cd.x,cd.y+bob,2,cd.x,cd.y+bob,22);
        cdGlow.addColorStop(0,coll.color);cdGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=cdGlow;ctx.fillRect(cd.x-22,cd.y+bob-22,44,44);ctx.restore();
        // Sprite or fallback
        var cdSpr=SPR.relicSprites&&SPR.relicSprites[cd.collectibleId];
        if(cdSpr){
            var iSz=24;
            ctx.save();ctx.imageSmoothingEnabled=false;
            ctx.shadowColor=coll.color;ctx.shadowBlur=8;
            var sc2=Math.min(iSz/cdSpr.width,iSz/cdSpr.height);
            var dw2=Math.round(cdSpr.width*sc2),dh2=Math.round(cdSpr.height*sc2);
            ctx.drawImage(cdSpr,Math.round(cd.x-dw2/2),Math.round(cd.y+bob-dh2/2),dw2,dh2);
            ctx.restore();
        } else {
            // Fallback: small colored circle
            ctx.save();ctx.fillStyle=coll.color;ctx.shadowColor=coll.color;ctx.shadowBlur=8;
            ctx.beginPath();ctx.arc(cd.x,cd.y+bob,8,0,Math.PI*2);ctx.fill();ctx.restore();
        }
        // Sparkle particles
        for(var si=0;si<3;si++){
            var sa=frameCount*0.05+si*2.1, sr=14+Math.sin(frameCount*0.03+si)*4;
            var spx=cd.x+Math.cos(sa)*sr, spy=cd.y+bob+Math.sin(sa)*sr;
            ctx.save();ctx.globalAlpha=0.35+Math.sin(frameCount*0.1+si)*0.25;
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
            var promptText=isMobile?'点击交互':'按E交互';
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
            var spr=null;
            
            // Use custom sprites based on floor (currentFloor is 0-indexed, but floorKey is 1-indexed)
            var floorKey='floor'+Math.min(currentFloor+1,5);
            var pool=SPR.customEnemies&&SPR.customEnemies[currentBiome.enemyType]?SPR.customEnemies[currentBiome.enemyType][floorKey]:null;
            if(pool&&pool.length>0){
                // Assign sprite based on enemy index (consistent per enemy)
                if(!e.spriteIndex) e.spriteIndex=Math.floor(Math.random()*pool.length);
                spr=pool[e.spriteIndex%pool.length];
            } else if(et.frames.length>0){
                spr=et.frames[e.animFrame%et.frames.length];
            }
            
            // Debug: log if no sprite found
            if(!spr&&frameCount%120===0&&enemies.indexOf(e)===0){
                console.log('[Enemy Sprite Debug]', 'Biome:', currentBiome.enemyType, 'Floor:', currentFloor, 'FloorKey:', floorKey, 'Pool:', pool?pool.length:0, 'SPR.customEnemies:', SPR.customEnemies);
            }
            
            if(spr){
                // Floating animation (up and down)
                var floatOffset=Math.sin(frameCount*0.05+e.x*0.1)*2;
                // Breathing animation (scale pulse)
                var breathScale=1.0+Math.sin(frameCount*0.08+e.y*0.1)*0.05;
                
                ctx.save();
                ctx.translate(e.x,e.y+floatOffset);
                var baseScale=e.isBoss?2.0:(e.isElite?1.4:1.0);
                var scale=baseScale*breathScale;
                var flip=(e.angle>Math.PI/2||e.angle<-Math.PI/2)?-1:1;
                ctx.scale(flip*scale,scale);
                
                // Draw sprite (support both canvas and image)
                var spriteSize=spr.width||TILE;
                ctx.drawImage(spr,-spriteSize/2,-spriteSize/2,spriteSize,spriteSize);
                ctx.restore();
            } else {
                ctx.fillStyle=e.isBoss?'#ff0000':(e.isElite?'#ff8800':(e.alert?'#ff4500':'#ffd700'));
                ctx.beginPath();ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);ctx.fill();
            }
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
        // Draw status effect icons on enemy
        if(e.statuses){
            var skeys=Object.keys(e.statuses);
            var sxOff=-(skeys.length-1)*9;
            for(var si2=0;si2<skeys.length;si2++){
                var stype=skeys[si2];
                var sd2=STATUS_DEFS[stype];
                if(!sd2) continue;
                var es2=e.statuses[stype];
                var sxp=e.x+sxOff+si2*18;
                var syp=e.y-e.radius-18;
                // Color overlay on enemy for freeze/burn
                if(stype==='freeze'){ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle='#44ddff';ctx.beginPath();ctx.arc(e.x,e.y,e.radius+2,0,Math.PI*2);ctx.fill();ctx.restore();}
                if(stype==='burn'){ctx.save();ctx.globalAlpha=0.2+Math.sin(frameCount*0.2)*0.1;ctx.fillStyle='#ff6622';ctx.beginPath();ctx.arc(e.x,e.y,e.radius+3,0,Math.PI*2);ctx.fill();ctx.restore();}
                // Icon
                ctx.fillStyle=sd2.color;ctx.font='12px monospace';ctx.textAlign='center';
                ctx.fillText(sd2.icon,sxp,syp);
                // Timer bar
                var sbar=e.isBoss?20:14;
                var sratio=es2.timer/sd2.duration;
                ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(sxp-sbar/2,syp+2,sbar,2);
                ctx.fillStyle=sd2.color;ctx.fillRect(sxp-sbar/2,syp+2,sbar*sratio,2);
            }
        }
    }

    // Player (improved with dynamic light and shadow)
    var ppx=player.x,ppy=player.y;
    // Ground shadow
    ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(ppx,ppy+10,10,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
    // Player debuff visual overlay
    if(playerDebuffs.freeze&&playerDebuffs.freeze.timer>0){ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle='#44ddff';ctx.beginPath();ctx.arc(ppx,ppy,20,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(playerDebuffs.burn&&playerDebuffs.burn.timer>0){ctx.save();ctx.globalAlpha=0.25+Math.sin(frameCount*0.2)*0.1;ctx.fillStyle='#ff6622';ctx.beginPath();ctx.arc(ppx,ppy,22,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(playerDebuffs.poison&&playerDebuffs.poison.timer>0){ctx.save();ctx.globalAlpha=0.2+Math.sin(frameCount*0.15)*0.08;ctx.fillStyle='#aa44dd';ctx.beginPath();ctx.arc(ppx,ppy,20,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(playerDebuffs.sleep&&playerDebuffs.sleep.timer>0){ctx.save();ctx.globalAlpha=0.4;ctx.fillStyle='#8888ff';ctx.beginPath();ctx.arc(ppx,ppy,20,0,Math.PI*2);ctx.fill();ctx.restore();}
    // Player light aura — biome-tinted
    ctx.save();ctx.globalAlpha=0.08+Math.sin(frameCount*0.04)*0.03;
    var pGlowColor=currentBiome.name==='Forest'?'#44dd88':(currentBiome.name==='Cave'?'#8888ee':'#aacc44');
    var pGlow=ctx.createRadialGradient(ppx,ppy,4,ppx,ppy,40);
    pGlow.addColorStop(0,pGlowColor);pGlow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=pGlow;ctx.fillRect(ppx-40,ppy-40,80,80);ctx.restore();
    if(SPR.ready){
        var spr=player.moving?SPR.playerFrames[player.animFrame%SPR.playerFrames.length]:SPR.playerIdle;
        ctx.save();ctx.translate(ppx,ppy);
        var flip=(player.moveFacing||1)<0?-1:1;
        ctx.scale(flip,1);
        ctx.drawImage(spr,-TILE/2,-TILE/2,TILE,TILE);
        ctx.restore();
    } else {
        ctx.fillStyle='#44dd88';ctx.beginPath();ctx.arc(ppx,ppy,player.radius,0,Math.PI*2);ctx.fill();
    }
    
    // Auto-rotating weapon circle (always active)
    if(equippedWeapon){
        var wRange=equippedWeapon.range;
        var weaponCount=8;
        var rotationSpeed=frameCount*0.05;
        var circleRadius=wRange*1.0;
        var wSprite=SPR.weapons&&SPR.weapons[equippedWeapon.name];
        
        for(var i=0;i<weaponCount;i++){
            var angle=i*Math.PI*2/weaponCount+rotationSpeed;
            var wx=ppx+Math.cos(angle)*circleRadius;
            var wy=ppy+Math.sin(angle)*circleRadius;
            
            ctx.save();
            ctx.translate(wx,wy);
            ctx.rotate(angle+Math.PI/2+Math.PI/4);
            ctx.globalAlpha=0.9;
            var wSize=24;
            if(wSprite){
                ctx.drawImage(wSprite,0,-wSize/2,wSize,wSize);
            } else {
                // Fallback: draw a colored bar
                ctx.fillStyle=equippedWeapon.color||'#aabbcc';
                ctx.fillRect(0,-wSize/2,4,wSize);
            }
            ctx.restore();
        }
    }
    
    // No attack animation needed - weapons auto-rotate continuously

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

    // Boss full-screen flash
    if(bossFlash>0.02){
        ctx.save();ctx.globalAlpha=bossFlash*0.55;
        ctx.fillStyle=bossFlashColor;ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.restore();
    }
    // Boss shockwave ring (screen-space, centered on world pos)
    if(bossShockwave){
        var bsWX=bossShockwave.x-camera.x, bsWY=bossShockwave.y-camera.y;
        var bsAlpha=Math.max(0,(bossShockwave.life/(bossShockwave.maxR/3))*0.7);
        ctx.save();ctx.globalAlpha=bsAlpha;
        ctx.strokeStyle=bossFlashColor;ctx.lineWidth=4;
        ctx.beginPath();ctx.arc(bsWX,bsWY,bossShockwave.r,0,Math.PI*2);ctx.stroke();
        ctx.lineWidth=2;ctx.globalAlpha=bsAlpha*0.5;
        ctx.beginPath();ctx.arc(bsWX,bsWY,bossShockwave.r*0.7,0,Math.PI*2);ctx.stroke();
        ctx.restore();
    }
    // Boss projectiles (screen-space)
    for(var bpri=0;bpri<bossProjectiles.length;bpri++){
        var bpr=bossProjectiles[bpri];
        var bprX=bpr.x-camera.x, bprY=bpr.y-camera.y;
        ctx.save();ctx.shadowColor='#aa44ff';ctx.shadowBlur=8;
        ctx.fillStyle='#cc88ff';
        ctx.beginPath();ctx.arc(bprX,bprY,5,0,Math.PI*2);ctx.fill();
        ctx.restore();
    }

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
    if(showBestiary) drawBestiary();
    if(weaponPopup) drawWeaponPopup();
    if(merchantPopup) drawMerchantPopup();
    if(buffPopup) drawBuffPopup();
    if(relicChoicePopup) drawRelicChoicePopup();

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
    var timeStr=godMode?'∞':mins+':'+(s<10?'0':'')+s;
    var timeW=ctx.measureText(timeStr).width+20;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(W/2-timeW/2,8,timeW,24);
    ctx.font='bold 16px monospace';ctx.textAlign='center';
    if(godMode){ctx.save();ctx.shadowColor='#ffd700';ctx.shadowBlur=8;ctx.fillStyle='#ffd700';ctx.fillText(timeStr,W/2,26);ctx.restore();}
    else if(secs<15){ctx.save();ctx.shadowColor='#ff0000';ctx.shadowBlur=8;ctx.fillStyle='#ee4444';ctx.fillText(timeStr,W/2,26);ctx.restore();}
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
        var bhpW=Math.min(300,W*0.5),bhpH=12,bhpX=W/2-bhpW/2,bhpY=78;
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
        // Boss name (above bar)
        ctx.fillStyle=bossPhase===1?'#ff4400':'#ff6666';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText('BOSS'+(bossPhase===1?' [狂暴]':''),W/2,bhpY-6);
        // HP text (below bar)
        ctx.fillStyle='#fff';ctx.font='9px monospace';
        ctx.fillText(bossRef.hp+'/'+bossRef.maxHp,W/2,bhpY+bhpH+10);
    }

    // All buffs displayed on left side (next to stats panel)
    var allBuffs = [];
    
    // Add active potion buffs with timer
    for(var bi=0;bi<activeBuffs.length;bi++){
        var b=activeBuffs[bi];
        var buffColor='#88aaff';
        for(var ri=0;ri<RECIPES.length;ri++){
            if(RECIPES[ri].effect===b.effect&&RECIPES[ri].tier===b.tier){buffColor=RECIPES[ri].color;break;}
        }
        var symbol='?';
        if(b.effect==='attack') symbol='⚔';
        else if(b.effect==='defense') symbol='🛡';
        else if(b.effect==='speed') symbol='⚡';
        else if(b.effect==='regen') symbol='❤';
        else if(b.effect==='poison') symbol='☠';
        else if(b.effect==='stealth') symbol='👁';
        else if(b.effect==='revive') symbol='⭐';
        else if(b.effect==='maxhp') symbol='♥';
        allBuffs.push({
            color:buffColor, symbol:symbol, tier:b.tier,
            timer:b.duration?Math.ceil(b.duration/60):null, type:'potion'
        });
    }
    
    // Add expedition relics as buffs
    var expeditionRelics = foundCollectibles.filter(function(cid){
        return expeditionFoundRelics && expeditionFoundRelics.indexOf(cid)>=0;
    });
    for(var ei=0;ei<expeditionRelics.length;ei++){
        var coll=COLLECTIBLES.find(function(c){return c.id===expeditionRelics[ei];});
        if(coll){
            var relicSymbol='💎';
            if(coll.effect.defenseBonus) relicSymbol='🛡';
            else if(coll.effect.speedBonus) relicSymbol='⚡';
            else if(coll.effect.maxHpBonus) relicSymbol='♥';
            else if(coll.effect.goldBonus) relicSymbol='💰';
            else if(coll.effect.dodgeChance) relicSymbol='👻';
            else if(coll.effect.critChance) relicSymbol='⚔';
            else if(coll.effect.lifeSteal) relicSymbol='❤';
            else if(coll.effect.regenBonus) relicSymbol='💚';
            allBuffs.push({
                color:coll.color, symbol:relicSymbol, tier:null,
                timer:null, type:'relic', name:coll.nameZh,
                relicId:coll.id
            });
        }
    }
    
    // Draw all buffs as HORIZONTAL row below stats panel
    window.renderedBuffs = []; // Store buff positions for click detection
    if(allBuffs.length>0){
        var buffIconSize=28,buffGap=3;
        var buffStartX=8, buffY=130; // horizontal row below the stat text
        for(var bi=0;bi<allBuffs.length;bi++){
            var buff=allBuffs[bi];
            var bix=buffStartX+bi*(buffIconSize+buffGap);
            // Store for click detection
            window.renderedBuffs.push({x:bix, y:buffY, w:buffIconSize, h:buffIconSize, buff:buff, index:bi});
            // Icon background with glow
            ctx.save();
            ctx.shadowColor=buff.color;ctx.shadowBlur=5;
            ctx.fillStyle='rgba(20,20,30,0.85)';
            ctx.fillRect(bix,buffY,buffIconSize,buffIconSize);
            ctx.shadowBlur=0;
            ctx.strokeStyle=buff.color;ctx.lineWidth=2;
            ctx.strokeRect(bix,buffY,buffIconSize,buffIconSize);
            // Symbol: use relic sprite if available, else fallback emoji
            if(buff.type==='relic'&&buff.relicId&&SPR.relicSprites&&SPR.relicSprites[buff.relicId]){
                var rspr=SPR.relicSprites[buff.relicId];
                var pad=3,iw=buffIconSize-pad*2,ih=buffIconSize-pad*2;
                var sc2=Math.min(iw/rspr.width,ih/rspr.height);
                var dw2=Math.round(rspr.width*sc2),dh2=Math.round(rspr.height*sc2);
                ctx.imageSmoothingEnabled=false;
                ctx.shadowColor=buff.color;ctx.shadowBlur=4;
                ctx.drawImage(rspr,bix+pad+(iw-dw2)/2,buffY+pad+(ih-dh2)/2,dw2,dh2);
            } else {
                ctx.fillStyle=buff.color;ctx.font='bold 14px monospace';ctx.textAlign='center';
                ctx.fillText(buff.symbol,bix+buffIconSize/2,buffY+17);
            }
            // Timer or tier below icon
            if(buff.timer!==null){
                ctx.fillStyle='#fff';ctx.font='bold 7px monospace';
                ctx.fillText(buff.timer+'s',bix+buffIconSize/2,buffY+buffIconSize+8);
            } else if(buff.tier!==null){
                ctx.fillStyle=buff.color;ctx.font='bold 7px monospace';
                ctx.fillText('T'+buff.tier,bix+buffIconSize/2,buffY+buffIconSize+8);
            }
            ctx.restore();
        }
    }
    
    // Draw buff detail tooltip if one is selected
    if(buffTooltipIndex!==null&&window.renderedBuffs){
        var rb=window.renderedBuffs.find(function(b){return b.index===buffTooltipIndex;});
        if(rb){
            var tooltipW=190,tooltipH=rb.buff.type==='relic'?100:80;
            // Tooltip appears below the icon row
            var tx=rb.x,ty=rb.y+rb.h+12;
            if(tx+tooltipW>canvas.width) tx=canvas.width-tooltipW-4;
            if(tx<4) tx=4;
            if(ty+tooltipH>canvas.height) ty=rb.y-tooltipH-6;
            // Background
            ctx.fillStyle='rgba(10,10,20,0.95)';
            ctx.fillRect(tx,ty,tooltipW,tooltipH);
            ctx.strokeStyle=rb.buff.color;ctx.lineWidth=2;
            ctx.strokeRect(tx,ty,tooltipW,tooltipH);
            // Content
            ctx.fillStyle='#fff';ctx.font='bold 11px monospace';ctx.textAlign='left';
            var cy=ty+18;
            if(rb.buff.type==='potion'){
                // Potion buff details
                var effectName='';
                if(rb.buff.symbol==='⚔') effectName='攻击';
                else if(rb.buff.symbol==='🛡') effectName='防御';
                else if(rb.buff.symbol==='⚡') effectName='速度';
                else if(rb.buff.symbol==='❤') effectName='回血';
                else if(rb.buff.symbol==='♥') effectName='最大生命';
                ctx.fillText(effectName+' T'+rb.buff.tier,tx+10,cy);cy+=16;
                ctx.fillStyle='#aaa';ctx.font='10px monospace';
                var bonus='';
                var actualBuff=activeBuffs.find(function(ab){return ab.tier===rb.buff.tier;});
                if(actualBuff){
                    if(actualBuff.effect==='attack') bonus='+'+actualBuff.value+' '+T('atk');
                    else if(actualBuff.effect==='defense') bonus='+'+actualBuff.value+' '+T('def');
                    else if(actualBuff.effect==='speed') bonus='+'+actualBuff.value+'% '+T('spd');
                    else if(actualBuff.effect==='regen') bonus='+'+actualBuff.value+' HP/5s';
                    else if(actualBuff.effect==='maxhp') bonus='+'+actualBuff.value+' Max HP';
                }
                ctx.fillText(bonus,tx+10,cy);cy+=14;
                ctx.fillText(T('duration')+': '+rb.buff.timer+'s',tx+10,cy);
            } else if(rb.buff.type==='relic'){
                // Relic buff details — show name + skillDesc
                ctx.fillStyle=rb.buff.color;ctx.font='bold 10px monospace';
                ctx.fillText(rb.buff.name,tx+10,cy);cy+=15;
                var coll=COLLECTIBLES.find(function(c){return c.id===rb.buff.relicId;});
                if(coll){
                    var sd=coll.skillDescZh||coll.skillDesc;
                    ctx.fillStyle='#ccbbee';ctx.font='9px monospace';
                    // word wrap description
                    var sdW=tooltipW-20,sdLines=[];
                    if(lang==='zh'){
                        var sdCl='';
                        for(var sdi=0;sdi<sd.length;sdi++){
                            var sdT=sdCl+sd[sdi];
                            if(ctx.measureText(sdT).width>sdW&&sdCl){sdLines.push(sdCl);sdCl=sd[sdi];}
                            else sdCl=sdT;
                        }
                        if(sdCl) sdLines.push(sdCl);
                    } else {
                        var sdWl='',sdWs=sd.split(' ');
                        for(var swi=0;swi<sdWs.length;swi++){
                            var sdTl=sdWl+(sdWl?' ':'')+sdWs[swi];
                            if(ctx.measureText(sdTl).width>sdW&&sdWl){sdLines.push(sdWl);sdWl=sdWs[swi];}
                            else sdWl=sdTl;
                        }
                        if(sdWl) sdLines.push(sdWl);
                    }
                    for(var sli=0;sli<Math.min(sdLines.length,4);sli++){ctx.fillText(sdLines[sli],tx+10,cy);cy+=12;}
                    // Skill name
                    if(coll.skillName){
                        ctx.fillStyle='#ffcc44';ctx.font='bold 8px monospace';
                        ctx.fillText('['+(coll.skillNameZh||coll.skillName)+']',tx+10,cy);cy+=12;
                    }
                }
            }
        }
    }
    // Bestiary book button (top-right, left of settings)
    var bookX=W-72,bookY=14,bookS=26;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(bookX,bookY,bookS,bookS);
    ctx.strokeStyle='#cc9944';ctx.lineWidth=1.5;ctx.strokeRect(bookX,bookY,bookS,bookS);
    ctx.fillStyle='#cc9944';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText('\uD83D\uDCDA',bookX+bookS/2,bookY+bookS/2+5);
    // Enemy count on floor
    if(enemies.length>0&&stairsZone){
        var remStr='剩余: '+enemies.length;
        ctx.fillStyle='rgba(0,0,0,0.5)';ctx.font='10px monospace';ctx.textAlign='center';
        var remW=ctx.measureText(remStr).width+12;
        ctx.fillRect(W/2-remW/2,56,remW,14);
        ctx.fillStyle='#ff9944';ctx.fillText(remStr,W/2,66);
    }
    // Player debuff icons (bottom center, above quickbar)
    var dbKeys=Object.keys(playerDebuffs).filter(function(k){return playerDebuffs[k]&&playerDebuffs[k].timer>0;});
    if(dbKeys.length>0){
        var dbIconSize=32,dbGap=6;
        var dbTotalW=dbKeys.length*(dbIconSize+dbGap)-dbGap;
        var dbX=(W-dbTotalW)/2, dbY=canvas.height-(isMobile?130:120);
        for(var di=0;di<dbKeys.length;di++){
            var dtype=dbKeys[di];
            var ddef=STATUS_DEFS[dtype];
            if(!ddef) continue;
            var dx=dbX+di*(dbIconSize+dbGap);
            var db=playerDebuffs[dtype];
            var dtRatio=(db&&ddef.duration>0)?Math.min(1,Math.max(0,db.timer/ddef.duration)):0;
            // Background
            ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(dx,dbY,dbIconSize,dbIconSize);
            ctx.strokeStyle=ddef.color;ctx.lineWidth=1.5;ctx.strokeRect(dx,dbY,dbIconSize,dbIconSize);
            // SVG icon or emoji fallback
            var sIcon=ICONS.status[dtype];
            if(sIcon&&sIcon.complete&&sIcon.naturalWidth>0){
                try{ctx.drawImage(sIcon,dx+1,dbY+1,dbIconSize-2,dbIconSize-2);}catch(e){}
            } else {
                ctx.fillStyle=ddef.color;ctx.font='18px monospace';ctx.textAlign='center';
                ctx.fillText(ddef.icon,dx+dbIconSize/2,dbY+dbIconSize/2+5);
            }
            // Timer bar at bottom
            ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(dx,dbY+dbIconSize-3,dbIconSize,3);
            var barW=dbIconSize*dtRatio;
            if(barW>0){ctx.fillStyle=ddef.color;ctx.fillRect(dx,dbY+dbIconSize-3,barW,3);}
            // Chinese name
            ctx.fillStyle=ddef.color;ctx.font='bold 8px monospace';ctx.textAlign='center';
            ctx.fillText(ddef.nameZh||ddef.name,dx+dbIconSize/2,dbY+dbIconSize+9);
            // Timer
            ctx.fillStyle='#aaa';ctx.font='8px monospace';
            ctx.fillText(Math.ceil((db&&db.timer||0)/60)+'s',dx+dbIconSize/2,dbY+dbIconSize+18);
        }
    }
    // Potion quickbelt (bottom-center, above joystick)
    if(carriedPotions.length>0){
        var qbSlotW=54,qbSlotH=54,qbGap=5;
        var qbTotalW=carriedPotions.length*(qbSlotW+qbGap)-qbGap;
        var qbX=Math.floor((W-qbTotalW)/2),qbY=canvas.height-(isMobile?68:72);
        for(var pi=0;pi<carriedPotions.length;pi++){
            var qslot=carriedPotions[pi],qp=qslot.potion;
            var sx=qbX+pi*(qbSlotW+qbGap);
            // Slot background
            ctx.fillStyle='rgba(10,10,20,0.88)';ctx.fillRect(sx,qbY,qbSlotW,qbSlotH);
            ctx.strokeStyle=qp.color||'#44dd88';ctx.lineWidth=1.5;ctx.strokeRect(sx,qbY,qbSlotW,qbSlotH);
            // Potion SVG icon (top 36px)
            var pIcon=ICONS.potions[qp.name];
            if(pIcon){
                ctx.drawImage(pIcon,sx+3,qbY+2,qbSlotW-6,36);
            } else {
                ctx.fillStyle=qp.color||'#ddd';ctx.font='bold 8px monospace';ctx.textAlign='center';
                ctx.fillText(recipeName(qp),sx+qbSlotW/2,qbY+20);
            }
            // Count badge
            ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(sx,qbY+38,qbSlotW,16);
            ctx.fillStyle='#ffdd44';ctx.font='bold 12px monospace';ctx.textAlign='center';
            ctx.fillText('×'+qslot.count,sx+qbSlotW/2,qbY+50);
        }
    }
    // Settings gear in expedition (top-right, left of minimap)
    if(ICONS.ui.settings){
        ctx.save();ctx.globalAlpha=0.85;
        ctx.drawImage(ICONS.ui.settings,W-40,13,28,28);
        ctx.restore();
    } else {
        drawSettingsGear(W-38,15,26);
    }
    // Exit expedition button (left side, below HP stats) with icon
    var exitBtnW=60,exitBtnH=26,exitBtnX=10,exitBtnY=95;
    if(ICONS.ui.exit){
        ctx.fillStyle='rgba(80,10,10,0.7)';ctx.fillRect(exitBtnX,exitBtnY,exitBtnW,exitBtnH);
        ctx.strokeStyle='#ff4444';ctx.lineWidth=1;ctx.strokeRect(exitBtnX,exitBtnY,exitBtnW,exitBtnH);
        ctx.drawImage(ICONS.ui.exit,exitBtnX+2,exitBtnY+1,22,22);
        ctx.fillStyle='#ff8888';ctx.font='bold 9px monospace';ctx.textAlign='left';
        ctx.fillText('退出',exitBtnX+26,exitBtnY+exitBtnH/2+3);
    } else {
        ctx.fillStyle='rgba(120,20,20,0.7)';ctx.fillRect(exitBtnX,exitBtnY,exitBtnW,exitBtnH);
        ctx.strokeStyle='#ff4444';ctx.lineWidth=1;ctx.strokeRect(exitBtnX,exitBtnY,exitBtnW,exitBtnH);
        ctx.fillStyle='#ff8888';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText('退出冒险',exitBtnX+exitBtnW/2,exitBtnY+exitBtnH/2+3);
    }
}

function useCarriedPotion(index){
    if(index<0||index>=carriedPotions.length) return;
    var slot=carriedPotions[index];
    var p=slot.potion;
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
    slot.count--;
    if(slot.count<=0) carriedPotions.splice(index,1);
    playSound('drink');
}

// ============ WEAPON POPUP ============
function drawWeaponModel(x,y,weapon,scale){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    var wc=weapon.color;
    var wn=weapon.name;
    
    // Use sprite if available
    if(SPR.weapons && SPR.weapons[wn]){
        var img = SPR.weapons[wn];
        var size = 32; // weapon sprite size
        ctx.drawImage(img, -size/2, -size/2, size, size);
        ctx.restore();
        return;
    }
    
    // Fallback to procedural drawing if sprite not loaded
    // Each weapon has unique appearance
    if(wn==='Rusty Dagger'){
        // Small rusty dagger
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-2,-16);ctx.lineTo(0,-20);ctx.lineTo(2,-16);ctx.lineTo(1.5,6);ctx.lineTo(-1.5,6);ctx.closePath();ctx.fill();
        ctx.fillStyle='#aa6633';ctx.fillRect(-4,6,8,2);ctx.fillRect(-1.5,8,3,8);
        // Rust spots
        for(var i=0;i<5;i++){ctx.fillStyle='#664422';ctx.fillRect(Math.random()*3-1.5,-14+i*3,1,1);}
    } else if(wn==='Wooden Club'){
        // Crude wooden club
        ctx.fillStyle='#6a4a2a';ctx.fillRect(-3,-20,6,26);ctx.fillRect(-2,6,4,12);
        ctx.fillStyle='#8b6a3a';ctx.fillRect(-4,-22,8,4);
        // Wood grain
        for(var i=0;i<8;i++){ctx.fillStyle='rgba(100,70,40,0.3)';ctx.fillRect(-2,-18+i*4,4,1);}
    } else if(wn==='Old Sword'){
        // Basic old iron sword
        ctx.fillStyle=wc;ctx.fillRect(-2.5,-24,5,30);
        ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(-0.5,-22,1,26);
        ctx.fillStyle='#777';ctx.fillRect(-7,6,14,3);
        ctx.fillStyle='#4a3a2a';ctx.fillRect(-2,9,4,10);
    } else if(wn==='Worn Axe'){
        // Old worn battle axe
        ctx.fillStyle='#7a5a3a';ctx.fillRect(-2,-20,4,28);
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-2,-16);ctx.lineTo(-9,-10);ctx.lineTo(-7,-5);ctx.lineTo(-2,-7);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(2,-16);ctx.lineTo(9,-10);ctx.lineTo(7,-5);ctx.lineTo(2,-7);ctx.closePath();ctx.fill();
        // Chips/damage
        ctx.fillStyle='#554433';ctx.fillRect(-8,-9,2,1);ctx.fillRect(6,-9,2,1);
    } else if(wn==='Iron Sword'){
        // Clean iron longsword
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-3,-26);ctx.lineTo(0,-30);ctx.lineTo(3,-26);ctx.lineTo(2,8);ctx.lineTo(-2,8);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillRect(-1,-28,2,32);
        ctx.fillStyle='#999';ctx.fillRect(-8,8,16,3);
        ctx.fillStyle='#3a2a1a';ctx.fillRect(-2,11,4,12);
        ctx.fillStyle='#666';ctx.beginPath();ctx.arc(0,24,3,0,Math.PI*2);ctx.fill();
    } else if(wn==='Steel Blade'){
        // Refined steel blade
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-3.5,-28);ctx.lineTo(0,-32);ctx.lineTo(3.5,-28);ctx.lineTo(2.5,10);ctx.lineTo(-2.5,10);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillRect(-1,-30,2,36);
        // Fuller groove
        ctx.fillStyle='rgba(100,100,120,0.3)';ctx.fillRect(-0.5,-26,1,28);
        ctx.fillStyle='#bbb';ctx.fillRect(-9,10,18,3);
        ctx.fillStyle='#4a3a2a';ctx.fillRect(-2,13,4,10);
        ctx.fillStyle='#888';ctx.beginPath();ctx.arc(0,24,3,0,Math.PI*2);ctx.fill();
    } else if(wn==='Bronze Spear'){
        // Bronze tipped spear
        ctx.strokeStyle='#8a6a4a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(0,20);ctx.stroke();
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-3,-20);ctx.lineTo(0,-28);ctx.lineTo(3,-20);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,200,150,0.4)';ctx.beginPath();ctx.moveTo(-1,-21);ctx.lineTo(0,-26);ctx.lineTo(1,-21);ctx.closePath();ctx.fill();
        // Bronze bands
        ctx.fillStyle='#b87333';ctx.fillRect(-2,-16,4,2);ctx.fillRect(-2,0,4,2);
    } else if(wn==='War Axe'){
        // Heavy war axe
        ctx.fillStyle='#6a4a2a';ctx.fillRect(-2.5,-22,5,32);
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-2,-18);ctx.lineTo(-11,-11);ctx.lineTo(-9,-5);ctx.lineTo(-2,-8);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(2,-18);ctx.lineTo(11,-11);ctx.lineTo(9,-5);ctx.lineTo(2,-8);ctx.closePath();ctx.fill();
        // Edge shine
        ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(-11,-11);ctx.lineTo(-9,-5);ctx.stroke();
        ctx.beginPath();ctx.moveTo(11,-11);ctx.lineTo(9,-5);ctx.stroke();
        // Spike
        ctx.fillStyle='#999';ctx.fillRect(-1.5,-26,3,8);
    } else if(wn==='Crystal Staff'){
        // Magical crystal staff
        ctx.strokeStyle='#9a7a5a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(0,18);ctx.stroke();
        // Crystal orb
        var grad=ctx.createRadialGradient(0,-24,0,0,-24,9);
        grad.addColorStop(0,'rgba(255,255,255,0.9)');grad.addColorStop(0.6,wc);grad.addColorStop(1,'rgba(100,180,255,0.3)');
        ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,-24,9,0,Math.PI*2);ctx.fill();
        // Crystal facets
        ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1;
        for(var i=0;i<6;i++){var a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(Math.cos(a)*7,-24+Math.sin(a)*7);ctx.stroke();}
        // Magic glow
        ctx.save();ctx.globalAlpha=0.4;
        var glow=ctx.createRadialGradient(0,-24,2,0,-24,14);
        glow.addColorStop(0,wc);glow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=glow;ctx.fillRect(-14,-38,28,28);ctx.restore();
    } else if(wn==='Shadow Knife'){
        // Dark shadow dagger
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-2,-18);ctx.lineTo(0,-22);ctx.lineTo(2,-18);ctx.lineTo(1.5,6);ctx.lineTo(-1.5,6);ctx.closePath();ctx.fill();
        // Shadow effect
        ctx.save();ctx.globalAlpha=0.3;
        for(var i=0;i<3;i++){ctx.fillStyle='#000';ctx.fillRect(-2-i,-18+i,4,20);}
        ctx.restore();
        ctx.fillStyle='#4433aa';ctx.fillRect(-5,6,10,2);
        ctx.fillStyle='#2a1a3a';ctx.fillRect(-1.5,8,3,9);
        // Purple gem
        ctx.fillStyle='#8844cc';ctx.beginPath();ctx.arc(0,14,2,0,Math.PI*2);ctx.fill();
    } else if(wn==='Flame Sword'){
        // Burning flame sword
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-3.5,-28);ctx.lineTo(0,-32);ctx.lineTo(3.5,-28);ctx.lineTo(2.5,10);ctx.lineTo(-2.5,10);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,100,0.6)';ctx.fillRect(-1,-30,2,36);
        // Flame pattern
        for(var i=0;i<6;i++){
            ctx.fillStyle=i%2===0?'#ff8822':'#ffdd44';
            ctx.beginPath();ctx.arc(2-i*0.5,-26+i*5,2,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle='#ffd700';ctx.fillRect(-9,10,18,3);
        ctx.fillStyle='#6a3a1a';ctx.fillRect(-2,13,4,10);
        ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(0,24,3,0,Math.PI*2);ctx.fill();
    } else if(wn==='Frost Mace'){
        // Ice mace
        ctx.fillStyle='#5a8aaa';ctx.fillRect(-2,-22,4,28);
        // Ice crystal head
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(-5,-18);ctx.lineTo(-3,-16);ctx.lineTo(0,-20);ctx.lineTo(3,-16);ctx.lineTo(5,-18);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.6)';
        ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(-3,-18);ctx.lineTo(0,-19);ctx.lineTo(3,-18);ctx.closePath();ctx.fill();
        // Ice spikes
        for(var i=0;i<4;i++){
            var ang=i*Math.PI/2;ctx.fillStyle='#aaddff';
            ctx.save();ctx.rotate(ang);ctx.fillRect(-1,-20,2,6);ctx.restore();
        }
    } else if(wn==='Venom Fang'){
        // Poisonous fang dagger
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-2,-19);ctx.lineTo(0,-23);ctx.lineTo(2,-19);
        ctx.bezierCurveTo(2,-10,1.5,0,1.5,6);ctx.bezierCurveTo(1.5,6,-1.5,6,-1.5,6);
        ctx.bezierCurveTo(-1.5,0,-2,-10,-2,-19);ctx.fill();
        // Venom drips
        for(var i=0;i<5;i++){
            ctx.fillStyle='#66ff44';ctx.beginPath();ctx.arc(-1+i*0.5,-18+i*4,0.8,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle='#8833cc';ctx.fillRect(-5,6,10,2);
        ctx.fillStyle='#3a2a4a';ctx.fillRect(-1.5,8,3,8);
    } else if(wn==='Thunder Spear'){
        // Lightning spear
        ctx.strokeStyle='#aa8844';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(0,20);ctx.stroke();
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-3.5,-22);ctx.lineTo(0,-30);ctx.lineTo(3.5,-22);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,200,0.5)';ctx.beginPath();ctx.moveTo(-1.5,-23);ctx.lineTo(0,-28);ctx.lineTo(1.5,-23);ctx.closePath();ctx.fill();
        // Lightning bolts
        ctx.strokeStyle='#ffff88';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(-2,-18);ctx.lineTo(-4,-12);ctx.lineTo(-2,-6);ctx.stroke();
        ctx.beginPath();ctx.moveTo(2,-16);ctx.lineTo(4,-10);ctx.lineTo(2,-4);ctx.stroke();
        // Golden wings
        ctx.fillStyle='#ffd700';
        ctx.beginPath();ctx.moveTo(-3.5,-22);ctx.lineTo(-6,-17);ctx.lineTo(-3,-19);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(3.5,-22);ctx.lineTo(6,-17);ctx.lineTo(3,-19);ctx.closePath();ctx.fill();
    } else if(wn==='Dragon Claw'){
        // Dragon claw gauntlet
        ctx.fillStyle='#5a3a2a';ctx.fillRect(-7,0,14,9);
        // Dragon scales
        for(var i=0;i<3;i++){for(var j=0;j<2;j++){
            ctx.fillStyle='#cc4422';ctx.beginPath();ctx.arc(-4+i*4,2+j*4,2,0,Math.PI*2);ctx.fill();
        }}
        // Three dragon claws (curved)
        for(var ci=0;ci<3;ci++){
            var cx=(ci-1)*5;
            ctx.fillStyle=wc;
            ctx.beginPath();
            ctx.moveTo(cx-1.5,0);
            ctx.bezierCurveTo(cx-1,-8,cx-0.5,-16,cx,-20);
            ctx.lineTo(cx+1.5,0);
            ctx.bezierCurveTo(cx+0.5,-10,cx+0.8,-15,cx,-20);
            ctx.closePath();ctx.fill();
            // Fire glow
            ctx.fillStyle='#ff6600';ctx.beginPath();ctx.arc(cx,-18,1.5,0,Math.PI*2);ctx.fill();
        }
    } else if(wn==='Arcane Blade'){
        // Magical arcane sword
        ctx.fillStyle=wc;
        ctx.beginPath();ctx.moveTo(-4,-30);ctx.lineTo(0,-34);ctx.lineTo(4,-30);ctx.lineTo(3,10);ctx.lineTo(-3,10);ctx.closePath();ctx.fill();
        // Arcane runes
        ctx.fillStyle='#ffaaff';ctx.font='bold 8px monospace';ctx.textAlign='center';
        ctx.fillText('⚡',-1,-22);ctx.fillText('✦',1,-12);ctx.fillText('◈',0,-2);
        ctx.fillStyle='rgba(255,200,255,0.5)';ctx.fillRect(-1.5,-32,3,38);
        // Ornate guard
        ctx.fillStyle='#ddaaff';
        ctx.beginPath();ctx.moveTo(-10,10);ctx.lineTo(-8,8);ctx.lineTo(-4,9);ctx.lineTo(0,10);ctx.lineTo(4,9);ctx.lineTo(8,8);ctx.lineTo(10,10);
        ctx.lineTo(8,12);ctx.lineTo(0,11);ctx.lineTo(-8,12);ctx.closePath();ctx.fill();
        ctx.fillStyle='#7a5aaa';ctx.fillRect(-2.5,12,5,10);
        // Magic crystal pommel
        ctx.fillStyle='#ff88ff';ctx.beginPath();ctx.arc(0,24,4,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.arc(-1,22,2,0,Math.PI*2);ctx.fill();
    } else {
        // Fallback: simple weapon
        ctx.fillStyle=wc;ctx.fillRect(-2,-24,4,28);
        ctx.fillStyle='#666';ctx.fillRect(-6,4,12,2);
        ctx.fillStyle='#444';ctx.fillRect(-1.5,6,3,10);
    }
    ctx.restore();
}

function drawBestiary(){
    var W=canvas.width,H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
    var pw=Math.min(W-30,420),ph=Math.min(H-30,520),px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='rgba(12,10,20,0.97)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#cc9944';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);

    // Title
    ctx.fillStyle='#cc9944';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText('📚 图鉴',W/2,py+26);

    // Close button
    var cbX=px+pw-32,cbY=py+6,cbS=24;
    ctx.fillStyle='rgba(255,60,60,0.15)';ctx.fillRect(cbX,cbY,cbS,cbS);
    ctx.strokeStyle='#ff4444';ctx.lineWidth=1;ctx.strokeRect(cbX,cbY,cbS,cbS);
    ctx.fillStyle='#ff6666';ctx.font='bold 14px monospace';ctx.textAlign='center';
    ctx.fillText('X',cbX+cbS/2,cbY+cbS/2+4);

    var seenKeys=Object.keys(seenEnemies);
    if(seenKeys.length===0){
        ctx.fillStyle='#666';ctx.font='12px monospace';ctx.textAlign='center';
        ctx.fillText('尚未遇到任何敌人',W/2,py+ph/2);
    } else {
        // Paged list
        var perPage=5;
        var totalPages=Math.ceil(seenKeys.length/perPage);
        bestiaryPage=Math.max(0,Math.min(bestiaryPage,totalPages-1));
        var startIdx=bestiaryPage*perPage;
        var pageKeys=seenKeys.slice(startIdx,startIdx+perPage);
        var iy=py+46;
        for(var ki=0;ki<pageKeys.length;ki++){
            var key=pageKeys[ki];
            var data=seenEnemies[key];
            var et=ENEMY_TYPES[key];
            if(!et) continue;
            var ex=px+12,ew=pw-24,eh=78;
            // Background
            var isBoss=et.isBossType,isElite=et.isEliteType;
            var frameColor=isBoss?'#ff4444':(isElite?'#cc44ff':'#446688');
            ctx.fillStyle='rgba(20,20,40,0.8)';ctx.fillRect(ex,iy,ew,eh);
            ctx.strokeStyle=frameColor;ctx.lineWidth=1;ctx.strokeRect(ex,iy,ew,eh);
            // Enemy sprite (circle placeholder)
            var sprX=ex+34,sprY=iy+eh/2;
            if(SPR.customEnemies&&data.sprite){
                ctx.save();ctx.translate(sprX,sprY);
                ctx.drawImage(data.sprite,-16,-16,32,32);
                ctx.restore();
            } else {
                ctx.fillStyle=et.color||'#888';
                ctx.beginPath();ctx.arc(sprX,sprY,14,0,Math.PI*2);ctx.fill();
            }
            // Type badge
            if(isBoss){ ctx.fillStyle='#ff4444';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('BOSS',sprX,iy+eh-4); }
            else if(isElite){ ctx.fillStyle='#cc44ff';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('ELITE',sprX,iy+eh-4); }
            // Name
            var nameStr=et.nameZh||et.name;
            ctx.fillStyle=frameColor;ctx.font='bold 12px monospace';ctx.textAlign='left';
            ctx.fillText(nameStr,ex+70,iy+16);
            // Seen count
            ctx.fillStyle='#888';ctx.font='9px monospace';
            ctx.fillText('遇到 '+data.count+'x',ex+70,iy+29);
            // Description
            var desc=et.descZh||et.desc;
            ctx.fillStyle='#aaa';ctx.font='10px monospace';
            // Word wrap
            var words=desc.split(' '),line='',descY=iy+43;
            for(var wi=0;wi<words.length;wi++){
                var test=line+(line?' ':'')+words[wi];
                if(ctx.measureText(test).width>ew-80&&line){
                    ctx.fillText(line,ex+70,descY);descY+=13;line=words[wi];
                    if(descY>iy+eh-4) break;
                } else line=test;
            }
            if(line&&descY<=iy+eh-4) ctx.fillText(line,ex+70,descY);
            // Skills
            if(et.skills&&et.skills.length>0){
                ctx.fillStyle='#ffcc44';ctx.font='9px monospace';
                ctx.fillText('['+et.skills.join(', ')+']',ex+70,iy+eh-6);
            }
            iy+=eh+6;
        }
        // Page nav
        if(totalPages>1){
            ctx.fillStyle='#888';ctx.font='10px monospace';ctx.textAlign='center';
            ctx.fillText((bestiaryPage+1)+'/'+totalPages,W/2,py+ph-14);
            // Prev/Next buttons
            if(bestiaryPage>0){ctx.fillStyle='#44aaff';ctx.fillText('◀ 上页',px+70,py+ph-14);}
            if(bestiaryPage<totalPages-1){ctx.fillStyle='#44aaff';ctx.fillText('下页 ▶',px+pw-70,py+ph-14);}
        }
    }
    // Seen count summary
    ctx.fillStyle='#666';ctx.font='9px monospace';ctx.textAlign='left';
    ctx.fillText('已发现: '+seenKeys.length+'/'+Object.keys(ENEMY_TYPES).length,px+10,py+ph-14);
}

function drawRelicChoicePopup(){
    var W=canvas.width,H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.78)';ctx.fillRect(0,0,W,H);
    var pop=relicChoicePopup;
    var isBoss=pop.source==='boss_chest';
    var titleColor=isBoss?'#ff4444':(pop.source==='elite'?'#cc44ff':'#ffd700');
    var titleStr=isBoss?'Boss宝箱！':(pop.source==='elite'?'精英掉落！':'宝箱开启！');
    // Title
    ctx.fillStyle=titleColor;ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText(titleStr,W/2,H/2-130);
    ctx.fillStyle='#aaa';ctx.font='11px monospace';
    ctx.fillText('选择一件遗物 (1/3)',W/2,H/2-110);

    var choices=pop.choices;
    var cardW=Math.min(140,(W-60)/3),cardH=200;
    var gap=12;
    var totalW=cardW*3+gap*2;
    var startX=(W-totalW)/2;
    var cardY=H/2-95;

    for(var ci=0;ci<choices.length;ci++){
        var c=choices[ci];
        var cx2=startX+ci*(cardW+gap);
        var isHover=false;
        // Card background
        ctx.fillStyle='rgba(20,14,40,0.97)';ctx.fillRect(cx2,cardY,cardW,cardH);
        ctx.strokeStyle=c.color;ctx.lineWidth=2;ctx.strokeRect(cx2,cardY,cardW,cardH);
        // Sprite icon
        var spr=SPR.relicSprites&&SPR.relicSprites[c.id];
        var iconSize=52;
        var iconX=cx2+cardW/2-iconSize/2,iconY=cardY+10;
        ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(iconX,iconY,iconSize,iconSize);
        if(spr){
            ctx.save();ctx.imageSmoothingEnabled=false;
            var sc=Math.min(iconSize/spr.width,iconSize/spr.height);
            var dw=Math.round(spr.width*sc),dh=Math.round(spr.height*sc);
            ctx.drawImage(spr,cx2+cardW/2-dw/2,iconY+(iconSize-dh)/2,dw,dh);
            ctx.restore();
        } else {
            ctx.fillStyle=c.color;ctx.beginPath();ctx.arc(cx2+cardW/2,iconY+iconSize/2,iconSize/3,0,Math.PI*2);ctx.fill();
        }
        ctx.strokeStyle=c.color;ctx.lineWidth=1;ctx.globalAlpha=0.5;ctx.strokeRect(iconX,iconY,iconSize,iconSize);ctx.globalAlpha=1;
        // Name
        var nameStr=c.nameZh;
        ctx.fillStyle=c.color;ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(nameStr,cx2+cardW/2,iconY+iconSize+16);
        // Skill name
        ctx.fillStyle='#ffcc44';ctx.font='9px monospace';
        ctx.fillText(c.skillNameZh||c.skillName,cx2+cardW/2,iconY+iconSize+30);
        // Effect desc (word wrap)
        var desc=c.skillDescZh||c.skillDesc;
        ctx.fillStyle='#ccbbee';ctx.font='8px monospace';ctx.textAlign='left';
        var maxW2=cardW-12,lh2=12,lx2=cx2+6,ly2=iconY+iconSize+45;
        var ws3=desc.split('');
        if(true){
            var cl3='';
            for(var chi=0;chi<desc.length;chi++){
                var t3=cl3+desc[chi];
                if(ctx.measureText(t3).width>maxW2&&cl3){ctx.fillText(cl3,lx2,ly2);ly2+=lh2;cl3=desc[chi];if(ly2>cardY+cardH-30)break;}
                else cl3=t3;
            }
            if(cl3&&ly2<=cardY+cardH-30) ctx.fillText(cl3,lx2,ly2);
        } else {
            var wl3='';
            for(var wi3=0;wi3<ws3.length;wi3++){
                var tl3=wl3+(wl3?' ':'')+ws3[wi3];
                if(ctx.measureText(tl3).width>maxW2&&wl3){ctx.fillText(wl3,lx2,ly2);ly2+=lh2;wl3=ws3[wi3];if(ly2>cardY+cardH-30)break;}
                else wl3=tl3;
            }
            if(wl3&&ly2<=cardY+cardH-30) ctx.fillText(wl3,lx2,ly2);
        }
        // Pick button
        var btnY=cardY+cardH-28,btnW2=cardW-16;
        ctx.fillStyle=c.color;ctx.globalAlpha=0.85;
        ctx.fillRect(cx2+8,btnY,btnW2,22);ctx.globalAlpha=1;
        ctx.fillStyle='#000';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText('选择',cx2+cardW/2,btnY+15);
    }
}

function drawWeaponPopup(){
    var W=canvas.width,H=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var pw=300,ph=260,px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='rgba(14,14,26,0.95)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);

    var w=weaponPopup.weapon;
    var rarityColor=RARITY_COLORS[w.rarity||0];
    var rarityName=RARITY_NAMES_ZH[w.rarity||0];
    ctx.strokeStyle=rarityColor;ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
    ctx.fillStyle='#ffd700';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText(T('weaponFound'),W/2,py+28);

    // Draw weapon image (sprite) or fallback model
    var sprImg=SPR.weapons&&SPR.weapons[w.name];
    if(sprImg){
        ctx.save();ctx.translate(W/2,py+72);
        ctx.drawImage(sprImg,-22,-22,44,44);
        ctx.restore();
    } else {
        drawWeaponModel(W/2,py+70,w,1.8);
    }

    // New weapon with rarity color and label
    var rarityLabel='['+rarityName+']';
    ctx.fillStyle=rarityColor;ctx.font='bold 11px monospace';
    ctx.fillText(rarityLabel,W/2,py+108);
    ctx.fillStyle=rarityColor;ctx.font='bold 14px monospace';
    ctx.fillText(weaponName(w),W/2,py+124);
    ctx.fillStyle='#aaa';ctx.font='11px monospace';
    ctx.fillText(T('dmg')+':'+w.dmg+' '+T('spd')+':'+w.speed.toFixed(1)+' '+T('rng')+':'+w.range,W/2,py+140);

    // Current weapon
    if(equippedWeapon){
        ctx.fillStyle='#888';ctx.font='11px monospace';
        ctx.fillText('— '+T('weapon')+' —',W/2,py+157);
        ctx.fillStyle=equippedWeapon.color;ctx.font='12px monospace';
        ctx.fillText(weaponName(equippedWeapon),W/2,py+173);
        ctx.fillStyle='#777';ctx.font='10px monospace';
        ctx.fillText(T('dmg')+':'+equippedWeapon.dmg+' '+T('spd')+':'+equippedWeapon.speed.toFixed(1)+' '+T('rng')+':'+equippedWeapon.range,W/2,py+189);
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
    var pw=Math.min(W-40,420),ph=Math.min(H-40,650),px=(W-pw)/2,py=(H-ph)/2;
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
            ctx.fillText('打开锁住的房间',px+20,y2+36);
        }

        // Price + buy button
        var btnW2=70,btnH2=28,btnX=px+pw-btnW2-20,btnY=y2+10;
        var canAfford=gold>=item.price;
        ctx.fillStyle=canAfford?'#44dd88':'#444';ctx.fillRect(btnX,btnY,btnW2,btnH2);
        ctx.fillStyle=canAfford?'#000':'#888';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(item.price+'G '+T('buy'),btnX+btnW2/2,btnY+btnH2/2+4);
    }

    // Sell section — only in lab, not in expedition
    if(state!=='expedition'){
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
                    var sellPrice=5;
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
            var sellPrice=8+pot.tier*5;
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
    ctx.fillText('增益详情',W/2,py+25);
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
    ctx.fillText('第 '+b.tier+' 阶',W/2,py+80);
    // Effect description
    ctx.fillStyle='#ddd';ctx.font='11px monospace';
    var desc='';
    if(b.effect==='attack') desc='攻击 +'+b.value;
    else if(b.effect==='defense') desc='防御 +'+b.value;
    else if(b.effect==='maxhp') desc='最大生命 +'+b.value;
    else if(b.effect==='speed') desc='速度 +'+b.value;
    else if(b.effect==='regen') desc='生命回复 +'+b.value+'/s';
    else if(b.effect==='poison') desc='毒素伤害 +'+b.value;
    else if(b.effect==='stealth') desc='隐身';
    else if(b.effect==='revive') desc='自动复活一次';
    ctx.fillText(desc,W/2,py+100);
    // Remove button
    var rmBtnW=120,rmBtnH=32,rmBtnX=(W-rmBtnW)/2,rmBtnY=py+ph-50;
    ctx.fillStyle='#dd4444';ctx.fillRect(rmBtnX,rmBtnY,rmBtnW,rmBtnH);
    ctx.fillStyle='#fff';ctx.font='bold 11px monospace';
    ctx.fillText('移除增益',rmBtnX+rmBtnW/2,rmBtnY+rmBtnH/2+4);
}

function handleRelicChoiceClick(cx,cy){
    var W=canvas.width,H=canvas.height;
    var pop=relicChoicePopup;
    var choices=pop.choices;
    var cardW=Math.min(140,(W-60)/3),cardH=200;
    var gap=12;
    var totalW=cardW*3+gap*2;
    var startX=(W-totalW)/2;
    var cardY=H/2-95;
    for(var ci=0;ci<choices.length;ci++){
        var cx2=startX+ci*(cardW+gap);
        var btnY=cardY+cardH-28;
        // Click anywhere on card or on button picks this relic
        if(cx>=cx2&&cx<=cx2+cardW&&cy>=cardY&&cy<=cardY+cardH){
            applyRelicEffect(choices[ci]);
            relicChoicePopup=null;
            playSound('craft');
            return;
        }
    }
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
                spawnFloat(player.x,player.y-20,'移除增益','#ffaa44');
            }
            buffPopup=null;playSound('click');return;
        }
        // Click outside
        if(cx<px||cx>px+pw||cy<py||cy>py+ph){buffPopup=null;playSound('click');return;}
        return;
    }
    if(weaponPopup){
        var pw=300,ph=260,px=(W-pw)/2,py=(H-ph)/2;
        var btnW=110,btnH=34,gap=20;
        var b1x=W/2-btnW-gap/2,b2x=W/2+gap/2,bty=py+ph-50;
        if(cx>=b1x&&cx<=b1x+btnW&&cy>=bty&&cy<=bty+btnH){
            // Replace weapon — expedition mode, old weapon discarded
            equippedWeapon=weaponPopup.weapon;
            weaponPopup=null; playSound('craft'); return;
        }
        if(cx>=b2x&&cx<=b2x+btnW&&cy>=bty&&cy<=bty+btnH){
            // Keep current — discard new weapon (expedition only)
            weaponPopup=null; playSound('click'); return;
        }
        return;
    }
    if(merchantPopup){
        // Use EXACT same coordinates as drawMerchantPopup
        var pw2=Math.min(W-40,420),ph2=Math.min(H-40,650),px2=(W-pw2)/2,py2=(H-ph2)/2;
        // Close button (not affected by scroll)
        var cbS=28,cbX=px2+pw2-cbS-6,cbY=py2+6;
        if(cx>=cbX&&cx<=cbX+cbS&&cy>=cbY&&cy<=cbY+cbS){merchantPopup=null;merchantScrollY=0;playSound('click');return;}
        // Click outside
        if(cx<px2||cx>px2+pw2||cy<py2||cy>py2+ph2){merchantPopup=null;merchantScrollY=0;playSound('click');return;}

        // Buy items (add scrollY because render uses ctx.translate)
        var iy=py2+65,itemH=50;
        for(var i=0;i<shopStock.length;i++){
            var item=shopStock[i];
            var y2=iy+merchantScrollY+i*(itemH+4);
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
                else if(item.type==='weapon'){
                    inventory.weapons.push(item.weapon);
                    equippedWeapon=item.weapon;
                    forgedWeapon=item.weapon;
                    saveGame();
                }
                else if(item.type==='key') playerKeys+=(item.count||1);
                shopStock.splice(i,1);
                spawnFloat(player.x,player.y-20,T('boughtItem'),'#44dd88');
                playSound('craft'); return;
            }
        }

        // Sell herbs
        var sellY=iy+shopStock.length*(itemH+4)+28+merchantScrollY;
        var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
        for(var i=0;i<Math.min(herbKeys.length,3);i++){
            var k=herbKeys[i];
            var sy2=sellY+i*32;
            var sbX=px2+pw2-80,sbW=60,sbH=22;
            if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                inventory.herbs[k]--;
                if(inventory.herbs[k]<=0) delete inventory.herbs[k];
                gold+=5;
                spawnFloat(player.x,player.y-20,T('soldItem')+' +5G','#ffd700');
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
                var sellPrice=8+pot.tier*5;
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
    // Attack button removed - weapons auto-rotate now
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
    var benchX=W*0.06,benchY=H*0.62;
    var shelfW=Math.min(110,W*0.13),shelfH=Math.min(110,H*0.18);
    var shelfX=W*0.82-shelfW/2,shelfY=H*0.55;
    // Weapon rack (left of alembic)
    var rackW=Math.min(80,W*0.1),rackH=Math.min(90,H*0.14);
    var rackX=W*0.32,rackY=H*0.48;
    // Merchant corner (right side, near shelf)
    var merchW=Math.min(70,W*0.08),merchH=Math.min(80,H*0.12);
    var merchX=W*0.68,merchY=H*0.62;
    // Alchemy Forge (weapon forging) — bottom-left corner
    var forgeW=Math.min(70,W*0.09),forgeH=Math.min(60,H*0.09);
    var forgeX=W*0.04,forgeY=H*0.74;
    return {
        vp:{x:vpx,y:vpy}, backWall:{x:vpx-bwW/2,y:vpy-bwH/2,w:bwW,h:bwH},
        door:{x:exitX,y:exitY,w:exitW,h:exitH},
        cauldron:{x:cX-cR*1.2,y:cY-cR,w:cR*2.4,h:cR*2,cx:cX,cy:cY,r:cR},
        bench:{x:benchX,y:benchY,w:benchW,h:benchH},
        shelf:{x:shelfX,y:shelfY,w:shelfW,h:shelfH},
        rack:{x:rackX,y:rackY,w:rackW,h:rackH},
        merch:{x:merchX,y:merchY,w:merchW,h:merchH},
        research:{x:W*0.22,y:H*0.74,w:Math.min(90,W*0.1),h:Math.min(60,H*0.09)},
        relicCase:{x:W*0.76,y:H*0.72,w:Math.min(80,W*0.09),h:Math.min(60,H*0.09)},
        skillBook:{x:W*0.46,y:H*0.78,w:Math.min(80,W*0.09),h:Math.min(55,H*0.08)},
        forge:{x:forgeX,y:forgeY,w:forgeW,h:forgeH}
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

    // Alchemy Forge (weapon crafting anvil)
    var fg=lay.forge,forgeHov=labHover==='forge';
    ctx.fillStyle=forgeHov?'#2a1a10':'#1a1008';
    ctx.fillRect(fg.x,fg.y,fg.w,fg.h);
    ctx.strokeStyle=forgeHov?'#ff8844':'#884422';ctx.lineWidth=2;ctx.strokeRect(fg.x,fg.y,fg.w,fg.h);
    // Anvil shape
    var ax=fg.x+fg.w/2,ay=fg.y+fg.h*0.55;
    ctx.fillStyle=forgeHov?'#666':'#444';
    ctx.fillRect(ax-fg.w*0.35,ay-fg.h*0.2,fg.w*0.7,fg.h*0.25); // top
    ctx.fillRect(ax-fg.w*0.22,ay+fg.h*0.05,fg.w*0.44,fg.h*0.22); // body
    ctx.fillRect(ax-fg.w*0.14,ay+fg.h*0.27,fg.w*0.28,fg.h*0.15); // base
    // Hammer
    ctx.fillStyle=forgeHov?'#cc8833':'#996622';
    ctx.save();ctx.translate(ax+fg.w*0.2,ay-fg.h*0.15);ctx.rotate(-0.6);
    ctx.fillRect(-3,-10,6,16);ctx.fillRect(-6,-12,12,8);ctx.restore();
    // Fire glow
    if(forgeHov){ctx.save();ctx.globalAlpha=0.1;var fgG=ctx.createRadialGradient(ax,ay,3,ax,ay,fg.w*0.8);fgG.addColorStop(0,'#ff6600');fgG.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=fgG;ctx.fillRect(fg.x-10,fg.y-10,fg.w+20,fg.h+20);ctx.restore();}
    // Forged weapon indicator
    if(forgedWeapon){ctx.fillStyle='#ffcc44';ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillText('★',ax,fg.y+fg.h*0.15);}
    ctx.fillStyle=forgeHov?'#ff8844':'#cc6622';ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText('锻造',fg.x+fg.w/2,fg.y+fg.h+16);

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

function updateLabPlayer(){
    var W=canvas.width,H=canvas.height;
    var lay=labFurniture;
    var spd=3.5;
    if(!labPlayer.initialized){
        labPlayer.x=W/2; labPlayer.y=H*0.72;
        labPlayer.initialized=true;
    }
    // Input: keyboard
    var dx=0,dy=0;
    if(keys['ArrowLeft']||keys['KeyA']) dx-=1;
    if(keys['ArrowRight']||keys['KeyD']) dx+=1;
    if(keys['ArrowUp']||keys['KeyW']) dy-=1;
    if(keys['ArrowDown']||keys['KeyS']) dy+=1;
    // Mobile joystick
    if(labHallStick.active){
        var sdx=labHallStick.cx-labHallStick.sx,sdy=labHallStick.cy-labHallStick.sy;
        var slen=Math.sqrt(sdx*sdx+sdy*sdy);
        if(slen>8){ dx+=sdx/Math.max(slen,40); dy+=sdy/Math.max(slen,40); }
    }
    var len=Math.sqrt(dx*dx+dy*dy);
    if(len>0){ dx/=len; dy/=len; }
    labPlayer.vx=dx*spd; labPlayer.vy=dy*spd;
    var nx=labPlayer.x+labPlayer.vx, ny=labPlayer.y+labPlayer.vy;
    var pr=14;
    // Clamp to screen
    nx=Math.max(pr,Math.min(W-pr,nx));
    ny=Math.max(pr,Math.min(H-pr,ny));
    // Trapezoid floor boundary: floor goes from (bw.x,bw.y+bw.h)-(bw.x+bw.w,bw.y+bw.h) at top to (0,H)-(W,H) at bottom
    var bw=lay.backWall;
    if(bw){
        var floorTopY=bw.y+bw.h;
        var floorBotY=H;
        var span=floorBotY-floorTopY;
        var t2=Math.max(0,Math.min(1,(ny-floorTopY)/span));
        var leftX=bw.x*(1-t2)+0*t2+pr;
        var rightX=(bw.x+bw.w)*(1-t2)+W*t2-pr;
        // Keep player inside trapezoid
        if(ny<floorTopY+pr) ny=floorTopY+pr;
        if(ny>H-pr) ny=H-pr;
        nx=Math.max(leftX,Math.min(rightX,nx));
    }
    // Furniture collision (push player out of furniture rects)
    var furnitureKeys2=['bench','cauldron','shelf','rack','merch','research','relicCase','skillBook','forge','door'];
    for(var i2=0;i2<furnitureKeys2.length;i2++){
        var fk2=furnitureKeys2[i2],fb2=lay[fk2];
        if(!fb2) continue;
        var fw=fb2.w||(fb2.r?fb2.r*2:0),fh=fb2.h||(fb2.r?fb2.r*2:0);
        if(fw===0||fh===0) continue;
        var fx2=fb2.x,fy2=fb2.y;
        // AABB overlap check with player radius
        if(nx+pr>fx2&&nx-pr<fx2+fw&&ny+pr>fy2&&ny-pr<fy2+fh){
            // Find smallest overlap axis and push out
            var overlapL=nx+pr-fx2,overlapR=fx2+fw-(nx-pr);
            var overlapT=ny+pr-fy2,overlapB=fy2+fh-(ny-pr);
            var minOv=Math.min(overlapL,overlapR,overlapT,overlapB);
            if(minOv===overlapL) nx=fx2-pr;
            else if(minOv===overlapR) nx=fx2+fw+pr;
            else if(minOv===overlapT) ny=fy2-pr;
            else ny=fy2+fh+pr;
        }
    }
    labPlayer.x=nx; labPlayer.y=ny;
    if(dx>0.1) labPlayer.facing=1; else if(dx<-0.1) labPlayer.facing=-1;
    // Animate
    if(len>0.1){ labPlayer.animTimer++; if(labPlayer.animTimer>=8){labPlayer.animTimer=0;labPlayer.animFrame=(labPlayer.animFrame+1)%4;} }
    else { labPlayer.animFrame=0; labPlayer.animTimer=0; }
    // Find nearest furniture using rect-to-point distance (works from all 4 sides)
    var keys2=['bench','cauldron','shelf','rack','merch','research','relicCase','skillBook','forge','door'];
    var nearest=null,nearDist=80;
    for(var i=0;i<keys2.length;i++){
        var fk=keys2[i],fb=lay[fk];
        if(!fb) continue;
        var fw2=fb.w||(fb.r?fb.r*2:0),fh2=fb.h||(fb.r?fb.r*2:0);
        // Clamp player center to furniture rect, get distance to nearest edge
        var clampX=Math.max(fb.x,Math.min(fb.x+fw2,labPlayer.x));
        var clampY=Math.max(fb.y,Math.min(fb.y+fh2,labPlayer.y));
        var dist=Math.sqrt((labPlayer.x-clampX)*(labPlayer.x-clampX)+(labPlayer.y-clampY)*(labPlayer.y-clampY));
        if(dist<nearDist){nearDist=dist;nearest=fk;}
    }
    labNearFurniture=nearest;
    if(nearest) labInteractPromptAlpha=Math.min(1,labInteractPromptAlpha+0.08);
    else labInteractPromptAlpha=Math.max(0,labInteractPromptAlpha-0.1);
}

function drawLabPlayer(){
    var p=labPlayer;
    var isMoving=(Math.abs(p.vx)>0.1||Math.abs(p.vy)>0.1);
    var x=p.x, y=p.y;
    var sprSize=TILE*1.4; // slightly larger than expedition for visibility
    // Shadow
    ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(x,y+sprSize*0.38,sprSize*0.28,sprSize*0.1,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(p.facing,1);
    if(SPR&&SPR.ready){
        var spr=isMoving?SPR.playerFrames[p.animFrame%SPR.playerFrames.length]:SPR.playerIdle;
        ctx.drawImage(spr,-sprSize/2,-sprSize/2,sprSize,sprSize);
    } else {
        ctx.fillStyle='#44dd88';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();

    // Interact prompt
    if(labNearFurniture&&labInteractPromptAlpha>0){
        ctx.save();ctx.globalAlpha=labInteractPromptAlpha;
        var isMob=('ontouchstart' in window);
        var promptText=isMob?'点击交互':'按E交互';
        var pw2=ctx.measureText(promptText).width+16;
        ctx.fillStyle='rgba(0,0,0,0.7)';
        ctx.beginPath();
        var rx=p.x-pw2/2,ry=p.y-52;
        ctx.roundRect?ctx.roundRect(rx,ry,pw2,20,4):ctx.fillRect(rx,ry,pw2,20);
        ctx.fill();
        ctx.fillStyle='#44dd88';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(promptText,p.x,p.y-38);
        ctx.restore();
    }
}

function drawLabHallStick(){
    if(!labHallStick.active) return;
    var sx=labHallStick.sx,sy=labHallStick.sy;
    var cx2=labHallStick.cx,cy2=labHallStick.cy;
    ctx.save();ctx.globalAlpha=0.35;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,sy,40,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,40,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=0.55;
    var dx=cx2-sx,dy=cy2-sy,dl=Math.sqrt(dx*dx+dy*dy);
    var clampR=35;
    if(dl>clampR){cx2=sx+dx/dl*clampR;cy2=sy+dy/dl*clampR;}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx2,cy2,18,0,Math.PI*2);ctx.fill();
    ctx.restore();
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
    if(ICONS.ui.settings){
        ctx.save();ctx.globalAlpha=0.85;
        ctx.drawImage(ICONS.ui.settings,68,13,24,24);
        ctx.restore();
    } else {
        drawSettingsGear(70,15,22);
    }

    // Bestiary button in lab
    var bkX=100,bkY=15,bkW=46,bkH=22;
    ctx.fillStyle='rgba(10,10,20,0.6)';ctx.fillRect(bkX,bkY,bkW,bkH);
    ctx.strokeStyle='#cc9944';ctx.lineWidth=1;ctx.strokeRect(bkX,bkY,bkW,bkH);
    if(ICONS.ui.bestiary){
        ctx.drawImage(ICONS.ui.bestiary,bkX+2,bkY+1,18,18);
        ctx.fillStyle='#cc9944';ctx.font='bold 9px monospace';ctx.textAlign='left';
        ctx.fillText('图鉴',bkX+22,bkY+bkH/2+3);
    } else {
        ctx.fillStyle='#cc9944';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText('📚 图鉴',bkX+bkW/2,bkY+bkH/2+3);
    }

    // Carried potions belt (summary)
    if(carriedPotions.length>0){
        var beltW=carriedPotions.length*80+20;
        ctx.fillStyle='rgba(10,10,20,0.6)';ctx.fillRect(W/2-beltW/2,H-30,beltW,22);
        ctx.fillStyle='#44dd88';ctx.font='10px monospace';ctx.textAlign='center';
        ctx.fillText(T('carriedSlots')+': '+carriedPotions.map(function(s){return recipeName(s.potion)+'×'+s.count;}).join(', '),W/2,H-15);
    }

    // Lab hall player (only when no panel open)
    if(!labTab&&!showSettings){
        updateLabPlayer();
        drawLabPlayer();
        drawLabHallStick();
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
        var panelTitles={extract:T('tabExtract'),brew:T('tabBrew'),potions:T('tabPotions'),expedition:T('tabExpedition'),weapons:T('tabWeapons'),shop:T('tabShop'),research:T('tabResearch'),relics:T('relicCase'),skills:T('skillTree'),bestiary:'📚 图鉴',forge:'⚒ 炼金锻造'};
        ctx.fillStyle='#44dd88';ctx.font='bold 18px monospace';ctx.textAlign='center';
        ctx.fillText(panelTitles[labTab]||'',W/2,ppy+30);
        var contentY=ppy+50;
        labPanelContentY=contentY; labPanelVisH=ph-85;
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
        else if(labTab==='bestiary') drawLabBestiary(contentY);
        else if(labTab==='forge') drawLabForge(contentY);
        ctx.restore();
    }

    labInteractBtnBox=null;

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
        labScrollMax=0;return;
    }
    // Normal herb list
    ctx.fillStyle='#aaa';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(T('selectHerb'),W/2,cy);cy+=25;
    var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
    if(herbKeys.length===0){ctx.fillStyle='#555';ctx.fillText(T('noHerbs'),W/2,cy+30);labScrollMax=Math.max(0,(cy+50-labPanelContentY)-labPanelVisH);return;}
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
    if(essKeys.length===0){ctx.fillStyle='#444';ctx.fillText(T('noneYet'),W/2,cy+10);labScrollMax=Math.max(0,(cy+30-labPanelContentY)-labPanelVisH);return;}
    var ex=W/2-essKeys.length*45;
    for(var i=0;i<essKeys.length;i++){var ek=essKeys[i],ess=ESSENCES[ek];ctx.fillStyle=ess.color;ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText(essenceName(ek),ex+i*90,cy);ctx.fillStyle='#aaa';ctx.font='11px monospace';ctx.fillText('x'+inventory.essences[ek],ex+i*90,cy+14);}
    cy+=30;
    labScrollMax=Math.max(0, (cy-labPanelContentY)-labPanelVisH);
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
        cy=ty+40;
    }
    labScrollMax=Math.max(0, (cy-labPanelContentY)-labPanelVisH);
}

function drawLabPotions(cy){
    var W=canvas.width;
    // Belt: slots by type, each max 10
    ctx.fillStyle='#aaa';ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText(T('carriedSlots')+' ('+carriedPotions.length+'种类型)',W/2,cy);cy+=8;
    var slotW=90,slotH=42,slotGap=8;
    var maxCols=Math.min(4,Math.max(carriedPotions.length+1,2));
    var slotStartX=W/2-(maxCols*(slotW+slotGap)-slotGap)/2;
    for(var i=0;i<carriedPotions.length;i++){
        var col=i%maxCols;
        var row=Math.floor(i/maxCols);
        var sx=slotStartX+col*(slotW+slotGap),sy=cy+row*(slotH+6);
        var slot=carriedPotions[i],p=slot.potion;
        ctx.fillStyle='rgba(30,30,50,0.8)';ctx.fillRect(sx,sy,slotW,slotH);
        ctx.strokeStyle=p.color||'#44dd88';ctx.lineWidth=1;ctx.strokeRect(sx,sy,slotW,slotH);
        ctx.fillStyle=p.color||'#ddd';ctx.font='10px monospace';ctx.textAlign='center';
        ctx.fillText(recipeName(p),sx+slotW/2,sy+14);
        ctx.fillStyle='#888';ctx.font='9px monospace';
        ctx.fillText(recipeDesc(p),sx+slotW/2,sy+26);
        ctx.fillStyle='#ffdd44';ctx.font='bold 11px monospace';
        ctx.fillText('×'+slot.count,sx+slotW/2,sy+38);
        ctx.fillStyle='#ff6666';ctx.font='bold 11px monospace';
        ctx.fillText('✕',sx+slotW-8,sy+12);
    }
    var rows=carriedPotions.length>0?Math.ceil(carriedPotions.length/maxCols):0;
    cy+=rows*(slotH+6)+15;
    ctx.fillStyle='#aaa';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(T('yourPotions'),W/2,cy);cy+=20;
    if(inventory.potions.length===0&&carriedPotions.length===0){ctx.fillStyle='#555';ctx.fillText(T('noPotions'),W/2,cy+20);return;}
    var itemH=40,startX=W/2-160;
    for(var i=0;i<inventory.potions.length;i++){
        var p=inventory.potions[i];var iy=cy+i*(itemH+4);
        ctx.fillStyle='#111118';ctx.fillRect(startX,iy,320,itemH);
        ctx.strokeStyle=p.color||'#333';ctx.lineWidth=1;ctx.strokeRect(startX,iy,320,itemH);
        ctx.fillStyle=p.color||'#ddd';ctx.font='12px monospace';ctx.textAlign='left';
        ctx.fillText(recipeName(p),startX+14,iy+16);
        ctx.fillStyle='#888';ctx.font='10px monospace';
        ctx.fillText(recipeDesc(p)+' ('+T('tier')+' '+p.tier+')',startX+14,iy+32);
        // Find existing slot count for this type
        var existSlot=carriedPotions.find(function(s){return s.potion.effect===p.effect;});
        var slotCount=existSlot?existSlot.count:0;
        var canAdd=(slotCount<10);
        var btnX=startX+240,btnY=iy+6,btnW=70,btnH=28;
        ctx.fillStyle=canAdd?'#44dd88':'#555';ctx.fillRect(btnX,btnY,btnW,btnH);
        ctx.fillStyle=canAdd?'#000':'#888';ctx.font='bold 10px monospace';ctx.textAlign='center';
        ctx.fillText(canAdd?(T('equip')+(slotCount>0?' +1':'')):'MAX',btnX+btnW/2,btnY+btnH/2+4);
    }
    cy+=inventory.potions.length*(itemH+4)+10;
    labScrollMax=Math.max(0, (cy-labPanelContentY)-labPanelVisH);
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
    cy+=inventory.weapons.length*40+20;
    labScrollMax=Math.max(0, (cy-labPanelContentY)-labPanelVisH);
}

// ============ ALCHEMY FORGE PANEL ============
// Selected potions for forging (indices into inventory.potions)
var forgeSelected = [];
var forgePotionListY = 0; // rendered y-start of potion list, for click detection
var forgeButtonY = 0;    // rendered y of forge button

function drawLabForge(cy){
    var W=canvas.width;
    ctx.fillStyle='#ff8844';ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText('⚒ 炼金锻造',W/2,cy);cy+=18;
    ctx.fillStyle='#888';ctx.font='10px monospace';
    ctx.fillText('选择3瓶药水炼制武器（最高紫色品质）',W/2,cy);cy+=16;
    ctx.fillText('药水等级越高，武器品质越好',W/2,cy);cy+=20;

    // Current forged weapon
    ctx.fillStyle='#aaa';ctx.font='11px monospace';
    ctx.fillText('— 当前锻造武器 —',W/2,cy);cy+=16;
    if(forgedWeapon){
        ctx.fillStyle=forgedWeapon.color;ctx.font='bold 13px monospace';
        ctx.fillText(weaponName(forgedWeapon),W/2,cy);cy+=14;
        ctx.fillStyle='#aaa';ctx.font='10px monospace';
        ctx.fillText(T('dmg')+':'+forgedWeapon.dmg+' '+T('spd')+':'+forgedWeapon.speed.toFixed(1)+' T'+forgedWeapon.tier,W/2,cy);cy+=18;
    } else {
        ctx.fillStyle='#555';ctx.font='11px monospace';
        ctx.fillText('（无）',W/2,cy);cy+=18;
    }

    cy+=8;
    // Potion selection list
    ctx.fillStyle='#cc8844';ctx.font='bold 11px monospace';
    ctx.fillText('选择药水（已选：'+forgeSelected.length+'/3）',W/2,cy);cy+=16;
    forgePotionListY = cy; // record for click detection

    var startX=W/2-160;
    if(inventory.potions.length===0){
        ctx.fillStyle='#444';ctx.font='10px monospace';ctx.fillText('背包中没有药水',W/2,cy+10);
        cy+=30;
    } else {
        for(var i=0;i<inventory.potions.length;i++){
            var p=inventory.potions[i];
            var iy=cy+i*36;
            var isSel=forgeSelected.indexOf(i)>=0;
            ctx.fillStyle=isSel?'rgba(255,136,68,0.25)':'#111118';ctx.fillRect(startX,iy,320,32);
            ctx.strokeStyle=isSel?'#ff8844':(p.color||'#333');ctx.lineWidth=isSel?2:1;ctx.strokeRect(startX,iy,320,32);
            // Tier stars
            var tierStr='';for(var ts=0;ts<=p.tier;ts++) tierStr+='★';
            ctx.fillStyle=p.color||'#ddd';ctx.font='10px monospace';ctx.textAlign='left';
            ctx.fillText(tierStr+' '+recipeName(p)+' (T'+p.tier+')',startX+10,iy+13);
            ctx.fillStyle='#777';ctx.font='9px monospace';
            ctx.fillText(recipeDesc(p),startX+10,iy+25);
            // Select button
            var btnX=startX+248,btnW=60,btnH=24,btnY=iy+4;
            ctx.fillStyle=isSel?'#ff8844':'#555';ctx.fillRect(btnX,btnY,btnW,btnH);
            ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.textAlign='center';
            ctx.fillText(isSel?'取消':'选择',btnX+btnW/2,btnY+btnH/2+3);
        }
        cy+=inventory.potions.length*36+8;
    }

    // Forge button
    cy+=8;
    var canForge=forgeSelected.length===3;
    var fbW=160,fbH=36,fbX=W/2-fbW/2,fbY=cy;
    forgeButtonY = fbY; // record for click detection
    ctx.fillStyle=canForge?'#ff8844':'#333';ctx.fillRect(fbX,fbY,fbW,fbH);
    ctx.fillStyle=canForge?'#000':'#555';ctx.font='bold 12px monospace';ctx.textAlign='center';
    ctx.fillText('⚒ 锻造武器',fbX+fbW/2,fbY+fbH/2+4);
    cy+=fbH+10;

    labScrollMax=Math.max(0, (cy-labPanelContentY)-labPanelVisH);
}

function drawLabShop(cy){
    var W=canvas.width;
    ctx.fillStyle='#ffd700';ctx.font='11px monospace';ctx.textAlign='center';
    ctx.fillText(T('gold')+': '+gold,W/2,cy);cy+=20;
    if(labShopStock.length===0){
        ctx.fillStyle='#555';ctx.font='12px monospace';
        ctx.fillText('商品已售罄',W/2,cy+20);
        labScrollMax=0;return;
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
            ctx.fillText('打开锁住的房间',startX+14,y2+36);
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
    
    // Sell herbs
    var herbKeys=Object.keys(inventory.herbs).filter(function(k){return inventory.herbs[k]>0;});
    for(var i=0;i<Math.min(herbKeys.length,5);i++){
        var k=herbKeys[i],sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(startX,sy2,320,28);
        ctx.fillStyle='#44dd88';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(herbName(k)+' x'+inventory.herbs[k],startX+14,sy2+18);
        var sbX=startX+240,sbW=70,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText('5G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }
    sellY+=Math.min(herbKeys.length,5)*32+8;
    
    // Sell potions
    for(var i=0;i<Math.min(inventory.potions.length,5);i++){
        var pot=inventory.potions[i];
        var sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(startX,sy2,320,28);
        ctx.fillStyle=pot.color||'#88aaff';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(recipeName(pot),startX+14,sy2+18);
        var sellPrice=8+pot.tier*5;
        var sbX=startX+240,sbW=70,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText(sellPrice+'G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }
    sellY+=Math.min(inventory.potions.length,5)*32+8;
    
    // Sell weapons
    for(var i=0;i<Math.min(inventory.weapons.length,5);i++){
        var wep=inventory.weapons[i];
        var sy2=sellY+i*32;
        ctx.fillStyle='#111118';ctx.fillRect(startX,sy2,320,28);
        ctx.fillStyle=wep.color||'#aabbcc';ctx.font='11px monospace';ctx.textAlign='left';
        ctx.fillText(weaponName(wep)+' (T'+wep.tier+')',startX+14,sy2+18);
        var sellPrice=8+wep.tier*8;
        var sbX=startX+240,sbW=70,sbH=22;
        ctx.fillStyle='#ddaa22';ctx.fillRect(sbX,sy2+3,sbW,sbH);
        ctx.fillStyle='#000';ctx.font='bold 9px monospace';ctx.textAlign='center';
        ctx.fillText(sellPrice+'G '+T('sell'),sbX+sbW/2,sy2+3+sbH/2+3);
    }
    sellY+=Math.min(inventory.weapons.length,5)*32+8;
    labScrollMax=Math.max(0, (sellY-labPanelContentY)-labPanelVisH);
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
    labScrollMax=Math.max(0, (cy+RESEARCH.length*44+20-labPanelContentY)-labPanelVisH);
}

function drawLabRelics(cy){
    var W=canvas.width;
    ctx.fillStyle='#aaa';ctx.font='12px monospace';ctx.textAlign='center';
    ctx.fillText(T('relicsFound')+': '+foundCollectibles.length+'/'+COLLECTIBLES.length,W/2,cy);cy+=25;
    var startX=W/2-180, cols=3, cellW=110, cellH=90;
    for(var i=0;i<COLLECTIBLES.length;i++){
        var c=COLLECTIBLES[i];
        var found=foundCollectibles.indexOf(c.id)>=0;
        var col=i%cols, row=Math.floor(i/cols);
        var cx2=startX+col*(cellW+8), cy2=cy+row*(cellH+8);
        ctx.fillStyle=found?'#111120':'#0a0a12';ctx.fillRect(cx2,cy2,cellW,cellH);
        ctx.strokeStyle=found?c.color:'#222';ctx.lineWidth=2;ctx.strokeRect(cx2,cy2,cellW,cellH);
        if(found){
            // Sprite icon (or fallback diamond)
            var relSpr=SPR.relicSprites&&SPR.relicSprites[c.id];
            var iconSz=28,iconX=cx2+cellW/2-iconSz/2,iconY=cy2+6;
            if(relSpr){
                ctx.save();ctx.imageSmoothingEnabled=false;
                ctx.shadowColor=c.color;ctx.shadowBlur=6;
                var sc3=Math.min(iconSz/relSpr.width,iconSz/relSpr.height);
                var dw3=Math.round(relSpr.width*sc3),dh3=Math.round(relSpr.height*sc3);
                ctx.drawImage(relSpr,cx2+cellW/2-dw3/2,iconY+(iconSz-dh3)/2,dw3,dh3);
                ctx.restore();
            } else {
                ctx.fillStyle=c.color;
                ctx.beginPath();ctx.moveTo(cx2+cellW/2,cy2+8);ctx.lineTo(cx2+cellW/2+8,cy2+20);
                ctx.lineTo(cx2+cellW/2,cy2+32);ctx.lineTo(cx2+cellW/2-8,cy2+20);ctx.closePath();ctx.fill();
            }
            ctx.fillStyle='#ddd';ctx.font='bold 9px monospace';ctx.textAlign='center';
            ctx.fillText(collectibleName(c),cx2+cellW/2,cy2+44);
            // Skill info
            if(c.skillName){
                ctx.fillStyle=c.color;ctx.font='bold 8px monospace';
                ctx.fillText(c.skillNameZh||c.skillName,cx2+cellW/2,cy2+56);
                ctx.fillStyle='#888';ctx.font='7px monospace';
                var skillD=c.skillDescZh||c.skillDesc;
                if(skillD.length>20) skillD=skillD.substring(0,18)+'...';
                ctx.fillText(skillD,cx2+cellW/2,cy2+66);
                ctx.fillText('被动',cx2+cellW/2,cy2+78);
            }
        } else {
            ctx.fillStyle='#333';ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillText('?',cx2+cellW/2,cy2+35);
            ctx.fillStyle='#333';ctx.font='9px monospace';
            ctx.fillText('???',cx2+cellW/2,cy2+60);
        }
    }
    // Update dynamic scroll max
    var rows2=Math.ceil(COLLECTIBLES.length/cols);
    var contentEnd=cy+rows2*(cellH+8)+20;
    labScrollMax=Math.max(0, (contentEnd-labPanelContentY)-labPanelVisH);
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
            // Icon (emoji)
            ctx.font='bold 16px sans-serif';ctx.textAlign='center';
            ctx.fillText(skill.icon||'?',nodeCx,nodeCy+5);
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
    var maxBranch=SKILL_BRANCHES.reduce(function(m,b){return Math.max(m,b.skills.length);},0);
    var skillContentEnd=cy+40+maxBranch*70+20;
    labScrollMax=Math.max(0, (skillContentEnd-labPanelContentY)-labPanelVisH);
}

// Draw one enemy entry on a book page. data=null means unseen (greyed out)
function drawBestiaryPage(key, data, px, py, pw, ph2, side){
    var et=ENEMY_TYPES[key];
    if(!et) return;
    var seen=!!data;
    var isBoss=et.isBossType,isElite=et.isEliteType;
    var accentColor=seen?(isBoss?'#ff4444':(isElite?'#cc44ff':'#88bbdd')):'#333355';
    var cx2=px+pw/2;

    // Page background
    ctx.fillStyle=side==='left'?'#1a1428':'#12101e';
    ctx.fillRect(px,py,pw,ph2);
    ctx.strokeStyle=accentColor;ctx.lineWidth=seen?2:1;ctx.strokeRect(px,py,pw,ph2);

    // Sprite portrait area (top ~52% of page)
    var imgH=Math.floor(ph2*0.52);
    var imgW=pw-20;
    var imgX=px+10,imgY=py+10;
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(imgX,imgY,imgW,imgH);
    ctx.strokeStyle=accentColor;ctx.lineWidth=1;ctx.globalAlpha=0.5;
    ctx.strokeRect(imgX,imgY,imgW,imgH);ctx.globalAlpha=1;

    if(!seen){
        // Unknown silhouette: draw "?" and dim overlay
        ctx.save();
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(imgX,imgY,imgW,imgH);
        ctx.fillStyle='#444';ctx.font='bold '+Math.floor(imgH*0.55)+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('?',imgX+imgW/2,imgY+imgH/2);
        ctx.textBaseline='alphabetic';
        ctx.restore();
    } else {
        var spr=SPR.bestiarySprites&&SPR.bestiarySprites[key];
        if(spr){
            var scale=Math.min(imgW/spr.width, imgH/spr.height)*0.85;
            var pixelScale=Math.max(1,Math.floor(scale));
            if(pixelScale*spr.width < imgW*0.5) pixelScale=scale;
            var dw=Math.round(spr.width*pixelScale),dh=Math.round(spr.height*pixelScale);
            var dx=Math.round(imgX+(imgW-dw)/2),dy=Math.round(imgY+(imgH-dh)/2);
            ctx.save();
            ctx.imageSmoothingEnabled=false;
            ctx.shadowColor=et.color||accentColor;ctx.shadowBlur=10;
            ctx.drawImage(spr,dx,dy,dw,dh);
            ctx.restore();
        } else {
            ctx.save();
            ctx.shadowColor=et.color||'#888';ctx.shadowBlur=20;
            ctx.fillStyle=et.color||'#888';
            ctx.beginPath();ctx.arc(imgX+imgW/2,imgY+imgH/2,Math.min(imgW,imgH)/3,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
        // Type badge
        if(isBoss){
            // Boss: red gradient banner with glow
            ctx.save();
            var bgrad=ctx.createLinearGradient(imgX,imgY+imgH-22,imgX,imgY+imgH);
            bgrad.addColorStop(0,'rgba(180,0,0,0.9)');bgrad.addColorStop(1,'rgba(255,60,0,0.95)');
            ctx.fillStyle=bgrad;ctx.fillRect(imgX,imgY+imgH-22,imgW,22);
            ctx.strokeStyle='#ff4400';ctx.lineWidth=1;ctx.strokeRect(imgX,imgY+imgH-22,imgW,22);
            ctx.shadowColor='#ff4400';ctx.shadowBlur=8;
            ctx.fillStyle='#ffe0c0';ctx.font='bold 11px monospace';ctx.textAlign='center';
            ctx.fillText('★ 首领 ★',imgX+imgW/2,imgY+imgH-7);
            ctx.restore();
        } else if(isElite){
            ctx.save();
            var egrad=ctx.createLinearGradient(imgX,imgY+imgH-18,imgX,imgY+imgH);
            egrad.addColorStop(0,'rgba(120,0,200,0.88)');egrad.addColorStop(1,'rgba(180,0,255,0.95)');
            ctx.fillStyle=egrad;ctx.fillRect(imgX,imgY+imgH-18,imgW,18);
            ctx.fillStyle='#eeccff';ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText('◆ 精英 ◆',imgX+imgW/2,imgY+imgH-5);
            ctx.restore();
        }
    }

    var pad=18;
    var infoY=imgY+imgH+10;
    var nameStr=seen?(et.nameZh||et.name):'???';
    ctx.fillStyle=seen?accentColor:'#444';ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText(nameStr,cx2,infoY);infoY+=16;

    if(seen){
        // Seen count
        ctx.fillStyle='#888';ctx.font='9px monospace';
        ctx.fillText('遭遇 '+data.count+'x',cx2,infoY);infoY+=14;

        // Stats
        var stats=[
            {k:'HP', v:et.hp.toFixed(1), c:'#ff6666'},
            {k:'ATK',v:et.atk.toFixed(1),c:'#ff9944'},
            {k:'SPD',v:et.spd.toFixed(1),c:'#44ddff'},
        ];
        var sw=(pw-pad*2)/3;
        for(var si=0;si<3;si++){
            var sx=px+pad+si*sw+sw/2;
            ctx.fillStyle='#555';ctx.font='8px monospace';ctx.textAlign='center';
            ctx.fillText(stats[si].k,sx,infoY);
            ctx.fillStyle=stats[si].c;ctx.font='bold 11px monospace';
            ctx.fillText(stats[si].v,sx,infoY+12);
        }
        infoY+=28;

        // Description (word-wrap)
        var desc=et.descZh||et.desc;
        ctx.fillStyle='#ccbbee';ctx.font='9px monospace';ctx.textAlign='left';
        var maxW=pw-pad*2-4,lh=13,lx=px+pad;
        var cl='';
        for(var ci=0;ci<desc.length;ci++){
            var t2=cl+desc[ci];
            if(ctx.measureText(t2).width>maxW&&cl){ctx.fillText(cl,lx,infoY);infoY+=lh;cl=desc[ci];if(infoY>py+ph2-20)break;}
            else cl=t2;
        }
        if(cl&&infoY<=py+ph2-20){ctx.fillText(cl,lx,infoY);infoY+=lh;}

        // Skills
        if(et.skills&&et.skills.length>0&&infoY<=py+ph2-12){
            ctx.fillStyle='#ffcc44';ctx.font='9px monospace';ctx.textAlign='left';
            ctx.fillText('['+et.skills.join(' · ')+']',lx,infoY);
        }
    } else {
        // Unseen hint
        ctx.fillStyle='#333';ctx.font='9px monospace';ctx.textAlign='center';
        var typeHint=isBoss?'Boss':(isElite?'精英':'未知生物');
        ctx.fillText(typeHint,cx2,infoY);
    }
}

function drawLabBestiary(cy){
    var W=canvas.width,H=canvas.height;
    var ph=Math.min(H-60,500),ppy=(H-ph)/2;
    var navH=36;
    var bookW=Math.min(W-24,560),bookH=ph-(cy-ppy)-navH-14;
    var bookX=(W-bookW)/2,bookY=cy-4;
    // Use ALL enemy types as the master list (preserve insertion order)
    var allKeys=Object.keys(ENEMY_TYPES);
    var total=allKeys.length;
    var seenCount=Object.keys(seenEnemies).length;
    var maxPage=Math.max(0,Math.ceil(total/2)-1);
    bestiaryPage=Math.max(0,Math.min(bestiaryPage,maxPage));

    // Discovered counter
    ctx.fillStyle='#aaaacc';ctx.font='10px monospace';ctx.textAlign='center';
    ctx.fillText('已发现: '+seenCount+' / '+total,W/2,bookY-2);

    var pageW=bookW/2,spineW=6;
    var leftKey=allKeys[bestiaryPage*2];
    var rightKey=allKeys[bestiaryPage*2+1];

    // Draw left page (always exists)
    drawBestiaryPage(leftKey, seenEnemies[leftKey]||null, bookX, bookY, pageW, bookH, 'left');

    // Draw right page (may be undefined on last odd page)
    if(rightKey){
        drawBestiaryPage(rightKey, seenEnemies[rightKey]||null, bookX+pageW, bookY, pageW, bookH, 'right');
    } else {
        ctx.fillStyle='#12101e';ctx.fillRect(bookX+pageW,bookY,pageW,bookH);
        ctx.strokeStyle='#334';ctx.lineWidth=2;ctx.strokeRect(bookX+pageW,bookY,pageW,bookH);
    }

    // Spine
    ctx.fillStyle='#2a2040';ctx.fillRect(bookX+pageW-spineW/2,bookY,spineW,bookH);
    ctx.strokeStyle='#553388';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bookX+pageW,bookY);ctx.lineTo(bookX+pageW,bookY+bookH);ctx.stroke();

    // Navigation row
    var navY=bookY+bookH+navH/2+2;
    ctx.fillStyle='#555';ctx.font='10px monospace';ctx.textAlign='center';
    ctx.fillText((bestiaryPage+1)+'/'+(Math.ceil(total/2)||1),W/2,navY);
    if(bestiaryPage>0){
        ctx.fillStyle='#44aaff';ctx.font='bold 12px monospace';
        ctx.fillText('◀ 上一页',bookX+55,navY);
    }
    if(bestiaryPage<maxPage){
        ctx.fillStyle='#44aaff';ctx.font='bold 12px monospace';
        ctx.fillText('下一页 ▶',bookX+bookW-55,navY);
    }
    labScrollMax=0;
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
    labScrollMax=0;
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
    var text=step.zh||step.en;
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
    ctx.fillText(tutorialStep<TUTORIAL_LAB.length-1?'下一步':'开始探险！',W/2,btnY+btnH/2+4);
}
function drawTutorialExp(){
    if(tutorialDone || tutorialPhase!=='expedition') return;
    var step=TUTORIAL_EXP[tutorialStep];
    if(!step) return;
    var W=canvas.width,H=canvas.height;
    tutorialBlink=(tutorialBlink+1)%60;
    var text=step.zh||step.en;
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
    ctx.fillText(tutorialStep<TUTORIAL_EXP.length-1?'下一步':'出发！',W/2,btnY+btnH/2+4);
}
function handleTutorialClick(cx,cy){
    var W=canvas.width,H=canvas.height;
    // Find the next button and check click
    var lines,bubH,bubY,bubW;
    if(tutorialPhase==='lab'){
        var step=TUTORIAL_LAB[tutorialStep];if(!step) return false;
        var text=step.zh;
        lines=text.split('\n');
        bubW=Math.min(W-40,320);bubH=lines.length*22+50;
        var lay=labFurniture;var target=lay[step.key];
        bubY=target?Math.min(target.y-bubH-20,H-bubH-60):H/2-bubH/2;
        if(bubY<10&&target) bubY=target.y+target.h+20;
    } else {
        var step=TUTORIAL_EXP[tutorialStep];if(!step) return false;
        var text=step.zh;
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
    var ph=Math.min(H-padY*2,compact?340:450);
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var pw=Math.min(W-30,340),px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='rgba(14,14,26,0.97)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#44dd88';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
    ctx.fillStyle='#44dd88';ctx.fillRect(px,py,pw,3);
    // Title
    ctx.fillStyle='#44dd88';ctx.font='bold '+(compact?14:18)+'px monospace';ctx.textAlign='center';
    ctx.fillText(T('settingsTitle'),W/2,py+titleH);
    var cy=py+titleH+20, sliderW=pw-100, sliderX=px+85;
    var fSz=compact?11:13;
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
    // God Mode toggle
    var gmBtnW=pw-24,gmBtnH=compact?24:28,gmBtnX=px+12,gmBtnY=cy;
    _settingsRects.godMode={x:gmBtnX,y:gmBtnY,w:gmBtnW,h:gmBtnH};
    ctx.fillStyle=godMode?'#ffd700':'#333';ctx.fillRect(gmBtnX,gmBtnY,gmBtnW,gmBtnH);
    ctx.strokeStyle=godMode?'#ffee88':'#555';ctx.lineWidth=1;ctx.strokeRect(gmBtnX,gmBtnY,gmBtnW,gmBtnH);
    ctx.fillStyle=godMode?'#000':'#888';ctx.font='bold '+(compact?10:11)+'px monospace';ctx.textAlign='center';
    ctx.fillText('无敌模式: '+(godMode?'开':'关'),gmBtnX+gmBtnW/2,gmBtnY+gmBtnH/2+4);
    cy+=compact?30:36;
    // Save & Load buttons
    var sbW=Math.floor((pw-40)/2),sbH=compact?24:28;
    var saveX=px+12,loadX=px+20+sbW,sbY=cy;
    _settingsRects.save={x:saveX,y:sbY,w:sbW,h:sbH};
    _settingsRects.load={x:loadX,y:sbY,w:sbW,h:sbH};
    ctx.fillStyle='#44dd88';ctx.fillRect(saveX,sbY,sbW,sbH);
    ctx.fillStyle='#000';ctx.font='bold '+(compact?10:11)+'px monospace';ctx.textAlign='center';
    ctx.fillText(T('saveBtn'),saveX+sbW/2,sbY+sbH/2+4);
    ctx.fillStyle='#4488ee';ctx.fillRect(loadX,sbY,sbW,sbH);
    ctx.fillStyle='#fff';ctx.font='bold '+(compact?10:11)+'px monospace';
    ctx.fillText(T('loadSave'),loadX+sbW/2,sbY+sbH/2+4);
    cy+=sbH+(compact?6:10);
    // Return to Menu button
    var menuBtnW=pw-24,menuBtnH=compact?24:28,menuBtnX=px+12,menuBtnY=cy;
    _settingsRects.menu={x:menuBtnX,y:menuBtnY,w:menuBtnW,h:menuBtnH};
    ctx.fillStyle='#dd8844';ctx.fillRect(menuBtnX,menuBtnY,menuBtnW,menuBtnH);
    ctx.strokeStyle='#ffaa66';ctx.lineWidth=1;ctx.strokeRect(menuBtnX,menuBtnY,menuBtnW,menuBtnH);
    ctx.fillStyle='#000';ctx.font='bold '+(compact?10:11)+'px monospace';ctx.textAlign='center';
    ctx.fillText('返回主菜单',menuBtnX+menuBtnW/2,menuBtnY+menuBtnH/2+4);
    cy+=compact?30:36;
    // Close button
    var cbW=compact?100:120,cbH=compact?28:34,cbX=W/2-cbW/2,cbY=cy;
    _settingsRects.close={x:cbX,y:cbY,w:cbW,h:cbH};
    _settingsRects.panel={x:px,y:py,w:pw,h:ph};
    ctx.fillStyle='#44dd88';ctx.fillRect(cbX,cbY,cbW,cbH);
    ctx.fillStyle='#000';ctx.font='bold '+(compact?12:14)+'px monospace';ctx.textAlign='center';
    ctx.fillText(T('settingsClose'),W/2,cbY+cbH/2+5);
}
function handleSettingsClick(cx,cy){
    var r=_settingsRects;
    // Use recorded rects from drawSettings for accurate hit detection
    if(r.godMode&&cx>=r.godMode.x&&cx<=r.godMode.x+r.godMode.w&&cy>=r.godMode.y&&cy<=r.godMode.y+r.godMode.h){godMode=!godMode;playSound('click');return;}
    if(r.save&&cx>=r.save.x&&cx<=r.save.x+r.save.w&&cy>=r.save.y&&cy<=r.save.y+r.save.h){saveGame();playSound('click');return;}
    if(r.load&&cx>=r.load.x&&cx<=r.load.x+r.load.w&&cy>=r.load.y&&cy<=r.load.y+r.load.h){loadGame();playSound('click');return;}
    if(r.menu&&cx>=r.menu.x&&cx<=r.menu.x+r.menu.w&&cy>=r.menu.y&&cy<=r.menu.y+r.menu.h){
        saveGame();state='menu';showSettings=false;labTab=null;activeBuffs=[];carriedPotions=[];
        weaponPopup=null;merchantPopup=null;buffPopup=null;buffTooltipIndex=null;
        playSound('click');playBGM('menu');return;
    }
    if(r.close&&cx>=r.close.x&&cx<=r.close.x+r.close.w&&cy>=r.close.y&&cy<=r.close.y+r.close.h){showSettings=false;saveSettings();playSound('click');return;}
    // Sliders (BGM/SFX) and quality buttons still use computed coords
    var W=canvas.width,H=canvas.height;
    var compact=H<550;
    var lh=compact?28:42, titleH=compact?22:30, padY=compact?12:20;
    var ph=Math.min(H-padY*2,compact?340:450);
    var pw=Math.min(W-30,340),px=(W-pw)/2,py=(H-ph)/2;
    var cyy=py+titleH+20, sliderW=pw-100, sliderX=px+85;
    var trackH=compact?8:10;
    if(cy>=cyy-12&&cy<=cyy+12&&cx>=sliderX&&cx<=sliderX+sliderW){
        bgmVolume=Math.max(0,Math.min(1,(cx-sliderX)/sliderW));
        if(bgmAudio) bgmAudio.volume=bgmVolume;
        return;
    }
    cyy+=lh;
    if(cy>=cyy-12&&cy<=cyy+12&&cx>=sliderX&&cx<=sliderX+sliderW){
        sfxVolume=Math.max(0,Math.min(1,(cx-sliderX)/sliderW));
        return;
    }
    cyy+=lh;
    var qBtnW=Math.floor((sliderW-8)/3),qBtnH=compact?22:26;
    for(var i=0;i<3;i++){
        var qx=sliderX+i*(qBtnW+4),qy=cyy-(compact?8:10);
        if(cx>=qx&&cx<=qx+qBtnW&&cy>=qy&&cy<=qy+qBtnH){qualityLevel=i;applyQuality();playSound('click');return;}
    }
    // Click outside panel to close
    if(r.panel&&(cx<r.panel.x||cx>r.panel.x+r.panel.w||cy<r.panel.y||cy>r.panel.y+r.panel.h)){showSettings=false;saveSettings();playSound('click');return;}
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

function openLabFurniture(fk){
    playSound('click');
    if(fk==='bench'){ labTab='extract';labScrollY=0;selectedEssences=[];extractMini=null; }
    else if(fk==='cauldron'){ labTab='brew';labScrollY=0;selectedEssences=[]; }
    else if(fk==='shelf'){ labTab='potions';labScrollY=0; }
    else if(fk==='rack'){ labTab='weapons';labScrollY=0; }
    else if(fk==='merch'){ labTab='shop';labScrollY=0; }
    else if(fk==='research'){ labTab='research';labScrollY=0; }
    else if(fk==='relicCase'){ labTab='relics';labScrollY=0; }
    else if(fk==='skillBook'){ labTab='skills';labScrollY=0; }
    else if(fk==='forge'){ labTab='forge';labScrollY=0; }
    else if(fk==='door'){ labTab='expedition';labScrollY=0; }
}

function handleLabClick(cx,cy){
    if(showSettings){handleSettingsClick(cx,cy);return;}
    if(tutorialPhase==='lab'){handleTutorialClick(cx,cy);return;}
    // Mobile interact button (right side)
    if(labInteractBtnBox&&cx>=labInteractBtnBox.x&&cx<=labInteractBtnBox.x+labInteractBtnBox.w&&cy>=labInteractBtnBox.y&&cy<=labInteractBtnBox.y+labInteractBtnBox.h){
        if(labNearFurniture){openLabFurniture(labNearFurniture);}
        return;
    }
    var W=canvas.width,H=canvas.height;
    // Save button
    var svW=45,svH=22,svX=15,svY=15;
    if(cx>=svX&&cx<=svX+svW&&cy>=svY&&cy<=svY+svH){saveGame();playSound('click');return;}
    // Settings gear
    if(cx>=70&&cx<=92&&cy>=15&&cy<=37){showSettings=true;playSound('click');return;}
    // Bestiary button
    if(cx>=100&&cx<=146&&cy>=15&&cy<=37){labTab='bestiary';bestiaryPage=0;labScrollY=0;playSound('click');return;}
    // Bestiary page nav handled below inside labTab block

    // No panel open: interact with nearby furniture, or fall through to hitBox checks below
    if(!labTab){
        if(labNearFurniture){ openLabFurniture(labNearFurniture);return; }
        // fall through to else-branch hitBox furniture checks
    }

    if(labTab){
        var pw=Math.min(W-40,520),ph=Math.min(H-60,500);
        var ppx=(W-pw)/2,ppy=(H-ph)/2;
        // Bestiary page nav: book-style two pages, each turn shows 2 enemies
        if(labTab==='bestiary'){
            var navHb=24;
            var bookWb=Math.min(W-24,560);
            var contentYb=ppy+50;
            var bookHb=ph-(contentYb-ppy)-navHb-14;
            var bookXb=(W-bookWb)/2,bookYb=contentYb-4;
            var navYb=bookYb+bookHb+navHb/2+2;
            var totalB=Object.keys(ENEMY_TYPES).length;
            var maxPageB=Math.max(0,Math.ceil(totalB/2)-1);
            if(cy>=navYb-14&&cy<=navYb+14){
                if(cx>=bookXb&&cx<W/2-20&&bestiaryPage>0){bestiaryPage--;playSound('click');return;}
                if(cx>W/2+20&&cx<=bookXb+bookWb&&bestiaryPage<maxPageB){bestiaryPage++;playSound('click');return;}
            }
        }
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
            // Slot click: remove one from count (or remove slot)
            var slotW2=90,slotH2=42,slotGap2=8;
            var maxCols2=Math.min(4,Math.max(carriedPotions.length+1,2));
            var slotStartX2=W/2-(maxCols2*(slotW2+slotGap2)-slotGap2)/2;
            var slotY2=contentY+8;
            for(var i=0;i<carriedPotions.length;i++){
                var col2=i%maxCols2,row2=Math.floor(i/maxCols2);
                var sx2=slotStartX2+col2*(slotW2+slotGap2),sy2=slotY2+row2*(slotH2+6);
                if(cx>=sx2&&cx<=sx2+slotW2&&cy>=sy2&&cy<=sy2+slotH2){
                    var slot2=carriedPotions[i];
                    inventory.potions.push(slot2.potion);
                    slot2.count--;
                    if(slot2.count<=0) carriedPotions.splice(i,1);
                    playSound('click');return;
                }
            }
            var rows2=carriedPotions.length>0?Math.ceil(carriedPotions.length/maxCols2):0;
            var listY=slotY2+rows2*(slotH2+6)+35,itemH=40,startX=W/2-160;
            for(var i=0;i<inventory.potions.length;i++){
                var iy=listY+i*(itemH+4);
                var btnX=startX+240,btnY2=iy+6,btnW=70,btnH=28;
                if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY2&&cy<=btnY2+btnH){
                    var p2=inventory.potions[i];
                    var existIdx=carriedPotions.findIndex(function(s){return s.potion.effect===p2.effect;});
                    if(existIdx>=0){
                        if(carriedPotions[existIdx].count>=10){labMessage='已满10个！';labMessageTimer=90;playSound('error');return;}
                        carriedPotions[existIdx].count++;
                    } else {
                        carriedPotions.push({potion:p2,count:1});
                    }
                    inventory.potions.splice(i,1);playSound('click');return;
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
                        var ep=enchantable[i];
                        // Remove previous enchant stats first
                        if(equippedWeapon.enchant){
                            var prev=equippedWeapon.enchant;
                            if(prev.effect==='attack') equippedWeapon.dmg=Math.max(1,equippedWeapon.dmg-Math.ceil(prev.value*0.5+1));
                            else if(prev.effect==='speed') equippedWeapon.speed=Math.max(0.5,parseFloat((equippedWeapon.speed-(0.2+prev.tier*0.1)).toFixed(1)));
                            else if(prev.effect==='defense') equippedWeapon._defBonus=0;
                        }
                        equippedWeapon.enchant=ep;
                        // Apply new enchant stats
                        if(ep.effect==='attack'){
                            var bonus=Math.ceil(ep.value*0.5+1);
                            equippedWeapon.dmg+=bonus;
                        } else if(ep.effect==='speed'){
                            equippedWeapon.speed=parseFloat((equippedWeapon.speed+(0.2+ep.tier*0.1)).toFixed(1));
                        } else if(ep.effect==='defense'){
                            equippedWeapon._defBonus=ep.tier+1;
                        }
                        // Remove potion from inventory
                        var idx=inventory.potions.indexOf(ep);
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
        } else if(labTab==='forge'){
            var startX=W/2-160;
            // Use recorded Y from render (adjusted for scroll offset)
            var fgCy=forgePotionListY+labScrollY;
            // Potion select buttons
            for(var i=0;i<inventory.potions.length;i++){
                var iy=fgCy+i*36;
                var btnX=startX+248,btnW=60,btnH=24,btnY=iy+4;
                if(cx>=btnX&&cx<=btnX+btnW&&cy>=btnY&&cy<=btnY+btnH){
                    var selIdx=forgeSelected.indexOf(i);
                    if(selIdx>=0){ forgeSelected.splice(selIdx,1); }
                    else if(forgeSelected.length<3){ forgeSelected.push(i); }
                    playSound('click'); return;
                }
            }
            // Forge button
            var fbY=forgeButtonY+labScrollY;
            var fbW=160,fbH=36,fbX=W/2-fbW/2;
            if(forgeSelected.length===3&&cx>=fbX&&cx<=fbX+fbW&&cy>=fbY&&cy<=fbY+fbH){
                // Determine quality from avg potion tier
                var avgTier=0;
                forgeSelected.forEach(function(idx){avgTier+=inventory.potions[idx].tier;});
                avgTier/=3;
                // Map avg tier to rarity: 0→0(gray), 1→1(green), 2→2(blue), 3→3(purple), max purple
                var rarity=Math.min(3,Math.round(avgTier));
                // Pick weapon tier proportionally
                var wepTier=Math.min(2,Math.floor(avgTier));
                var pool=WEAPONS.filter(function(w){return (w.tier||0)===wepTier;});
                if(pool.length===0) pool=WEAPONS;
                var wType=pool[randInt(0,pool.length-1)];
                var forged=makeWeapon(wType);
                forged.rarity=rarity;
                forged.color=RARITY_COLORS[rarity];
                // Remove used potions (sort descending to avoid index shift)
                forgeSelected.sort(function(a,b){return b-a;});
                forgeSelected.forEach(function(idx){inventory.potions.splice(idx,1);});
                forgeSelected=[];
                forgedWeapon=forged;
                inventory.weapons.push(forged);
                saveGame();
                // Also equip it as current weapon for next expedition
                labMessage='锻造成功：'+weaponName(forged);
                labMessageTimer=180; playSound('levelUp'); return;
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
                    gold+=5;labMessage=T('soldItem');labMessageTimer=60;playSound('pickup');return;
                }
            }
            sellY+=Math.min(herbKeys.length,5)*32+8;
            
            // Sell potions
            for(var i=0;i<Math.min(inventory.potions.length,5);i++){
                var pot=inventory.potions[i];
                var sy2=sellY+i*32;
                var sellPrice=8+pot.tier*5;
                var sbX=startX+240,sbW=70,sbH=22;
                if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                    inventory.potions.splice(i,1);
                    gold+=sellPrice;labMessage=T('soldItem');labMessageTimer=60;playSound('pickup');return;
                }
            }
            sellY+=Math.min(inventory.potions.length,5)*32+8;
            
            // Sell weapons
            for(var i=0;i<Math.min(inventory.weapons.length,5);i++){
                var wep=inventory.weapons[i];
                var sy2=sellY+i*32;
                var sellPrice=8+wep.tier*8;
                var sbX=startX+240,sbW=70,sbH=22;
                if(cx>=sbX&&cx<=sbX+sbW&&cy>=sy2+3&&cy<=sy2+3+sbH){
                    inventory.weapons.splice(i,1);
                    gold+=sellPrice;labMessage=T('soldItem');labMessageTimer=60;playSound('pickup');return;
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
        if(lay.forge&&hitBox(cx,cy,lay.forge)){labTab='forge';labScrollY=0;playSound('click');return;}
    }
}

function handleMenuTouch(cx,cy){
    if(!audioCtx) initAudio();
    if(showSettings){handleSettingsClick(cx,cy);return;}
    playBGM('lab');
    var W=canvas.width,H=canvas.height;
    // Settings gear
    var gX=W-50,gY=15,gS=26;
    if(cx>=gX&&cx<=gX+gS&&cy>=gY&&cy<=gY+gS){showSettings=true;playSound('click');return;}
    // New layout: buttons on left (middle)
    var btnW=180,btnH=42,btnX=40,btnGap=12;
    var hasSave=!!localStorage.getItem('alchemist_save');
    var startY=H*0.45;
    // New Game button
    if(cx>=btnX&&cx<=btnX+btnW&&cy>=startY&&cy<=startY+btnH){
        // Reset all game data for new game
        gold=0; totalScore=0; expeditionNum=0;
        inventory={herbs:{},essences:{},potions:[],weapons:[]};
        equippedWeapon=makeWeapon(WEAPONS[0]);
        forgedWeapon=null; forgeSelected=[];
        discoveredRecipes=[];
        carriedPotions=[];
        researchLevels={};
        foundCollectibles=[];
        playerKeys=0;
        unlockedSkills={};
        tutorialDone=false;
        tutorialPhase='';
        tutorialStep=0;
        initResearch();
        refreshLabShop();
        state='lab';playSound('click');playBGM('lab');
        if(!tutorialDone&&tutorialPhase===''){tutorialPhase='lab';tutorialStep=0;}
        return;
    }
    // Continue button
    if(hasSave){
        var continueY=startY+btnH+btnGap;
        if(cx>=btnX&&cx<=btnX+btnW&&cy>=continueY&&cy<=continueY+btnH){
            loadGame();state='lab';playSound('click');playBGM('lab');
            tutorialDone=true;return;
        }
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
        if(showBestiary){
            // Handle bestiary close/nav
            var W2=canvas.width,H2=canvas.height;
            var pw2=Math.min(W2-30,420),ph2=Math.min(H2-30,520),px2=(W2-pw2)/2,py2=(H2-ph2)/2;
            var cbX2=px2+pw2-32,cbY2=py2+6,cbS2=24;
            if(cx>=cbX2&&cx<=cbX2+cbS2&&cy>=cbY2&&cy<=cbY2+cbS2){showBestiary=false;playSound('click');return;}
            var perPage2=5,totalPages2=Math.ceil(Object.keys(seenEnemies).length/perPage2);
            if(cy>=py2+ph2-40&&cy<=py2+ph2){
                if(cx>=px2&&cx<W2/2-10&&bestiaryPage>0){bestiaryPage--;playSound('click');}
                else if(cx>W2/2+10&&cx<=px2+pw2&&bestiaryPage<totalPages2-1){bestiaryPage++;playSound('click');}
            }
            return;
        }
        if(relicChoicePopup){handleRelicChoiceClick(cx,cy);return;}
        if(weaponPopup||merchantPopup||buffPopup){handleExpeditionPopupClick(cx,cy);return;}
        // Settings gear
        var W=canvas.width;
        if(cx>=W-38&&cx<=W-12&&cy>=15&&cy<=41){showSettings=true;playSound('click');return;}
        // Bestiary book button
        if(cx>=W-72&&cx<=W-46&&cy>=14&&cy<=40){showBestiary=true;bestiaryPage=0;playSound('click');return;}
        // Exit expedition button (left side, below HP stats)
        if(cx>=10&&cx<=70&&cy>=95&&cy<=117){
            if(confirm('确定退出本次冒险？进度将丢失。')){
                endExpedition();
            }
            return;
        }
        // Click on buff icons (left side)
        if(window.renderedBuffs&&window.renderedBuffs.length>0){
            for(var bi=0;bi<window.renderedBuffs.length;bi++){
                var rb=window.renderedBuffs[bi];
                if(cx>=rb.x&&cx<=rb.x+rb.w&&cy>=rb.y&&cy<=rb.y+rb.h){
                    // Toggle buff tooltip
                    if(buffTooltipIndex===rb.index) buffTooltipIndex=null;
                    else buffTooltipIndex=rb.index;
                    playSound('click');return;
                }
            }
        }
        // Close buff tooltip if clicking elsewhere
        if(buffTooltipIndex!==null){buffTooltipIndex=null;}
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
            var qbSlotW=54,qbSlotH=52,qbGap=5;
            var qbTotalW=carriedPotions.length*(qbSlotW+qbGap)-qbGap;
            var qbX=Math.floor((canvas.width-qbTotalW)/2),qbY=canvas.height-(isMobile?65:70);
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
    else if(lay.forge&&hitBox(cx,cy,lay.forge)) labHover='forge';
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
    // New layout: buttons on the left side (middle)
    var btnW=180,btnH=42,btnX=40,btnGap=12;
    var hasSave=!!localStorage.getItem('alchemist_save');
    var startY=H*0.45;
    // New Game button
    ctx.shadowColor='#44dd88';ctx.shadowBlur=15;ctx.fillStyle='#44dd88';ctx.fillRect(btnX,startY,btnW,btnH);ctx.shadowBlur=0;
    ctx.strokeStyle='#88ffbb';ctx.lineWidth=2;ctx.strokeRect(btnX,startY,btnW,btnH);
    ctx.fillStyle='#000';ctx.font='bold 14px monospace';ctx.textAlign='center';
    ctx.fillText('新游戏',btnX+btnW/2,startY+btnH/2+1);
    // Continue button (if save exists)
    if(hasSave){
        var continueY=startY+btnH+btnGap;
        ctx.fillStyle='#4488ee';ctx.fillRect(btnX,continueY,btnW,btnH);
        ctx.strokeStyle='#6699ff';ctx.lineWidth=2;ctx.strokeRect(btnX,continueY,btnW,btnH);
        ctx.fillStyle='#fff';ctx.font='bold 14px monospace';
        ctx.fillText('继续游戏',btnX+btnW/2,continueY+btnH/2+1);
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
        inventory:inventory, equippedWeapon:equippedWeapon, forgedWeapon:forgedWeapon,
        discoveredRecipes:discoveredRecipes, carriedPotions:carriedPotions,
        researchLevels:researchLevels, foundCollectibles:foundCollectibles,
        playerKeys:playerKeys, lang:lang, unlockedSkills:unlockedSkills,
        seenEnemies:seenEnemies
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
        forgedWeapon=data.forgedWeapon||null;
        if(data.seenEnemies) seenEnemies=data.seenEnemies;
        
        // Fix missing type property in old saves
        if(equippedWeapon&&!equippedWeapon.type){
            var template=WEAPONS.find(function(w){return w.name===equippedWeapon.name;});
            if(template) equippedWeapon.type=template.type;
            else equippedWeapon.type='sword';
        }
        for(var i=0;i<inventory.weapons.length;i++){
            if(!inventory.weapons[i].type){
                var template=WEAPONS.find(function(w){return w.name===inventory.weapons[i].name;});
                if(template) inventory.weapons[i].type=template.type;
                else inventory.weapons[i].type='sword';
            }
        }
        
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

// ============ ICON SYSTEM ============
var ICONS = { potions:{}, status:{}, ui:{} };
// Potion name -> embedded icon key mapping
var POTION_ICON_KEY = {
    'Healing Brew':'healing_brew','Greater Heal':'greater_heal',
    'Master Healing':'greater_heal','Divine Blessing':'greater_heal',
    'Strength Elixir':'strength_elixir','Berserker Draft':'strength_elixir',
    'Titan Strength':'strength_elixir','Elemental Fury':'strength_elixir',
    'Iron Skin':'iron_skin','Stone Shield':'iron_skin',
    'Diamond Shield':'iron_skin','Fortress Wall':'iron_skin',
    'Swift Potion':'swift_potion',
    'Regen Potion':'regen_potion','Rapid Regen':'regen_potion',
    'Vitality Tonic':'regen_potion','Supreme Vitality':'regen_potion',
    'Phoenix Draught':'phoenix_draught','Phoenix Rebirth':'phoenix_draught',
    'Venom Blade':'venom_blade','Deadly Venom':'venom_blade','Shadow Elixir':'venom_blade'
};
function loadImgFromDataUrl(dataUrl){
    return new Promise(function(resolve){
        if(!dataUrl){resolve(null);return;}
        var img=new Image();
        img.onload=function(){resolve(img);};
        img.onerror=function(){resolve(null);};
        img.src=dataUrl;
    });
}
function loadGameIcons(){
    if(typeof ICON_DATA==='undefined'){return Promise.resolve();}
    var tasks=[];
    // potions by key
    var pd=ICON_DATA.potions||{};
    for(var pk in pd) tasks.push((function(k,d){return loadImgFromDataUrl(d).then(function(img){ICONS.potions[k]=img;});})(pk,pd[pk]));
    // potion name aliases
    for(var pname in POTION_ICON_KEY){
        var pkey=POTION_ICON_KEY[pname];
        if(pd[pkey]) tasks.push((function(n,d){return loadImgFromDataUrl(d).then(function(img){ICONS.potions[n]=img;});})(pname,pd[pkey]));
    }
    // status
    var sd=ICON_DATA.status||{};
    for(var sk in sd) tasks.push((function(k,d){return loadImgFromDataUrl(d).then(function(img){ICONS.status[k]=img;});})(sk,sd[sk]));
    // ui
    var ud=ICON_DATA.ui||{};
    for(var uk in ud) tasks.push((function(k,d){return loadImgFromDataUrl(d).then(function(img){ICONS.ui[k]=img;});})(uk,ud[uk]));
    return Promise.all(tasks);
}
function drawIconOrFallback(iconImg, x, y, w, h, fallbackFn){
    if(iconImg){ ctx.drawImage(iconImg, x, y, w, h); }
    else if(fallbackFn){ fallbackFn(); }
}

// ============ MAIN LOOP ============
function render(){
    if(state==='menu') drawMenu();
    else if(state==='lab') renderLab();
    else if(state==='expedition') renderExpedition();
    else if(state==='gameover') drawGameOver();
}
var gamePaused = false;
function gameLoop(){
    if(!gamePaused){update();render();}
    requestAnimationFrame(gameLoop);
}
document.addEventListener('visibilitychange',function(){
    if(document.hidden){
        gamePaused=true;
    } else {
        gamePaused=false;
        // Reset touch states to avoid stuck input on resume
        labHallStick.active=false;labHallStick.id=-1;
        mobileStick.active=false;mobileStick.id=-1;
        mobileAimStick.active=false;mobileAimStick.id=-1;
    }
});
(async function(){await loadTilesheet();initSprites();await loadCustomEnemySprites();await loadWeaponSprites();await loadBestiarySprites();await loadRelicSprites();await loadGameIcons();initResearch();loadSettings();loadTutorialState();loadGame();refreshLabShop();gameLoop();})();
