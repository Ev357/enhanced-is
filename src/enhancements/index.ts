import { compute } from "./compute";

export const enhancements = () => {
  if (/^\/auth\/seminare\/student.*$/.test(window.location.pathname)) {
    compute();
  }
};
