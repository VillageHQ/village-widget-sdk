export class AnalyticsService {
    static getDistinctId(): string;
    static setUserId(userId: any): void;
    static removeUserId(): void;
    static trackButtonClick({ type, module, url, partnerKey }: {
        type: any;
        module: any;
        url: any;
        partnerKey: any;
    }): void;
    static trackButtonRender({ partnerKey }: {
        partnerKey: any;
    }): void;
}
