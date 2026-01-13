import { UseDurationProps, useDuration } from "~/lib/hooks/useDuration";

import { T } from "~/components/ui/text";

const Duration = ({ duration, durationSync, increasing, decreasing }: UseDurationProps) => {
    const text = useDuration({ duration, durationSync, increasing, decreasing } as any);

    return <T>{text}</T>;
};

export default Duration;
