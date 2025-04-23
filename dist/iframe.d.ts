export function buildIframeSrc({ token, partnerKey, userReference, url, module: villageModule, config, }: {
    token: any;
    partnerKey: any;
    userReference: any;
    url: any;
    module: any;
    config: any;
}): string;
export function renderSearchIframeInsideElement(targetElement: any, params: any): HTMLIFrameElement;
export class Iframe {
    element: HTMLIFrameElement;
    spinner: HTMLDivElement;
    update(params: any): void;
    render(container: any): void;
    hideSpinner(): void;
}
