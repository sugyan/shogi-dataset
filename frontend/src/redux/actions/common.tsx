import * as tf from "@tensorflow/tfjs";
import { Action } from "redux";

export enum CommonActionName {
    LOAD_MODEL = "LOAD_MODEL",
}

interface IloadModelAction extends Action {
    type: CommonActionName.LOAD_MODEL;
    model: tf.FrozenModel;
}

export type CommonAction = IloadModelAction;

export const loadModelAction = (model: tf.FrozenModel): IloadModelAction => {
    return {
        model,
        type: CommonActionName.LOAD_MODEL,
    };
};
