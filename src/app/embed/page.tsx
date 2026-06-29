import { Suspense } from "react";
import Simulator from "@/components/Simulator";

/**
 * Stripped-down route meant to be loaded in an <iframe> from sinvestir.fr,
 * without the simulateurs.sinvestir.fr sidebar/header.
 */
export default function EmbedPage() {
  return (
    <div className="p-4">
      <Suspense>
        <Simulator embedded />
      </Suspense>
    </div>
  );
}
