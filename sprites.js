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
        forest: { frames: [], color: '#55aa22', customSprites: true },
        cave:   { frames: [], color: '#7766bb', customSprites: true },
        swamp:  { frames: [], color: '#998822', customSprites: true }
    };
    
    // Custom enemy sprites (loaded separately)
    SPR.customEnemies = {
        forest: {
            floor1: [], floor2: [], floor3: [], floor4: [], floor5: []
        },
        cave: {
            floor1: [], floor2: [], floor3: [], floor4: [], floor5: []
        },
        swamp: {
            floor1: [], floor2: [], floor3: [], floor4: [], floor5: []
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
    console.log('[Custom Enemy Sprites] Starting to load...');
    return new Promise(function(resolve) {
        // Enemy distribution by biome and floor
        var enemyPools = {
            forest: {
                floor1: ['rat.png', 'grey_rat.png', 'quokka.png', 'butterfly.png', 'butterfly1.png', 'small_snake.png'],
                floor2: ['green_rat.png', 'orange_rat.png', 'sheep.png', 'black_sheep.png', 'bumblebee.png', 'snake.png'],
                floor3: ['wolf.png', 'jackal.png', 'hound.png', 'killer_bee.png', 'giant_beetle.png', 'viper.png'],
                floor4: ['bear.png', 'hog.png', 'war_dog.png', 'warg.png', 'queen_bee.png', 'giant_scorpion.png'],
                floor5: ['grizzly_bear.png', 'black_bear.png', 'polar_bear.png', 'hell_hound.png', 'death_yak.png']
            },
            cave: {
                floor1: ['giant_bat.png', 'wolf_spider.png', 'boring_beetle.png', 'worm.png', 'giant_cockroach.png'],
                floor2: ['jumping_spider.png', 'trapdoor_spider.png', 'giant_centipede.png', 'brain_worm.png', 'giant_mite.png'],
                floor3: ['tarantella.png', 'redback.png', 'scorpion.png', 'rock_worm.png', 'boulder_beetle.png'],
                floor4: ['giant_scorpion.png', 'giant_ant.png', 'soldier_ant.png', 'queen_ant.png', 'lava_worm.png'],
                floor5: ['kraken_head.png', 'giant_blowfly.png', 'moth_of_wrath.png', 'ghost_moth.png']
            },
            swamp: {
                floor1: ['giant_frog.png', 'blink_frog.png', 'giant_newt.png', 'giant_gecko.png', 'small_snake.png'],
                floor2: ['giant_toad.png', 'spiny_frog.png', 'iguana.png', 'gila_monster.png', 'water_moccasin.png'],
                floor3: ['alligator_baby.png', 'crocodile.png', 'komodo_dragon.png', 'sea_snake.png', 'swamp_worm.png'],
                floor4: ['alligator.png', 'snapping_turtle.png', 'alligator_snapping_turtle.png', 'black_mamba.png', 'giant_leech.png'],
                floor5: ['anaconda.png', 'electric_eel.png', 'shark.png', 'big_fish.png']
            }
        };
        
        var toLoad = [];
        for (var biome in enemyPools) {
            for (var floor in enemyPools[biome]) {
                enemyPools[biome][floor].forEach(function(filename) {
                    toLoad.push({ path: 'enemy_sprites/' + filename, biome: biome, floor: floor });
                });
            }
        }
        
        var loaded = 0;
        var total = toLoad.length;
        
        if (total === 0) { resolve(); return; }
        
        console.log('[Custom Enemy Sprites] Total to load:', total);
        
        toLoad.forEach(function(item) {
            var img = new Image();
            img.onload = function() {
                SPR.customEnemies[item.biome][item.floor].push(img);
                loaded++;
                if (loaded % 20 === 0) {
                    console.log('[Custom Enemy Sprites] Progress:', loaded + '/' + total);
                }
                if (loaded === total) {
                    console.log('[Custom Enemy Sprites] ✓ Successfully loaded ' + total + ' sprites');
                    console.log('[Custom Enemy Sprites] Forest floors:', Object.keys(SPR.customEnemies.forest).map(f => f + ':' + SPR.customEnemies.forest[f].length));
                    console.log('[Custom Enemy Sprites] Cave floors:', Object.keys(SPR.customEnemies.cave).map(f => f + ':' + SPR.customEnemies.cave[f].length));
                    console.log('[Custom Enemy Sprites] Swamp floors:', Object.keys(SPR.customEnemies.swamp).map(f => f + ':' + SPR.customEnemies.swamp[f].length));
                    resolve();
                }
            };
            img.onerror = function() {
                console.error('[Custom Enemy Sprites] ✗ Failed to load: ' + item.path);
                loaded++;
                if (loaded === total) {
                    console.warn('[Custom Enemy Sprites] Finished with errors. Loaded: ' + loaded + '/' + total);
                    resolve();
                }
            };
            img.src = item.path;
        });
    });
}
