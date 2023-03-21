import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SocketJS from "sockjs-client";
import { stepIconClasses } from "@mui/material";
let stompClient = null;
export const ChatRoomTest = () => {
  const [username, setUsername] = useState("");
  const [recepient, setRecepient] = useState("");
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);

  const newActiveUserNotify = (payload) => {
    console.log("New user: " + JSON.parse(payload));
  };
  const messageReceived = (payload) => {
    console.log("New message: " + JSON.parse(payload));
  };
  const onConnectionEstablished = () => {
    stompClient.subscribe("/chatroom/join", newActiveUserNotify); // subscribing user to topic that stores active users' usernames
    stompClient.subscribe("/user/Marko/inbox", messageReceived); // subscribing user to topic that represents his chat inbox
  };
  const onError = () => {
    console.log("Error");
  };
  useEffect(() => {
    const socket = new SocketJS("http://localhost:8080/ws");
    stompClient = over(socket);
    stompClient.connect({}, onConnectionEstablished, onError);
  }, []);
  const join = () => {
    stompClient.send("/app/join", username);
  };
  const send = () => {
    stompClient.send("/chat", JSON.stringify({ recepient, content: message }));
  };
  return (
    joined && (
      <div>
        username
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        ></input>
        <button onClick={join}>join</button>
        <input
          type="text"
          value={recepient}
          onChange={(event) => setRecepient(event.target.value)}
        ></input>
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        ></input>
        <button onClick={send}>Send</button>
      </div>
    )
  );
};
export default ChatRoomTest;
