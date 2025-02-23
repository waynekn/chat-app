import { Routes, Route } from "react-router";

import HomePage from "./pages/home";
import Room from "./pages/room";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />}></Route>
      <Route path="/room/:roomName/" element={<Room />}></Route>
    </Routes>
  );
};

export default Router;
