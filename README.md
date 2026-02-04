Developer: Josh Massarella

ECS Game framework for multiplayer browser game.

commands:
    npm run dev     :localy host at http://localhost:5173
    npm run devS    :local server at ws://localhost:8080

using:
    rendering: Three JS
    physics: Dimforge/Rapier3d

client entry point: CMain
server entry point: SMain

make component:
    in any          :export class NEW_COMPONENT extends Component
    in ECS.ts       :add any to enum Comps
    in ECSRegi.ts   :add Record to CompReg as enum->NEW_COMPONENT

use component:
    SolWorld.add(entityId, Comps.any)   :instantiate and assign component to entity
    SolWorld.get(entityId, Comps.any)   :get component or null
    SolWorld.query(...Comps[])          :get an array of entityId's that have these components

make system:
    in any          :export class NEW_SYSTEM implements ISystem
    in NEW_SYSTEM   :define any ISystem parameter to be added to world tick order,
                    define process to handle functionality on an entity.
    Iterate over every entity on tick
    in step()       :world.query(any Comps).foreach(process)

use system:
    Add a system to the clients game world only, order matters top systems will tick first.
    in CGame constructor    :new NEW_SYSTEM() in const addSystems array -

    Add a system to the servers game world only, order matters top systems will tick first.
    in SGame constructor    :new NEW_SYSTEM() in const addSystems array -

    Add a system to both the client and the servers game world, order matters top systems will tick first.
    in SolWorld constructor :new NEW_SYSTEM() in this.allSystems array -