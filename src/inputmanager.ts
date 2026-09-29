import { vector2 } from "./basics.ts";
import { Command, userConfig } from "./config.ts";

export default class InputManager{
    heldKeys:{[key:string]:number}={};
    onKeyDown:((command:Command)=>void)[]=[];
    onKeyUp:((command:Command)=>void)[]=[];
    userConfig:userConfig;

    constructor(_userConfig:userConfig){
        this.userConfig = _userConfig;
    }

    OnKeyDown(e: KeyboardEvent){
        console.log(e.code);

        if(this.userConfig.codemappings[e.code] === undefined)
            return
        const command = this.userConfig.codemappings[e.code];

        e.preventDefault()

        if(this.heldKeys[command] && this.userConfig.blockKeyRetriggers)
            return;

        if(!this.heldKeys[command])
            this.heldKeys[command] = new Date().getTime();

        this.DispatchInput(command)
    }

    DispatchInput(command:Command){
        for(const subscriber of this.onKeyDown){
            subscriber(command)
        }
    }

    OnKeyUp(e: KeyboardEvent){
        if(this.userConfig.codemappings[e.code] === undefined)
            return
        const command = this.userConfig.codemappings[e.code];

        e.preventDefault()

        if(!this.heldKeys[command])
            return;
        delete this.heldKeys[command];

        for(const subscriber of this.onKeyUp){
            subscriber(command)
        }
    }

    /**returns undefined if key isnt held and the time it started being held if it is */
    Held(key:Command){
        return this.heldKeys[key];
    }
}