import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { Button } from "@/components/ui/button";
import UserMedia from "@/components/user-media";
import RemoteMedia from "@/components/remote-media";

import { handleSDPResponse, generateSDPOffer } from "@/utils/sdp";

import { SdpResponse, SocketRequest } from "@/types/socket";

const Room = () => {
  const { roomName } = useParams();

  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const userIdRef = useRef<string>(null);
  const socketRef = useRef<WebSocket>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!userIdRef.current) {
      userIdRef.current = String(Math.random()).substring(2);
    }
  }, []);

  useEffect(() => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnectionRef.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          makeSocReq({
            type: "ice-candidate",
            candidate: event.candidate,
          });
        }
      };

      peerConnectionRef.current.onconnectionstatechange = (event) => {
        if (peerConnectionRef.current?.connectionState === "connected") {
          console.warn("peers connected", event);
        } else {
          console.log("peers not connected");
        }
      };
    }
  }, []);

  const handleStream = (stream: MediaStream) => {
    if (peerConnectionRef.current) {
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, stream);
      });
    }
  };

  const sendSdpOffer = useCallback((sdp: RTCSessionDescriptionInit) => {
    if (!sdp || !userIdRef.current) {
      return;
    }
    makeSocReq({
      type: "sdp",
      sdp: sdp,
      sender: userIdRef.current,
      receiver: "",
    });
  }, []);

  const sendSdpResponse = useCallback(
    (sdp: RTCSessionDescriptionInit, receiver: string) => {
      if (!sdp || !userIdRef.current) {
        return;
      }
      makeSocReq({
        type: "sdp",
        sdp: sdp,
        sender: userIdRef.current,
        receiver,
      });
    },
    []
  );

  const joinRoom = () => {
    if (!socketRef.current) {
      const socket = new WebSocket(
        `ws://localhost:8000/ws/chat/${roomName}/${userIdRef.current}/`
      );

      socket.onopen = async () => {
        setIsConnected(true);
        if (peerConnectionRef.current) {
          const sdp = await generateSDPOffer(peerConnectionRef.current);
          sendSdpOffer(sdp);
        }
      };

      socket.onmessage = async (e) => {
        const res = JSON.parse(e.data);

        if (res.message) {
          console.log(res.message);
        } else if (res.sdp) {
          const data = res as SdpResponse;
          const response = await handleSDPResponse(
            data.sdp,
            peerConnectionRef.current as RTCPeerConnection
          );
          if (response) {
            sendSdpResponse(response, res.sender);
          }
        } else if (res.candidate) {
          await peerConnectionRef.current?.addIceCandidate(res.candidate);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
      };

      socket.onerror = (e) => {
        console.log("WebSocket error:", e);
      };

      socketRef.current = socket;
    }
  };

  const sendMsg = () => {
    const trimmedMsg = message.trim();
    if (trimmedMsg === "") {
      return;
    }
    makeSocReq({
      type: "chat",
      message,
    });
  };

  const makeSocReq = (req: SocketRequest) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(req));
      setMessage("");
    }
  };

  const leaveRoom = async () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  };

  return (
    <div className="h-screen w-screen flex gap-10 justify-center items-center">
      <div>
        <UserMedia onStream={handleStream} />
      </div>

      <div>
        <p className="font-bold">{roomName}</p>
        {isConnected ? (
          <Button onClick={leaveRoom} disabled={!isConnected}>
            Leave
          </Button>
        ) : (
          <Button onClick={joinRoom} disabled={isConnected}>
            Join
          </Button>
        )}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border-2 border-red-500"
        />

        <Button onClick={sendMsg} disabled={!isConnected || !message}>
          Send Message
        </Button>
      </div>

      <RemoteMedia remoteMedia={remoteStream} />
    </div>
  );
};
export default Room;
