import { Suspense } from "react";
import Simulator from "@/components/Simulator";
import SuiteShell from "@/components/SuiteShell";

export default function Home() {
  return (
    <SuiteShell>
      <Suspense>
        <Simulator />
      </Suspense>
    </SuiteShell>
  );
}
