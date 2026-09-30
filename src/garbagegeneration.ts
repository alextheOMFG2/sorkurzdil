import { Randomiser, vector2 } from "./basics";
import { board, tile, tileType } from "./board";
import { BaseGarbageLineGenerator, garbageType } from "./garbagelinetypes";
import { BasePieceGenerator } from "./piecechoice";
import { piece, tileModels } from "./roms";

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

export class DebrisGarbage extends BaseGarbageGenerator{
    pieceChoice:BasePieceGenerator

    constructor(pieceChoice:BasePieceGenerator){
        super()
        this.pieceChoice = pieceChoice
    }

    Seed(seed:number) {
        this.pieceChoice.Seed(seed)
    }

    Reset() {
        
    }

    LineEligible(_board:board,y:number):boolean{
        return _board.matrix.CountEmpties(y) > 1
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