import {
  OnboardingViewComp,
} from "village-monorepo";

import { useWidgetView } from "./context";
import { useSetAtom } from "jotai";
import { modalSizeAtom } from "./atoms";
import { useEffect } from "react";
import React from "react";

export function OnboardingView() {
  const { viewData } = useWidgetView();

  const setModalSize = useSetAtom(modalSizeAtom);

  useEffect(() => {
    setModalSize("sm");
  }, []);

  return <OnboardingViewComp message={viewData?.message} />;
}
