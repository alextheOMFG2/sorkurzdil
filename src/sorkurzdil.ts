import roms, { piece } from './roms.ts'
import { colour3, modular, vector2 } from './basics.ts'
import { b2btype, cameraMode, Command, gameConfig, garbageGeneration, garbageGeneratorInitiator, garbagePacket, garbageType, levelling, simplescoring, userConfig, wavetype } from './config.ts';
import { act } from '@testing-library/react';
import InputManager from './inputmanager.ts'
import { board, matrix, tile } from './board.ts'
import MovementManager from './movementmanager.ts';
import visualFlags from './visualflags.ts';
import { ReactElement } from 'react';
import { gimmickReport } from './gimmicks.ts';

export class game{
    gameConfig:gameConfig;
    userConfig:userConfig;
    inputManager:InputManager;
    
    flags:visualFlags = new visualFlags();

    gameOn = false;
    gameOver = false;
    gameFailed = true;

    time = 0;

    levels = 0;
    score = 0;
    pieces = 0;

    keys = 0;

    waves = 0;
    lines = 0;
    attack = 0; //unimplemented
    defense = 0; //unimplemented
    dig = 0;
    pc = 0;

    talentless = true; //unimplemented
    extratalentless = true; //unimplemented
    drought = 0; //unimplemented

    finesse = 0; //unimplemented
    allperfect = true; //unimplemented
    fullcombo = true; //unimplemented

    b2b = -1;
    combo = -1;
    health = 0;

    piecesTimes:number[] = [];

    constructor(_gameConfig:gameConfig,_userConfig:userConfig,inputManager:InputManager){
        this.gameConfig = _gameConfig;
        this.userConfig = _userConfig;
        this.inputManager = inputManager;
    }
}

export class gameManager{
    inputManager:InputManager;
    movementManager:MovementManager;
    debugDisplay:any;

    garbageChoice:garbageGeneratorInitiator;
    woundChoice:garbageGeneratorInitiator;
    pieceChoice:Generator<piece>;

    board:board;
    game:game;
    game2?:game;
    swap=false;

    gameDelay:number;

    garbageQueue:garbagePacket[]=[];

    constructor(debugDisplay:ReactElement,_gameConfig?:gameConfig,_userConfig?:userConfig,inputManager?:InputManager){
        this.debugDisplay = debugDisplay
        
        _gameConfig = _gameConfig?.copy()||new gameConfig();
        _userConfig = _userConfig||new userConfig();

        if(_gameConfig.forcehandling){
            _userConfig.arr = _gameConfig.arr;
            _userConfig.das = _gameConfig.das;
            _userConfig.sdf = _gameConfig.sdf;
            _userConfig.sdarr = _gameConfig.sdarr;
            _userConfig.usesdarr = _gameConfig.usesdarr;
        }
        
        this.inputManager = inputManager||new InputManager(_userConfig);

        this.game = new game(_gameConfig,_userConfig,this.inputManager);
        if(_gameConfig.twoplayer)
            this.game2 = new game(_gameConfig,_userConfig,this.inputManager);

        const _matrix = new matrix(_gameConfig.width,_gameConfig.height);
        const piecespawnlocation = new vector2(Math.ceil(_gameConfig.width/2) - 1,_gameConfig.height).add(_gameConfig.spawnOffset);
        this.board = new board(_matrix,piecespawnlocation)

        this.pieceChoice = _gameConfig.pieceChoice.generator();
        this.board.activepiece = this.PopQueue();

        this.gameDelay = _userConfig.gameStartDelay;

        this.movementManager = new MovementManager(this.game,this.board);

        for(const i of _gameConfig.initialisegarbage)
            this.garbageQueue.push(i.copy());
        
        this.game.levels = Math.max(Math.floor(this.game.lines / 10),_gameConfig.startlevel);
        if(_gameConfig.levelgravity)
            _gameConfig.gravity = roms.levelsGravities[Math.min(roms.levelsGravities.length-1,this.game.levels)]

        this.garbageChoice = _gameConfig.garbageChoice?
            _gameConfig.garbageChoice() : garbageGeneration.straight()()
        this.woundChoice = _gameConfig.woundsChoice?
            _gameConfig.woundsChoice() : garbageGeneration.messy()()
        this.cheeseChoice = _gameConfig.cheeseChoice?
            _gameConfig.cheeseChoice()(this.game.gameConfig.cheeseType,_gameConfig.width) : garbageGeneration.messy()()(this.game.gameConfig.cheeseType,_gameConfig.width)

        this.game.inputManager.onKeyDown.push((command:Command)=>{
            if(this.game.gameOver || !this.game.gameOn) return;
            this.game.keys++

            switch(command){
                case Command.Discard:
                    for(let i=0; i<_gameConfig.discardsize; i++)
                        this.board.activepiece = this.PopQueue();
                    if(_gameConfig.discardsize > 0)
                        this.movementManager.SpawnPiece();
                    break;
                case Command.Hold:
                    this.Hold();
                    break;
                case Command.SpawnGarbage:
                    if(!_gameConfig.debug)break;
                    this.SpawnGarbage(1);
                    break;
                case Command.SpawnGarbage4:
                    if(!_gameConfig.debug)break;
                    this.SpawnGarbage(20);
                    break;
                case Command.SpawnWound:
                    if(!_gameConfig.debug)break;
                    this.SpawnWound(1);
                    this.game.flags.otheralerts.push({
                        time: Date.now(),
                        code:"pc",
                    })
                    break;
                case Command.ToggleCamera:
                    this.game.userConfig.cameraMode++;
                    this.game.userConfig.cameraMode%=Object.keys(cameraMode).length / 2;
                    break;
            }
        })

        this.movementManager.onLock.push((spin:boolean,mini:boolean,immobile:boolean,_gimmickReport:gimmickReport)=>{
            this.OnLock(spin,mini,immobile,_gimmickReport);
        });
    }

    //pieces stuff

    PopBag(){
        let piece = this.pieceChoice.next().value;
        return piece;
    }
    
    bag:piece[] = [];
    queue:piece[] = [];
    hold:piece[] = [];

    UpdateQueue(){
        let exhaust = 0;
        while(this.queue.length < this.game.gameConfig.queuesize){
            this.queue.push(this.PopBag());

            exhaust++;
            if(exhaust > 3000){
                throw new Error("your took too long");
            }
        }
    }

    PopQueue(){
        if(this.queue.length <= 0)
            this.UpdateQueue();
        let piece = this.queue.splice(0,1)[0];
        this.UpdateQueue();
        return piece;
    }

    holdsused = 0;

    Hold(){
        if(!this.board.activepiece)
            return

        if(this.game.gameConfig.holdsize <= 0)
            return

        if (this.holdsused >= this.game.gameConfig.holds && !this.game.gameConfig.infinitehold)
            return

        this.board.activepiece.RotateTo(0);
        this.board.activepiece.Hadamard(this.board.activepiece.chirality);
        this.hold.push(this.board.activepiece)
        
        if (this.hold.length > this.game.gameConfig.holdsize){
            this.board.activepiece = this.hold.splice(0,1)[0];
        }
        else{
            this.board.activepiece = this.PopQueue();
        }
        this.movementManager.SpawnPiece();
        
        this.holdsused++;
    }

    //locking

    lastCleared = "";
    lastClearedWarlock = "";

    ComboAdjacent(piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean){
        var pc = this.board.matrix.PerfectClear();
        var [combobreak,b2bbreak] = [false,false]
        
        if(lines <= 0){
            this.game.combo = -1;
            combobreak = true;
        }
        else
            this.game.combo++;
        
        switch(this.game.gameConfig.b2btype){
            case b2btype.lenient:
                if(lines >= 4 || spin || mini || immobile || pc)
                    this.game.b2b++;
                else if(lines >= 1){
                    this.game.b2b = -1;
                    b2bbreak = true;
                }
                break
            case b2btype.b2b:
                if(lines >= 4 || ((spin || mini || immobile) && lines >= 1) || pc)
                    this.game.b2b++;
                else if(lines >= 1){
                    this.game.b2b = -1;
                    b2bbreak = true;
                }
                break
            case b2btype.guideline:
                if(lines >= 4 || ((spin || mini) && piecejustplaced.name === "T" && lines >= 1) || pc)
                    this.game.b2b++;
                else if(lines >= 1){
                    this.game.b2b = -1;
                    b2bbreak = true;
                }
                break
            case b2btype.tech:
                if(((spin || mini) && lines >= 1) || pc)
                    this.game.b2b++;
                else if(lines >= 1){
                    this.game.b2b = -1;
                    b2bbreak = true;
                }
                break
        }

        var magicianbreak = false;
        var warlockbreak = false;
        
        if(lines >= 1 || spin || mini || immobile){
            const lastCleared = ((spin || mini || immobile) ? piecejustplaced.name : "") + lines + ((mini || immobile) ? "m" : "");
            const lastClearedWarlock = (spin || mini || immobile) ? lines.toString() : "v";

            magicianbreak = lastCleared === this.lastCleared;
            warlockbreak = lastClearedWarlock === this.lastClearedWarlock
            
            this.lastCleared = lastCleared;
            this.lastClearedWarlock = lastClearedWarlock;
        }

        if(spin || mini || immobile || lines >= 4){
            if(!spin && !mini && !immobile)
                this.game.health += lines - 1;
            else if(mini)
                this.game.health += lines / 2;
            else if(lines <= 0)
                this.game.health += 0.4;
            else if(lines <= 2)
                this.game.health += lines;
            else if(lines == 3)
                this.game.health += 3.6;
            else if(lines == 4)
                this.game.health += 16;
            else if(lines >= 5)
                this.game.health += 20;
        }else if(!pc){
            if(lines >= 1){
                this.game.health -= 5;
            }
            else if(this.game.health > 16){
                this.game.health -= Math.min(0.8,this.game.health - 16);
            }
        }

        if(pc && this.game.lines > 8)
            this.game.health += 16;

        var healthdeath = this.game.health < 0;

        this.game.health = Math.max(0,Math.min(20,this.game.health));

        return [combobreak,b2bbreak,magicianbreak,warlockbreak,healthdeath]
    }

    ComboWhatever(combobreak:boolean,b2bbreak:boolean,magicianbreak:boolean,warlockbreak:boolean,healthdeath:boolean,oldb2b:number,oldcombo:number,lines:number){
        if(combobreak && oldcombo >= 1)
            this.game.flags.otheralerts.push({
                time: Date.now(),
                code:"combobreak",
                info:oldcombo,
            })

        if(b2bbreak && oldb2b >= 1)
            this.game.flags.otheralerts.push({
                time: Date.now(),
                code:"b2bbreak",
                info:oldb2b,
            })
        
        let problematicLineClear = 0;
        if(b2bbreak){
            this.SpawnWound(this.game.gameConfig.techpluswounds);
            problematicLineClear += this.game.gameConfig.techpluswounds;
        }
        if(magicianbreak){
            this.SpawnWound(this.game.gameConfig.magicianwounds);
            problematicLineClear += this.game.gameConfig.magicianwounds;
        }
        if(warlockbreak){
            this.SpawnWound(this.game.gameConfig.warlockwounds);
            problematicLineClear += this.game.gameConfig.warlockwounds;
        }

        if(problematicLineClear <= 0 && lines >= 1){
            this.ClearWound(1);
        }

        if(healthdeath){
            this.game.flags.negativeb2bmeter = true;
        }
    }

    ClearWound(counts:number){
        for(let y=0; y<this.board.matrix.effectiveHeight+1; y++){
            for(let x=0; x<this.board.matrix.width; x++){
                let i = new vector2(x,y);
                const _tile = this.board.matrix.GetTile(i);
                if(!_tile) continue;
                if(!_tile.wound) continue;
                _tile.wound-= counts;
                if(_tile.wound <= 0){
                    _tile.wound = undefined;
                    _tile.countstoclear = true;
                }
            }
        }
    }

    GarbageEnter(){
        var toEnter = this.game.gameConfig.garbagecap;
        for (let i = 0; i < this.garbageQueue.length; i++) {
            const packet = this.garbageQueue[i];
            if(packet.used) continue;
            if(packet.entrance < this.game.gameConfig.garbageentry) continue;
            if(packet.ripen < this.game.gameConfig.garbageripen) continue;

            if(packet.lines <= toEnter){
                toEnter -= packet.lines
                this.garbagebuffer.push(packet)
                packet.used = true;
                packet.ripen = 0;
            }else{
                var cutpiece = packet.copy()
                cutpiece.cut = true;

                cutpiece.lines = toEnter;
                packet.lines -= toEnter;
                cutpiece.maxlines = cutpiece.lines;
                packet.maxlines = packet.lines;

                this.garbageQueue.splice(i,0,cutpiece)

                cutpiece.used = true;
                cutpiece.ripen = 0;
                this.garbagebuffer.push(cutpiece)

                break
            }
        }
        this.StepGarbage(0);
    }

    GarbageCancel(outgoing:number){
        var toCancel = outgoing;

        var deletion:number[] = [];

        for (let i = 0; i < this.garbageQueue.length; i++) {
            const packet = this.garbageQueue[i];
            if(packet.used) continue;

            if(packet.lines <= toCancel){
                toCancel -= packet.lines
                packet.lines = 0;

                deletion.push(i)
            }else{
                packet.lines -= toCancel;
                packet.maxlines = packet.lines;

                break
            }
        }
        
        while(deletion.length > 0)
            this.garbageQueue.splice(deletion.pop() as number,1);

        return [toCancel, outgoing - toCancel]
    }

    CalculateAttack(piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean){
        var pc = this.board.matrix.PerfectClear();
        var attack = 0
        if(lines > 6)
            lines = 5 // i think it would be cool

        attack += this.game.gameConfig.attacking(this.game,piecejustplaced,lines,spin,mini,immobile,pc)

        var [attack, defense] = this.GarbageCancel(attack);

        this.game.attack += attack;
        this.game.defense += defense;
    }

    CalculateScore(piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean){
        var pc = this.board.matrix.PerfectClear();
        var score = 0
        if(lines > 6)
            lines = 5

        score += this.game.gameConfig.simplescoring(this.game,piecejustplaced,lines,spin,mini,immobile,pc)

        if(this.game.gameConfig.levelscore)
            score *= this.game.levels + 1

        this.game.score +=  score;
    }

    lineclearare = false;
    OnLock(spin:boolean,mini:boolean,immobile:boolean,_gimmickReport:gimmickReport){
        if(!this.board.activepiece)
            throw new Error("?")

        const piecejustplaced = this.board.activepiece.copy(); // keep track of piece
        const justplacedlocation = this.board.activeposition;
        this.board.activepiece = undefined; //some housekeeping stuff
        this.inputManager.bufferinputs = true;
        this.holdsused = 0;
        this.areelapsed = 0;

        if(this.game.gameConfig.areincreaseresolution >0)
            this.areelapsed -= Math.ceil(justplacedlocation.y * this.game.gameConfig.areincrease / this.game.gameConfig.areincreaseresolution) * this.game.gameConfig.areincreaseresolution
        else
            this.areelapsed -= justplacedlocation.y * this.game.gameConfig.areincrease

        var [lines, dig] = this.board.matrix.MarkClears(); //line clears
        lines += _gimmickReport.lines;
        if(this.game.gameConfig.verticallineclears)
            lines += this.board.matrix.MarkClearsVert();
        if(lines > 0)
            this.lineclearare = true;
        
        this.game.pieces++; //gamestate and score related stuff
        this.game.lines += lines;
        this.game.dig += dig;
        if (this.game.gameConfig.levelling === levelling.nes){
            this.game.levels = Math.max(Math.floor(this.game.lines / 10),this.game.gameConfig.startlevel);
        }
        if(this.board.matrix.PerfectClear()){
            this.game.flags.otheralerts.push({
                time: Date.now(),
                code:"pc",
            })
            this.game.pc++;
        }

        this.CalculateScore(piecejustplaced,lines,spin,mini,immobile);
        this.CalculateAttack(piecejustplaced,lines,spin,mini,immobile)

        this.game.flags.lineclearalerts.push({ //tell renderer we linecleared so they can draw the thing
            time:Date.now(),
            piecejustplaced:piecejustplaced,
            lines:lines,
            spin:spin,
            mini:mini,
            immobile:immobile,
            combo:this.game.combo,
        })
            
        const [oldcombo,oldb2b] = [this.game.combo,this.game.b2b] // a bunch of combo and b2b handling stuff
        const [combobreak,b2bbreak,magicianbreak,warlockbreak,healthdeath] = this.ComboAdjacent(piecejustplaced,lines,spin,mini,immobile)
        this.ComboWhatever(combobreak,b2bbreak,magicianbreak,warlockbreak,healthdeath,oldb2b,oldcombo,lines);

        if(lines <= 0 || !this.game.gameConfig.comboBlocking) // garbage related stuff
            this.GarbageEnter()
        else if (lines > 0)
            this.garbageelapsed -= this.game.gameConfig.garbagehesitation;

        
        this.EvaluateMission();
        if(this.game.pieces % 7 == 0 && this.game.gameConfig.twoplayer && !this.game.gameOver){
            var a = this.game
            this.game = this.game2 as game
            this.game2 = a
            this.swap = !this.swap
            
            this.game.gameOver = false
            this.board.matrix.GreyAll()
            this.areelapsed -= this.game.gameConfig.swapplayerare
        }
        this.StepAre(0);
    }

    //board stuff

    garbagebuffer:garbagePacket[]=[];
    currentpacket:garbagePacket|undefined;
    iscut = false;
    currentgenerator:Generator<tile[], never, unknown>|undefined;
    garbageelapsed:number=0;

    SpawnLines(choice:garbageGeneratorInitiator,_garbageType:garbageType,numberlines:number){
        const generator = choice(_garbageType,this.board.matrix.width)
        for (let i = 0; i < numberlines; i++) {
            var newline = generator.next().value;
            for(const _tile of newline){
                _tile.birth = Date.now();
                _tile.isGarbage = true;
            }
            if(this.movementManager.Grounded())
                this.board.activeposition = this.board.activeposition.add(vector2.up);
            this.board.matrix.AddGarbageLine(newline);
        }
    }

    SpawnGarbage(numberlines:number){
        this.SpawnLines(this.garbageChoice,this.game.gameConfig.garbageType,numberlines)
    }

    StepGarbage(deltaTime:number){
        if(!this.currentpacket || !this.currentgenerator){
            if(this.garbagebuffer.length <= 0){
                this.garbageelapsed = this.game.gameConfig.garbageare;
                return;
            }
            else{
                this.currentpacket = this.garbagebuffer.splice(0,1)[0]
                this.currentpacket.ripen = this.game.gameConfig.garbageare
                this.currentgenerator = (this.garbageChoice)(this.game.gameConfig.garbageType,this.board.matrix.width)
            }
        }
        
        this.garbageelapsed += deltaTime;
        this.currentpacket.ripen += deltaTime;

        while(this.garbageelapsed >= this.game.gameConfig.garbageare){
            this.garbageelapsed -= this.game.gameConfig.garbageare;

            var newline = this.currentgenerator.next().value;
            for(const _tile of newline){
                _tile.birth = Date.now();
                _tile.isGarbage = true;
            }
            if(this.movementManager.Grounded())
                this.board.activeposition = this.board.activeposition.add(vector2.up);
            this.board.matrix.AddGarbageLine(newline);
            this.board.yoffset--;

            this.currentpacket.lines--;
            if(this.currentpacket.lines <= 0){
                if(this.garbagebuffer.length <= 0){
                    this.currentpacket = undefined
                    this.garbageelapsed = this.game.gameConfig.garbageare;
                    return;
                }
                else{
                    if(!this.currentpacket.cut){
                        this.currentgenerator = (this.garbageChoice)(this.game.gameConfig.garbageType,this.board.matrix.width)
                        this.garbageelapsed -= this.game.gameConfig.garbagepacketare;
                    }
                    this.currentpacket = this.garbagebuffer.splice(0,1)[0]
                    this.currentpacket.ripen = this.garbageelapsed
                }
            }

        }
    }

    SpawnWound(numberlines:number){
        const generator = (this.woundChoice)(this.game.gameConfig.woundsType,this.board.matrix.width)
        for (let i = 0; i < numberlines; i++) {
            var newline = generator.next().value;
            for(const _tile of newline){
                _tile.birth = Date.now();
                _tile.isGarbage = true;
                _tile.wound = this.game.gameConfig.woundsclearby;
                _tile.countstoclear = false;
            }
            if(this.movementManager.Grounded())
                this.board.activeposition = this.board.activeposition.add(vector2.up);
            this.board.matrix.AddGarbageLine(newline);
        }
    }

    //general game stuff

    ClearLineAndShiftActive(){
        var lines:number[] = [];
        if(this.game.gameConfig.verticallineclears){
            this.board.matrix.ClearLinesIncludeVert(this.game.gameConfig.lineclearare + this.game.gameConfig.linecleartime)
        }else
            lines = this.board.matrix.ClearLines(this.game.gameConfig.lineclearare + this.game.gameConfig.linecleartime,!this.game.gameConfig.lineclearshiftdown);

        for(const line of lines){
            if (line < this.board.activeposition.y)
                this.board.activeposition = this.board.activeposition.add(vector2.down);
        }
    }
    
    areelapsed = 0;

    StepAre(deltaTime:number){
        this.areelapsed += deltaTime;
        
        var useare = this.game.gameConfig.are;
        if(this.lineclearare)
            useare = this.game.gameConfig.lineclearare;
        if(this.areelapsed > useare){
            this.ClearLineAndShiftActive();

            this.board.activepiece = this.PopQueue();
            this.movementManager.SpawnPiece();

            this.lineclearare = false;
            this.areelapsed = 0;
        }
    }

    StepGarbageQueue(deltaTime:number){
        let workingdeltaTime = deltaTime;
        for(const packet of this.garbageQueue){
            if(packet.entrance < this.game.gameConfig.garbageentry){
                const deltaWorkingDeltaTime = Math.min(this.game.gameConfig.garbageentry - packet.entrance,workingdeltaTime)
                packet.entrance += deltaWorkingDeltaTime;
                workingdeltaTime -= deltaWorkingDeltaTime;
                if(packet.entrance >= this.game.gameConfig.garbageentry && deltaWorkingDeltaTime > 0)
                    this.game.flags.shakeincrease += packet.lines/4
            }
            else if(!packet.used)
                packet.ripen += deltaTime
        }
    }

    waveelapsed = 0

    SpawnWave(){
        this.game.waves++;
        for(const i of this.game.gameConfig.wave)
            this.garbageQueue.push(i.copy());
    }

    StepWave(deltaTime:number){
        this.waveelapsed += deltaTime
        let timerhit = 0
        while(this.waveelapsed >= this.game.gameConfig.waveinterval && timerhit < 20){
            timerhit++;
            this.waveelapsed -= this.game.gameConfig.waveinterval;  
        }
        
        switch(this.game.gameConfig.wavetype){
            case wavetype.ontimer:
            case wavetype.skippable:
                for (let _ = 0; _ < timerhit; _++)
                    this.SpawnWave();

                this.game.flags.waveprogress = this.game.gameConfig.waveinterval ? (this.waveelapsed / this.game.gameConfig.waveinterval) : 1;

                if(this.game.gameConfig.wavetype === wavetype.ontimer) break;
            case wavetype.onexhaust:
                if(this.garbageQueue.length <= 0){
                    this.SpawnWave();
                    this.waveelapsed = 0;
                }
                break
            case wavetype.onclear:
                var inqueuegarbage = 0
                for(const i of this.garbageQueue)
                    inqueuegarbage += i.lines
                for(const i of this.garbagebuffer)
                    inqueuegarbage += i.lines
                if(this.board.matrix.GarbageLineCount() + inqueuegarbage <= this.game.gameConfig.clearthres)
                    this.SpawnWave();
        }
    }

    EvaluateMission(){
        const _mission = this.game.gameConfig.mission
        if(_mission){
            const missionReport = _mission(this.game);
            if(missionReport.win){
                this.game.gameFailed = false;
                this.game.gameOver = true;
                return
            }
        }
    
        for(const i of this.game.gameConfig.constraints){
            const alive = i(this.game)
            if(!alive){
                this.game.gameOver = true;
                return
            }
        }
    }

    cheeseChoice:Generator<tile[], never, unknown>;

    EvaluateCheese(){
        const cheesed = this.board.matrix.GarbageLineCount();
        const tocheese = this.game.gameConfig.cheeselayer - cheesed;
        for (let _ = 0; _ < tocheese; _++) {
            var newline = this.cheeseChoice.next().value;
            for(const _tile of newline){
                _tile.birth = Date.now();
                _tile.isGarbage = true;
            }
            if(this.movementManager.Grounded())
                this.board.activeposition = this.board.activeposition.add(vector2.up);
            this.board.matrix.AddGarbageLine(newline);
        }
    }

    Update(deltaTime:number){
        if(this.game.gameOver) return;

        if(!this.game.gameOn){
            const lastsecond = Math.floor(this.gameDelay/1000)
            this.gameDelay -= deltaTime
            if(this.game.userConfig.strideMode)
                this.gameDelay -= deltaTime
            const thissecond = Math.floor(this.gameDelay/1000)
            if(this.gameDelay <= 0){
                this.game.gameOn = true
                this.game.flags.otheralerts.push({
                    time:0,
                    code:"generic",
                    info:{
                        text:"open",
                        colour:new colour3(1,1,1)
                    },
                })
            }
            else if(lastsecond != thissecond){
                this.game.flags.otheralerts.push({
                    time:0,
                    code:"generic",
                    info:{
                        text:(this.game.userConfig.strideMode)?roms.stridenames[lastsecond]:lastsecond.toString(),
                        colour:new colour3(1,1,1)
                    },
                })
            }
            return
        }

        this.game.time += deltaTime;

        this.board.yoffset += Math.min(-this.board.yoffset,(this.game.gameConfig.garbageare>0)?deltaTime/this.game.gameConfig.garbageare:deltaTime)

        if(this.board.activepiece && this.inputManager.bufferinputs)
            this.game.inputManager.InputUnblock();

        if(!this.board.activepiece)
        {
            this.StepAre(deltaTime);
            return
        }
        this.ClearLineAndShiftActive();

        this.StepGarbage(deltaTime);
        this.StepGarbageQueue(deltaTime);
        this.StepWave(deltaTime);
        this.EvaluateCheese();

        this.movementManager.Update(deltaTime);

        this.EvaluateMission();

        this.DrawDebug(deltaTime)
    }

    fps:number[] = []

    DrawDebug(deltaTime:number){
        if(!this.game.gameConfig.debug) return;
        this.fps.push(Math.floor(1000/deltaTime))

        if(this.fps.length > 600)
            this.fps.splice(0,1)

        var totalfps = 0
        var worstfps = 1/0
        for(const i of this.fps){
            totalfps += i;
            worstfps = Math.min(worstfps,i)
        }
        totalfps /= this.fps.length

        //const tee = Date.now() / 1000
        //const x = (Math.sin(tee * Math.E)**2 + Math.sin(tee * Math.PI)**2 + Math.sin(tee)**2);
        //console.log(colour3.fromHSV(x % 1,1,1).toHex());
        var oeuao=""
        for (let i = 0; i < 32; i++) {
            oeuao += "\n" + colour3.fromHSV(0.75383,1,(modular.exp(i+1,9,33)-1)/32).toHex()
        }
        console.log(oeuao)
        
        this.debugDisplay.current.Update(totalfps+" "+worstfps)
    }
}