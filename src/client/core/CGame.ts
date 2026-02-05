import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { SolWorld } from "#/common/core/SolWorld";
import { CNet } from "./CNet";
import { ViewSystem } from "../modules/view/ViewSystem";
import { EntityTypes, SOL_PHYS } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { CameraSystem } from "../modules/camera/CameraSystem";
import { AnimationSystem } from "../modules/animation/AnimationSystem";
import { CameraArm } from "../modules/camera/CameraArm";
import { solDebug } from "../debug/DebugDom";
import { ClientSyncSystem } from "../modules/netsync/ClientSyncSystem";
import type { LocalInput } from "./LocalInput";
import { ClientCleanupSystem } from "../modules/netsync/ClientCleanupSystem";
import { NameplateSystem } from "../modules/nameplate/NameplateSystem";
import { Comps, MapReg, Maps, type ISystem } from "#/common/core/ECS";
import solSave from "./SolSave";
import type { Scene } from "three";

export class CGame {
    loop: ClientLoop;
    world: SolWorld;
    clientSync: ClientSyncSystem;
    tempVec = new SolVec3();
    testTimer = 0;
    addSystems: ISystem[];
    singletons: any[];
    mapRender: Scene | undefined;

    constructor(
        private localInput: LocalInput,
        private rendering: Rendering,
        private net: CNet,
        private mapIndex: Maps = 0,
    ) {
        this.loop = new ClientLoop(this);
        this.clientSync = new ClientSyncSystem(net, this.loop);
        const cameraArm = new CameraArm();

        this.addSystems = [
            this.clientSync,
            new AnimationSystem(),
            new CameraSystem(rendering, cameraArm),
            new ViewSystem(rendering, rendering.scene),
            new NameplateSystem(),
            new ClientCleanupSystem(),
        ]
        this.singletons = [
            localInput,
            rendering,
            net,
            cameraArm
        ]

        this.world = new SolWorld(false, this.addSystems, this.mapIndex);
        this.world.addSingleton(...this.singletons);

        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyT") {
                this.clientSync.join(this.world);
            }
            if (e.code === "KeyY") {
                this.net.socket.disconnect();
            }
            if (e.code === "KeyU") {
                const thing = new SpeechSynthesisUtterance("Hello is this working");
                thing.lang = "en";
                window.speechSynthesis.speak(thing);
            }
            if (e.code === "KeyG") {
                solSave.mapIndex = 2;
                solSave.save();
            }
        })
    }

    async run() {
        await this.world.start();
        this.mapRender = await this.rendering.loadMap(MapReg[this.mapIndex]);
        this.localStart();

        // for (let i = 0; i < 5; i++) {
        //     const id = this.world.spawn(NetworkRole.LOCAL, EntityTypes.wizard, undefined, {
        //         TransformComp: {
        //             pos: new SolVec3(0, i + i + 2, 0)
        //         }
        //     })
        // }

        this.clientSync.join(this.world);
        this.loop.start();
    }

    async changeMap(mapIndex: number = 0) {
        this.world.destroy();
        if (this.mapRender) this.rendering.scene.remove(this.mapRender);
        
        this.mapIndex = mapIndex;
        this.world = new SolWorld(false, this.addSystems, mapIndex);
        this.mapRender = await this.rendering.loadMap(MapReg[mapIndex]);
        this.run();
    }

    localStart() {
        const userId = this.world.spawn();
        const user = this.world.add(userId, Comps.User, {
            socketId: "LOCAL_USER"
        });
        const pawnId = this.world.spawn({
            type: EntityTypes.player,
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(0, 1, 0) } },
                { type: Comps.Owner, data: { ownerId: userId } }
            ]
        });

        this.world.localId = userId;
        user.pawnId = pawnId;
    }

    preUpdate(dt: number, time: number) {
        this.world.preUpdate(dt, time);
    }

    step(dt: number, time: number) {
        this.world.preStep(dt, time);
        this.world.step(dt, time);
        this.world.postStep(dt, time);
        this.debugTick();
    }

    noRecoveryStep() {
    }

    postUpdate(dt: number, time: number) {
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;
        this.world.postUpdate(dt, time, alpha);
        this.rendering.render(dt);

    }

    debugTick() {
        if (!this.testTimer || this.testTimer < Date.now()) {

            this.testTimer = Date.now() + 150;

            const localUser = this.world.get(this.world.localId, Comps.User);
            if (!localUser || !localUser.pawnId) return;
            const pos = this.world.get(localUser.pawnId, Comps.Transform);
            const phys = this.world.get(localUser.pawnId, Comps.Physics);
            const move = this.world.get(localUser.pawnId, Comps.Movement);
            if (pos && phys && phys.body) solDebug.add("LocalEntity",
                `Ping: ${this.clientSync.ping}
                User Id:${localUser.entityId}
                Pawn Id:${localUser.pawnId}
                MoveState: ${move?.state}
                vel: ${Math.floor(SolVec3.mag(phys.body.linvel()))} 
                pos: x:${Math.floor(pos!.pos.x)} y:${Math.floor(pos!.pos.y)} z:${Math.floor(pos!.pos.z)}
                dynamic: ${phys.body.isDynamic()} Sleep: ${phys.body.isSleeping()}
                Entities: ${[...this.world.entities.values()].sort((a, b) => a - b)}`);
        }
    }

}