import { Avatar, Box, Stack, Text } from "@chakra-ui/react";

export function PopupWrapper({ title, children }) {
  return (
    <Stack spacing={12} textAlign="center" p={6}>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="center">
          <Avatar src="/logo-square.png" name="Village" />
        </Box>

        <Text fontSize="xl">{title}</Text>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}
