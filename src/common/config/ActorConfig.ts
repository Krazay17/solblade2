export interface ActorProps {
    body: BodyData;
    model: string;
    modelOffset?: number;
    movement?: any;
    comps?: string[];
    abilities?: string[];
}

export interface BodyData {
    type: "pawn" | "capsule" | "box" | "ball" | "trimesh";
    radius: number;
    height: number;
    mass?: number;
    scale?: number;
    vertices?: Float32Array | number[];
    indices?: Uint32Array | number[];
    collisionGroup?: number;
    sensor?: boolean;
}

export const ActorTypes: Record<string, ActorProps> = {
    player: {
        body: {
            type: "pawn",
            radius: 0.5,
            height: 1,
        },
        modelOffset: 1,
        model: "spikeMan",
        comps: ["MovementComp"]
    },
    wizard: {
        body: {
            type: "pawn",
            radius: 0.5,
            height: 1,
        },
        model: "Wizard",
    },
    cube: {
        body: {
            type: "box",
            radius: 0.5,
            height: 0.5,
        },
        model: "cube",
        comps: ["MovementComp"]
    }
}