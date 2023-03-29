/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { flushSync } from "react-dom";
import { over } from "stompjs";
import SocketJS from "sockjs-client";
import { onlineUsers, assignAvatar } from "../../services/user.service";
import { BASE_URL } from "../../services/axios.service";
import {
  tokenize,
  imageAvailable,
  readURL,
  decodeMsg,
} from "../../services/message.service";
import { encode } from "../../services/steg.service/encode";
import { decode } from "../../services/steg.service/decode";
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

let stompClient = null;

export const ChatPage = () => {
  const navigate = useNavigate();
  const state = useLocation().state;
  let blocked = false;
  const maxWindowWidth = 768;
  const lastMsg = useRef(null);
  const [users, setUsers] = useState(new Map());
  const [chats, setChats] = useState(new Map());
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

  const reconnect = () => {
    // console.log("reconnecting");
    const socket = new SocketJS(BASE_URL + "ws");
    stompClient = over(socket);
    stompClient.connect(
      {},
      () => onConnectionEstablished(user, users),
      onError
    );
  };
  const handleMessageChange = (event) => {
    if (event.target.value === "" || event.target.value === "Message")
      setShowSend(false);
    else setShowSend(true);
    setMessage(event.target.value);
  };
  const sendMessage = (message) => {
    if (imageAvailable()) {
      if (
        message &&
        message !== "" &&
        message.replace(/(?:\r\n|\r|\n)/g, "") !== "" &&
        message.replace(/\s/g, "") !== ""
      ) {
        // console.log("SENDING: " + message + " !!!!!!!!!!!!!!!!!!!!!!!");
        const tokens = tokenize(
          message,
          user.username,
          selectedUser ? selectedUser : "unknown",
          user.token
        );
        console.log(tokens);
        tokens.forEach((t) => {
          try {
            stompClient.send("/app/chatroom", {}, JSON.stringify(t));
          } catch (e) {
            // console.log(e);
          }
        });
        flushSync(() => {
          if (!chats.has(selectedUser)) chats.set(selectedUser, []);
          chats.get(selectedUser).push({
            received: false,
            content: message,
          });
          setMessage("");
          setChats(new Map(chats));
        });
        if (lastMsg && lastMsg.current) lastMsg.current.scrollIntoView(false);
      }
    } else {
      setSnackbarMessage("Niste odabrali fotografiju!");
      setOpenSnackbar(true);
    }
  };
  const handleSendMessage = (message) => {
    if (stompClient === null) {
      reconnect();
      setTimeout(() => sendMessage(message), 400);
    } else sendMessage(message);
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
  const logoutUser = () => {
    if (stompClient === null) {
      reconnect();
      setTimeout(() => logout(), 800);
    } else logout();
  };
  const logout = () => {
    stompClient.send("/app/chatroom/leave", {}, user.token);
    navigate("/SecureChat");
  };
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  const onConnectionEstablished = (userObj, usersMap) => {
    //timeout after establishing connection required from unknown reasons
    setTimeout(() => {
      stompClient.subscribe("/chatroom/users/active", (payload) =>
        newActiveUserNotify(payload, usersMap)
      ); // subscribing user to topic that stores active users' usernames
      stompClient.subscribe("/chatroom/users/left", (payload) =>
        userLeftNotify(payload, usersMap)
      ); // subscribing user to topic that stores active users' usernames
      stompClient.send("/app/chatroom/join", {}, userObj.token);
      stompClient.subscribe("/user/" + userObj.username + "/inbox", (payload) =>
        messageReceived(payload, usersMap)
      ); // subscribing user to topic that represents his chat inbox
      setJoined(true);
    }, 100);
  };
  const onError = () => {};
  const userLeftNotify = (payload, usersMap) => {
    // console.log("LEFT LEFT LEFT LEFT USER!!!!!   " + payload.body);

    if (payload.body !== JSON.parse(state).user.username) {
      // while (blocked) console.log("waiting");
      // blocked = true;
      // console.log(Array.from(usersMap.values()));
      usersMap.delete(payload.body);
      // console.log(Array.from(usersMap.values()));
      setUsers(new Map(usersMap));
      blocked = false;
      if (payload.body === selectedUser) setSelectedUser(null);
    } else console.log("SAME");
  };
  const newActiveUserNotify = (payload, usersMap) => {
    if (payload.body !== JSON.parse(state).user.username) {
      // console.log(Array.from(usersMap.values()));
      usersMap.set(payload.body, assignAvatar(payload.body));
      // console.log(Array.from(usersMap.values()));
      setUsers(new Map(usersMap));
    }
  };
  const assembleMsg = (msg) => {
    try {
      const tokens = msg.split("#");
      const len = Number.parseInt(tokens[2].split("/")[1]);
      flushSync(() => {
        if (!msgs.has(tokens[0])) {
          // console.log("msg from new user");
          msgs.set(tokens[0], new Map());
        }
        if (!receivedMsgs.includes(tokens[1])) {
          if (!msgs.get(tokens[0]).has(tokens[1]))
            msgs.get(tokens[0]).set(tokens[1], new Map());
          if (!msgs.get(tokens[0]).get(tokens[1]).has(tokens[2])) {
            msgs.get(tokens[0]).get(tokens[1]).set(tokens[2], tokens[3]);
          }
          if (msgs.get(tokens[0]).get(tokens[1]).size === len) {
            console.log(msgs.get(tokens[0]).get(tokens[1]));
            // console.log("fragments collected");
            receivedMsgs.push(tokens[1]);
            // console.log(receivedMsgs);
            const msgTokens = msgs.get(tokens[0]).get(tokens[1]);
            let msg = "";
            for (let i = 1; i <= msgTokens.size; i++) {
              const key = i + "/" + len;
              msg += msgTokens.get(key);
            }
            msgs.get(tokens[0]).delete(tokens[1]);
            if (!chats.has(tokens[0])) chats.set(tokens[0], []);
            chats.get(tokens[0]).push({
              received: true,
              content: msg.replace(/%%%/gm, "\n"),
            });
            setChats(new Map(chats));
          }
          setMsgs(new Map(msgs));
        }
      });
    } catch (e) {}
    if (lastMsg && lastMsg.current) lastMsg.current.scrollIntoView(false);
  };
  const messageReceived = (payload) => {
    let msg = payload.body;
    if (msg.startsWith("data:image")) {
      console.log("Fragment to decode:");
      console.log(msg);
      const temp = new Image();
      temp.src = msg;
      temp.onload = () => {
        console.log("loaded");
        msg = decodeMsg(temp);
        assembleMsg(msg.replace("엛", ""));
      };
    } else assembleMsg(msg);
  };

  useEffect(() => {
    if (!state) {
      console.log("triggered");
      navigate("/SecureChat");
    } else {
      let array = [];
      const tempUser = JSON.parse(state).user;
      setUser(tempUser);
      onlineUsers()
        .catch(() => {})
        .then((response) => {
          if (response !== undefined) {
            const temp = response.data.filter((u) => u !== tempUser.username);
            array = temp.map((u) => assignAvatar(u));
            const map = new Map();
            array.forEach((u) => map.set(u.user, u));
            setUsers(map);
            if (!joined) {
              // console.log("Joining!");
              const socket = new SocketJS(BASE_URL + "ws");
              stompClient = over(socket);
              stompClient.connect(
                {},
                () => onConnectionEstablished(tempUser, map),
                onError
              );
            }
          }
        });
    }
  }, []);

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
                <Badge badgeContent={4} color="error">
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

        {/* {image && <img src={image} alt="source"></img>}
      <button onClick={hideMsg}>Hide</button>
      {hiddenMsg && <img src={hiddenMsg} alt="hidden"></img>}
      <button onClick={revealMsg}>Reveal</button>
      <p>{msg}</p> */}
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
                    onChange={(event) => readURL(event)}
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
                    onClick={() => {
                      setOpen(false);
                      setSelectedUser(user.user);
                    }}
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
