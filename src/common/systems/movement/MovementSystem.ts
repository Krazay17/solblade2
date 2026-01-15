import type { Actor } from "@/common/actor/Actor";
import type { MovementComp } from "../../actor/MovementComp";
import { System } from "../System";

export interface MovementState {
    update(dt:number, actor: Actor): void;
}

export class MovementSystem extends System {
    update(dt: number, time: number): void {
        this.actors.forEach((a)=>{
            const comp = a[this.component] as MovementComp;
            
        })
    }    
}