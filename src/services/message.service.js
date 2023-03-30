import { encode } from "./steg.service/encode";
import { decode } from "./steg.service/decode";
import { encrypt } from "../services/crypto.service";
// import { formControlUnstyledClasses } from "@mui/base";
const MAX_SERVERS = 3;
const MAX_TOKENS = 20;
let image = null;

export const imageAvailable = () => {
  return image !== null;
};
// reads image
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
export const tokenize = (msg, sender, to, token, pk, sk) => {
  console.log("recepient pk: " + pk);
  console.log("sender sk: " + sk);
  if (image !== null) {
    // replaces new line characters with %%%
    msg = msg.replace(/[\r\n]/gm, "%%%");
    const random = Math.floor(Math.random() * (MAX_TOKENS - 2) + MAX_SERVERS);
    // number of tokens iz n or messsage.length if n>message.length
    const n = random <= msg.length ? random : msg.length;
    // calculates min token length
    const tokenLen = Math.floor(msg.length / n);
    const x = msg.length % n;
    // extracts tokens with tokenLen length
    const regex1 = new RegExp(".{" + tokenLen + "}", "g");
    // extracts tokens with tokenLen+1 length
    const regex2 = new RegExp(".{" + (tokenLen + 1) + "}", "g");
    const arr1 = msg.slice(x * (tokenLen + 1), msg.length).match(regex1);
    let result = [];
    // generates id for message (same for each message fragment)
    const id =
      new Date().toTimeString().split(" ")[0] +
      "-" +
      Math.floor(Math.random() * 100000000);
    // checks if there will be tokens with tokenLen+1 length
    if (x !== 0) {
      result = msg.match(regex2).slice(0, x).concat(arr1);
    } else result = arr1;
    let counter = 1;
    if (result) {
      // picing random fragment for stegenography
      const stegIndex = Math.floor(Math.random() * result.length);
      return result.map((t) => {
        const index = counter - 1;
        // fragment content
        const content = id + "###" + counter++ + "/" + n + "###" + t;
        // encrypting
        const encrypted = encrypt(content, sk, pk);
        let fragment = JSON.stringify(Object.values(encrypted.cipher_text));
        const nonce = JSON.stringify(Object.values(encrypted.one_time_code));
        console.log();
        if (index === stegIndex) {
          // applying stegenography
          fragment = encode(fragment, image);
        }
        return {
          recepient: to,
          sender,
          content: fragment,
          nonce,
          token,
        };
      });
    } else return [];
  }
};
export const decodeMsg = (msg) => {
  return decode(msg);
};
