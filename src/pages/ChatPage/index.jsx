/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { flushSync } from "react-dom";
import { over } from "stompjs";
import SocketJS from "sockjs-client";
import { onlineUsers, assignAvatar } from "../../services/user.service";
import { SERVERS } from "../../services/axios.service";
import {
  tokenize,
  imageAvailable,
  readURL,
  decodeMsg,
} from "../../services/message.service";
import { decrypt } from "../../services/crypto.service";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Badge from "@mui/material/Badge";
import TextField from "@mui/material/TextField";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import "./ChatPage.css";
import { Global } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { grey } from "@mui/material/colors";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import avatar from "../../assets/images/avatar4.png";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import SendIcon from "@mui/icons-material/Send";
import Fab from "@mui/material/Fab";
import PeopleIcon from "@mui/icons-material/People";
import ring from "../../assets/audio/bell.wav";
let stompClients = [];
export const ChatPage = () => {
  const navigate = useNavigate();
  const state = useLocation().state;
  let blocked = false;
  const bell = new Audio(ring);
  const maxWindowWidth = 768;
  const lastMsg = useRef(null);
  const [users, setUsers] = useState(new Map());
  const [chats, setChats] = useState(new Map());
  const chatsData = useRef(new Map());
  const notifies = useRef([]);
  const currentChat = useRef(null);
  const [msgs, setMsgs] = useState(new Map());
  const [joined, setJoined] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const drawerBleeding = 50;
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("Message");
  const [render, setRender] = useState(false);
  const [msgRpws, setMsgRows] = useState(5);
  const [showSend, setShowSend] = useState(false);
  const [open, setOpen] = React.useState(false);
  const receivedMsgs = [];
  const [arrivedMsgs, setArrivedMsgs] = useState(0);
  const StyledBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "light" ? "#fff" : grey[800],
  }));
  const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
      backgroundColor: "#44b700",
      color: "#44b700",
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      "&::after": {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        animation: "ripple 1.2s infinite ease-in-out",
        border: "1px solid currentColor",
        content: '""',
      },
    },
    "@keyframes ripple": {
      "0%": {
        transform: "scale(.8)",
        opacity: 1,
      },
      "100%": {
        transform: "scale(2.4)",
        opacity: 0,
      },
    },
  }));
  const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: "rgba(255,255,255,.7)",
    borderRadius: 3,
    position: "absolute",
    top: 8,
    left: "calc(50% - 15px)",
  }));

  const connect = (user, users) => {
    SERVERS.forEach((url) => {
      const socket = new SocketJS(url + "ws");
      console.log("connecting to " + url);
      const stompClient = over(socket);
      stompClient.connect(
        {},
        () => onConnectionEstablished(user, users, stompClient),
        onError
      );
      stompClients.push(stompClient);
    });
  };
  // sometimes WebSockets connection breaks -> this reconnects user and server
  const reconnect = (id) => {
    const socket = new SocketJS(SERVERS[id] + "ws");
    stompClients[id] = over(socket);
    stompClients[id].connect(
      {},
      () => onConnectionEstablished(user, users),
      onError
    );
  };
  // saving message changes
  const handleMessageChange = (event) => {
    if (event.target.value === "" || event.target.value === "Message")
      setShowSend(false);
    else setShowSend(true);
    setMessage(event.target.value);
  };
  // image size is limited
  const invalidImage = () => {
    setSnackbarMessage("Max image width/height = 2060px!");
    setOpenSnackbar(true);
  };
  const sendMessage = (message) => {
    // console.log("Recepient pk: " + users.get(selectedUser).key);
    console.log(user);
    console.log(users.get(selectedUser));
    if (imageAvailable()) {
      if (
        message &&
        message !== "" &&
        message.replace(/(?:\r\n|\r|\n)/g, "") !== "" &&
        message.replace(/\s/g, "") !== ""
      ) {
        const tokens = tokenize(
          message,
          user.username,
          selectedUser ? selectedUser : "unknown",
          user.token,
          users.get(selectedUser).key,
          user.keys.secretKey
        );
        console.log(tokens);
        const servers_num = SERVERS.length;
        let counter = Math.floor(Math.random() * SERVERS.length);
        tokens.forEach((t) => {
          try {
            if (stompClients[counter] === null) {
              reconnect(SERVERS[counter]);
              setTimeout(
                () =>
                  stompClients[counter].send(
                    "/app/chatroom",
                    {},
                    JSON.stringify(t)
                  ),
                400
              );
            }
            stompClients[counter].send("/app/chatroom", {}, JSON.stringify(t));
            counter = (counter + 1) % servers_num;
          } catch (e) {}
        });
        // this enables scroolIntoView to work properly
        flushSync(() => {
          // add new message to chat -> causes new render because of ***
          if (!chatsData.current.has(selectedUser))
            chatsData.current.set(selectedUser, []);
          chatsData.current.get(selectedUser).push({
            received: false,
            content: message,
          });
          // resets message
          setMessage("");
          //***
          setChats(new Map(chatsData.current));
        });
        // scrolling to last element
        if (lastMsg && lastMsg.current) lastMsg.current.scrollIntoView(false);
      }
    } else {
      setSnackbarMessage("Pick photo first!");
      setOpenSnackbar(true);
    }
  };
  const handleSendMessage = (message) => {
    sendMessage(message);
  };
  const handleOpenSnackbar = () => {
    setOpenSnackbar(true);
  };
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };
  const handleSelectUser = (user) => {
    setOpen(false);
    // if there are new arrived messages from seleceted user...
    decreaseArrivedMsgs(user);
    currentChat.current = user;
    setSelectedUser(user);
  };
  const logoutUser = () => {
    let i = 0;
    let n = SERVERS.length;
    for (i; i < n; i++) {
      if (stompClients[i] === null) {
        reconnect(SERVERS[i]);
        setTimeout(
          () => stompClients[i].send("/app/chatroom/leave", {}, user.token),
          800
        );
      } else stompClients[i].send("/app/chatroom/leave", {}, user.token);
      navigate("/SecureChat");
    }
  };
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  const onConnectionEstablished = (userObj, usersMap, stompClient) => {
    //timeout after establishing connection required from unknown reasons
    setTimeout(() => {
      // subscribing user to topic that stores active users
      stompClient.subscribe("/chatroom/users/active", (payload) =>
        newActiveUserNotify(payload, usersMap)
      );
      // subscribing user to topic that stores data about users that left chat
      stompClient.subscribe("/chatroom/users/left", (payload) =>
        userLeftNotify(payload, usersMap)
      );
      const chatRequest = {
        token: userObj.token,
        key: JSON.stringify(Object.values(userObj.keys.publicKey)),
      };
      // console.log(userObj.keys.publicKey);
      // console.log(Object.values(userObj.keys.publicKey));
      // console.log(chatRequest);

      // joining chat
      stompClient.send("/app/chatroom/join", {}, JSON.stringify(chatRequest));
      // joining to user-specific topic (inbox)
      stompClient.subscribe("/user/" + userObj.username + "/inbox", (payload) =>
        messageReceived(payload, usersMap, userObj)
      );
      setJoined(true);
    }, 100);
  };
  const onError = () => {};
  // action performed after one of the active users leave chat
  const userLeftNotify = (payload, usersMap) => {
    if (payload.body !== JSON.parse(state).user.username) {
      usersMap.delete(payload.body);
      setUsers(new Map(usersMap));
      if (payload.body === selectedUser) setSelectedUser(null);
    }
  };
  // action performed after new users joined chat
  const newActiveUserNotify = (payload, usersMap) => {
    const newUser = JSON.parse(payload.body);
    if (
      newUser.username !== JSON.parse(state).user.username &&
      chatsData.current.has(newUser.username) === false
    ) {
      usersMap.set(newUser.username, assignAvatar(newUser));
      setUsers(new Map(usersMap));
    }
  };
  // handles mesage fragment -> puts it in collection with other fragments from same message
  const assembleMsg = (sender, msg) => {
    try {
      const tokens = msg.split("###");
      const len = Number.parseInt(tokens[1].split("/")[1]);
      flushSync(() => {
        if (!msgs.has(sender)) {
          // console.log("msg from new user");
          msgs.set(sender, new Map());
        }
        if (!receivedMsgs.includes(tokens[0])) {
          if (!msgs.get(sender).has(tokens[0]))
            msgs.get(sender).set(tokens[0], new Map());
          if (!msgs.get(sender).get(tokens[0]).has(tokens[1])) {
            msgs.get(sender).get(tokens[0]).set(tokens[1], tokens[2]);
          }
          // all fragments collected - new message is added to chat
          if (msgs.get(sender).get(tokens[0]).size === len) {
            console.log(msgs.get(sender).get(tokens[0]));
            // console.log("fragments collected");
            receivedMsgs.push(tokens[0]);
            // console.log(receivedMsgs);
            const msgTokens = msgs.get(sender).get(tokens[0]);
            let msg = "";
            for (let i = 1; i <= msgTokens.size; i++) {
              const key = i + "/" + len;
              msg += msgTokens.get(key);
            }
            msgs.get(sender).delete(tokens[1]);
            if (!chatsData.current.has(sender))
              chatsData.current.set(sender, []);
            chatsData.current.get(sender).push({
              received: true,
              content: msg.replace(/%%%/gm, "\n"),
            });

            setChats(new Map(chatsData.current));
            console.log(notifies.current);
            console.log(currentChat.current);
            // creating notify about new arrived message
            if (
              currentChat.current !== sender &&
              !notifies.current.includes(sender)
            ) {
              const temp = notifies.current;
              temp.push(sender);
              notifies.current = temp;
              console.log("playing");

              setArrivedMsgs(temp.length);
            }
            if (currentChat.current !== sender) new Audio(ring).play();
          }
          setMsgs(new Map(msgs));
        }
      });
    } catch (e) {}
    if (lastMsg && lastMsg.current) lastMsg.current.scrollIntoView(false);
  };
  // action performed after receivein new fragment
  const messageReceived = (payload, users, user) => {
    let msg = JSON.parse(payload.body);
    // console.log(msg);

    // exctracting sender, sender public key, nonce and content from fragment
    const sender = msg.sender;
    console.log(users);
    console.log(sender);
    const nonce = new Uint8Array(JSON.parse(msg.nonce));
    console.log(nonce);
    console.log(users.get(sender).key);
    console.log(user.keys.secretKey);
    // if cotnent starts with data:image -> encrypted message is hidden inside of image
    if (msg.content.startsWith("data:image")) {
      console.log("Fragment to decode:");
      console.log(msg.content);
      const temp = new Image();
      temp.src = msg.content;
      temp.onload = () => {
        console.log("loaded image to decode");
        const content = new Uint8Array(JSON.parse(decodeMsg(temp)));
        console.log(content);
        const decrypted_content = decrypt(
          content,
          nonce,
          users.get(sender).key,
          user.keys.secretKey
        );
        console.log("decrypted: " + decrypted_content);
        try {
          assembleMsg(sender, decrypted_content.replace("엛", ""));
        } catch (e) {}
      };
    } else {
      const content = new Uint8Array(JSON.parse(msg.content));
      console.log(content);
      // decrypting
      const decrypted_content = decrypt(
        content,
        nonce,
        users.get(sender).key,
        user.keys.secretKey
      );
      console.log("decrypted: " + decrypted_content);
      assembleMsg(sender, decrypted_content);
    }
  };

  useEffect(() => {
    if (!state) {
      console.log("triggered");
      navigate("/SecureChat");
    } else {
      let array = [];
      const tempUser = JSON.parse(state).user;
      console.log(tempUser);
      tempUser.keys.publicKey = new Uint8Array(
        Object.values(tempUser.keys.publicKey)
      );
      tempUser.keys.secretKey = new Uint8Array(
        Object.values(tempUser.keys.secretKey)
      );
      setUser(tempUser);
      // fetching info about users that alredy joined chat
      onlineUsers()
        .catch(() => {})
        .then((response) => {
          if (response !== undefined) {
            const temp = response.data.filter(
              (u) => u.username !== tempUser.username
            );
            array = temp.map((u) => assignAvatar(u));
            const map = new Map();
            array.forEach((u) => map.set(u.user, u));
            console.log(map);
            setUsers(map);
            if (!joined) {
              // establising WebSocket connection with servers
              connect(tempUser, map);
            }
          }
        });
    }
  }, []);
  // handles notifies
  const decreaseArrivedMsgs = (user) => {
    const index = notifies.current.indexOf(user);
    if (index > -1) {
      notifies.current.splice(index, 1);
      setArrivedMsgs(notifies.current.length);
    }
  };

  return (
    user && (
      <div className="chat-page">
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                Secure Chat
              </Typography>
              <LockIcon
                sx={{ marginLeft: 1, display: { xs: "none", sm: "block" } }}
              ></LockIcon>

              <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
              >
                <Avatar
                  src={avatar}
                  className="avatar-img"
                  alt="avatar"
                  sx={{ width: 45, height: 45, bgcolor: "black" }}
                ></Avatar>
              </StyledBadge>
              <Typography sx={{ marginRight: 2, marginLeft: 2 }}>
                {user.username}
              </Typography>
              <Box
                sx={{ display: { xs: "flex", md: "flex", marginRight: 70 } }}
              >
                <Badge badgeContent={arrivedMsgs} color="error">
                  <MailIcon />
                </Badge>
              </Box>
              <Button
                size="small"
                color="error"
                aria-label="add an alarm"
                onClick={logoutUser}
                id="logout-btn"
                sx={{ borderRadius: "10px" }}
              >
                <PowerSettingsNewIcon />
              </Button>
            </Toolbar>
          </AppBar>
        </Box>
        <CssBaseline />
        <Global
          styles={{
            ".MuiDrawer-root > .MuiPaper-root": {
              height: `calc(50% - ${drawerBleeding}px)`,
              overflow: "visible",
            },
          }}
        />
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <MuiAlert
            onClose={handleCloseSnackbar}
            severity="error"
            sx={{ width: "100%" }}
            variant="filled"
            elevation={6}
          >
            {snackbarMessage}
          </MuiAlert>
        </Snackbar>
        {!open && (
          <Fab
            aria-label="add"
            size="small"
            sx={{
              display: { xs: "none", sm: "flex" },
              position: "fixed",
              bottom: 8,
              right: "calc(50% - 20px)",
              zIndex: 1201,
            }}
            onClick={toggleDrawer(true)}
          >
            {" "}
            <PeopleIcon />
          </Fab>
        )}
        {selectedUser && users.has(selectedUser) && (
          <div className="chat-area">
            <div className="selected-user">
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
              >
                <Avatar
                  src={users.get(selectedUser).avatar}
                  className="avatar-img"
                  alt="avatar"
                  sx={{ width: 45, height: 45, bgcolor: "black" }}
                ></Avatar>
              </StyledBadge>
              <div className="username">{users.get(selectedUser).user}</div>
            </div>
            <div className="messages">
              {chats.get(selectedUser) &&
                chats.get(selectedUser).map((m) => {
                  return (
                    <div
                      className={
                        m.received
                          ? "message-wrapper-received"
                          : "message-wrapper-sent"
                      }
                    >
                      <div
                        className={
                          "message received " +
                          (m.received ? "received" : "sent")
                        }
                      >
                        {m.received && (
                          <Avatar
                            src={users.get(selectedUser).avatar}
                            className={"msg-avatar received-msg-avatar"}
                            alt="avatar"
                            sx={{ width: 35, height: 35, bgcolor: "black" }}
                          ></Avatar>
                        )}

                        <pre>{m.content}</pre>
                        {!m.received && (
                          <Avatar
                            src={avatar}
                            className="msg-avatar sent-msg-avatar"
                            alt="avatar"
                            sx={{ width: 35, height: 35, bgcolor: "black" }}
                          ></Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
              <div id="end" ref={lastMsg}></div>
            </div>
            <div className="new-message-wrapper">
              <div className="new-message">
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  size="medium"
                  className="buttons"
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(event) => readURL(event, invalidImage)}
                  />
                  <PhotoCamera fontSize="inherit" />
                </IconButton>
                <TextField
                  size="small"
                  id="new-message-input"
                  multiline
                  fullWidth={!showSend ? false : true}
                  maxRows={msgRpws}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyUp={(e) => {
                    e.preventDefault();
                    // console.log(window.innerWidth);
                    const temp = message.substring(0, message.length - 1);
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      window.innerWidth >= maxWindowWidth
                    ) {
                      setMessage(temp);
                      handleSendMessage(temp);
                    }
                  }}
                  onFocus={() => {
                    if (message === "" || message === "Message")
                      handleMessageChange({ target: { value: "" } });
                    setMsgRows(5);
                  }}
                  onBlur={() => {
                    if (message === "")
                      handleMessageChange({ target: { value: "Message" } });
                    setMsgRows(1);
                  }}
                ></TextField>
                {showSend && (
                  <IconButton
                    size="medium"
                    onClick={() => handleSendMessage(message)}
                  >
                    <SendIcon color="primary" fontSize="inherit"></SendIcon>
                  </IconButton>
                )}
              </div>
            </div>
          </div>
        )}
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          swipeAreaWidth={drawerBleeding}
          disableSwipeToOpen={false}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: {
              div: {
                backgroundColor: "#1976d2",
                color: "#1976d2",
                div: {
                  backgroundColor: "rgba(255,255,255,.7)",
                },
              },
            },
          }}
        >
          <StyledBox
            sx={{
              position: "absolute",
              top: -drawerBleeding,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              visibility: "visible",
              right: 0,
              left: 0,
            }}
          >
            <Puller />
            <Typography sx={{ p: 2, color: "rgba(255,255,255,.7)" }}>
              {users.size + " online users"}
            </Typography>
          </StyledBox>
          <StyledBox
            sx={{
              px: 2,
              pb: 2,
              height: "100%",
              overflow: "auto",
            }}
          >
            <div className="online-users">
              {Array.from(users.values()).map((user) => {
                return (
                  <button
                    className={
                      selectedUser && selectedUser === user.user
                        ? "avatar-button glow"
                        : "avatar-button"
                    }
                    onClick={() => handleSelectUser(user.user)}
                  >
                    <div key={user.user} className="user-label">
                      <StyledBadge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        variant="dot"
                      >
                        <Avatar
                          src={user.avatar}
                          className="avatar-img"
                          alt="avatar"
                          sx={{ width: 65, height: 65, bgcolor: "black" }}
                        ></Avatar>
                      </StyledBadge>

                      <div className="username">{user.user}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </StyledBox>
        </SwipeableDrawer>
      </div>
    )
  );
};
export default ChatPage;
