export namespace posthog {
    function capture(event: any, properties: any): Promise<import("axios").AxiosResponse<any, any>>;
    function merge(previousId: any, newId: any): Promise<import("axios").AxiosResponse<any, any>>;
}
