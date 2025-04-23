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
  Button,
  usePartner,
  PathsModalHeader, 
  PathsResults,
  CompanyModal,
  BasicModal,
  useQuery,
} from "village-monorepo";


import React from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { OnboardingView } from "./Onboarding";
import { PartnerEducationalView } from "./PartnerEducational";
import { PathsView } from "./Paths";
import { ViewTypes, WidgetViewProvider, useWidgetView } from "./context";
import { useEffect } from "react";
import { messageFromIframeToPage } from "../../utils/cross-origin-communication";
import { useAtomValue } from "jotai";
import { modalSizeAtom } from "./atoms";
import { SearchModule } from "./Search";

function WidgetModal() {
  const { isWidgetOpen, closeWidget, currentView, setView, viewData } =
    useWidgetView();

  const modalSize = useAtomValue(modalSizeAtom);

  const renderContent = () => {
    switch (currentView) {
      case ViewTypes.LOADING:
        return (
          <BasicModal.Body>
            <Box
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "20rem",
              }}
            >
              <Spinner />
            </Box>
          </BasicModal.Body>
        );
      case ViewTypes.AUTHORIZE:
        return (
          <BasicModal.Body>
            <PartnerEducationalView />
          </BasicModal.Body>
        );
      case ViewTypes.ONBOARDING:
        return <OnboardingView />;
      case ViewTypes.PATHS:
        return <PathsView onBack={() => setView("onboarding")} url={undefined} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    messageFromIframeToPage({ type: "VILLAGE_IFRAME_LOADED" });
  }, []);

  if (!isWidgetOpen) {
    return null;
  }

  return (
    <BasicModal size={modalSize} isOpen={true} onClose={closeWidget}>
      {renderContent()}
    </BasicModal>
  );
}

export function Widget() {
  const search = useQuery();

  const villageModule = search.get("module");

  if (villageModule === "search") {
    return <SearchModule />;
  }

  return (
    <WidgetViewProvider>
      <WidgetModal />
    </WidgetViewProvider>
  );
}
