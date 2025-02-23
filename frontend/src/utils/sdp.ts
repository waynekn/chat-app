export const generateSDPOffer = async (peerConnection: RTCPeerConnection) => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

export const handleSDPResponse = async (
  sdp: RTCSessionDescriptionInit,
  peerConnection: RTCPeerConnection
) => {
  if (!peerConnection) {
    return;
  }

  if (sdp.type === "offer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } else if (sdp.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  }
};
