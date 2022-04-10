import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonIcon from '../../input/ButtonIcon/ButtonIcon';
import Avatar from '../../display/Avatar/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { setGlobalState } from '../../../actions/globalActions';
import { faTimes } from '@fortawesome/free-solid-svg-icons'; //added
import { useState } from 'react'; //added
import { Socket } from 'socket.io-client'; //added
import EditParty from '../EditParty/EditParty'; //added
import Heading from '../../display/Heading/Heading'; //added

interface Props {
  user: User;
  userParty: ClientParty;
  handlePartyChoose: (userParty: ClientParty) => void;
  setRedirectToPartySettings: (partyId: string) => void;
  socket: Socket | null; //added
}

export default function PartyTile({
  user,
  userParty,
  handlePartyChoose,
  // setRedirectToPartySettings,
  socket
}: Props): ReactElement {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [editPartyOverlay, setEditPartyOverlay] = useState(false); //added

  return (
    <div
      className="w-40 h-40 p-2 mr-2 my-2 bg-gray-900 hover:bg-gray-800 cursor-pointer"
      key={userParty.id}
      onClick={(): void => {
        if (userParty.status === 'active' || user.role === 'admin') {
          if (!editPartyOverlay)
            handlePartyChoose(userParty);
        } else {
          dispatch(
            setGlobalState({
              errorMessage: t(`errors.joinInactivePartyError`)
            })
          );
        }
      }}
      title={t('dashboard.partyTileTitle')}
    >
      <div className="flex flex-row justify-between">
        <div
          className={
            'mb-1 text-xs' +
            (userParty.status === 'active'
              ? ' text-green-500'
              : ' text-red-600')
          }
        >
          {userParty.status === 'active'
            ? t('common.statusActive')
            : t('common.statusStopped')}
        </div>
        {user.role === 'admin' && (
          <div>
            <ButtonIcon
              color="text-gray-200 z-50"
              icon={
                <FontAwesomeIcon icon={faCog}></FontAwesomeIcon>
              }
              title={t('dashboard.editPartyTitle')}
              onClick={(event): void => {
                event.stopPropagation();
                // setRedirectToPartySettings(userParty.id);
                setEditPartyOverlay(true);
              }}
            ></ButtonIcon>
          </div>
        )}
      </div>
      <div className="mb-1">{userParty.name}</div>
      <div className="flex flex-row flex-wrap">
        {userParty.members.map((member: ClientPartyMember) => {
          return (
            <Avatar
              key={member.username}
              size={8}
              fontSize={'text-sm'}
              username={member.username}
              user={user}
            ></Avatar>
          );
        })}
      </div>
      {editPartyOverlay && userParty && user && socket && (
        <div className="absolute z-50 m-auto max-w-screen-md max-h-screen-md border border-gray-500 shadow-md backgroundShade p-5 ">
          <div className="flex flex-row justify-between">
            <Heading className="mb-5" size={2} text={`${t('common.party')}: ${userParty.name}`}></Heading>
            <ButtonIcon
              className="p-1"
              color="text-gray-200"
              title="Close"
              icon={
                <FontAwesomeIcon
                  icon={faTimes}
                  size="lg"
                ></FontAwesomeIcon>
              }
              onClick={(): void => setEditPartyOverlay(false)}
            ></ButtonIcon>
          </div>
          <EditParty
            party={userParty}
            user={user}
            socket={socket}
          ></EditParty>
        </div>
      )}
    </div>
  );
}
