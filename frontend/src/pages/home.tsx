import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HomePage = () => {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  const navigateToRoom = async () => {
    await navigate(`room/${roomName}/`);
  };

  document.title = "Home page";

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div>
        <p>Join a room</p>
        <Input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="mb-2"
        />
        <Button disabled={!roomName} onClick={navigateToRoom}>
          Join room
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
