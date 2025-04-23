import {
  Avatar as ChakraAvatar,
  AvatarGroup,
  Box,
  Button,
  Image,
  StackProps,
  Text,
  chakra,
} from "@chakra-ui/react";

import { Stack } from "@chakra-ui/react";


import { useWidgetView } from "./context";
import { useEffect } from "react";
import { modalSizeAtom } from "./atoms";
import { useSetAtom } from "jotai";
import { messageFromIframeToPage } from "../../utils/cross-origin-communication";
import React from "react";

export function PartnerEducationalView() {
  const { partner } = useWidgetView();
  const setModalSize = useSetAtom(modalSizeAtom);

  useEffect(() => {
    setModalSize("sm");
  }, []);

  const triggerWidgetToOpenLogin = () =>
    messageFromIframeToPage({
      type: "VILLAGE_OAUTH_REQUEST",
      isAuthorizationFlow: partner?.authorization_flow,
    });

  return (
    <Stack textAlign="center" p={6} spaceX={12} spaceY={12}>
      <Stack spaceX={2} spaceY={2}>
        <AvatarGroup size="md" maxW={2} margin="0 auto">
          <ChakraAvatar src={partner?.logo} name={partner?.title} />
          <ChakraAvatar src="/logo-square.png" name="Village" />
        </AvatarGroup>
        <Text fontSize="xl">
          {partner?.title} uses <strong>Village</strong> to securely analyze
          your network.
        </Text>
      </Stack>

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
        minHeight={0}
      >
        <Image
          src="/network-image.webp"
          alt="Network Image"
          maxH="15vh"
          objectFit="contain"
        />
      </Box>

      <Stack spaceX={4} spaceY={4}>
        <Text fontSize="sm">
          By continuing, you agree to Village's{" "}
          <chakra.a
            textDecor="underline"
            href="https://village.do/privacy"
            target="_blank"
          >
            privacy policy
          </chakra.a>
          {" and "}
          <chakra.a
            textDecor="underline"
            href="https://village.do/terms"
            target="_blank"
          >
            terms of service
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
          onClick={triggerWidgetToOpenLogin}
        >
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
