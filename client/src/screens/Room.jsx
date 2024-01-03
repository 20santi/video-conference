import React, { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "../context/SocketProvider";
import peer from "../service/peer";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash  } from "react-icons/fa";
import { IoIosCall } from "react-icons/io";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSoketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [video, setVideo] = useState(true);

  const handleToggleVideo = () => {
    console.log("inside video");
    const videoTrack = myStream.getTracks().find(track => track.kind === "video");
    if (videoTrack.enabled) {
      videoTrack.enabled = false
      setVideo(false);
    } else {
      videoTrack.enabled = true;
      setVideo(true);
    }
  };

  const handleToggleMic = () => {
    const audioTrack = myStream.getTracks().find(track => track.kind === "audio");
    console.log("inside mic");
    if (audioTrack.enabled) {
      audioTrack.enabled = false
      setIsMuted(false);
    } else {
      audioTrack.enabled = true;
      setIsMuted(true);
    }
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`${email} joined the room`);
    setRemoteSoketId(id);
  }, []);

  const handleHangUp = () => {
    // Emit the "hangup" event to inform the server
    socket.emit("hangup");
    // Additional cleanup or UI updates as needed
    setRemoteSoketId(null);
    setMyStream(null);
    setRemoteStream(null);
  };

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSoketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log("Incomming call: ", from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call accepted");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    handleCallAccepted,
    handleIncommingCall,
    handleNegoNeedFinal,
    handleNegoNeedIncoming,
    handleUserJoined,
    myStream,
    socket,
  ]);

  return (
    <div className="w-screen h-screen flex flex-col gap-y-4 items-center justify-center">
      <h4 className="font-medium text-xl">
        {remoteSocketId ? "Connected" : "No one else is here"}
      </h4>
      {myStream && 
      <button 
        onClick={sendStreams} 
        className="rounded-lg bg-green-600 p-3 ml-4 text-white font-bold flex items-center justify-center"
      >
        Send Stream
      </button>}
      {remoteSocketId && (
        <div>
          <button
            onClick={handleCallUser}
            className="rounded-lg bg-blue-700 text-white font-bold w-24 h-8 ml-4"
          >
            Admit
          </button>
        </div>
      )}
      <div className="flex">
        {myStream && (
          <div className="flex flex-col">
            <h1 className="ml-4">My stream</h1>
            <ReactPlayer
              url={myStream}
              height="500px"
              width="800px"
              playing
              muted
            />
          </div>
        )}
        {remoteStream ? (
          <div className="flex flex-col">
            <h1>Remote stream</h1>
            <ReactPlayer
              url={remoteStream}
              height="500px"
              width="800px"
              playing
              muted
            />
          </div>
        ): (<div></div>)}
      </div>
      <div className="flex gap-x-4">
          <button 
            className={`${isMuted ? ("bg-blue-700 text-3xl text-white w-[60px] h-[60px] rounded-full flex items-center justify-center") 
            : ('text-3xl text-white w-[60px] h-[60px] rounded-full flex items-center justify-center bg-slate-400')}`}
            onClick={handleToggleMic}
          >
            {isMuted ? (<FaMicrophone/>) : (<FaMicrophoneSlash />)}
          </button>
          <button 
            className={`${video ? ("bg-blue-700 text-3xl text-white w-[60px] h-[60px] rounded-full flex items-center justify-center") 
            : ('text-3xl text-white w-[60px] h-[60px] rounded-full flex items-center justify-center bg-slate-400')}`}
            onClick={handleToggleVideo}
          >
            {video ? (<FaVideo/>) : (<FaVideoSlash/>)}
          </button>
          <button
            onClick={handleHangUp}
            className="rounded-full bg-red-700 w-[60px] h-[60px] text-white font-bold text-3xl flex items-center justify-center"
          >
            <IoIosCall/>
          </button>
      </div>
    </div>
  );
};

export default RoomPage;
