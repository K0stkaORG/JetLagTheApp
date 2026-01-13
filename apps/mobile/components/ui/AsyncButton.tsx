import { Button, ButtonProps } from "./button";

import Spinner from "./Spinner";
import { Without } from "~/types/utilityTypes";
import { useState } from "react";

type Props = Without<ButtonProps, "onPress"> & {
    onPress: () => Promise<any>;
};

const AsyncButton = ({ onPress, children, ...props }: Props) => {
    const [loading, setLoading] = useState(false);

    const handleOnPress = async () => {
        setLoading(true);

        onPress().finally(() => setLoading(false));
    };

    return (
        <Button {...props} onPress={handleOnPress}>
            {loading ? <Spinner /> : children}
        </Button>
    );
};

export default AsyncButton;
