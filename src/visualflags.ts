import { vector2 } from "./basics";
import { piece } from "./roms";


export type lineclearalert={
    time:number,
    piecejustplaced:piece,
    lines:number,
    spin:boolean,
    mini:boolean,
    immobile:boolean,
    combo:number,
}

export type otheralert={
    time:number,
    code:string,
    info?:any,
}

export default class visualFlags{
    lineclearalerts:lineclearalert[] = [];
    otheralerts:otheralert[] = [];
    nongravitydisplacementthisframe:vector2 = vector2.zero;
    piecechange = false;
    justspinned = false;
    shakeincrease = 0;

    waveprogress = 0;

    negativeb2bmeter=false;
}