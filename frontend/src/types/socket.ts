export type ChatRequest = {
  type: "chat";
  message: string;
};

export type RTCRequest = {
  type: "sdp";
  sdp: RTCSessionDescriptionInit;
  sender: string;
  receiver: string;
};

export type ICErequest = {
  type: "ice-candidate";
  candidate: RTCIceCandidate;
};

export type SocketRequest = ChatRequest | RTCRequest | ICErequest;

export type ChatResponse = { message: string };

export type SdpResponse = {
  sdp: RTCSessionDescriptionInit;
  sender: string;
  receiver: string;
};

export type SocketResponse = ChatResponse | SdpResponse;
