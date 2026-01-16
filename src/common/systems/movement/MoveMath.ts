import type { Actor } from "@/common/core/Actor";
import type { MovementComp } from "./MovementComp";

class Vector3 {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    constructor(x?: number | Record<string, number>, y?: number, z?: number) {
        if (typeof x === "object") {
            this.x = x.x ?? 0;
            this.y = x.y ?? 0;
            this.z = x.z ?? 0;
        } else {
            this.x = x ?? 0;
            this.y = y ?? 0;
            this.z = z ?? 0;
        }
    }

    // Static method: creates a NEW instance
    static add(a: Vector3, b: Vector3): Vector3 {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    // Mutates the instance and returns 'this' for chaining
    add(v: Vector3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    normalize(): this {
        const mag = this.length();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
            this.z /= mag;
        }
        return this;
    }

    dot(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    angleTo(v: Vector3): number {
        const dot = this.dot(v);
        const mag = this.length() * v.length();
        return Math.acos(dot / mag);
    }

    subtract(v: Vector3): this {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    multiplyScalar(v: number) {
        this.x *= v;
        this.y *= v;
        this.z *= v;
        return this;
    }

    copy(v: Vector3 | any): this {
        this.x = v.x ?? 0;
        this.y = v.y ?? 0;
        this.z = v.z ?? 0;
        return this;
    }
}

let velocity = new Vector3();
let horizVelocity = new Vector3();
let wishdir = new Vector3();

export function move(dt: number, actor: Actor, comp: MovementComp) {
    wishdir.copy(comp!.inputs.moveDir);
    velocity.copy(actor.body!.linvel());
    console.log(wishdir);
    horizVelocity.copy(velocity);
    horizVelocity.y = 0;

    friction(dt, comp.friction);
    accelerate(dt, wishdir, comp.speed, comp.accel);

    actor.body!.setLinvel(velocity, true);
}

function friction(dt: number, friction: number, exponential: boolean = true) {
    const speed = horizVelocity.length();
    if (speed < 0.00001) return;
    const drop = exponential ? speed * friction * dt : friction * dt;
    const newSpeed = Math.max(0, speed - drop);
    const cap = newSpeed / speed;
    horizVelocity.multiplyScalar(cap);
    horizVelocity.y = velocity.y;
    velocity.copy(horizVelocity);
}

function accelerate(dt: number, wishdir: Vector3, wishspeed: number, accel: number) {
    const dirspeed = horizVelocity.dot(wishdir);
    const addspeed = wishspeed - dirspeed;
    if (addspeed <= 0) return;
    let accelSpeed = accel * wishspeed * dt;
    accelSpeed = Math.min(accelSpeed, addspeed);
    velocity.add(wishdir.multiplyScalar(accelSpeed));
}