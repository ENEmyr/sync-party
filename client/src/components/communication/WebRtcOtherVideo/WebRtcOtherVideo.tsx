import React, { ReactElement } from 'react';

interface Props {
    memberStatus: any;
    userIdWebRtcIdMap: any;
    displayedMediaStream: any;
    mediaStreamsRef: any;
    isOwnVideo: boolean;
    webRtcIsFullscreen: boolean;
    displayVertically: boolean;
    otherVideosAmount: number;
}

export default function WebRtcOtherVideo({
    memberStatus,
    userIdWebRtcIdMap,
    displayedMediaStream,
    mediaStreamsRef,
    isOwnVideo,
    webRtcIsFullscreen,
    displayVertically,
    otherVideosAmount
}: Props): ReactElement | null {
    let maxVideoWidth = '100vw';
    let maxVideoHeight = '100vh';

    if (
        otherVideosAmount === 2 ||
        otherVideosAmount === 3 ||
        otherVideosAmount === 4
    ) {
        maxVideoWidth = '50vw';
        maxVideoHeight = otherVideosAmount > 2 ? '50vh' : '100vh';
    } else if (otherVideosAmount === 5 || otherVideosAmount === 6) {
        maxVideoWidth = '33.3vw';
        maxVideoHeight = '50vh';
    }

    return memberStatus &&
        memberStatus[userIdWebRtcIdMap[displayedMediaStream.webRtcId]].online &&
        displayedMediaStream.mediaStream.getVideoTracks().length &&
        !isOwnVideo ? (
        <div
            key={displayedMediaStream.webRtcId}
            className={
                'overflow-hidden bg-transparent flex' +
                (webRtcIsFullscreen ? '' : ' rounded')
            }
            style={{
                maxWidth: maxVideoWidth,
                margin: webRtcIsFullscreen
                    ? '0 auto'
                    : displayVertically
                    ? '0 0 0.5rem 0'
                    : '0 0.5rem 0 0',
                flex: '1 1 ' + maxVideoWidth,
                height: webRtcIsFullscreen
                    ? maxVideoHeight
                    : displayVertically
                    ? ' '
                    : 'auto'
            }}
        >
            <video
                className="object-cover"
                style={{
                    flex: '1 1 auto'
                }}
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
