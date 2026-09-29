export class vector2{
  x:number;
  y:number;

  constructor(x:number,y:number){
    this.x = x;
    this.y = y;
  }

  add(other:vector2){
    return new vector2(this.x + other.x, this.y + other.y);
  }

  sub(other:vector2){
    return new vector2(this.x - other.x, this.y - other.y);
  }

  mul(other:number){
    return new vector2(this.x * other, this.y * other);
  }

  hadamard(other:vector2){
    return new vector2(this.x * other.x, this.y * other.y);
  }

  dot(other:vector2){
    return this.x * other.x + this.y * other.y;
  }

  div(other:number){
    return new vector2(this.x / other, this.y / other);
  }

  sqMag(){
    return this.x * this.x + this.y * this.y;
  }

  magnitude(){
    return this.sqMag()**0.5;
  }

  sqDist(other:vector2){
    return this.sub(other).sqMag();
  }

  distance(other:vector2){
    return this.sub(other).magnitude();
  }

  orient(right:vector2,up:vector2){
    return new vector2(this.dot(right),this.dot(up));
  }

  normalise(){
    if(this.magnitude()<=0.0001)
      return this.copy()
    return this.div(this.magnitude());
  }

  /*90 degree clockwise*/
  cw(){
    return new vector2(this.y, -this.x);
  }

  /*90 degree withershins*/
  ws(){
    return new vector2(-this.y, this.x);
  }

  /*180 degree turn*/
  flip(){
    return new vector2(-this.x, -this.y);
  }

  /*rotate this amount of 90 degree clockwise turns*/
  rotate(turns:number){
    turns = (turns % 4 + 4) % 4

    switch(turns){
      case 0:
        return this.copy();
      case 1:
        return this.cw();
      case 2:
        return this.flip();
      case 3:
        return this.ws();
      default:
        throw new TypeError("how to rotate " + turns);
    }
  }

  rotateAngle(angle:number){
    return new vector2(this.x * Math.cos(angle) - this.y * Math.sin(angle),this.x * Math.sin(angle) + this.y * Math.cos(angle));
  }

  copy(){
    return new vector2(this.x,this.y);
  }

  toString(){
    return "( " + this.x + ", " + this.y + ")"
  }

  static up = new vector2(0,1);
  static down = new vector2(0,-1);
  static left = new vector2(-1,0);
  static right = new vector2(1,0);
  static zero = new vector2(0,0);
  static one = new vector2(1,1);

  static fromAngle(angle:number){
    return new vector2(Math.cos(angle),Math.sin(angle));
  }

  static orthogonal = [vector2.left,vector2.up,vector2.right,vector2.down]
  static king = [vector2.left,vector2.up,vector2.right,vector2.down,new vector2(1,1),new vector2(1,-1),new vector2(-1,1),new vector2(-1,-1)]

  lerp(other:vector2,t:number){
    return new vector2(
      lerp(this.x,other.x,t),
      lerp(this.y,other.y,t),
    )
  }
}

const hexadecimalAlphabet = "0123456789abcdef"
function hexadecimalToDecimal1(x:string){
  return hexadecimalAlphabet.indexOf(x);
}
function hexadecimalToDecimal2(msd:string,lsd:string){
  return hexadecimalToDecimal1(msd) * 16 + hexadecimalToDecimal1(lsd);
}
function decimalToHexadecimal(x:number){
  let o = ""
  while (x>0){
    let mod = x % 16
    x = Math.floor(x/16)
    o = hexadecimalAlphabet[mod] + o
  }
  while (o.length < 2)
    o = "0" + o
  return o
}

export function lerp(a:number,b:number,t:number){
  return a + (b-a) * t
}

export function lerpq(a:number,b:number,t:number){
  return lerp(a**0.5,b**0.5,t) ** 2
}

function Validate1(x:number){
  x *= 255
  x = Math.round(x);
  x = Math.min(x,255);
  x = Math.max(x,0);
  x /= 255
  return x;
}

export class colour3{
  r:number;
  g:number;
  b:number;
  a:number;

  /**rgb values are from 0 to 1 */
  constructor(r:number,g:number,b:number,a:number=1){
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  Validate(){
    this.r = Validate1(this.r);
    this.g = Validate1(this.g);
    this.b = Validate1(this.b);
  }

  toHex(){
    this.Validate();
    return "#" + decimalToHexadecimal(this.r * 255) + decimalToHexadecimal(this.g * 255) + decimalToHexadecimal(this.b * 255);
  }

  /**rgb hex code */
  static fromHex(hex:string,a:number=1){
    const r = hexadecimalToDecimal2(hex[1], hex[2]);
    const g = hexadecimalToDecimal2(hex[3], hex[4]);
    const b = hexadecimalToDecimal2(hex[5], hex[6]);
    return colour3.fromRGB(r,g,b,a);
  }

  /**this is for rgb values from 0 to 255*/
  static fromRGB(r:number,g:number,b:number,a:number=1){
    return new colour3(r / 255,g / 255,b / 255,a);
  }

  /**hsv values are from 0 to 1 */
  static fromHSV(h:number,s:number,v:number,a:number=1){
    h = h%1;
    const f = (n:number) => {
      const k = (n + h*6) % 6
      return v - v * s * Math.max(0,Math.min(k,4-k,1))
    };
    return new colour3(f(5),f(3),f(1),a);
  }

  toHSV(){
    const v = Math.max(this.r,this.g,this.b);
    const min = Math.min(this.r,this.g,this.b);
    const c = v - min
    var h = Math.random() * 6; // fallback case (funy)
    if(c > 0){
      if(v == this.r)
        h = ((this.g - this.b) / c / 6) % 1
      if(v == this.g)
        h = ((this.b - this.r) / c + 2) / 6
      if(v == this.b)
        h = ((this.r - this.g) / c + 4) / 6
    }
    var s = 0;
    if(v > 0)
      s = c/v
    return [h,s,v,this.a]
  }

  lerp(other:colour3,t:number){
    return new colour3(
      lerp(this.r,other.r,t),
      lerp(this.g,other.g,t),
      lerp(this.b,other.b,t),
      lerp(this.a,other.a,t),
    )
  }

  static lerp(zis:colour3,other:colour3,t:number){
    return zis.lerp(other,t);
  }

  lerpq(other:colour3,t:number){
    return new colour3(
      lerpq(this.r,other.r,t),
      lerpq(this.g,other.g,t),
      lerpq(this.b,other.b,t),
      lerp(this.a,other.a,t),
    )
  }

  static lerpq(zis:colour3,other:colour3,t:number){
    return zis.lerpq(other,t);
  }

  lerphsv(other:colour3,t:number){
    const [thish,thiss,thisv,thisa] = this.toHSV()
    const [otherh,others,otherv,othera] = other.toHSV()
    return colour3.fromHSV(
      lerp(thish,otherh,t),
      lerp(thiss,others,t),
      lerp(thisv,otherv,t),
      lerp(thisa,othera,t),
    )
  }

  static lerphsv(zis:colour3,other:colour3,t:number){
    return zis.lerphsv(other,t);
  }

  flash(other:colour3,rate:number){
    const t = Math.sin(new Date().getTime() * rate)**2;
    return new colour3(
      lerpq(this.r,other.r,t),
      lerpq(this.g,other.g,t),
      lerpq(this.b,other.b,t),
      lerp(this.a,other.a,t),
    )
  }

  saturate100(){
    let min = Math.min(this.r,this.g,this.b);
    let max = Math.max(this.r,this.g,this.b);
    if (max-min<=0)
      return this.copy();
    return new colour3(
      (this.r - min)/(max-min),
      (this.g - min)/(max-min),
      (this.b - min)/(max-min),
      this.a
    );
  }

  static saturate100(zis:colour3){
    return zis.saturate100();
  }

  saturate(t:number){
    let other = this.saturate100();
    return new colour3(
      lerpq(this.r,other.r,t),
      lerpq(this.g,other.g,t),
      lerpq(this.b,other.b,t),
      lerp(this.a,other.a,t),
    );
  }

  static saturate(zis:colour3,t:number){
    return zis.saturate(t);
  }

  copy(){
    return new colour3(this.r,this.g,this.b,this.a);
  }
}

export class modular{
  static dist(x:number,y:number,mod:number){
    return Math.min(Math.abs(x - y - mod),Math.abs(x - y),Math.abs(x - y + mod));
  }

  static displacement(x:number,y:number,mod:number){
    var dist = modular.dist(x,y,mod);
    if(dist == Math.abs(x-y-mod))
      return x - y - mod
    if(dist == Math.abs(x-y))
      return x - y
    if(dist == Math.abs(x-y+mod))
      return x - y + mod
    throw new Error("?" + x + y + mod)
  }

  static exp(b:number,e:number,mod:number){
    let c = 1;
    while(e >= 2){
      c = (c * b) % mod;
      e--;
    }
    return (c * (b**(e-1))) % mod;
  }
}

export class Randomiser{
  x0:number;
  x1:number;
  x2:number;
  x3:number;
  constructor(seed:number){
    this.x0 = modular.exp(seed,907,Number.MAX_SAFE_INTEGER)
    this.x1 = modular.exp(seed,911,Number.MAX_SAFE_INTEGER)
    this.x2 = modular.exp(seed,919,Number.MAX_SAFE_INTEGER)
    this.x3 = modular.exp(seed,929,Number.MAX_SAFE_INTEGER)
  }

  next(){
    var t = this.x3;
    var s = this.x0;
    [this.x3,this.x2,this.x1] = [this.x2,this.x1,s];
    t ^= t << 11;
    t ^= t >>8;
    this.x0 = t ^ s ^ (s >> 19)
    return this.x0 / (2 ** 31) % 1
  }

}

export function pad(x:number,digits:number) {
    let o = x.toString();
    while(o.length < digits)
        o = "0" + o;
    return o;
}

export function formatTime(milliseconds:number){
    var seconds:number,minutes:number,hours:number,days:number
    [seconds,milliseconds] = [Math.floor(milliseconds / 1000),milliseconds % 1000];
    [minutes, seconds] = [Math.floor(seconds / 60),seconds % 60];
    [hours, minutes] = [Math.floor(minutes / 60),minutes % 60];
    [days, hours] = [Math.floor(hours / 24),hours % 24];

    const ms = pad(Math.round(milliseconds),3);
    const s = pad(seconds,2);
    const min = pad(seconds,2);
    
    var text = `${seconds}.${ms}`

    if(days > 0)
        text = `day ${days} ${hours}:${min}:${seconds}` //why did i write support for days
    else if (hours > 0)
        text = `${hours}:${min}:${seconds}`
    else if (minutes > 0)
        text = `${minutes}:${s}.${ms}`

    return text
}

export function formatTimeSmall(milliseconds:number){
  milliseconds = Math.round(milliseconds/100)*100
    var seconds:number,minutes:number,hours:number,days:number
    [seconds,milliseconds] = [Math.floor(milliseconds / 1000),milliseconds % 1000];
    [minutes, seconds] = [Math.floor(seconds / 60),seconds % 60];
    [hours, minutes] = [Math.floor(minutes / 60),minutes % 60];
    [days, hours] = [Math.floor(hours / 24),hours % 24];

    const ms = milliseconds/100;
    const s = pad(seconds,2);
    const min = pad(seconds,2);
    
    var text = `${seconds}.${ms}`

    if(days > 0)
        text = `day ${days} ${hours}:${min}:${seconds}` //why did i write support for days
    else if (hours > 0)
        text = `${hours}:${min}:${seconds}`
    else if (minutes > 0)
        text = `${minutes}:${s}.${ms}`

    return text
}