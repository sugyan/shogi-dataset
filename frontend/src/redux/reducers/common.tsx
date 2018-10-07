import { CommonAction } from "../actions/common";

export interface IcommonState {
}

const initialState: IcommonState = {
};

export function commonReducer(state: IcommonState = initialState, action: CommonAction): IcommonState {
    switch (action.type) {
    default:
        return state;
    }
}
