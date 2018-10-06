import { combineReducers, Reducer } from "redux";

import { commonReducer, IcommonState } from "./reducers/common";
import { IuploaderState, uploaderReducer } from "./reducers/uploader";

export interface Istate {
    commonReducer: IcommonState;
    uploaderReducer: IuploaderState;
}

export const reducer: Reducer<Istate> = combineReducers({
    commonReducer,
    uploaderReducer,
});
