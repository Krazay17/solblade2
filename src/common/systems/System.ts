import type { Actor } from "../actor/Actor";

export class System {
    private actors = new Set<Actor>()
    private component: string = "";

    addActor(actor: Actor) {
        if (actor.get(this.component)) {
            this.actors.add(actor);
        }
    }
    update(dt: number, time: number) {
        for (const actor of this.actors) {
            const component = actor[this.component];
        }
    }
    register(actor: Actor) { }
    unRegister(actor: Actor) { }
}