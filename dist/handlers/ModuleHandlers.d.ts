export class ModuleHandlers {
    constructor(app: any);
    app: any;
    listenerMap: WeakMap<object, any>;
    syncUrlElements: Map<any, any>;
    elementsWithListeners: Set<any>;
    handleDataUrl(element: any, url: any): void;
    handleModule(element: any, moduleValue: any): void;
    removeListener(element: any): void;
    getSyncUrlElements(): Map<any, any>;
    getAllElementsWithListeners(): Set<any>;
}
