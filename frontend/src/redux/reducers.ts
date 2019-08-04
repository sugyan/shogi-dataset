import { Reducer, combineReducers } from "redux";

import { ActionTypes, UserAction, UploadAction } from "./actions";

export enum UserRole {
    anonymous = "anonymous",
    viewer = "viewer",
    editor = "editor",
}

export interface User {
    name?: string;
    role: UserRole;
}

export interface UserState {
    user?: User;
}

const userReducer: Reducer<UserState, UserAction> = (state: UserState = {}, action: UserAction): UserState => {
    switch (action.type) {
        case ActionTypes.SET_USER:
            return {
                ...state,
                user: action.user,
            };
        default:
            return state;
    }
};

export interface DivideNums {
    row: number;
    col: number;
}

export interface UploadState {
    image?: HTMLImageElement;
    points: number[];
    imageData?: ImageData;
    divide: DivideNums;
}

const uploadReducer: Reducer<UploadState, UploadAction> = (state: UploadState = {
    points: [
        0.1, 0.1,
        0.9, 0.1,
        0.9, 0.9,
        0.1, 0.9,
    ],
    divide: {
        col: 9,
        row: 9,
    },
}, action: UploadAction): UploadState => {
    switch (action.type) {
        case ActionTypes.LOAD_IMAGE:
            return {
                ...state,
                image: action.image,
            };
        case ActionTypes.UPDATE_POINTS:
            return {
                ...state,
                points: action.points,
            };
        case ActionTypes.UPDATE_IMAGE_DATA:
            return {
                ...state,
                imageData: action.imageData,
            };
        case ActionTypes.CHANGE_DIVIDE:
            return {
                ...state,
                divide: action.divide,
            };
        default:
            return state;
    }
};

export const reducer = combineReducers({
    userReducer,
    uploadReducer,
});
