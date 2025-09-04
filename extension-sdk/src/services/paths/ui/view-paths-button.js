import { icon_network } from "./icons";

export function createViewPathsButton({ color }) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<button style="border: none; height: 40px; background: ${color}; color: white; padding: 0 16px; border-radius: 9999px; font-size: 14px; font-weight: 600; cursor: pointer;"><div style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 4px;">${icon_network}<span style="color: white; font-size: 14px;">View Paths</span></div></button>`;
  return wrapper;
}
