import { Action, ActionName, IloadImageAction, IupdatePointAction } from "./actions";

export interface Istate {
    dataUrl?: string;
    points: number[];
}

const initialState: Istate = {
    dataUrl: undefined,
    points: [],
};

export function reducer(state: Istate = initialState, action: Action): Istate {
    switch (action.type) {
        case ActionName.UPDATE_POINTS:
            return {
                ...state,
                points: action.points,
            };
        case ActionName.LOAD_IMAGE:
            return {
                ...state,
                dataUrl: action.dataUrl,
            };
        default:
            return state;
    }
}
