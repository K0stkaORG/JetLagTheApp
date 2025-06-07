import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import React, { Suspense } from "react";
import { useAuth, useUser } from "~/context/auth";

import AsyncButton from "~/components/AsyncButton";
import { Button } from "~/components/ui/button";
import { Code } from "~/components/ui/typography";
import { LogOut } from "~/lib/icons/LogOut";
import { Menu } from "~/lib/icons/Menu";
import Spinner from "~/components/Spinner";
import { T } from "~/components/ui/text";
import { View } from "react-native";

const Map = React.lazy(() => import("~/components/Map"));

export default function Screen() {
    const user = useUser();
    const { logout, refresh } = useAuth();

    return (
        <>
            <View className="absolute bottom-0 left-0 right-0 top-0">
                <Suspense fallback={<Spinner fullscreen />}>
                    <Map style={{ flex: 1 }} />
                </Suspense>
            </View>

            <Dialog>
                <View className="h-screen-safe mt-safe relative box-border w-screen">
                    <DialogTrigger asChild>
                        <Button
                            className="bg-jetlag-blue absolute bottom-3 left-3 h-auto w-auto p-2"
                            size="icon">
                            <Menu size={40} className="color-jetlag-gray" />
                        </Button>
                    </DialogTrigger>
                </View>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Session info</DialogTitle>
                    </DialogHeader>
                    <Code>{JSON.stringify(user, null, 2)}</Code>
                    <DialogFooter>
                        <View className="flex flex-col gap-5">
                            <AsyncButton onPress={refresh} variant="outline">
                                <T>Refresh info</T>
                            </AsyncButton>

                            <AsyncButton
                                onPress={logout}
                                variant="destructive"
                                className="flex flex-row items-center justify-center gap-2">
                                <LogOut className="color-foreground" />
                                <T>Logout</T>
                            </AsyncButton>
                        </View>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
