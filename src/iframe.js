export function buildIframeSrc({
  token,
  partnerKey,
  userReference,
  url,
  module: villageModule,
  config,
}) {
  const params = new URLSearchParams();

  if (token) params.append("token", token);
  if (url) params.append("url", encodeURIComponent(url));
  if (partnerKey) params.append("partnerKey", partnerKey);
  if (userReference) params.append("userReference", userReference);
  if (villageModule) params.append("module", villageModule);
  console.log('config.paths_cta', config);
  let pathsCtaJson = '[]';
  if(typeof config !== 'undefined' && typeof config.paths_cta !== 'undefined' ){
    pathsCtaJson = JSON.stringify(config.paths_cta); 
  }
  const encodedPathsCta = encodeURIComponent(pathsCtaJson);
  params.append("paths_cta", encodedPathsCta);

  //console.log('buildIframeSrc encodedPathsCta', encodedPathsCta);
  return `${import.meta.env.VITE_APP_FRONTEND_URL}/widget?${params.toString()}`;
}

// Function to render the search iframe directly inside a target element
export function renderSearchIframeInsideElement(targetElement, params) {
  // Clear any existing content in the target element
  targetElement.innerHTML = "";

  // Create the iframe element
  const iframe = document.createElement("iframe");

  // Set the source using the utility function, ensuring module is 'search'
  //console.log('buildIframeSrc call 2');
  iframe.src = buildIframeSrc({ ...params, module: "search" });

  // Apply basic inline styling (can be customized further via CSS)
  iframe.style.width = "100%";
  iframe.style.height = "100%"; // Example height, adjust as needed
  iframe.style.border = "none"; // Remove default iframe border
  iframe.style.display = "block"; // Ensure it takes block layout

  // Append the iframe to the target element
  targetElement.appendChild(iframe);

  // Return the created iframe element in case it's needed
  return iframe;
}

// Restored original Iframe class structure
export class Iframe {
  constructor() {
    this.element = document.createElement("iframe");
    this.element.className = "village-iframe village-hidden"; // Keep original classes
    this.spinner = document.createElement("div");
    this.spinner.className = "village-iframe village-hidden village-loading"; // Keep original classes
    this.spinner.innerHTML = '<div class="village-spinner"></div>';
  }

  // Update method uses the utility function to set src, but keeps class logic
  update(params) {
    // params: { token, partnerKey, userReference, url, module }
    // Use the utility function to build the source URL
    //console.trace('buildIframeSrc call 3');
    this.element.src = buildIframeSrc(params);

    // Keep the original logic for setting classes based on url/module
    const shouldShow = params.url || params.module;
    this.element.className = shouldShow
      ? "village-iframe"
      : "village-iframe village-hidden";
    this.spinner.className = shouldShow
      ? "village-iframe village-loading"
      : "village-iframe village-hidden village-loading";
  }

  // Keep original render method
  render(container) {
    if (!this.element.parentNode) {
      container.appendChild(this.spinner);
      container.appendChild(this.element);
    }
  }

  // Keep original hideSpinner method
  hideSpinner() {
    this.spinner.className = "village-iframe village-hidden village-loading";
  }
}
