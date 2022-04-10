import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalState } from '../../../actions/globalActions';

import Axios from 'axios';
import {
  baseState,
  axiosConfig,
  updateCurrentParty,
  noPartyState
} from '../../../common/helpers';
import { useTranslation } from 'react-i18next';

import { getUpdatedUserParties } from '../../../common/requests';
import InputText from '../../input/InputText/InputText';
import Heading from '../../display/Heading/Heading';
import Button from '../../input/Button/Button';
import Alert from '../../display/Alert/Alert';
import PartyTile from '../../ui/PartyTile/PartyTile';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHdd } from '@fortawesome/free-solid-svg-icons';
import { Socket } from 'socket.io-client';
import { Navigate } from 'react-router-dom';

type Props = {
  socket: Socket | null;
};

export default function ScreenDashboard(props: Props): JSX.Element | null {
  const [redirectToParty, setRedirectToParty] = useState('');
  const [redirectToUser, setRedirectToUser] = useState(false);
  const [redirectToMediaItems, setRedirectToMediaItems] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false); //added
  const [redirect, setRedirect] = useState(false); //added
  const [redirectToPartySettings, setRedirectToPartySettings] = useState('');
  const [partyName, setPartyName] = useState('');
  const userParties = useSelector(
    (state: RootAppState) => state.globalState.userParties
  );
  const party = useSelector((state: RootAppState) => state.globalState.party);
  const user = useSelector((state: RootAppState) => state.globalState.user);
  const errorMessage = useSelector(
    (state: RootAppState) => state.globalState.errorMessage
  );
  const dispatch = useDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (props.socket && party && !redirectToParty) {
      props.socket.emit('leaveParty', { partyId: party.id });
      dispatch(setGlobalState(noPartyState));
    }
  }, [props.socket, party, dispatch, redirectToParty]);

  const handleCreateParty = async (
    event: React.MouseEvent
  ): Promise<void> => {
    event.preventDefault();

    try {
      const response = await Axios.post(
        process.env.REACT_APP_SERVER_URL + '/api/party',
        { partyName: partyName },
        axiosConfig()
      );
      if (response.data.success) {
        const updatedUserParties = await getUpdatedUserParties(
          dispatch,
          t
        );
        if (party) {
          await updateCurrentParty(
            dispatch,
            updatedUserParties,
            party
          );
        }
        setPartyName('');
      } else {
        dispatch(
          setGlobalState({
            errorMessage: t(
              `apiResponseMessages.${response.data.msg}`
            )
          })
        );
      }
    } catch (error) {
      dispatch(
        setGlobalState({
          errorMessage: t(`errors.partyCreationError`)
        })
      );
      return Promise.reject(error);
    }
  };

  const handlePartyChoose = (userParty: ClientParty): void => {
    dispatch(setGlobalState({ party: userParty }));
    setRedirectToParty(userParty.id);
  };

  if (redirectToParty !== '') {
    return <Navigate to={'/party/' + redirectToParty}></Navigate>;
  }

  if (redirectToPartySettings !== '') {
    return (
      <Navigate to={'/editParty/' + redirectToPartySettings}></Navigate>
    );
  }

  if (redirectToUser) {
    return <Navigate to={'/user'}></Navigate>;
  }

  if (redirectToMediaItems) {
    return <Navigate to={'/mediaItems'}></Navigate>;
  }

  // added
  const handleLogoutButton = async (): Promise<void> => {
    try {
      const response = await Axios.post(
        process.env.REACT_APP_SERVER_URL + '/api/logout',
        {},
        axiosConfig()
      );

      if (response.data.success === true) {
        setLoggedOut(true);

        dispatch(setGlobalState(baseState));
      } else {
        dispatch(
          setGlobalState({
            errorMessage: t(
              `apiResponseMessages.${response.data.msg}`
            )
          })
        );
      }
    } catch (error) {
      dispatch(
        setGlobalState({
          errorMessage: t(`errors.logoutError`)
        })
      );
    }
  };

  if (loggedOut || redirect) {
    return <Navigate to="/"></Navigate>;
  }

  return (
    <>
      <div className="flex flex-col">
        {user && (
          <div className='w-full flex flex-row justify-end'>
            <div className="mx-2 mt-1 mb-3">
              <FontAwesomeIcon
                icon={faUser}
                size="sm"
              ></FontAwesomeIcon>
              <a className="btn user-setting" href="#user-setting"> {user.username} </a>
            </div>
            <div id="user-setting" className="modal-window">
              <div>
                <a href="#" title="Close" className="modal-close">Close</a>
                <h1> {user.username} </h1>
                <div className="flex-row mt-4">
                  <Button
                    className="ml-auto text-red-500 w-full"
                    color="text-red-500 border-red-500 hover:text-red-400 hover:border-red-400"
                    onClick={handleLogoutButton}
                    text={t('common.logout')}
                  ></Button>
                </div>
              </div>
            </div>
          </div>
          // <div className="w-full flex flex-row justify-end">
          //     <div className="mx-2 mt-1 mb-3">
          //         <div
          //             className="cursor-pointer"
          //             onClick={(): void => setRedirectToUser(true)}
          //             title={t('common.userLinkTitle')}
          //         >
          //             <FontAwesomeIcon
          //                 icon={faUser}
          //                 size="sm"
          //             ></FontAwesomeIcon>{' '}
          //             {user.username}
          //         </div>
          //     </div>
          // </div>
        )}
        {errorMessage && (
          <div className="w-full absolute">
            <div className="mx-auto mt-4 max-w-lg">
              <Alert
                className="w-full"
                mode="error"
                text={errorMessage}
                onCloseButton={(): void => {
                  dispatch(
                    setGlobalState({ errorMessage: '' })
                  );
                }}
              ></Alert>
            </div>
          </div>
        )}
        {user && (
          <div className="m-auto max-w-lg">
            {user.role === 'admin' && (
              <form>
                <div className="flex flex-row mb-5">
                  <div>
                    <InputText
                      containerClassName="w-full"
                      label={
                        t('dashboard.newParty') + ':'
                      }
                      labelWidth="w-32"
                      placeholder={t('common.name')}
                      value={partyName}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ): void =>
                        setPartyName(event.target.value)
                      }
                    ></InputText>
                  </div>
                  <Button
                    type="submit"
                    className="ml-3 mb-3 w-24"
                    text={t('dashboard.createParty')}
                    onClick={handleCreateParty}
                  ></Button>
                </div>
              </form>
            )}
            <div className="m-auto pb-12 mt-3">
              <div className="flex flex-row">
                <Heading
                  size={3}
                  text={t('dashboard.yourParties')}
                ></Heading>
              </div>
              <div className="flex flex-col md:flex-row mb-4 flex-wrap">
                {userParties ? (
                  userParties.map(
                    (userParty: ClientParty) => {
                      return (
                        <PartyTile
                          key={userParty.id}
                          user={user}
                          userParty={userParty}
                          handlePartyChoose={
                            handlePartyChoose
                          }
                          setRedirectToPartySettings={
                            setRedirectToPartySettings
                          }
                          socket={props.socket}
                        ></PartyTile>
                      );
                    }
                  )
                ) : (
                  <div>{t('dashboard.noParties')}</div>
                )}
              </div>
              <Button
                className="w-40"
                text={
                  <span>
                    <FontAwesomeIcon
                      icon={faHdd}
                      size="lg"
                      className="mr-3"
                    ></FontAwesomeIcon>
                    {user.role === 'admin'
                      ? t('dashboard.allMedia')
                      : t('dashboard.yourMedia')}
                  </span>
                }
                onClick={(): void =>
                  setRedirectToMediaItems(true)
                }
              ></Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
