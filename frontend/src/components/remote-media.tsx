import { useEffect, useRef } from "react";

import { Video } from "lucide-react";

type RemoteMediaProps = {
  remoteMedia: MediaStream | null;
};

const RemoteMedia = ({ remoteMedia }: RemoteMediaProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remoteMedia) {
      videoRef.current.srcObject = remoteMedia;
    }
  }, [remoteMedia]);

  if (!remoteMedia) {
    return (
      <div className="grid place-content-center w-lg h-64 rounded-sm bg-gray-700">
        <Video className="text-white" />
      </div>
    );
  }

  return (
    <video
      autoPlay
      playsInline
      ref={videoRef}
      controls={import.meta.env.MODE === "development"}
      className="w-lg h-lg rounded-sm border-2 border-red-500"
    />
  );
};

export default RemoteMedia;
