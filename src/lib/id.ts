// crypto.randomUUID finns bara i säkra sammanhang (HTTPS och localhost). Dev-servern
// nås också över vanlig HTTP i tailnet, så id:t byggs med getRandomValues, som
// finns överallt.
export function nyttId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
