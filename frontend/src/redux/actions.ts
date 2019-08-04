import { Action } from "redux";

import { User, DivideNums } from "./reducers";

export enum ActionTypes {
    SET_USER = "SET_USER",

    LOAD_IMAGE        = "LOAD_IMAGE",
    UPDATE_POINTS     = "UPDATE_POINTS",
    UPDATE_IMAGE_DATA = "UPDATE_IMAGE_DATA",
    CHANGE_DIVIDE     = "CHANGE_DIVIDE",
}

interface SetUserAction extends Action {
    type: ActionTypes.SET_USER;
    user: User;
}

export type UserAction = SetUserAction;

export const setUser = (user: User): SetUserAction => {
    return {
        type: ActionTypes.SET_USER,
        user,
    };
};

interface LoadImageAction extends Action {
    type: ActionTypes.LOAD_IMAGE;
    image?: HTMLImageElement;
}

interface UpdatePointsAction extends Action {
    type: ActionTypes.UPDATE_POINTS;
    points: number[];
}

interface UpdateImageDataAction extends Action {
    type: ActionTypes.UPDATE_IMAGE_DATA;
    imageData: ImageData;
}

interface ChangeDivideAction extends Action {
    type: ActionTypes.CHANGE_DIVIDE;
    divide: DivideNums;
}

export type UploadAction = (
    | LoadImageAction
    | UpdatePointsAction
    | UpdateImageDataAction
    | ChangeDivideAction
);

export const loadImage = (image?: HTMLImageElement): LoadImageAction => {
    return {
        type: ActionTypes.LOAD_IMAGE,
        image,
    };
};

export const updatePoints = (points: number[]): UpdatePointsAction => {
    return {
        type: ActionTypes.UPDATE_POINTS,
        points,
    };
};

export const updateImageData = (imageData: ImageData): UpdateImageDataAction => {
    return {
        type: ActionTypes.UPDATE_IMAGE_DATA,
        imageData,
    };
};

export const changeDivide = (divide: DivideNums): ChangeDivideAction => {
    return {
        type: ActionTypes.CHANGE_DIVIDE,
        divide,
    };
};
