import type { Actor } from "../actor/Actor";

export class System {
    private actors: Actor[] = [];
    update(dt: number, time: number){}
    register(actor: Actor){}
    unRegister(actor: Actor){}
}