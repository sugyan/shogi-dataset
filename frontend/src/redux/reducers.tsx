import { Action, ActionName } from "./actions";

export interface Istate {
    image?: HTMLImageElement;
    points: number[];
    exampleIndex: number;
}

const initialState: Istate = {
    exampleIndex: 0,
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
        case ActionName.SELECT_EXAMPLE:
            return {
                ...state,
                exampleIndex: action.index,
            };
        default:
            return state;
    }
}
