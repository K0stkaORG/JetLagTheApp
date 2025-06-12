import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Suspense, lazy } from "react";
import { useAuth, useUser } from "~/context/auth";

import AsyncButton from "~/components/AsyncButton";
import { Button } from "~/components/ui/button";
import { Code } from "~/components/ui/typography";
import { LogOut } from "~/lib/icons/LogOut";
import { Menu } from "~/lib/icons/Menu";
import { SafeAreaView } from "react-native-safe-area-context";
import Spinner from "~/components/Spinner";
import { T } from "~/components/ui/text";
import { View } from "react-native";

const Map = lazy(() => import("~/components/Map"));

export default function Screen() {
    const user = useUser();
    const { logout, refresh } = useAuth();

    return (
        <Dialog>
            <SafeAreaView className="h-screen">
                <View className="relative h-full w-full">
                    <Suspense fallback={<Spinner fullscreen />}>
                        <Map />
                    </Suspense>
                    <DialogTrigger asChild>
                        <Button
                            className="absolute bottom-3 left-3 h-auto w-auto bg-jetlag-blue p-2"
                            size="icon">
                            <Menu size={40} className="color-jetlag-gray" />
                        </Button>
                    </DialogTrigger>
                </View>
            </SafeAreaView>

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
    );
}
