function scoreToTier(warmthScore) {
  if (warmthScore >= 10) return "excellent";
  if (warmthScore >= 7) return "veryGood";
  if (warmthScore >= 4) return "good";
  if (warmthScore >= 1) return "okay";
  if (warmthScore >= 0.5) return "highLikelihood";
  if (warmthScore >= 0.1) return "lowLikelihood";
  if (warmthScore > 0) return "lessCold";
  return "cold";
}

const tierTolabel = {
  excellent: "Excellent",
  veryGood: "Very Good",
  good: "Good",
  okay: "Okay",
  highLikelihood: "Maybe",
  lowLikelihood: "Maybe",
  lessCold: "Not sure",
  cold: "Not Sure",
};

const tierToCss = {
  excellent: "background: #CCF6C9; color: #2E533E;",
  veryGood: "background: #CCF6C9; color: #2E533E;",
  good: "background: #EAFEE9; color: #315540;",
  okay: "background: #EAFEE9; color: #315540;",
  highLikelihood: "background: #FEFCBF; color: #B7791F;",
  lowLikelihood: "background: #FEFCBF; color: #B7791F;",
  lessCold: "background: #ECECEC; color: #000000CC;",
  cold: "background: #ECECEC; color: #000000CC;",
};

export function createPathsWithStrengthComponent({
  avatars,
  score,
  total,
  entity = "person",
}) {
  // Define the badge color and text based on the score
  const scoreTier = scoreToTier(score);

  // Remove duplicates and get the first two avatars
  const displayedAvatars = [...new Set(avatars)].slice(0, 2);

  // Calculate the remaining count of avatars not displayed
  // const remainingAvatarsCount = total - displayedAvatars.length;

  // Generate the HTML for the avatars and the remaining count
  const avatarsHtml = displayedAvatars
    .map((avatar, index) => {
      const isFirst = index === 0;
      return `<img src="${avatar}" style="width: 40px; height: 40px; border-radius: 9999px; z-index: ${
        isFirst ? "3" : "2"
      }; transform: translateX(-${isFirst ? "3" : "10"}px)" />`;
    })
    .join("");

  // const remainingAvatarsHtml = remainingAvatarsCount > 0
  //   ? `<div style="width: 40px; height: 40px; border-radius: 9999px; background: gray; color: white; display: flex; align-items: center; justify-content: center; z-index: 1;">+${remainingAvatarsCount}</div>`
  //   : '';

  // Return the full HTML component
  const html = `<div class='paths-with-strength' style="display: flex; align-items: center; cursor: pointer;">
      <div style="${
        tierToCss[scoreTier]
      } text-transform: uppercase; font-size: 12px; font-weight: 600; white-space: nowrap; padding: 8px 12px; border-radius: 9999px;">${
    tierTolabel[scoreTier]
  }</div>
      ${avatarsHtml}
      <span style="color: #718096; font-size: 14px; font-weight: 600; white-space: nowrap; text-decoration: underline;">${total} ${totalLabel(
    total,
    entity
  )} →</span>
    </div>`;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  return wrapper;
}

function totalLabel(total, entity) {
  if (entity === "company") return total === 1 ? "person" : "people";
  return `path${total > 1 ? "s" : ""}`;
}
