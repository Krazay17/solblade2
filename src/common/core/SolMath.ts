export class SolVec3 {
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
    static add(a: SolVec3, b: SolVec3): SolVec3 {
        return new SolVec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    // Mutates the instance and returns 'this' for chaining
    add(v: SolVec3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
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

    dot(v: SolVec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    angleTo(v: SolVec3): number {
        const dot = this.dot(v);
        const mag = this.length() * v.length();
        return Math.acos(dot / mag);
    }

    subtract(v: SolVec3): this {
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

    copy(v: SolVec3 | any): this {
        this.x = v.x ?? 0;
        this.y = v.y ?? 0;
        this.z = v.z ?? 0;
        return this;
    }
}

export class SolQuat {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    w: number = 1;

    constructor(x?: number | Record<string, number>, y?: number, z?: number, w?: number) {
        if (typeof x === "object") {
            this.x = x.x ?? 0;
            this.y = x.y ?? 0;
            this.z = x.z ?? 0;
            this.w = x.w ?? 1;
        } else {
            this.x = x ?? 0;
            this.y = y ?? 0;
            this.z = z ?? 0;
            this.w = w ?? 1;
        }
    }

    // Static method: creates a NEW instance (Concatenates rotations A then B)
    static multiply(a: SolQuat, b: SolQuat): SolQuat {
        return new SolQuat(
            a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
            a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
            a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
            a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
        );
    }

    // Mutates the instance and returns 'this' (Concatenates another rotation onto this one)
    multiply(q: SolQuat): this {
        const qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
        const qbx = q.x, qby = q.y, qbz = q.z, qbw = q.w;

        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        return this;
    }

    set(x: number, y: number, z: number, w: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2);
    }

    normalize(): this {
        let l = this.length();
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    }

    copy(q: SolQuat | any): this {
        this.x = q.x ?? 0;
        this.y = q.y ?? 0;
        this.z = q.z ?? 0;
        this.w = q.w ?? 1;
        return this;
    }

    identity(): this {
        return this.set(0, 0, 0, 1);
    }
}