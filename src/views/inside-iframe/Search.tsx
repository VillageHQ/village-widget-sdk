import {
  GoogleButton,
  useAuth,
  useQuery,
  useCheckAuthorization,
  GOOGLE_CLIENT_ID,
  api,
  CompaniesSearch,
  PeopleSearch,
  SelectableBadge,
  PeopleModalsProvider,
  SearchInput,
  Button,
  usePartner
} from "village-monorepo";

import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { modalSizeAtom } from "./atoms";
import Cookies from "js-cookie";
import { messageFromIframeToPage } from "../../utils/cross-origin-communication";
import { Box, Text } from "@chakra-ui/react";
import React from "react";

export function SearchView() {
  const setModalSize = useSetAtom(modalSizeAtom);

  useEffect(() => {
    setModalSize("6xl");

    return () => {
      setModalSize("sm");
    };
  }, []);

  return <SearchViewContent />;
}

export function SearchModule() {
  const { fetchUser, signed, loading } = useAuth();
  const search = useQuery();
  const token = search.get("token");

  useEffect(() => {
    const setTokenAndFetchUser = async () => {
      Cookies.set("village.token", token, { secure: true, expires: 60 });
      await fetchUser(token);
    };

    if (token) {
      setTokenAndFetchUser();
    }
  }, [token]);

  if (loading) {
    return (
      <Box p={4}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <div className="p-4">
      {signed ? <SearchViewContent /> : <SearchLoginFallback />}
    </div>
  );
}

function SearchLoginFallback() {
  const search = useQuery();
  const partnerKey = search.get("partnerKey");
  const partnerQuery = usePartner({ partnerKey, enabled: true });

  const partner = partnerQuery?.data;

  const triggerWidgetToOpenLogin = () =>
    messageFromIframeToPage({
      type: "VILLAGE_OAUTH_REQUEST",
      isAuthorizationFlow: partner?.authorization_flow,
    });

  return (
    <Box textAlign="center">
      <Text mb={4}>Authorize to search connections.</Text>
      <Button onClick={triggerWidgetToOpenLogin}>Authorize</Button>
    </Box>
  );
}

const views = ["people", "companies"] as const;

const VIEWS: Record<(typeof views)[number], string> = {
  people: "People",
  companies: "Companies",
} as const;

function SearchViewContent() {
  const [activeView, setActiveView] =
    useState<(typeof views)[number]>("people");

  return (
    <PeopleModalsProvider>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {views.map((view) => (
            <SelectableBadge
              key={view}
              name={VIEWS[view]}
              isSelected={activeView === view}
              onClick={() => setActiveView(view)}
              icon={undefined}
            />
          ))}
        </div>

        <div>
          {activeView === "people" && (
            <PeopleSearch>
              <div>
                <SearchInput />
              </div>

              <PeopleSearch.Details>
                <PeopleSearch.Count />
              </PeopleSearch.Details>

              <PeopleSearch.Table />
            </PeopleSearch>
          )}

          {activeView === "companies" && (
            <CompaniesSearch>
              <div>
                <SearchInput />
              </div>

              <PeopleSearch.Details>
                <CompaniesSearch.Count />
              </PeopleSearch.Details>

              <CompaniesSearch.Table />
            </CompaniesSearch>
          )}
        </div>
      </div>
    </PeopleModalsProvider>
  );
}
