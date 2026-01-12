import type { Rendering } from "@/client/core/Rendering";
import { Actor } from "../actor/Actor";
import { ActorTypes, type ActorProps } from "../config/ActorConfig";
import { Physics } from "./Physics";

export class ActorFactory {
    constructor(private physics: Physics, private rendering: Rendering) {

    }
    async createActor(type: string) {
        let data: ActorProps = ActorTypes[type];
        let actor = new Actor();

        // const { body } = this.physics.createBody(actor, data.body, 1);
        // actor.body = body;
        if (data.mesh && this.rendering) {
            const mesh = await this.rendering.createMesh(data.mesh);
            if (mesh) actor.mesh = mesh;
        }

        return actor;
    }
}