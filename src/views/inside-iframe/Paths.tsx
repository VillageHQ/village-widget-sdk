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
  MessagesLoader,
} from "village-monorepo";


import { Box, Button as ChakraButton, Text, chakra } from "@chakra-ui/react";
import React from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useWidgetView, ViewTypes } from "./context";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { modalSizeAtom } from "./atoms";
import { useSetAtom } from "jotai";
import { SearchIcon } from "lucide-react";

export function PathsView({ url: propsUrl, onBack }) {
  const { url: widgetUrl, setView } = useWidgetView();
  const url = propsUrl || widgetUrl;
  const [currentUrl, setCurrentUrl] = useState(url || widgetUrl);

  const isPerson = currentUrl?.includes("linkedin.com/in/");

  const setModalSize = useSetAtom(modalSizeAtom);

  const {
    data: relationship,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["paths-deprecated", currentUrl],
    queryFn: async () => {
      const { data } = await api.post(`paths`, { url: currentUrl });
      return data.relationship;
    },
    enabled: !!currentUrl,
  });

  useEffect(() => {
    setModalSize("6xl");
  }, []);

  useEffect(() => {
    if (relationship) {
      if (!isPerson && !(relationship?.people?.length)) {
        setView(ViewTypes.ONBOARDING, {
          message: "NO_PATHS",
        });
      }
    }
  }, [relationship, isPerson, setView]);

  if (isLoading)
    return (
      <BasicModal.Body>
        <MessagesLoader />
      </BasicModal.Body>
    );

  if (isError) {
    return <Box>Error loading data</Box>;
  }

  return (
    <>
      <PathsModalHeader
        title={
          isPerson ? (
            <Text>
              Your paths to{" "}
              <chakra.span fontWeight="bold" textTransform="capitalize">
                {relationship?.full_name}
              </chakra.span>
            </Text>
          ) : (
            <Text>
              People from{" "}
              <chakra.span fontWeight="bold" textTransform="capitalize">
                {relationship?.name}
              </chakra.span>
            </Text>
          )
        }
        relationship={relationship}
      >
        <Button onClick={onBack} variant="link" className="h-fit p-0">
          Find more paths <SearchIcon />
        </Button>
      </PathsModalHeader>

      <BasicModal.Body>
        {isPerson ? (
          <PathsResults
            relationship={{
              ...relationship,
              paths: relationship?.paths || [],
            }}
            currentUrl={currentUrl}
          />
        ) : (
          <CompanyModal
            company={{ id: relationship.id, name: relationship.name }}
            people={relationship?.people || []}
            selectPersonPaths={({ entity, value }) => {
              // When selecting a person from company view, we'll get their LinkedIn URL
              // and update currentUrl to trigger a new fetch
              const personUrl = `https://linkedin.com/in/${value}`;
              setCurrentUrl(personUrl);
            }}
          />
        )}
      </BasicModal.Body>

      {url !== currentUrl && isPerson ? (
        <BasicModal.Footer
          justifyContent="flex-start"
          boxShadow="0px -2px 3px rgba(0, 0, 0, 0.05)"
          borderBottomLeftRadius={"md"}
          borderBottomRightRadius={"md"}
          bg="gray.25"
        >
          <ChakraButton
            background="transparent"
            onClick={() => setCurrentUrl(url)}
          >
            <Box as="span" mr={2}>
              <FaArrowLeft />
            </Box>
            Back
          </ChakraButton>
        </BasicModal.Footer>
      ) : !isPerson ? (
        <BasicModal.Footer />
      ) : null}
    </>
  );
}
