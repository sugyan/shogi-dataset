import { Action } from "redux";

import { IdivideNums } from "../reducers/uploader";

export enum UploaderActionName {
    CHANGE_DIVIDE     = "CHANGE_DIVIDE",
    CLEAR_STATE       = "CLEAR_STATE",
    LOAD_IMAGE        = "LOAD_IMAGE",
    UPDATE_IMAGE_DATA = "UPDATE_IMAGE_DATA",
    UPDATE_POINTS     = "UPDATE_POINTS",
}

interface IchangeDivideAction extends Action {
    type: UploaderActionName.CHANGE_DIVIDE;
    divide: IdivideNums;
}

interface IclearStateAction extends Action {
    type: UploaderActionName.CLEAR_STATE;
}

interface IloadImageAction extends Action {
    type: UploaderActionName.LOAD_IMAGE;
    image: HTMLImageElement;
}

interface IupdateImageDataAction extends Action {
    type: UploaderActionName.UPDATE_IMAGE_DATA;
    imageData: ImageData;
}

interface IupdatePointAction extends Action {
    type: UploaderActionName.UPDATE_POINTS;
    points: number[];
}

export type UploaderAction =
    | IchangeDivideAction
    | IclearStateAction
    | IloadImageAction
    | IupdateImageDataAction
    | IupdatePointAction;

export const changeDivideAction = (divide: IdivideNums): IchangeDivideAction => {
    return {
        divide,
        type: UploaderActionName.CHANGE_DIVIDE,
    };
};

export const clearStateAction = (): IclearStateAction => {
    return {
        type: UploaderActionName.CLEAR_STATE,
    };
};

export const loadImageAction = (image: HTMLImageElement): IloadImageAction => {
    return {
        image,
        type: UploaderActionName.LOAD_IMAGE,
    };
};

export const updateImageDataAction = (imageData: ImageData): IupdateImageDataAction => {
    return {
        imageData,
        type: UploaderActionName.UPDATE_IMAGE_DATA,
    };
};

export const updatePointAction = (points: number[]): IupdatePointAction => {
    return {
        points,
        type: UploaderActionName.UPDATE_POINTS,
    };
};
