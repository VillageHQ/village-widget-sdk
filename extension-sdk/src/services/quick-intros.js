export const runQuickIntros = (composeButton, email) => {
  var alreadyFilled = false;

  // Create a MutationObserver to watch for the compose window
  const observer = new MutationObserver((mutations) => {
    const { to, subject, content } = email;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        // Check if this is the compose window element
        if (node.classList?.contains("An") && !alreadyFilled) {
          const compose = node.closest(".M9");

          setTimeout(() => {
            var subjectField = compose.querySelector("input[name=subjectbox]");
            subjectField.value = subject;

            var bodyField = compose.querySelector(
              "div[contenteditable=true]:not([id=subject])"
            );
            bodyField.innerHTML = `${content} ${bodyField.innerHTML}`;

            var toField = compose.querySelector("div[name=to] input");
            toField.value = to;

            alreadyFilled = true;

            // Disconnect observer once email is filled
            observer.disconnect();
          }, 1000);
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document, {
    childList: true,
    subtree: true,
  });

  // Trigger a click event to open the compose window
  composeButton.click();
};
