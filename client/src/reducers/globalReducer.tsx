import { SET_GLOBAL_STATE } from '../actions/actionTypes';

const initialState: AppState = {
    loggedIn: null,
    user: null,
    uiVisible: true,
    playingItem: null,
    party: null,
    syncStatus: null,
    memberStatus: null,
    userParties: null,
    userItems: null,
    actionMessage: null,
    errorMessage: null,
    initialServerTimeOffset: 0,
    chat: {}
};

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
