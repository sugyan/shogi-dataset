import { UploaderAction, UploaderActionName } from "../actions/uploader";

export interface IdivideNums {
    row: number;
    col: number;
}

export interface IuploaderState {
    image?: HTMLImageElement;
    imageData?: ImageData;
    points: number[];
    divide: IdivideNums;
}

const initialState: IuploaderState = {
    divide: {
        col: 9,
        row: 9,
    },
    points: [
        0.1, 0.1,
        0.9, 0.1,
        0.9, 0.9,
        0.1, 0.9,
    ],
};

export function uploaderReducer(state: IuploaderState = initialState, action: UploaderAction): IuploaderState {
    switch (action.type) {
    case UploaderActionName.CHANGE_DIVIDE:
        return {
            ...state,
            divide: action.divide,
        };
    case UploaderActionName.CLEAR_STATE:
        return initialState;
    case UploaderActionName.LOAD_IMAGE:
        return {
            ...state,
            image: action.image,
        };
    case UploaderActionName.UPDATE_IMAGE_DATA:
        return {
            ...state,
            imageData: action.imageData,
        };
    case UploaderActionName.UPDATE_POINTS:
        return {
            ...state,
            points: action.points,
        };
    default:
        return state;
    }
}
