import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobyScreen = () => {
  const [email, setEmail] = useState();
  const [room, setRoom] = useState();

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [handleJoinRoom, socket]);

  return (
    <div className="w-screen h-screen flex flex-col gap-y-4 items-center justify-center">
      <h1 className="font-bold text-2xl">Lobby</h1>
      <form onSubmit={handleSubmitForm} className="flex items-start flex-col gap-y-4">
        <div className="flex gap-x-2 items-center">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="border border-blue-700 rounded-lg w-96 h-10 p-4"
          />
        </div>

        <div className="flex gap-x-2 items-center">
          <input
            type="text"
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter a code or link"
            className="border border-blue-700 rounded-lg w-96 h-10 p-4"
          />
        </div>

        <button className="rounded-lg bg-blue-700 text-white font-bold w-24 h-8 ml-36">Join</button>
      </form>
    </div>
  );
};

export default LobyScreen;
