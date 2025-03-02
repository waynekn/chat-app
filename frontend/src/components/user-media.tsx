import { useCallback, useEffect, useRef, useState } from "react";

import { Pause } from "lucide-react";
import { Play } from "lucide-react";
import { Button } from "./ui/button";

type UserMediaProps = {
  peerConnectionRef: React.RefObject<RTCPeerConnection | null>;
};

const UserMedia = ({ peerConnectionRef }: UserMediaProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const playUserMedia = useCallback(async () => {
    try {
      const constraints = { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      setIsStreaming(true);
    } catch (error) {
      console.error("Error opening video camera.", error);
    }
  }, [peerConnectionRef]);

  useEffect(() => {
    playUserMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsStreaming(false);
    };
  }, [playUserMedia]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      senders.forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
        peerConnectionRef.current?.removeTrack(sender);
      });
    }

    setIsStreaming(false);
  };

  return (
    <div>
      <video
        autoPlay
        playsInline
        ref={videoRef}
        controls
        className="w-lg h-lg rounded-sm"
      />
      <Button onClick={isStreaming ? stopStream : playUserMedia}>
        {isStreaming ? <Pause /> : <Play />}
      </Button>
    </div>
  );
};

export default UserMedia;
