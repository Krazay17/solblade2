// InteractionSystem.ts
import { Comps, type ISystem } from "#/common/core/ECS";
import type { SolWorld } from "../../core/SolWorld";
import RAPIER from "@dimforge/rapier3d-compat";
import type { InteractionComp } from "./InteractionComp";

export class InteractionSystem implements ISystem {

    step(world: SolWorld, dt: number, time: number): void {
        const interactors = world.query([Comps.Interaction, Comps.Transform, Comps.Physics]);

        for (const id of interactors) {
            const interaction = world.get(id, Comps.Interaction)!;

            this.updateInteractionTarget(world, id, time, interaction);
            if (interaction.wantsInteract) {
                this.tryInteract(world, id, time, interaction);
                interaction.wantsInteract = false;
            }
        }
    }

    private updateInteractionTarget(world: SolWorld, interactorId: number, time: number, interaction: InteractionComp): void {
        const xform = world.get(interactorId, Comps.Transform)!;
        const physics = world.get(interactorId, Comps.Physics)!;
        const move = world.get(interactorId, Comps.Movement);
        if (!move) return;

        // Perform shape cast
        const ray = new RAPIER.Ray(move.getAimPos(xform.pos), move.getAim());
        const maxToi = interaction.range;

        const hit = world.physWorld.castRay(
            ray,
            maxToi,
            true,
            undefined,
            undefined,
            undefined,
            physics.body
        )

        // Clear previous target
        const previousTarget = interaction.currentTarget;
        interaction.currentTarget = -1;

        if (hit) {
            // Find entity with this collider
            const interactables = world.query([Comps.Interactable, Comps.Physics]);

            for (const targetId of interactables) {
                const targetPhysics = world.get(targetId, Comps.Physics)!;
                const interactable = world.get(targetId, Comps.Interactable)!;

                if (targetPhysics.handle === hit.collider.parent()?.handle) {
                    // Check if interactable is enabled and not on cooldown
                    if (interactable.enabled &&
                        time - interactable.lastInteraction >= interactable.cooldown) {
                        interaction.currentTarget = targetId;
                        break;
                    }
                }
            }
        }

        // Notify about target changes (for UI highlighting)
        if (previousTarget !== interaction.currentTarget) {
            this.onTargetChanged(world, interactorId, previousTarget, interaction.currentTarget);
        }
    }

    private onTargetChanged(world: SolWorld, interactorId: number, oldTarget: number, newTarget: number): void {
        // Hook for UI updates - you can emit events here
        // For now, just clear/set indicators if you have them
        if (oldTarget !== -1 && world.entities.has(oldTarget)) {
            // Remove highlight from old target
        }

        if (newTarget !== -1) {
            // Add highlight to new target
            console.log(newTarget);
        }
    }

    private tryInteract(world: SolWorld, interactorId: number, time: number, interaction: InteractionComp): boolean {
        // Check cooldown
        if (time - interaction.lastInteractTime < interaction.interactCooldown) {
            return false;
        }

        // Check if we have a valid target
        if (interaction.currentTarget === -1 || !world.entities.has(interaction.currentTarget)) {
            return false;
        }

        const interactable = world.get(interaction.currentTarget, Comps.Interactable);
        if (!interactable || !interactable.enabled) {
            return false;
        }

        // Perform interaction
        interaction.lastInteractTime = time;
        interactable.lastInteraction = time;

        // Call the interaction callback
        if (interactable.onInteract) {
            interactable.onInteract(world, interactorId, interaction.currentTarget);
        }

        return true;
    }
}