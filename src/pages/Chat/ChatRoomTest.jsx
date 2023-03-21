import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SocketJS from "sockjs-client";
let stompClient = null;
export const ChatRoomTest = () => {
  const [user, setUser] = useState({
    username: "",
    joined: false,
    connectionEstablished: false,
  });
  const [message, setMessage] = useState({
    content: "",
    recepient: "",
  });

  const newActiveUserNotify = (payload) => {
    console.log("New user: ");
    console.log(payload.body);
  };
  const messageReceived = (payload) => {
    console.log("New message: " + payload);
  };
  const onConnectionEstablished = () => {
    //timeout after establishing connection required from unknown reasons
    setTimeout(() => {
      console.log("Connection established");
      stompClient.subscribe("/chatroom/users", newActiveUserNotify); // subscribing user to topic that stores active users' usernames
      setUser({
        username: user.username,
        joined: user.joined,
        connectionEstablished: user.connectionEstablished,
      });
    }, 1000);
  };
  const onError = () => {
    console.log("Error!!!!");
  };
  useEffect(() => {
    const socket = new SocketJS("http://localhost:8080/SecureChat/ws");
    stompClient = over(socket);
    stompClient.connect({}, onConnectionEstablished, onError);
  }, []);
  const join = () => {
    stompClient.send("/app/chatroom/join", {}, user.username);
    stompClient.subscribe("/user/" + user.username + "/inbox", messageReceived); // subscribing user to topic that represents his chat inbox
  };
  const send = () => {
    stompClient.send(
      "/app/chatroom",
      {},
      JSON.stringify({ recepient: message.recepient, content: message.content })
    );
  };
  return (
    <div>
      username
      <input
        type="text"
        value={user.username}
        onChange={(event) =>
          setUser({
            username: event.target.value,
            joined: user.joined,
            connectionEstablished: user.connectionEstablished,
          })
        }
      ></input>
      <button onClick={join}>join</button>
      <input
        type="text"
        value={message.recepient}
        onChange={(event) =>
          setMessage({
            recepient: event.target.value,
            content: message.content,
          })
        }
      ></input>
      <input
        type="text"
        value={message.content}
        onChange={(event) =>
          setMessage({
            recepient: message.content,
            content: event.target.value,
          })
        }
      ></input>
      <button onClick={send}>Send</button>
    </div>
  );
};
export default ChatRoomTest;
