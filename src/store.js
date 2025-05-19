import { create } from "zustand";

const useStore = create((set) => ({
  username: "",
  playerName: "",
  avatar: "",
  setUser: (username, playerName, avatar) => set({ username, playerName, avatar}),
}));

export default useStore;