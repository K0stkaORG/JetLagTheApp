import { Suspense, lazy } from "react";

import Spinner from "~/components/ui/Spinner";

const Map = lazy(() => import("~/components/game/Map"));

export default function Screen() {
    return (
        <Suspense fallback={<Spinner fullscreen />}>
            <Map />
        </Suspense>
    );
}
