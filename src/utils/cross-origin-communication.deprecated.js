/**
 * @deprecated This file appears to be unused.
 * Please validate before deleting. Marked by Daniel Neto.
 */

export const messageFromPopupToPage = (message) => {
  if (!window.opener) {
    alert("Sorry, something went wrong. Please restart and try again.");
    return;
  }

  window.opener.postMessage(message, "*");
};

export const messageFromIframeToPage = (message) => {
  if (!window.parent) {
    alert("Sorry, something went wrong. Please restart and try again.");
    return;
  }

  window.parent.postMessage(message, "*");
};
