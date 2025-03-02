import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

import { Button } from "@/components/ui/button";
import UserMedia from "@/components/user-media";
import ChatSidebar from "@/components/chat-sidebar";
import RemoteMedia from "@/components/remote-media";

import { handleSDPResponse, generateSDPOffer } from "@/utils/sdp";

import { SdpResponse, SocketRequest } from "@/types/socket";

const Room = () => {
  const { roomName } = useParams();

  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);

  const userIdRef = useRef<string>(null);
  const socketRef = useRef<WebSocket>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const userMediaMemo = useMemo(
    () => <UserMedia peerConnectionRef={peerConnectionRef} />,
    []
  );

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
          setChatMessages((prevMessages) => [...prevMessages, res.message]);
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

  const sendMsg = (message: string) => {
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
    }
  };

  const leaveRoom = async () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  };

  return (
    <div className="h-screen w-screen flex gap-10 items-center">
      <h1 className="absolute top-2 left-1/2 font-bold text-2xl underline">
        {roomName}
      </h1>
      <aside className="z-50 h-screen w-90 border-r-1">
        <ChatSidebar
          chatMessages={chatMessages}
          sendMsg={sendMsg}
          isSocketConnected={isConnected}
        />
      </aside>
      <div>{userMediaMemo}</div>

      <div>
        {isConnected ? (
          <Button onClick={leaveRoom} disabled={!isConnected}>
            Leave
          </Button>
        ) : (
          <Button onClick={joinRoom} disabled={isConnected}>
            Join
          </Button>
        )}
      </div>

      <RemoteMedia remoteMedia={remoteStream} />
    </div>
  );
};
export default Room;
