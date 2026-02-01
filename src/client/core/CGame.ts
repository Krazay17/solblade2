import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "#/common/core/World";
import { CNet } from "./CNet";
import { ViewSystem } from "../modules/view/ViewSystem";
import { EntityTypes, NetworkRole, SOL_PHYS } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { CameraSystem } from "../modules/camera/CameraSystem";
import { AnimationSystem } from "../modules/animation/AnimationSystem";
import { CameraArm } from "../modules/camera/CameraArm";
import { solDebug } from "../debug/DebugDom";
import { ClientSyncSystem } from "../modules/netsync/ClientSyncSystem";
import { UserComp } from "#/common/modules/controller/UserComp";
import type { LocalInput } from "./LocalInput";
import { ClientCleanupSystem } from "../modules/netsync/ClientCleanupSystem";
import { NameplateSystem } from "../modules/nameplate/NameplateSystem";
import { Comps } from "#/common/core/ECSRegi";

export class CGame {
    loop: ClientLoop;
    world: World;
    clientSync: ClientSyncSystem;
    tempVec = new SolVec3();
    testTimer = 0;

    constructor(private localInput: LocalInput, private rendering: Rendering, private net: CNet) {
        this.loop = new ClientLoop(this);
        this.clientSync = new ClientSyncSystem(net);

        const cameraArm = new CameraArm();
        this.world = new World(false, [
            this.clientSync,
            new AnimationSystem(),
            new CameraSystem(rendering, cameraArm),
            new ViewSystem(rendering, rendering.scene),
            new NameplateSystem(),
            new ClientCleanupSystem(),
        ]);
        this.world.addSingleton(localInput, rendering, net, cameraArm);

        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyT") {
                this.clientSync.join(this.world);
            }
        })

    }

    async run() {
        await this.rendering.loadMap("World0");
        await this.world.start();
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

    localStart() {
        const user = this.world.getSingleton(UserComp);
        const userId = this.world.spawn(NetworkRole.LOCAL, EntityTypes.none, 1);
        this.world.add(userId, user);
        user.socketId = "LOCAL_USER";
        const pawnId = this.world.spawn(NetworkRole.LOCAL, EntityTypes.wizard, 2, {
            TransformComp: {
                pos: new SolVec3(0, 1, 0)
            }
        });
        this.world.add(pawnId, Comps.Owner).setOwnerId(userId);
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

            const localUser = this.world.getSingleton(UserComp);
            if (!localUser.pawnId) return;
            const pos = this.world.getComp(localUser.pawnId, Comps.Transform);
            const phys = this.world.getComp(localUser.pawnId, Comps.Physics);
            const move = this.world.getComp(localUser.pawnId, Comps.Movement);
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