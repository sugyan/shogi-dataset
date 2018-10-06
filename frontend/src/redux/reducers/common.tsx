import * as tf from "@tensorflow/tfjs";
import { CommonAction, CommonActionName } from "../actions/common";

export interface IcommonState {
    model?: tf.FrozenModel;
}

const initialState: IcommonState = {
};

export function commonReducer(state: IcommonState = initialState, action: CommonAction): IcommonState {
    switch (action.type) {
    case CommonActionName.LOAD_MODEL:
        return {
            ...state,
            model: action.model,
        };
    default:
        return state;
    }
}
