import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
export const generate_keys = () => {
  return nacl.box.keyPair();
};
export const encrypt = (message, senderSK, recepientPK) => {
  // nonce used in encryption process
  const one_time_code = nacl.randomBytes(24);

  // generating session key (elliptic curve Diffie Helman)
  const shared_key = nacl.box.before(recepientPK, senderSK);

  const cipher_text = nacl.box.after(
    naclUtil.decodeUTF8(message),
    one_time_code,
    shared_key
  );
  // result consist of 2 Uint8Arrays (encrypted text and nonce)
  const result = {
    cipher_text,
    one_time_code,
  };
  return result;
};

export const decrypt = (message, one_time_code, senderPK, recepientSK) => {
  try {
    const shared_key = nacl.box.before(senderPK, recepientSK);

    const plain_text = nacl.box.open.after(message, one_time_code, shared_key);
    return naclUtil.encodeUTF8(plain_text);
  } catch (e) {}
};
