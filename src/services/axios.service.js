import { createAxiosClient } from "./request.interceptor";

const host = "192.168.100.8";
// const host = "localhost";
const protocol = "https";
const port = "";
// export const BASE_URL = protocol + "://" + host + ":443/SecureChat/";
export const BASE_URL = protocol + "://" + host + ":8443/SecureChat/";

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
    baseURL: BASE_URL,
    timeout: 300000,
    headers: {
      "Content-Type": "application/json",
    },
  },
  getToken,
});
