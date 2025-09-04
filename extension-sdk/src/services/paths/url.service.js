class UrlService {
  getUrlWithoutParams(url) {
    const { hostname, pathname } = new URL(url);
    return `${hostname}${pathname}`;
  }

  getPageSelector({ hostname }) {
    if (hostname === "airtable.com") return "span.url";
    return "a[href]";
  }

  getPageListenerStrategy({ hostname }) {
    if (hostname === "docs.google.com") return "mutation";
    return "interval";
  }

  processUrlIntoUnique(url) {
    try {
      const { hostname, pathname } = new URL(url);

      if (pathname.startsWith("/in/")) {
        const profileMatch = pathname.match(/^\/in\/([^/]+)/);
        if (!profileMatch) return false;
        return `/in/${profileMatch[1]}`;
      }

      if (pathname.startsWith("/company/")) {
        const companyLinkedinPathMatch = pathname.match(/^\/company\/([^/]+)/);
        if (!companyLinkedinPathMatch) return false;
        return `/company/${companyLinkedinPathMatch[1]}`;
      }

      return hostname;
    } catch (err) {
      console.log("error");
      console.log(err);
    }

    return false;
  }

  extractUrl(element) {
    if (element.tagName === "A") return element.href;
    if (element.tagName === "SPAN") return element.innerText;

    return null;
  }
}

export { UrlService };
