import React, { ReactElement } from 'react';

interface Props {
    memberStatus: any;
    userIdWebRtcIdMap: any;
    displayedMediaStream: any;
    mediaStreamsRef: any;
    isOwnVideo: boolean;
    webRtcIsFullscreen: boolean;
    displayVertically: boolean;
}

export default function WebRtcOtherVideo({
    memberStatus,
    userIdWebRtcIdMap,
    displayedMediaStream,
    mediaStreamsRef,
    isOwnVideo,
    webRtcIsFullscreen,
    displayVertically
}: Props): ReactElement | null {
    return memberStatus &&
        memberStatus[userIdWebRtcIdMap[displayedMediaStream.webRtcId]].online &&
        displayedMediaStream.mediaStream.getVideoTracks().length &&
        !isOwnVideo ? (
        <div
            key={displayedMediaStream.webRtcId}
            className={
                'overflow-hidden bg-transparent rounded flex justify-start ' +
                (webRtcIsFullscreen ? '' : displayVertically ? 'mb-2' : 'mr-2')
            }
            style={{
                maxWidth: '50vw',
                maxHeight: '50vh'
            }}
        >
            <video
                style={{ flex: 0 }}
                ref={(video): void => {
                    if (video) {
                        if (
                            video.srcObject !==
                            mediaStreamsRef.current[
                                displayedMediaStream.webRtcId
                            ]
                        ) {
                            video.srcObject =
                                mediaStreamsRef.current[
                                    displayedMediaStream.webRtcId
                                ];
                        }
                    }
                }}
                onLoadedMetadata={(event): void => {
                    event.currentTarget.play();
                }}
            ></video>
        </div>
    ) : null;
}
