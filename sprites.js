// ============ SPRITE SYSTEM for Alchemist's Path ============
const TILE_SIZE = 16, SHEET_COLS = 20;
let tilesheet = null;
const SPR = {};

function extractTile(idx) {
    var col = idx % SHEET_COLS, row = Math.floor(idx / SHEET_COLS);
    var c = document.createElement('canvas'); c.width = TILE_SIZE; c.height = TILE_SIZE;
    c.getContext('2d').drawImage(tilesheet, col*TILE_SIZE, row*TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
    return c;
}
function tintTile(idx, color) {
    var base = extractTile(idx);
    var c = document.createElement('canvas'); c.width = TILE_SIZE; c.height = TILE_SIZE;
    var cx = c.getContext('2d');
    cx.drawImage(base, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = color; cx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    return c;
}
function tintTileGradient(idx, color1, color2) {
    var base = extractTile(idx);
    var c = document.createElement('canvas'); c.width = TILE_SIZE; c.height = TILE_SIZE;
    var cx = c.getContext('2d');
    cx.drawImage(base, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    var g = cx.createLinearGradient(0, 0, 0, TILE_SIZE);
    g.addColorStop(0, color1); g.addColorStop(1, color2);
    cx.fillStyle = g; cx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    return c;
}
function loadTilesheet() {
    return new Promise(function(resolve) {
        tilesheet = new Image();
        tilesheet.onload = function() { resolve(true); };
        tilesheet.onerror = function() { tilesheet = null; resolve(false); };
        tilesheet.src = 'tilesheet.png';
    });
}
function initSprites() {
    if (!tilesheet) { SPR.ready = false; return; }
    SPR.ready = true;

    // Wall 9-grid (base — will be tinted per biome in game.js)
    SPR.wallSet = {
        tl:extractTile(87),t:extractTile(88),tr:extractTile(89),
        l:extractTile(107),c:extractTile(108),r:extractTile(109),
        bl:extractTile(127),b:extractTile(128),br:extractTile(129)
    };
    SPR.hStrip = { l:extractTile(170), c:extractTile(171), r:extractTile(172) };
    SPR.vStrip = { t:extractTile(113), c:extractTile(133), b:extractTile(153) };
    SPR.wallSingle = extractTile(171);

    // Biome-tinted wall sets
    SPR.wallSets = {};
    var biomeTints = {
        forest: {c1:'#2a4a2a',c2:'#1a3a1a'},
        cave:   {c1:'#2a2a5a',c2:'#1a1a40'},
        swamp:  {c1:'#3a3a1a',c2:'#2a2a10'}
    };
    for(var bk in biomeTints){
        var bt=biomeTints[bk];
        SPR.wallSets[bk]={
            wallSet:{
                tl:tintTileGradient(87,bt.c1,bt.c2),t:tintTileGradient(88,bt.c1,bt.c2),tr:tintTileGradient(89,bt.c1,bt.c2),
                l:tintTileGradient(107,bt.c1,bt.c2),c:tintTileGradient(108,bt.c1,bt.c2),r:tintTileGradient(109,bt.c1,bt.c2),
                bl:tintTileGradient(127,bt.c1,bt.c2),b:tintTileGradient(128,bt.c1,bt.c2),br:tintTileGradient(129,bt.c1,bt.c2)
            },
            hStrip:{l:tintTileGradient(170,bt.c1,bt.c2),c:tintTileGradient(171,bt.c1,bt.c2),r:tintTileGradient(172,bt.c1,bt.c2)},
            vStrip:{t:tintTileGradient(113,bt.c1,bt.c2),c:tintTileGradient(133,bt.c1,bt.c2),b:tintTileGradient(153,bt.c1,bt.c2)},
            wallSingle:tintTileGradient(171,bt.c1,bt.c2)
        };
    }

    // Floor
    SPR.floorDeco = [extractTile(90), extractTile(91), extractTile(69), extractTile(70)];

    // Player (green alchemist with gradient)
    SPR.playerFrames = [tintTileGradient(241,'#66ffaa','#228855'), tintTileGradient(242,'#66ffaa','#228855'), tintTileGradient(243,'#66ffaa','#228855'), tintTileGradient(244,'#66ffaa','#228855')];
    SPR.playerIdle = tintTileGradient(240, '#66ffaa', '#228855');

    // Enemies by biome (gradient tinted for depth — more distinct per biome)
    SPR.enemies = {
        forest: { frames: [tintTileGradient(320,'#66cc33','#2a6611'), tintTileGradient(321,'#66cc33','#2a6611'), tintTileGradient(322,'#66cc33','#2a6611')], color: '#55aa22' },
        cave:   { frames: [tintTileGradient(340,'#9988dd','#443388'), tintTileGradient(341,'#9988dd','#443388'), tintTileGradient(342,'#9988dd','#443388')], color: '#7766bb' },
        swamp:  { frames: [], color: '#998822', customSprites: true } // Will load custom sprites
    };
    
    // Custom enemy sprites (loaded separately)
    SPR.customEnemies = {
        swamp: {
            normal: null,    // alligator_baby.png
            elite: null,     // alligator.png
            boss: null,      // anaconda.png
            variant: null    // alligator_snapping_turtle.png
        }
    };

    // Herbs/ingredients (colored gems/items)
    SPR.herbs = {
        greenLeaf:  tintTile(21, '#44dd88'),
        redBerry:   tintTile(21, '#ee4444'),
        blueMush:   tintTile(21, '#4488ee'),
        yellowRoot: tintTile(21, '#ddaa22'),
        purpleMoss: tintTile(21, '#aa44dd'),
        caveCrystal:tintTile(1, '#88ccff'),
        firestone:  tintTile(1, '#ff6622'),
        swampGoo:   tintTile(21, '#88aa33')
    };

    // Potions (colored bottles)
    SPR.potions = {
        red:    tintTile(96, '#ee4444'),
        blue:   tintTile(96, '#4488ee'),
        green:  tintTile(96, '#44dd88'),
        yellow: tintTile(96, '#ddaa22'),
        purple: tintTile(96, '#aa44dd'),
        orange: tintTile(96, '#ff8833')
    };

    // Decorations
    SPR.plants = [13,14,15,16,17,18,19].map(i => extractTile(i));
    SPR.rocks = [9,10,29].map(i => extractTile(i));
    SPR.cover = [extractTile(9), extractTile(10), extractTile(29)];

    // UI icons
    SPR.heart = tintTile(40, '#ee4444');
    SPR.sword = tintTile(166, '#ffffff');
    SPR.shield = tintTile(96, '#4488ee');

    console.log('[Sprites] Ready');
}

// Load custom enemy sprites
function loadCustomEnemySprites() {
    return new Promise(function(resolve) {
        var toLoad = [
            { path: 'enemy_sprites/alligator_baby.png', target: 'swamp', type: 'normal' },
            { path: 'enemy_sprites/alligator.png', target: 'swamp', type: 'elite' },
            { path: 'enemy_sprites/anaconda.png', target: 'swamp', type: 'boss' },
            { path: 'enemy_sprites/alligator_snapping_turtle.png', target: 'swamp', type: 'variant' }
        ];
        var loaded = 0;
        var total = toLoad.length;
        
        if (total === 0) { resolve(); return; }
        
        toLoad.forEach(function(item) {
            var img = new Image();
            img.onload = function() {
                SPR.customEnemies[item.target][item.type] = img;
                loaded++;
                if (loaded === total) {
                    console.log('[Custom Enemy Sprites] Loaded ' + total + ' sprites');
                    resolve();
                }
            };
            img.onerror = function() {
                console.warn('[Custom Enemy Sprites] Failed to load: ' + item.path);
                loaded++;
                if (loaded === total) resolve();
            };
            img.src = item.path;
        });
    });
}
