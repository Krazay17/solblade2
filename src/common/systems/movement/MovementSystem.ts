
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "@/common/core/World";
import type { Component } from "../Component";
import type { ISystem } from "../System";

export interface MovementState {
    enter(comp: MovementComp): void;
    exit(comp: MovementComp): void;
    update(comp: MovementComp, dt: number): void;
}

export class MovementSystem implements ISystem {
    private components: MovementComp[] = [];
    private states: Record<string, MovementState> = {
        idle: new IdleState(),
        walk: new WalkState(),
    }
    addComp(comp: Component): void {
        if (comp instanceof MovementComp) {
            this.components.push(comp);
        }
    }

    update(world: World, dt: number): void {
        for (const c of this.components) {
            if (c.state !== c.lastState) {
                this.states[c.lastState].exit(c);
                this.states[c.state].enter(c);
                c.lastState = c.state;
            }
            this.states[c.state].update(c, dt);
        }
    }
    // update(dt: number, time: number): void {
    //     for (const [actor, comp] of this.actors) {
    //         if (comp.state !== comp.lastState) {
    //             this.states[comp.lastState].exit(actor, comp);
    //             this.states[comp.state].enter(actor, comp);
    //             comp.lastState = comp.state;
    //         }
    //         this.states[comp.state].update(dt, actor, comp);
    //     }
    // }
}