import { Action, ActionName } from "./actions";

export interface Ipoint {
    x: number;
    y: number;
}

export interface Istate {
    image?: HTMLImageElement;
    points: Ipoint[];
    exampleIndex: number;
}

const initialState: Istate = {
    exampleIndex: 0,
    image: undefined,
    points: [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.9, y: 0.9 },
        { x: 0.1, y: 0.9 },
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
