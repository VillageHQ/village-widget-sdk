import { OnboardingView as OnboardingViewComp } from "@/use-cases/Onboarding";
import { useWidgetView } from "./context";
import { useSetAtom } from "jotai";
import { modalSizeAtom } from "./atoms";
import { useEffect } from "react";

export function OnboardingView() {
  const { viewData } = useWidgetView();

  const setModalSize = useSetAtom(modalSizeAtom);

  useEffect(() => {
    setModalSize("sm");
  }, []);

  return <OnboardingViewComp message={viewData?.message} />;
}
