import { useEffect, useRef } from "react";

type UserMediaProps = {
  onStream: (stream: MediaStream) => void;
};

const UserMedia = ({ onStream }: UserMediaProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playUserMedia = async () => {
      try {
        const constraints = { /*video: true,*/ audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        onStream(stream);
      } catch (error) {
        console.error("Error opening video camera.", error);
      }
    };

    playUserMedia();
  }, [onStream]);

  return (
    <video
      autoPlay
      playsInline
      controls={true}
      ref={videoRef}
      className="w-lg h-lg rounded-sm"
    />
  );
};

export default UserMedia;
