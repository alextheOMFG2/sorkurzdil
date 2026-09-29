import { vector2 } from "./basics.ts";
import config, { b2btype, gameConfig, garbageGeneration, garbagePacket, pieceChoices, wavetype } from "./config.ts"
import roms from "./roms";
import { kickSystems } from "./rotationsystems.ts";

const prefabs:{[key:string]:gameConfig} = {
    default:new gameConfig()
}

{
    let _gameConfig = new gameConfig()
    _gameConfig.forcehandling = true;
    _gameConfig.sdarr = 1000/30;
    _gameConfig.usesdarr = true;
    _gameConfig.levelgravity = true;
    _gameConfig.startlevel = 19;
    _gameConfig.lockTime = 2*1000/60;
    _gameConfig.allowHardDrop = false;
    _gameConfig.allow180 = false;
    _gameConfig.are = 10*1000/60;
    _gameConfig.areincrease = 0.5*1000/60;
    _gameConfig.areincreaseresolution = 2*1000/60;
    _gameConfig.lineclearare = 20*1000/60

    _gameConfig.pieceChoice = pieceChoices.random(roms.bagprefabs.arcade);
    _gameConfig.kickSystem = kickSystems.righthanded;
    _gameConfig.queuesize = 1;
    _gameConfig.holdsize = 0;
    _gameConfig.drawGhost = false;
    _gameConfig.aligntoptile = true;
    _gameConfig.spawnOffset = new vector2(0,-1);
    _gameConfig.droughteligible = true;

    prefabs["master"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()
    _gameConfig.mission = config.missions.lines(40);
    _gameConfig.scorer = config.scorers.speed;

    prefabs["40l"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()
    _gameConfig.width = 5
    _gameConfig.height = 10
    _gameConfig.boardscalar = new vector2(2,2)

    prefabs["big"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()
    _gameConfig.allowFlips = true;
    _gameConfig.pieceChoice = pieceChoices.bags(roms.bagprefabs.freeTetrominos);

    prefabs["freetennis"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()
    _gameConfig.allowRotation = false;
    _gameConfig.pieceChoice = pieceChoices.bags(roms.bagprefabs.fixedTetrominos);

    prefabs["fixedtennis"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()
    _gameConfig.lineclearshiftdown = false;
    _gameConfig.verticallineclears = true;
    _gameConfig.activepiecephasethroughblocks = true;
    _gameConfig.allowAirLock = true;
    _gameConfig.allowShiftUp = true;

    _gameConfig.usegravity = false;
    _gameConfig.drawGhost = false;

    _gameConfig.width = 8
    _gameConfig.height = 8

    prefabs["blockblast"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.warlockwounds = 20
    _gameConfig.keeplastlineclear = true;
    _gameConfig.woundsChoice = garbageGeneration.damnation()

    _gameConfig.initialisegarbage = [
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
      new garbagePacket(1),
    ]

    prefabs["warlock"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.magicianwounds = 1
    _gameConfig.keeplastlineclear = true;

    prefabs["magician"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.constraints.push(config.constraints.b2bhealth)

    prefabs["tech"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.techpluswounds = 20
    _gameConfig.b2btype = b2btype.tech

    prefabs["techplus"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.gravity = 0;
    _gameConfig.levelLocktimes = true;

    prefabs["freefall"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()
    
    _gameConfig.mission = config.missions.lines(4*7);
    _gameConfig.scorer = config.scorers.pc;
    _gameConfig.constraints.push(config.constraints['4hpc'])

    prefabs["allpc28"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.wave = [
        new garbagePacket(2),
    ]

    _gameConfig.wavetype = wavetype.ontimer;

    _gameConfig.scorer = config.scorers.survival

    _gameConfig.garbageare = 500
    _gameConfig.garbageripen = 500

    prefabs["survival"] = _gameConfig
}

{
    let _gameConfig = new gameConfig()

    _gameConfig.twoplayer = true
    _gameConfig.mission = config.missions.attack(20)

    prefabs["twoplayer"] = _gameConfig
}

export default prefabs