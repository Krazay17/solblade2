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
import { WorldGroup } from "../modules/view/SolRenders";
import { IndicatorSystem } from "../modules/indicator/IndicatorSystem";

export class CGame {
    loop: ClientLoop;
    world: SolWorld;
    clientSync: ClientSyncSystem;
    tempVec = new SolVec3();
    testTimer = 0;
    addSystems: ISystem[];
    singletons: any[];
    worldGroup: WorldGroup | null = null;

    constructor(
        private localInput: LocalInput,
        private rendering: Rendering,
        private net: CNet,
        mapIndex: Maps = 0,
    ) {
        this.loop = new ClientLoop(this);
        this.clientSync = new ClientSyncSystem(net, this.loop);
        const cameraArm = new CameraArm();
        this.addSystems = [
            this.clientSync,
            new AnimationSystem(),
            new CameraSystem(rendering, cameraArm),
            new ViewSystem(rendering),
            new NameplateSystem(),
            new ClientCleanupSystem(),
            new IndicatorSystem(),
        ]
        this.singletons = [
            localInput,
            rendering,
            net,
            cameraArm
        ]

        this.world = this.run(mapIndex);
        this.clientSync.join();
        this.loop.start();

        this.welcomeSpeech()

        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyT") this.requestMapChange(0);
            if (e.code === "KeyY") this.requestMapChange(1);
            if (e.code === "KeyU") this.requestMapChange(2);
            if (e.code === "KeyG") {
                this.welcomeSpeech();
            }
            if (e.code === "KeyN") {
                this.clientSync.join();
            }
            if (e.code === "KeyM") {
                this.net.socket.disconnect();
            }
        })
    }

    welcomeSpeech() {
        const sentance = `Thank you for joining us hunter,
                the An-the-los have ravaged our once prosperous world,
                please help us find the Sol Blade and defeat An-thee-lee-on to restore glory to our planet.`
        const thing = new SpeechSynthesisUtterance(sentance);
        thing.rate = 0.9;
        thing.lang = "fr";
        window.speechSynthesis.speak(thing);
    }

    run(mapIndex: number) {
        this.world?.destroy();
        const world = new SolWorld(false, this.addSystems, mapIndex);
        if (this.worldGroup) {
            this.rendering.scene.remove(this.worldGroup.group);
        }
        this.worldGroup = new WorldGroup();
        this.rendering.scene.add(this.worldGroup.group);
        world.addSingleton(...this.singletons, this.worldGroup);
        world.start();
        this.rendering.loadMap(MapReg[mapIndex]).then(g => {
            this.worldGroup!.group.add(g);
        });
        this.localStart(world);
        this.clientSync.world = world;
        return world;
    }

    requestMapChange(mapIndex: number) {
        solSave.mapIndex = mapIndex;
        solSave.save();
        this.clientSync.desync();
        this.world = this.run(mapIndex);
        this.clientSync.join();
    }

    localStart(world: SolWorld) {
        const userId = world.spawn();
        const user = world.add(userId, Comps.User, {
            socketId: "LOCAL_USER"
        });
        const pawnId = world.spawn({
            type: EntityTypes.player,
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(0, 1, 0) } },
                { type: Comps.Owner, data: { ownerId: userId } }
            ]
        });

        world.localId = userId;
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