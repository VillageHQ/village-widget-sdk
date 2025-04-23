import {
  GoogleButton,
  useAuth,
  useCheckAuthorization,
  GOOGLE_CLIENT_ID,
  api,
  CompaniesSearch,
  PeopleSearch,
  SelectableBadge,
  PeopleModalsProvider,
  SearchInput,
  useQuery,
  usePartner,
  PathsModalHeader, 
  PathsResults,
  CompanyModal,
  BasicModal,
  MessagesLoader,
} from "village-monorepo";

import Cookies from "js-cookie";
import React, { createContext, useContext, useState } from "react";
import { messageFromIframeToPage } from "../../utils/cross-origin-communication";

export const ViewTypes = {
  LOADING: "loading",
  AUTHORIZE: "authorize",
  ONBOARDING: "onboarding",
  PATHS: "paths",
} as const;

type ViewType = (typeof ViewTypes)[keyof typeof ViewTypes];

interface Partner {
  title: string;
  [key: string]: any;
}

interface WidgetViewContextType {
  url: string | null;
  partner: Partner | null;
  isWidgetOpen: boolean;
  closeWidget: () => void;
  currentView: ViewType;
  viewData: Record<string, any>;
  setView: (view: ViewType, data?: Record<string, any>) => void;
}

interface WidgetViewProviderProps {
  children: React.ReactNode;
}

const WidgetViewContext = createContext<WidgetViewContextType | {}>({});

export function WidgetViewProvider({ children }: WidgetViewProviderProps) {
  const { userHasFlatten, signed, fetchUser } = useAuth();
  const search = useQuery();

  const villageModule = search.get("module");

  const partnerKey = search.get("partnerKey");
  const partnerQuery = usePartner({ partnerKey, enabled: true });

  const partner = partnerQuery?.data;

  const [currentView, setCurrentView] = useState<ViewType>(ViewTypes.LOADING);
  const [viewData, setViewData] = useState<Record<string, any>>({});
  const [url, setUrl] = useState<string | null>(null);

  const token = search.get("token");

  React.useEffect(() => {
    const urlFromParams = search.get("url")
      ? decodeURIComponent(search.get("url"))
      : null;

    const targetEntity = search.get("targetEntity");
    const targetValue = search.get("targetValue");

    let url: string | null = null;

    if (urlFromParams) {
      url = decodeURIComponent(urlFromParams);
    } else if (targetEntity && targetValue) {
      const decodedValue = decodeURIComponent(targetValue);
      if (targetEntity === "person_linkedin") {
        url = `https://linkedin.com/in/${decodedValue}`;
      } else if (targetEntity === "company_linkedin") {
        url = `https://linkedin.com/company/${decodedValue}`;
      } else if (targetEntity === "company_domain") {
        url = `https://${decodedValue}`;
      }
    }

    setUrl(url);
  }, []);

  const isWidgetOpen = Boolean(url || villageModule);

  const setView = (newView: ViewType, data: Record<string, any> = {}) => {
    setCurrentView(newView);
    setViewData(data);
  };
  React.useEffect(() => {
    if (!isWidgetOpen) {
      return;
    }

    const setTokenAndFetchUser = async () => {
      Cookies.set("village.token", token, { secure: true, expires: 60 });
      const user = await fetchUser(token);

      if (!user?.last_flatten_date || villageModule === "sync") {
        setView(ViewTypes.ONBOARDING);
      } else if (url) {
        setView(ViewTypes.PATHS);
      }
    };

    if (token) {
      setTokenAndFetchUser();
    } else if (!signed) {
      setView(ViewTypes.AUTHORIZE);
    } else if (!userHasFlatten) {
      setView(ViewTypes.ONBOARDING);
    } else if (userHasFlatten) {
      setView(ViewTypes.PATHS);
    } else {
      setView(ViewTypes.LOADING);
    }
  }, [isWidgetOpen, token]);

  const removeIframe = () =>
    messageFromIframeToPage({ type: "VILLAGE_REMOVE_IFRAME" });

  React.useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        removeIframe();
      }
    }

    document.addEventListener("keyup", handleKeyDown);
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";

    // This function will be called when the component unmounts,
    // so we can use it to remove the event listener
    return () => {
      document.removeEventListener("keyup", handleKeyDown);
    };
  }, []); // The empty array means that this effect will only run once

  return (
    <WidgetViewContext.Provider
      value={{
        url,
        partner,
        isWidgetOpen,
        closeWidget: removeIframe,
        currentView,
        viewData,
        setView,
      }}
    >
      {children}
    </WidgetViewContext.Provider>
  );
}

export function useWidgetView(): WidgetViewContextType | Record<string, never> {
  const context = useContext(WidgetViewContext);
  if (!context) {
    return {};
  }
  return context;
}

interface PaaSContext {
  [key: string]: any;
}

export function checkIsRunningThroughPaaS(paasContext: PaaSContext): boolean {
  const isPaaSContextEmpty =
    paasContext &&
    Object.keys(paasContext).length === 0 &&
    Object.getPrototypeOf(paasContext) === Object.prototype;

  return !isPaaSContextEmpty;
}

export function isNotVillagePlayground(
  widgetView: WidgetViewContextType | undefined
): boolean {
  return widgetView?.partner?.title !== "Village Playground";
}
