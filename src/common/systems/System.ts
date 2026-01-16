import type { Actor } from "../core/Actor";

export abstract class System<T> {
    public actors = new Map<Actor, T>()
    public abstract readonly lookup: string;
    register(actor: Actor) {
        const comp = actor.get<T>(this.lookup);
        if (comp) {
            this.actors.set(actor, comp);
        }
    }
    unRegister(actor: Actor) {
        if (this.actors.has(actor)) this.actors.delete(actor);
    }
    public abstract update(dt: number, time: number): void;
}