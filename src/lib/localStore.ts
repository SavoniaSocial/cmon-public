export const localStore = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem(key) || "null");
  },
  set: (key: string, value: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};
