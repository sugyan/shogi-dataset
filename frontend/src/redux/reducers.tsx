import { Action, ActionName, IloadImageAction, IupdatePointAction } from "./actions";

export interface IdivideNums {
    row: number;
    col: number;
}

export interface Istate {
    image?: HTMLImageElement;
    imageData?: ImageData;
    points: number[];
    divide: IdivideNums;
}

const initialState: Istate = {
    divide: {
        col: 9,
        row: 9,
    },
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
        case ActionName.CHANGE_DIVIDE:
            return {
                ...state,
                divide: action.divide,
            };
        case ActionName.LOAD_IMAGE:
            return {
                ...state,
                image: action.image,
            };
        case ActionName.UPDATE_IMAGE_DATA:
            return {
                ...state,
                imageData: action.imageData,
            };
        case ActionName.UPDATE_POINTS:
            return {
                ...state,
                points: action.points,
            };
        default:
            return state;
    }
}
