import {
  GoogleButton,
  useAuth,
  useQuery,
  useCheckAuthorization,
  GOOGLE_CLIENT_ID,
  api
} from "village-monorepo";

import { Box, Spinner } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useEffect } from "react";
//import { messageFromPopupToPage } from "../../utils/cross-origin-communication";
import { PartnerAuthorizeView } from "./PartnerAuthorize";
import { PopupWrapper } from "./PopupWrapper";
import { useMutation } from "@tanstack/react-query";
import React from "react";

const tryCloseWindow = () => {
  // Try to close the popup after a short delay (ensures postMessage is sent first)
  setTimeout(() => {
    window.close();

    // As a fallback, redirect to a blank page if close is blocked by the browser
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 1000);
  }, 300);
};


// Atualizar o listener para realmente fechar:
const useAcknowledgementListener = () => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "VILLAGE_OAUTH_ACKNOWLEDGED") {
        tryCloseWindow(); // Aqui sim é seguro fechar
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
};

const handleOAuthSuccess = ({ token }: { token: string }) => {
  // Send success message to the parent window
  if (window.opener) {
    window.opener.postMessage({
      type: "VILLAGE_OAUTH_SUCCESS",
      token,
    }, "*");
  }

  // Attempt to safely close this popup window
  //tryCloseWindow();
};


const handleOAuthError = (err: any) => {
  // Send error message to the parent window
  if (window.opener) {
    window.opener.postMessage({
      type: "VILLAGE_OAUTH_ERROR",
      error: err,
    }, "*");
  }

  // Attempt to safely close this popup window
  //tryCloseWindow();
};


export function OAuthView() {
  const { loading: isLoadingAuth, signIn, signed } = useAuth();
  const search = useQuery();
  const partnerKey = Cookies.get("village.partnerKey");
  const { data: authorizationData, isLoading: isCheckingAuthorization } =
    useCheckAuthorization({
      public_key: partnerKey,
      enabled: !!partnerKey && signed,
    });

  useAcknowledgementListener();

  useEffect(() => {
    if (authorizationData?.authorized) {
      const token = Cookies.get("village.token");

      if (token) {
        handleOAuthSuccess({ token });
      }
    }

    // Keep logic for setting cookies from query params
    const queryPartnerKey = search.get("partnerKey");
    const queryUserReference = search.get("userReference");
    if (queryPartnerKey) {
      Cookies.set("village.partnerKey", queryPartnerKey, {
        expires: 10 / (24 * 60),
      });
    }
    if (queryUserReference) {
      Cookies.set("village.userReference", queryUserReference, {
        expires: 10 / (24 * 60),
      });
    }
  }, [authorizationData, signed]); // Dependencies seem correct

  useEffect(() => {
    // This effect handles the initial OAuth callback (code or error in URL)
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");

      if (code) {
        try {
          await signIn({ code, partnerKey });
        } catch (error: any) {
          handleOAuthError(error.message || "Failed during sign in process.");
        }
      } else if (error) {
        handleOAuthError(error);
      }
    };

    handleCallback();
  }, []);

  if (isLoadingAuth || isCheckingAuthorization)
    return (
      <PopupWrapper
        title={
          isLoadingAuth
            ? "Connecting to Village..."
            : "Checking authorization..."
        }
      >
        <Spinner color="middle.500" size="xl" />
      </PopupWrapper>
    );

  return (
    <Box
      style={{
        width: "100dvw",
        height: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          width: "500px",
          height: "600px",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        p={6}
        py={12}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        {!signed ? (
          <PopupWrapper title={<>Verify your email to proceed</>}>
            <GoogleButton onClick={handleGoogleLogin}>
              Continue with Google
            </GoogleButton>
          </PopupWrapper>
        ) : (
          <PartnerAuthorizeView
            onSuccess={() => {
              const token = Cookies.get("village.token");
              if (token) {
                handleOAuthSuccess({ token });
              } else {
                console.error(
                  "OAuthView: Partner authorization successful but token not found in cookies."
                );
              }
            }}
          />
        )}
      </Box>
    </Box>
  );
}

const resolveAuthTokenMutationFn = async (variables: {
  authorization_token: string;
  public_key: string;
}) => {
  const response = await api.post(`/partner/resolve-authorization`, variables);
  return response.data;
};

export function ResolveAuthView() {
  const { processResolvedAuth } = useAuth(); // This sets the cookie internally
  const search = useQuery();

  // Add the listener
  useAcknowledgementListener();

  const mutation = useMutation({
    mutationFn: resolveAuthTokenMutationFn,
    onSuccess: (data) => {
      if (data && data.user && data.token) {
        // Set cookie/auth state
        processResolvedAuth({ user: data.user, token: data.token });
        // Directly send message. Closing is handled by the listener hook.
        handleOAuthSuccess({
          token: data.token,
        });
      } else {
        handleOAuthError("Invalid response received after resolving token.");
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.error || error.message || "Unknown error";

      handleOAuthError(`Failed to resolve authorization: ${errorMsg}`);
      window.close();
    },
  });

  useEffect(() => {
    const authorization_token = search.get("userReference");
    const public_key = search.get("partnerKey");

    if (authorization_token && public_key) {
      mutation.mutate({ authorization_token, public_key });
    } else {
      handleOAuthError("Authorization token or partner key missing from URL.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PopupWrapper
      title={
        mutation.isPending
          ? "Authorizing..."
          : mutation.isSuccess
            ? "Authorization successful. Completing..."
            : "Authorization"
      }
    >
      {mutation.isPending && <Spinner color="middle.500" size="xl" />}
    </PopupWrapper>
  );
}

const handleGoogleLogin = () => {
  const scope = "profile email";
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${`${window.location.origin}/widget/oauth`}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  window.location.href = googleAuthUrl;
};
