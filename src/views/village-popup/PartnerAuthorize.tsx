import {
  createAuthorization,
  usePartner,
  useToast,
} from "village-monorepo";

import {
  Button,
  List,
  ListItem,
  VStack,
  Stack,
  Text,
  chakra,
  AvatarGroup,
  Avatar,
  ListIcon,
} from "@chakra-ui/react";

import { FaCheckCircle } from "react-icons/fa";

import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";
import { messageFromPopupToPage } from "../../utils/cross-origin-communication";
import React from "react";

export function PartnerAuthorizeView({ onSuccess }) {
  const partnerKey = Cookies.get("village.partnerKey");
  const partnerQuery = usePartner({ partnerKey, enabled: !!partnerKey });
  const toast = useToast();

  const partner = partnerQuery?.data;

  const handleCreateAuthorization = useMutation({
      mutationFn: (data: { public_key: string; app_external_reference?: string }) => createAuthorization(data),
      onSuccess: () => {
        onSuccess();
      },
      onError: (err) => {
        toast({
          title: "Sorry, something went wrong.",
          description: `Please try again, or contact support if the problem persists.`,
          status: "error",
        });
      },
    });

  const handleAuthorize = () => {
    const partnerKey = Cookies.get("village.partnerKey");
    const userReference = Cookies.get("village.userReference");

    if (!partnerKey) {
      return messageFromPopupToPage({
        type: "VILLAGE_OAUTH_ERROR",
        error: "There was a problem with your authorization, please try again.",
      });
    }

    handleCreateAuthorization.mutate({
      public_key: partnerKey,
      app_external_reference: userReference || undefined,
    });
  };

  return (
    <Stack spaceX={12} spaceY={12} alignItems="center" p={6}>
      <Stack spaceX={2} spaceY={2}>
        <AvatarGroup size="md" maxW={2} m="0 auto">
          <Avatar src={partner?.logo} name={partner?.title} />
          <Avatar src="/logo-square.png" name="Village" />
        </AvatarGroup>
        <Text fontSize="xl" textAlign="center">
          <strong>{partner?.title}</strong> wants to access your
          <br /> network on Village.
        </Text>
      </Stack>

      <List spaceX={2} spaceY={2} textAlign="left" styleType="none">
        {access_items.map((item, index) => (
          <ListItem key={index}>
            <ListIcon as={FaCheckCircle} color="green.500" />
            {item}
          </ListItem>
        ))}
      </List>
      <VStack spaceX={4} spaceY={4}>
        <Stack spaceX={4} spaceY={4}>
          <Text fontSize="sm">
            By continuing, you agree to Village's{" "}
            <chakra.a
              textDecor="underline"
              href="https://village.do"
              target="_blank"
            >
              privacy policy
            </chakra.a>
            ,{" "}
            <chakra.a
              textDecor="underline"
              href="https://village.do"
              target="_blank"
            >
              terms of service
            </chakra.a>
            , and{" "}
            <chakra.a
              textDecor="underline"
              href="https://village.do"
              target="_blank"
            >
              cookie usage
            </chakra.a>
            .
          </Text>

          <Button
            textTransform={"uppercase"}
            fontWeight="bold"
            borderColor="black"
            bgColor="black"
            color="white"
            _hover={{
              filter: "opacity(0.8)",
            }}
            _active={{
              filter: "opacity(0.8)",
            }}
            onClick={handleAuthorize}
            loading={handleCreateAuthorization.isPending}
          >
            Authorize
          </Button>
        </Stack>
      </VStack>
    </Stack>
  );
}

const access_items = [
  "People you know",
  "People you can get introduced to",
  "Relationship scores and meta information",
];
