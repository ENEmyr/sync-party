import { SET_GLOBAL_STATE } from '../actions/actionTypes';
import { baseState } from '../common/helpers';

const initialState: AppState = { ...baseState, loggedIn: null };

export default (
    state: AppState = initialState,
    action: AppAction
): AppState => {
    switch (action.type) {
        case SET_GLOBAL_STATE: {
            return {
                ...state,
                ...action.globalStateProperties
            };
        }
        default: {
            return state;
        }
    }
};
