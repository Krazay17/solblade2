import type { Actor } from "../actor/Actor";

export class System {
    public actors = new Set<Actor>()
    public component: string = "";

    addActor(actor: Actor) {
        const comp = actor.get(this.component);
        if (comp) {
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