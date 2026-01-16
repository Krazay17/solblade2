import type { Actions } from "@/common/core/SolConstants";
import { Component } from "../Component";


export class InputComp extends Component {
    state: Map<Actions, boolean> = new Map();
}