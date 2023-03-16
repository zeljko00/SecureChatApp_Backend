export const tokenize = (msg, n) => {
  const tokenLen = Math.floor(msg.length / n);
  const x = msg.length % n;
  const regex1 = new RegExp(".{" + tokenLen + "}", "g");
  const regex2 = new RegExp(".{" + (tokenLen + 1) + "}", "g");
  const arr1 = msg.slice(x * (tokenLen + 1), msg.length).match(regex1);
  if (x !== 0) {
    return msg.match(regex2).slice(0, x).concat(arr1);
  } else return arr1;
};
