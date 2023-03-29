import { encode } from "./steg.service/encode";
import { decode } from "./steg.service/decode";
import { formControlUnstyledClasses } from "@mui/base";
const MAX_SERVERS = 3;
const MAX_TOKENS = 20;
let image = null;
// export const imageAvailable = () => {
//   return image !== null;
// };
export const imageAvailable = () => {
  return image !== null;
};
export const readURL = (input, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    let img = e.target.result;
    const temp = new Image();
    temp.src = img;
    temp.onload = () => {
      console.log("loaded");
      if (temp.naturalHeight > 2060 || temp.naturalWidth > 2060) {
        callback();
      } else image = temp;
    };
  };
  reader.readAsDataURL(input.target.files[0]);
};
export const tokenize = (msg, sender, to, token) => {
  if (image !== null) {
    msg = msg.replace(/[\r\n]/gm, "%%%");
    const random = Math.floor(Math.random() * (MAX_TOKENS - 2) + MAX_SERVERS);
    // console.log(random);
    const n = random <= msg.length ? random : msg.length;
    // console.log(n);
    const tokenLen = Math.floor(msg.length / n);
    const x = msg.length % n;
    const regex1 = new RegExp(".{" + tokenLen + "}", "g");
    const regex2 = new RegExp(".{" + (tokenLen + 1) + "}", "g");
    const arr1 = msg.slice(x * (tokenLen + 1), msg.length).match(regex1);
    let result = [];
    const id =
      new Date().toTimeString().split(" ")[0] +
      "-" +
      Math.floor(Math.random() * 100000000);
    if (x !== 0) {
      result = msg.match(regex2).slice(0, x).concat(arr1);
    } else result = arr1;
    let counter = 1;
    if (result) {
      const stegIndex = Math.floor(Math.random() * result.length);
      return result.map((t) => {
        const index = counter - 1;
        let fragment = sender + "#" + id + "#" + counter++ + "/" + n + "#" + t;
        if (index === stegIndex) {
          fragment = encode(fragment, image);
        }
        return {
          recepient: to,
          content: fragment,
          token,
        };
      });
    } else return [];
  }
};
export const decodeMsg = (msg) => {
  return decode(msg);
};
