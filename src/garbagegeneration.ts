import { Randomiser, vector2 } from "./basics";
import { board, tile, tileType } from "./board";
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

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        const hole = Math.floor(this.randomiser.next()*width)
        for(let i=0; i<width; i++)
            if(i === hole)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        return line
    }
}

export class MessyGarbage extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    repeat:number|undefined;

    Reset(): void {
        this.repeat = undefined
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        if(width <= 1)
            throw new Error("crazy edge case you get an achievement for finding this")
    
        var line:tile[] = []
        var hole = Math.floor(this.randomiser.next()*width)
        if(this.repeat!==undefined){
            hole = Math.floor(this.randomiser.next()*(width - 1))
            if(hole >= this.repeat)
                hole ++
        }
        for(let i=0; i<width; i++)
            if(i === hole)
                line[i] = new tile();
            else
                line[i] = _garbageType();

        return line
    }
}

export class StraightGarbage extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    hole:number|undefined

    Reset(): void {
        this.hole = undefined
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        this.hole = this.hole||Math.floor(this.randomiser.next()*width)
        for(let i=0; i<width; i++)
            if(i === this.hole)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        return line
    }
}

export class CheckerGarbage extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    parity:boolean|undefined

    Reset(): void {
        this.parity = undefined
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        this.parity = !this.parity
        var line:tile[] = []
        for(let i=0; i<width; i++)
            if((i % 2 === 0) == this.parity)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        return line
    }
}

export class RandomGarbage extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        for(let i=0; i<width; i++)
            if(this.randomiser.next() < 0.5)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        return line
    }
}

export class Damnation extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

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

export class OneBlockGarbage extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        const block = Math.floor(this.randomiser.next()*width)
        for(let i=0; i<width; i++)
            if(i !== block)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        return line
    }
}

export class SecretGrade extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    parity=0;

    Reset(){
        this.parity = 0;
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        const diagonish = this.parity % (width - 1)
        const pong = (Math.floor(this.parity / (width-1)) % 2 === 0 ? diagonish : (width - 1 - diagonish))
        for(let i=0; i<width; i++)
            if(i === pong)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        this.parity++;
        return line
    }
}

export class Diagonal extends SecretGrade{
    constructor(){
        super()
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        const diagonish = this.parity % (width - 1)
        const pong = (Math.floor(this.parity / (width-1)) % 2 === 0 ? diagonish : (width - 1 - diagonish))
        for(let i=0; i<width; i++)
            if(i !== pong)
                line[i] = new tile();
            else
                line[i] = _garbageType();
        this.parity++;
        return line
    }
}

export class Bombs extends StraightGarbage{
    constructor(){
        super()
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        for(let i=0; i<width; i++)
            if(i === this.hole){
                line[i] = new tile(tileModels.bomb);
                line[i].countstoclear = false;
                line[i].tileType = tileType.bomb;
            }
            else{
                line[i] = _garbageType();
                line[i].countstoclear = false;
            }
        return line
    }
}

export class Solid extends BaseGarbageLineGenerator{
    constructor(){
        super()
    }

    Next(_garbageType:garbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        for(let i=0; i<width; i++){
            line[i] = _garbageType();
            line[i].countstoclear = false;
            line[i].tileType = tileType.solid;
        }
        return line
    }
}

export class BaseGarbageGenerator{

    Seed(seed:number){

    }

    Reset(){

    }

    Spawn(_board:board,_garbageType:garbageType,numberlines:number){
        
    }
}

export class LinesGenerator extends BaseGarbageGenerator{
    currentGenerator:BaseGarbageLineGenerator;

    constructor(generator:BaseGarbageLineGenerator){
        super()
        this.currentGenerator = generator
    }

    Seed(seed:number) {
        this.currentGenerator.Seed(seed)
    }

    Reset() {
        this.currentGenerator.Reset()
    }

    Spawn(_board:board,_garbageType:garbageType,numberlines:number){
        for (let i = 0; i < numberlines; i++) {
            var newline = this.currentGenerator.Next(_garbageType,_board.matrix.width);
            for(const _tile of newline){
                _tile.birth = Date.now();
                _tile.isGarbage = true;
            }
            _board.matrix.AddGarbageLine(newline);
            _board.yoffset--;
        }
    }
}

export class SpecklesGarbage extends BaseGarbageGenerator{
    randomiser:Randomiser;
    height:number;

    constructor(height:number){
        super()
        this.randomiser = new Randomiser(Date.now())
        this.height = height
    }

    Seed(seed:number) {
        this.randomiser = new Randomiser(seed)
    }

    Reset() {
        
    }

    LineEligible(_board:board,y:number):boolean{
        return _board.matrix.CountEmpties(y) > 1
    }

    AddSpeckle(_board:board,_garbageType:garbageType,y:number){
        const insertat = Math.floor(this.randomiser.next() * _board.matrix.CountEmpties(y))
        var empty = 0
        for(let x=0; x<_board.matrix.width; x++){
            let i = new vector2(x,y);
            let thile = _board.matrix.GetTile(i);
            if(thile) continue
            if(empty!=insertat){
                empty += 1
                continue
            }
            const _tile = _garbageType()
            _tile.birth = Date.now();
            _tile.isGarbage = true;
            _board.matrix.SetTile(i,_tile)
            break
        }
    }

    Spawn(_board:board,_garbageType:garbageType,numberlines:number){
        for (let i = 0; i < numberlines; i++) {
            var y = -1;
            var heightleft = this.height;
            while(true){
                y++
                if(y>20000) throw new Error("how is this even possible to trigger")

                if(!this.LineEligible(_board,y)) continue
                if(this.randomiser.next() > 1 / heightleft){
                    heightleft--;
                    continue
                }

                this.AddSpeckle(_board,_garbageType,y)
                break
            }
        }
    }
}