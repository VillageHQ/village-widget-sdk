// frontend-web/src/apps/extension-sdk/src/styles.ts

// Using CSS Properties (camelCase) instead of strings for better type checking and autocompletion if you use TypeScript
export const floatingIconStyles = {
  wrapper: {
    right: 0,
    left: "auto",
    position: "fixed" as "fixed", // Cast for type safety
    zIndex: 2147483647,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
    borderTopLeftRadius: "10px",
    borderBottomLeftRadius: "10px",
    transition: "top 0.3s ease-in-out",
    display: "none", // Hide by default
  },
  icon: {
    width: "40px",
    height: "40px",
    cursor: "pointer",
    pointerEvents: "auto" as "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as "relative",
  },
  positionerWrapper: {
    pointerEvents: "auto" as "auto",
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease-in-out",
  },
  positionerButton: {
    border: "none",
    padding: 0,
    width: "0px", // Initial state, likely adjusted dynamically
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease-in-out",
    cursor: "grab",
  },
  iconImage: {
    width: "24px",
    height: "24px",
  },
  iconBadge: {
    position: "absolute" as "absolute",
    background: "#48bb74",
    color: "white",
    borderRadius: "999999px",
    width: "22px",
    height: "22px",
    zIndex: 2147483646,
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    bottom: "-8px",
    left: "-8px",
  },
};

export const pathsIconStyles = {
  // Base styles for the icon container
  icon: (displayVar: string = "none") => ({
    // Use function for dynamic display
    display: displayVar, // Controlled by JS logic
    height: "fit-content",
  }),
  iconAbsolute: {
    position: "absolute" as "absolute",
    zIndex: 2147483647,
    top: 0,
    left: 0,
  },
  // Styles for the outer colored span
  outerSpan: {
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    marginLeft: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Styles for the inner border span
  innerSpan: {
    display: "inline-block",
    borderRadius: "50%",
    width: "14px",
    height: "14px",
    borderColor: "#fff",
    borderStyle: "solid",
    borderWidth: "3px",
  },
  // Variations based on relationship strength
  strong: {
    backgroundColor: "#48bb74",
  },
  weak: {
    backgroundColor: "#ffa500",
  },
  noRelationship: {
    backgroundColor: "#ffa3a3",
  },
  // Specific style adjustments for the 'no relationship' inner span
  noRelationshipInnerSpan: {
    borderWidth: "5px",
    width: "9px",
    height: "9px",
  },
};

export const tooltipStyles = {
  tooltip: {
    position: "absolute" as "absolute",
    top: 0, // Positioned by JS
    left: 0, // Positioned by JS
    width: "max-content",
    zIndex: 2147483647,
    padding: "10px",
    borderRadius: "5px",
    transform: "translateX(-50%)", // Center tooltip
    display: "none", // Controlled by JS
    backgroundColor: "#fff",
    border: "solid 1px #e5e5e5",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
  },
  tooltipWrapper: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "0.75rem",
    padding: "0.5rem",
  },
  tooltipLink: {
    // Targetting 'a' inside the tooltip div
    fontSize: "12px",
  },
  tooltipParagraph: {
    // Targetting 'p' inside the tooltip
    fontSize: "12px",
    margin: 0,
    color: "#748095",
  },
  // villageComponent (Used for layout within tooltip)
  component: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "0.5rem",
  },
  // villageLoader styles
  loader: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  loaderSpan: {
    display: "flex",
    alignItems: "center",
  },
  // Note: Keyframes/animations need specific handling in CSS-in-JS (e.g., using a library like styled-components or emotion)
  // For basic inline styles, the spin animation won't work directly like this.
  // Consider using a library or a different approach if animation is critical.
  // loaderSvg: { // Basic style, animation needs library support
  //   animation: 'spin 1s linear infinite', // This line won't work directly in inline styles
  // },
};

// Example Keyframes definition if using a library like Emotion or Styled Components
// import { keyframes } from '@emotion/react'; // or styled-components
// export const spinAnimation = keyframes`
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// `;
// And apply it like: animation: `${spinAnimation} 1s linear infinite`
