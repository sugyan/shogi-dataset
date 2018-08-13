import { Action, ActionName, IloadImageAction, IupdatePointAction } from "./actions";

export interface Istate {
    image?: HTMLImageElement;
    points: number[];
}

const initialState: Istate = {
    image: undefined,
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
                image: action.image,
            };
        default:
            return state;
    }
}
