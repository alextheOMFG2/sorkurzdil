import { colour3, vector2 } from './basics.ts'
import krux from './krexkd.png'
import { kickType, simpleKickType, SpinType, symmetry } from './rotationsystems.ts';
import { tileType } from './board.ts';

const lightmode = Object.freeze({
  garbage: colour3.fromHex("#adafb8"),

  I: colour3.fromHex("#f24b4b"),
  L: colour3.fromHex("#f2834b"),
  O: colour3.fromHex("#f2f24b"),
  Z: colour3.fromHex("#4bf24b"),
  T: colour3.fromHex("#4bf2f2"),
  J: colour3.fromHex("#4b4bf2"),
  S: colour3.fromHex("#f24bf2"),
  chartreuse: colour3.fromHex("#83f24b"),
  greenish: colour3.fromHex("#4bf283"),
  blue: colour3.fromHex("#4b83f2"),
  violent: colour3.fromHex("#834bf2"),
  pink: colour3.fromHex("#f24b83"),

  wound: colour3.fromHex("#834bf2"),

  attackunentered: colour3.fromHex("#adafb8"),
  attackunripe: colour3.fromHex("#ff4b4b"),
  attackdormant: colour3.fromHex("#4b0000"),
  attackused: colour3.fromHex("#4b4b4b"),
  attack1: colour3.fromHex("#ff0000"),
  attack2: colour3.fromHex("#ffffff"),
  
  b2b: colour3.fromHex("#4bf2f2"),
  b2b2b: colour3.fromHex("#4b4bf2"),

  board: colour3.fromHex("#0b0013"),
  black: colour3.fromHex("#0b0013"),
  background: colour3.fromHex("#f2f2f2"),
  shine: colour3.fromHex("#ffffff"),
  
  great1: colour3.fromHex("#ffff00"),
  great2: colour3.fromHex("#00ffff"),

  get great(){
    if(Date.now() % 128 < 64)
      return "#ffff00";
    else
      return "#00ffff";
  },

  light: colour3.fromHex("#7f7983"),
  dark: colour3.fromHex("#593c63"),
  grey: colour3.fromHex("#4b4b4b"),

  none: new colour3(0,0,0,0),
})

const darkmode = Object.freeze({
  garbage: colour3.fromHex("#593c63"),

  I: colour3.fromHex("#f24b4b"),
  L: colour3.fromHex("#f2834b"),
  O: colour3.fromHex("#f2f24b"),
  Z: colour3.fromHex("#4bf24b"),
  T: colour3.fromHex("#4bf2f2"),
  J: colour3.fromHex("#4b4bf2"),
  S: colour3.fromHex("#f24bf2"),
  chartreuse: colour3.fromHex("#83f24b"),
  greenish: colour3.fromHex("#4bf283"),
  blue: colour3.fromHex("#4b83f2"),
  violent: colour3.fromHex("#834bf2"),
  pink: colour3.fromHex("#f24b83"),

  wound: colour3.fromHex("#834bf2"),

  attackunentered: colour3.fromHex("#adafb8"),
  attackunripe: colour3.fromHex("#ff4b4b"),
  attackdormant: colour3.fromHex("#4b0000"),
  attackused: colour3.fromHex("#4b4b4b"),
  attack1: colour3.fromHex("#ff0000"),
  attack2: colour3.fromHex("#ffffff"),
  
  b2b: colour3.fromHex("#4bf2f2"),
  b2b2b: colour3.fromHex("#4b4bf2"),

  board: colour3.fromHex("#0b0013"),
  black: colour3.fromHex("#7f7983"),
  background: colour3.fromHex("#000000"),
  shine: colour3.fromHex("#f2f2f2"),
  
  great1: colour3.fromHex("#ffff00"),
  great2: colour3.fromHex("#00ffff"),

  light: colour3.fromHex("#f2f2f2"),
  dark: colour3.fromHex("#adafb8"),
  grey: colour3.fromHex("#4b4b4b"),

  none: new colour3(0,0,0,0),
})

export const palette = lightmode;

export type colourpossibility = ()=>colour3

export class filledRectangle{
  position:vector2;
  size:vector2;
  colour:colour3|undefined;
  colourpossibility:colourpossibility|undefined;
  constructor(position:vector2,size:vector2,colour:colour3|colourpossibility){
    this.position = position;
    this.size = size;
    if (typeof colour == "function"){
      this.colourpossibility = colour
    }
    else{
      this.colour = colour;
    }
  }

  copy(){
    if(this.colourpossibility!==undefined)
      return new filledRectangle(this.position,this.size,this.colourpossibility);
    if(this.colour)
      return new filledRectangle(this.position,this.size,this.colour.copy());
    throw new Error("null colour");
  }

  frozen(){
    let robot = this.copy();
    robot.colour = this.evaluateColour();
    robot.colourpossibility = undefined;
    return robot;
  }

  evaluateColour(){
    if(this.colourpossibility!==undefined)
      return this.colourpossibility();
    if(this.colour)
      return this.colour;
    throw new Error("null colour");
  }
}

export class imageRectangle{
  position:vector2;
  size:vector2;
  image:string;
  alpha=1;
  constructor(position:vector2,size:vector2,image:string){
    this.position = position;
    this.size = size;
    this.image = image;
  }

  copy(){
    return new imageRectangle(this.position.copy(),this.size.copy(),this.image)
  }
}

export function SafeColour(c:colour3|colourpossibility){
  if(typeof(c) == "function"){
    return c()
  }
  return c
}

export class tileModel{
  rectangles:filledRectangle[]=[];
  images:imageRectangle[]=[];
  isNull:boolean;
  grey:boolean=true;
  firstcolour:colour3=new colour3(0,0,0);
  constructor(solidcolour?:colour3|colourpossibility){
    if(!solidcolour){
      this.isNull = true;
      return
    }
    this.isNull = false
    this.rectangles.push(new filledRectangle(vector2.zero,vector2.one,solidcolour));
    this.firstcolour = SafeColour(solidcolour);
  }

  static tripleRing(outer:colour3,middle?:colour3,inner?:colour3){
    let robot = new tileModel();

    const oRect = new filledRectangle(vector2.zero,vector2.one,outer)
    robot.rectangles.push(oRect);
    if(middle){
      const mRect = new filledRectangle(vector2.one.div(5),vector2.one.mul(3/5),middle)
      robot.rectangles.push(mRect);
    }
    if(inner){
      const iRect = new filledRectangle(vector2.one.mul(2/5),vector2.one.div(5),inner)
      robot.rectangles.push(iRect);
    }
    robot.isNull = false
    robot.firstcolour = outer;
    return robot
  }

  static tripleRingTransparency(outer:colour3,middle?:colour3,inner?:colour3){
    let robot = new tileModel();

    robot.rectangles.push(new filledRectangle(new vector2(0,0),new vector2(1,0.2),outer));
    robot.rectangles.push(new filledRectangle(new vector2(0,0.8),new vector2(1,0.2),outer));
    robot.rectangles.push(new filledRectangle(new vector2(0,0.2),new vector2(0.2,0.6),outer));
    robot.rectangles.push(new filledRectangle(new vector2(0.8,0.2),new vector2(0.2,0.6),outer));
    if(middle){
      robot.rectangles.push(new filledRectangle(new vector2(0.2,0.2),new vector2(0.6,0.2),middle));
      robot.rectangles.push(new filledRectangle(new vector2(0.2,0.6),new vector2(0.6,0.2),middle));
      robot.rectangles.push(new filledRectangle(new vector2(0.2,0.4),new vector2(0.2,0.2),middle));
      robot.rectangles.push(new filledRectangle(new vector2(0.6,0.4),new vector2(0.2,0.2),middle));
    }
    if(inner){
      const iRect = new filledRectangle(vector2.one.mul(2/5),vector2.one.div(5),inner)
      robot.rectangles.push(iRect);
    }
    robot.isNull = false
    robot.firstcolour = outer;
    return robot
  }

  static gradient(top:colour3,bottom:colour3,layers:number){
    let robot = new tileModel();

    for(let i=0; i<layers; i++){
      const x = i/layers;
      robot.rectangles.push(new filledRectangle(new vector2(0,x),new vector2(1,1/layers ),top.lerpq(bottom,x)));
    }
    
    robot.isNull = false
    robot.firstcolour = top;
    return robot
  }

  static sprite(image:string){
    let robot = new tileModel();

    robot.images.push(new imageRectangle(vector2.zero,vector2.one,image));
    robot.isNull = false
    return robot
  }

  copy(){
    let robot = new tileModel();
    for(const rect of this.rectangles)
      robot.rectangles.push(rect.copy());
    for(const rect of this.images)
      robot.images.push(rect.copy());
    robot.isNull = this.isNull;

    return robot;
  }
  colourOperation(op:(zis:colour3,...a:any[]) => colour3,...opargs:any[]){
    let robot = this.copy();
    for(const rect of robot.rectangles){
      rect.colour = op(rect.evaluateColour(),...opargs);
      rect.colourpossibility = undefined;
    }
    return robot;
  }

  lerp(other:colour3,t:number){
    return this.colourOperation(colour3.lerp,other,t)
  }

  lerpq(other:colour3,t:number){
    return this.colourOperation(colour3.lerpq,other,t)
  }

  withOpacity(opacity:number){
    const robot = this.copy()
    for(const rect of robot.rectangles){
      let col = rect.evaluateColour();
      col.a *= opacity;
      rect.colour = col;
      rect.colourpossibility = undefined;
    }
    for(const rect of robot.images){
      rect.alpha *= opacity;
    }
    return robot;
  }

  doNotGrey(){
    const robot = this.copy()
    robot.grey = false
    return robot;
  }
}

export const tileModels = Object.freeze({
  "none":new tileModel(),
  "garbage":new tileModel(palette.garbage),
  "I":new tileModel(palette.I),
  "L":new tileModel(palette.L),
  "O":new tileModel(palette.O),
  "Z":new tileModel(palette.Z),
  "T":new tileModel(palette.T),
  "J":new tileModel(palette.J),
  "S":new tileModel(palette.S),
  "V":new tileModel(),
  "U":new tileModel(),
  "W":new tileModel(),
  "X":new tileModel(),
  "H":new tileModel(),
  "N":new tileModel(),
  "Y":new tileModel(),
  "R":new tileModel(),
  "P":new tileModel(),
  "Q":new tileModel(),
  "grenade":tileModel.tripleRing(colour3.fromHex("#c9552a"),colour3.fromHex("#000000")).doNotGrey(),
  "bomb":tileModel.tripleRing(colour3.fromHex("#c9552a"),colour3.fromHex("#e5db22")).doNotGrey(),
  "permanent":new tileModel(colour3.fromHex("#593c63")).doNotGrey(),
  "impermanent":tileModel.tripleRing(colour3.fromHex("#593c63"),undefined,colour3.fromHex("#adafb8")).doNotGrey(),
});

export enum orientiation {
  north,
  east,
  south,
  west,
}

export const compensations = {
  [simpleKickType.none]:new vector2(0,0),
  [simpleKickType.T]:new vector2(0,0),
  [simpleKickType.I]:new vector2(0.5,0),
  [simpleKickType.O]:new vector2(0.5,0),
}

export const CORoffsets = {
  [simpleKickType.none]:new vector2(0,0),
  [simpleKickType.T]:new vector2(0,0),
  [simpleKickType.I]:new vector2(0.5,-0.5),
  [simpleKickType.O]:new vector2(0.5,0.5),
}

export class piece{
  name:string;

  tiles:vector2[];
  tileModel:tileModel;
  kickType:kickType;
  spinType:SpinType;
  orientiation=orientiation.north;
  chirality=vector2.one;
  symmetry=symmetry.none;

  tileType=tileType.none;

  constructor(tiles:vector2[],tileModel:tileModel,kickType:kickType,name?:string,spinType?:SpinType){
    this.tiles = tiles;
    this.tileModel = tileModel;
    this.kickType = kickType;
    this.name = name || this.tiles.toString();
    this.spinType = spinType || SpinType.immobilespin;
  }

  copy(){
    let newtiles:vector2[] = [];
    for(let i=0; i<this.tiles.length; i++)
      newtiles[i] = this.tiles[i].copy();
    let robot = new piece(newtiles,this.tileModel,this.kickType,this.name,this.spinType);
    robot.orientiation = this.orientiation;
    robot.tileType = this.tileType;
    robot.symmetry = this.symmetry;
    return robot;
  }

  Rotate(rotation:number){
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].rotate(rotation)
    }
    this.orientiation = (this.orientiation + rotation) % 4
  }

  rotated(rotation:number){
    let robot = this.copy();
    robot.Rotate(rotation);
    return robot;
  }

  RotateTo(endorientation:orientiation){
    var rotation = (endorientation - this.orientiation + 4) % 4
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].rotate(rotation)
    }
    this.orientiation = endorientation
  }

  Shift(offset:vector2){
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].add(offset);
    }
  }

  shifted(offset:vector2){
    let robot = this.copy();
    robot.Shift(offset);
    return robot;
  }

  Hadamard(other:vector2){
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].hadamard(other)
    }
    this.chirality = this.chirality.hadamard(other);

    if(this.chirality.y < 0){
      this.chirality = this.chirality.hadamard(new vector2(-1,-1));
      this.orientiation = (this.orientiation + 2) % 4
    }
  }

  HadamardTo(other:vector2){
    this.Hadamard(this.chirality);
    this.Hadamard(other);
  }

  withModel(_tileModel:tileModel){
    let robot = this.copy();
    robot.tileModel = _tileModel;
    return robot;
  }

  withRotationCleared(){
    let robot = this.copy();
    robot.orientiation = orientiation.north;
    robot.chirality = vector2.one;
    return robot;
  }

  withGimmick(gimmick:tileType){
    let robot = this.copy();
    robot.tileType = gimmick;
    return robot;
  }

  withName(name:string){
    let robot = this.copy();
    robot.name = name;
    return robot;
  }

  withSymmetry(_symmetry:symmetry){
    let robot = this.copy();
    robot.symmetry = _symmetry;
    return robot;
  }

  withKickType(_kickType:kickType){
    let robot = this.copy();
    robot.kickType = _kickType;
    return robot;
  }
}

export const pieces = Object.freeze({
  // main tetrominos
  I:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(2,0),
  ],
  tileModels.I,
  kickType.I,
  "I",
  SpinType.I),

  L:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModels.L,
  kickType.L,
  "L",
  SpinType.T),

  O:
  new piece([
    new vector2(0,0),
    new vector2(0,1),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModels.O,
  kickType.O,
  "O",
  SpinType.none),

  Z:
  new piece([
    new vector2(-1,1),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModels.Z,
  kickType.Z,
  "Z",
  SpinType.S),

  T:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModels.T,
  kickType.T,
  "T",
  SpinType.T),

  J:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(-1,1),
  ],
  tileModels.J,
  kickType.J,
  "J",
  SpinType.T),

  S:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,1),
    new vector2(0,1),
  ],
  tileModels.S,
  kickType.S,
  "S",
  SpinType.S),
  
  //modified tetrominoes
  sz:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,1),
    new vector2(0,1),
  ],
  tileModel.tripleRing(palette.S,undefined,palette.background),
  kickType.T,
  "s",
  SpinType.S),
  jl:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModel.tripleRing(palette.J,undefined,palette.background),
  kickType.T,
  "l",
  SpinType.T),

  //main pentominoes
  I5:
  null,
  V:
  null,
  T5:
  null,
  U:
  null,
  W:
  null,
  X:
  null,
  J5:
  null,
  L5:
  null,
  H:
  null,
  N:
  null,
  Y:
  null,
  R:
  null,
  P:
  null,
  Q:
  null,
  F:
  null,
  K:
  null,
  Z5:
  null,
  S5:
  null,
  
  //123 minos
  "<":
  new piece([
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModel.tripleRing(palette.violent,palette.board),
  kickType.T,
  "<",
  SpinType.immobilespin),
  "_":
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.tripleRing(palette.blue,palette.board),
  kickType.T,
  "_",
  SpinType.immobilespin),
  "-":
  new piece([
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.tripleRing(palette.greenish,palette.board),
  kickType.T,
  "-",
  SpinType.immobilespin),
  ".":
  new piece([
    new vector2(0,0),
  ],
  tileModel.tripleRing(palette.chartreuse,palette.board),
  kickType.T,
  ".",
  SpinType.immobilespin),
});

export const bagprefabs = Object.freeze({
  tetrominos: [
    pieces.I,
    pieces.L,
    pieces.O,
    pieces.Z,
    pieces.T,
    pieces.J,
    pieces.S,
  ],
  arcade: [
    pieces.I.withKickType(kickType.I).withSymmetry(symmetry.rot180),
    pieces.L.rotated(2).withRotationCleared(),
    pieces.O.withSymmetry(symmetry.rot90),
    pieces.Z.withKickType(kickType.O).withSymmetry(symmetry.rot180),
    pieces.T.rotated(2).withRotationCleared(),
    pieces.J.rotated(2).withRotationCleared(),
    pieces.S.withKickType(kickType.O).withSymmetry(symmetry.rot180),
  ],
  tetrominosPlusGrenade: [
    pieces.I,
    pieces.L,
    pieces.O,
    pieces.Z,
    pieces.T,
    pieces.J,
    pieces.S,
    pieces['.'].withName("grenade").withModel(tileModels.grenade).withGimmick(tileType.grenade),
  ],
  cursedTennis: [
    pieces.I.withModel(new tileModel(()=>{
      return colour3.fromHSV((Date.now() / 2000) % 1,1,1);
    })),
    pieces.L.withModel(new tileModel(()=>{
      return colour3.fromHex("#f2834b",(Math.sin(Date.now() / 5000)/2 + 0.5)**8);
    })),
    pieces.O.withModel(tileModel.sprite(krux)),
    pieces.Z.withModel(new tileModel(()=>{
      return colour3.fromHSV(Math.sin(Math.floor(Date.now()/200)),1,1);
    })),
    pieces.T.withModel(new tileModel(()=>{
      return new colour3(1,1,1,Math.sin(Date.now() / 1000)/4 + 0.75);
    })),
    pieces.J.withModel(tileModel.gradient(colour3.fromHex("#4b4bf2"),colour3.fromHex("#191953"),5)),
    pieces.S.withModel(tileModel.tripleRingTransparency(
      colour3.fromHex("#712b11",1),
      colour3.fromHex("#24cfcf",0.2),
      colour3.fromHex("#24cfcf",0.2)
    )),
  ],
  freeTetrominos: [
    pieces.I,
    pieces.jl,
    pieces.O,
    pieces.T,
    pieces.sz,
  ],
  fixedTetrominos: [
    pieces.I.rotated(0).withModel(new tileModel(colour3.fromHSV( 0/19,0.6901,0.9490))).withRotationCleared(),
    pieces.I.rotated(1).withModel(new tileModel(colour3.fromHSV( 1/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(0).withModel(new tileModel(colour3.fromHSV( 2/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(1).withModel(new tileModel(colour3.fromHSV( 3/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(2).withModel(new tileModel(colour3.fromHSV( 4/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(3).withModel(new tileModel(colour3.fromHSV( 5/19,0.6901,0.9490))).withRotationCleared(),
    pieces.O.rotated(0).withModel(new tileModel(colour3.fromHSV( 6/19,0.6901,0.9490))).withRotationCleared(),
    pieces.Z.rotated(0).withModel(new tileModel(colour3.fromHSV( 7/19,0.6901,0.9490))).withRotationCleared(),
    pieces.Z.rotated(1).withModel(new tileModel(colour3.fromHSV( 8/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(0).withModel(new tileModel(colour3.fromHSV( 9/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(1).withModel(new tileModel(colour3.fromHSV(10/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(2).withModel(new tileModel(colour3.fromHSV(11/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(3).withModel(new tileModel(colour3.fromHSV(12/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(0).withModel(new tileModel(colour3.fromHSV(13/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(1).withModel(new tileModel(colour3.fromHSV(14/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(2).withModel(new tileModel(colour3.fromHSV(15/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(3).withModel(new tileModel(colour3.fromHSV(16/19,0.6901,0.9490))).withRotationCleared(),
    pieces.S.rotated(0).withModel(new tileModel(colour3.fromHSV(17/19,0.6901,0.9490))).withRotationCleared(),
    pieces.S.rotated(1).withModel(new tileModel(colour3.fromHSV(18/19,0.6901,0.9490))).withRotationCleared(),
  ],
  m123: [
    pieces['<'],
    pieces['_'],
    pieces['-'],
    pieces['.'],
  ],
  fixedM123: [
    pieces['<'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 0/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['<'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 1/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['<'].rotated(2).withModel(tileModel.tripleRing(colour3.fromHSV( 2/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['<'].rotated(3).withModel(tileModel.tripleRing(colour3.fromHSV( 3/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['_'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 4/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['_'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 5/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['-'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 6/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['-'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 7/9,0.6901,0.9490),palette.background)).withRotationCleared(),
    pieces['.'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 8/9,0.6901,0.9490),palette.background)).withRotationCleared(),
  ],
});

export const levelsGravities = Object.freeze([
  48/60.0988*1000,
  43/60.0988*1000,
  38/60.0988*1000,
  33/60.0988*1000,
  28/60.0988*1000,
  23/60.0988*1000,
  18/60.0988*1000,
  13/60.0988*1000,
  8/60.0988*1000,
  6/60.0988*1000,
  5/60.0988*1000,
  5/60.0988*1000,
  5/60.0988*1000,
  4/60.0988*1000,
  4/60.0988*1000,
  4/60.0988*1000,
  3/60.0988*1000,
  3/60.0988*1000,
  3/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  8, //im just making stuff up at this point
  8,
  8,
  8,
  8,
  8,
  8,
  8,
  8,
  8,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
]);

export const levelsLockTimes = Object.freeze([
  400,
  367,
  333,
  300,
  267,
  250,
  233,
  217,
  200,
  183,
]);

export const clearNames = Object.freeze([
  "Null",
  "Single",
  "Double",
  "Triple",
  "Techrash",
  "Pentachrash",
  "Hexachrash",
  "Heptachrash",
  "Octachrash",
  "Enneachrash",
  "Decachrash",
  "Endelchrash",
  "Dozer",
  "Zhawa",
  "Reya",
  "Vaya",
  "Ch'hawa",
  "Z'heya",
  "B'haya",
  "S'hawa",
  "Kagaris",
  "Rei",
  "Macoro",
  "TSUKIOLOKLIRON",
  "krussus",
])

export const stridenames = Object.freeze([
  "open",
  "set",
  "get",
  "ready",
  "mark",
  "your",
  "on",
  "yet",
  "not"
])