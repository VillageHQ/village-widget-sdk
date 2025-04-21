import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Image,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { useWidgetView } from "./context";
import { useEffect } from "react";
import { modalSizeAtom } from "./atoms";
import { useSetAtom } from "jotai";
import { messageFromIframeToPage } from "../../utils/cross-origin-communication";

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
    <Stack spacing={12} textAlign="center" p={6}>
      <Stack spacing={2}>
        <AvatarGroup size="md" max={2} spacing="-0.5rem" m="0 auto">
          <Avatar src={partner?.logo} name={partner?.title} />
          <Avatar src="/logo-square.png" name="Village" />
        </AvatarGroup>
        <Text fontSize="xl">
          {partner?.title} uses <strong>Village</strong> to securely analyze
          your network.
        </Text>
      </Stack>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <Image
          src="/network-image.webp"
          alt="Network Image"
          maxH="15vh"
          objectFit="contain"
        />
      </Box>

      <Stack spacing={4}>
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
