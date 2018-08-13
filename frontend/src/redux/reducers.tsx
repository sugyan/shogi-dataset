import { Action, ActionName, IloadImageAction, IupdatePointAction } from "./actions";

export interface Istate {
    image?: HTMLImageElement;
    points: number[];
}

const initialState: Istate = {
    image: undefined,
    points: [
        0.1, 0.1,
        0.9, 0.1,
        0.9, 0.9,
        0.1, 0.9,
    ],
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
                image: action.image,
            };
        default:
            return state;
    }
}
