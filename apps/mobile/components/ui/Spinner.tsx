import { T, TextClassContext } from "./text";

import { Loader2 } from "~/lib/icons/Loader2";
import { View } from "react-native";
import { cn } from "~/lib/utils";
import { use } from "react";

type Props = {
    className?: string;
    fullscreen?: true;
    text?: string;
};

const Spinner = ({ className, fullscreen, text = "Načítání..." }: Props) => {
    const textClass = use(TextClassContext);

    return (
        <View
            className={cn("flex items-center justify-center", {
                "h-8 w-8": !fullscreen,
                "h-full w-full gap-2": fullscreen,
            })}>
            <View className="flex h-8 w-8 animate-spin items-center justify-center">
                <Loader2 className={cn(textClass, className)} size={fullscreen ? 32 : undefined} />
            </View>
            {fullscreen && <T>{text}</T>}
        </View>
    );
};

export default Spinner;
