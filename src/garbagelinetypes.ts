import { Randomiser } from "./basics";
import { tile, tileType } from "./board";
import { tileModels } from "./roms";

export type garbageType = ()=>tile;
export type garbageGenerator = Generator<tile[], never, unknown>
export type garbageGeneratorInitiator = (_garbageType:garbageType,width: number) => garbageGenerator

export class BaseGarbageLineGenerator{
    randomiser:Randomiser;
    constructor(){
        this.randomiser = new Randomiser(Date.now())
    }

    Seed(seed:number){
        this.randomiser = new Randomiser(seed||Date.now())
    }

    Reset(){
        
    }

    GarbageType(_garbageType:garbageType):tile{
        return _garbageType();
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        this.PreNext(_garbageType,width)
        var line:tile[] = []
        for(let i=0; i<width; i++)
            line[i] = this.GarbageType(_garbageType)
        return line
    }

    PreNext(_garbageType:garbageType=tile.garbage,width:number){
        
    }
}

export class SwitchGarbageLineGenerator extends BaseGarbageLineGenerator{
    IsHole(i:number):boolean{
        return this.randomiser.next() <= 0.5
    }

    HoleType(_garbageType:garbageType):tile{
        return new tile();
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        this.PreNext(_garbageType,width)
        var line:tile[] = []
        for(let i=0; i<width; i++)
            if(this.IsHole(i))
                line[i] = this.HoleType(_garbageType);
            else
                line[i] = this.GarbageType(_garbageType);
        return line
    }
}

export class HolesGarbageLineGenerator extends SwitchGarbageLineGenerator{
    holes:number[]=[];

    HoleChoice(width:number):number[]{
        return [Math.floor(this.randomiser.next()*width)]
    }

    PreNext(_garbageType: garbageType | undefined, width: number): void {
        this.holes = this.HoleChoice(width)
    }

    IsHole(i: number): boolean {
        return this.holes.includes(i)
    }
}

export class MessyGarbage extends HolesGarbageLineGenerator{
    repeat:number|undefined;

    Reset(): void {
        this.repeat = undefined
    }

    HoleChoice(width: number): number[] {
        var hole = Math.floor(this.randomiser.next()*width)
        if(this.repeat!==undefined){
            hole = Math.floor(this.randomiser.next()*(width - 1))
            if(hole >= this.repeat)
                hole ++
        }
        return [hole]
    }
}

export class StraightGarbage extends HolesGarbageLineGenerator{
    hole:number|undefined

    Reset(): void {
        this.hole = undefined
        console.log("reset")
    }

    HoleChoice(width: number): number[] {
        this.hole = this.hole||Math.floor(this.randomiser.next()*width)
        return [this.hole]
    }
}

export class CheckerGarbage extends SwitchGarbageLineGenerator{
    parity:number=0

    Reset(): void {
        this.parity = 0
    }

    PreNext(_garbageType: garbageType | undefined, width: number): void {
        this.parity++
    }

    IsHole(i: number): boolean {
        return (i%2)==(this.parity%2)
    }
}

export class Damnation extends BaseGarbageLineGenerator{
    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        var choose = this.randomiser.next() < 0.5 ? 6 : 7;
        var left = width;
        for(let i=0; i<width; i++)
            if(this.randomiser.next() < choose / left){
                choose--;
                left--;
                line[i] = new tile();
            }
            else{
                left--;
                line[i] = _garbageType();
            }
        return line
    }
}

export class MultiholeGarbage extends BaseGarbageLineGenerator{
    constructor(holes:number){
        super()
        this.holes = holes;
    }

    holes:number;

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        var choose = this.holes;
        var left = width;
        for(let i=0; i<width; i++)
            if(this.randomiser.next() < choose / left){
                choose--;
                left--;
                line[i] = new tile();
            }
            else{
                left--;
                line[i] = _garbageType();
            }
        return line
    }
}

export class OneBlockGarbage extends HolesGarbageLineGenerator{
    GarbageType(_garbageType: garbageType): tile {
        return new tile()
    }

    HoleType(_garbageType: garbageType): tile {
        return _garbageType();
    }
}

export class SecretGrade extends SwitchGarbageLineGenerator{
    parity=-1;
    pong=-1;

    Reset(){
        this.parity = -1;
    }

    PreNext(_garbageType: garbageType | undefined, width: number): void {
        this.parity++;
        const diagonish = this.parity % (width - 1)
        this.pong = (Math.floor(this.parity / (width-1)) % 2 === 0 ? diagonish : (width - 1 - diagonish))
    }

    IsHole(i: number): boolean {
        return i==this.pong
    }
}

export class Diagonal extends SecretGrade{
    GarbageType(_garbageType: garbageType): tile {
        return new tile()
    }

    HoleType(_garbageType: garbageType): tile {
        return _garbageType();
    }
}

export class Bombs extends StraightGarbage{
    HoleType(_garbageType: garbageType): tile {
        const _tile = new tile(tileModels.bomb);
        _tile.countstoclear = false;
        _tile.tileType = tileType.bomb;
        return _tile
    }
}

export class Solid extends BaseGarbageLineGenerator{
    GarbageType(_garbageType: garbageType): tile {
        const _tile = _garbageType()
        _tile.countstoclear = false
        _tile.tileType = tileType.solid
        return _tile
    }
}