import { Action, ActionName } from "./actions";

export interface Istate {
    points: number[];
}

const initialState: Istate = {
    points: [],
};

export function reducer(state: Istate = initialState, action: Action): Istate {
    switch (action.type) {
        case ActionName.UPDATE_POINTS:
            return {
                ...state,
                points: action.points,
            };
        default:
            return state;
    }
}
