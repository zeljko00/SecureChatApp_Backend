const MAX_SERVERS = 3;
const MAX_TOKENS = 20;
export const tokenize = (msg, id, to) => {
  const random = Math.floor(Math.random() * (MAX_TOKENS - 2) + MAX_SERVERS);
  console.log(random);
  const n = random <= msg.length ? random : msg.length;
  console.log(n);
  const tokenLen = Math.floor(msg.length / n);
  const x = msg.length % n;
  const regex1 = new RegExp(".{" + tokenLen + "}", "g");
  const regex2 = new RegExp(".{" + (tokenLen + 1) + "}", "g");
  const arr1 = msg.slice(x * (tokenLen + 1), msg.length).match(regex1);
  let result = [];
  if (x !== 0) {
    result = msg.match(regex2).slice(0, x).concat(arr1);
  } else result = arr1;
  let counter = 1;
  return result.map((t) => {
    return { recepient: to, content: id + "#" + counter++ + "/" + n + ":" + t };
  });
};
