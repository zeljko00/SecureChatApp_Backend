import { createAxiosClient } from "./request.interceptor";

const host = "192.168.100.8";
// const host = "192.168.43.63";
// const host = "localhost";
const protocol = "https";
const ports = [8443, 8442, 8441];
// const ports = [8443];
export const SERVERS = ports.map((port) => {
  return protocol + "://" + host + ":" + port + "/SecureChat/";
});
console.log(SERVERS);
console.log(ports);
// [
//   protocol + "://" + host + ":" + ports[0] + "/SecureChat/",
//   protocol + "://" + host + ":" + ports[1] + "/SecureChat/",
//   protocol + "://" + host + ":" + ports[2] + "/SecureChat/",
// ];

// load balancing
const main_server_id = Math.floor(Math.random() * SERVERS.length);
// login,register,activeUsers requests are sent only to "main" server
export const MAIN_SERVER = SERVERS[main_server_id];
// export const MAIN_SERVER = SERVERS[0];

function getToken() {
  try {
    const token = sessionStorage.getItem("token");
    // console.log(token);
    return token;
  } catch (ex) {
    console.log("no token");
    return "NO_TOKEN";
  }
}
// sets headers and baseURL for each ajax request
export const client = createAxiosClient({
  options: {
    baseURL: MAIN_SERVER,
    timeout: 300000,
    headers: {
      "Content-Type": "application/json",
    },
  },
  getToken,
});
