import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import CreateNewGame from "./CreateNewGame";
import { H1 } from "../ui/typography";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectExistingGame from "./SelectExistingGame";
import { T } from "../ui/text";
import { useServerData } from "~/services/server";
import { useState } from "react";
import { useToken } from "~/context/auth";

export type JoinGameInfo = {
    id: number;
    name: string;
    description: string;
    startsAt: number;
    state: "planned" | "hiding_phase" | "main_phase" | "paused" | "finished";
    duration: number;
    durationSync: number;
};

const SelectGameScreen = () => {
    const token = useToken();

    const [tabsScreen, setTabsScreen] = useState("existing");

    const {
        data: games,
        isLoading,
        refetch,
    } = useServerData<JoinGameInfo[]>({
        path: "/games/joinable",
        defaultValue: [],
        fetchOnMount: true,
        options: {
            method: "GET",
            token,
        },
    });

    return (
        <SafeAreaView>
            <Tabs
                value={tabsScreen}
                onValueChange={setTabsScreen}
                className="flex h-full justify-stretch gap-5 p-5">
                <H1 className="flex-shrink-0 flex-grow-0 text-center">Připojit se do hry</H1>
                <TabsList className="flex-row">
                    <TabsTrigger value="existing" className="flex-1">
                        <T>Už existující</T>
                    </TabsTrigger>
                    <TabsTrigger value="new" className="flex-1">
                        <T>Vytvořit novou</T>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="h-full flex-shrink">
                    <SelectExistingGame isLoading={isLoading} games={games} refetch={refetch} />
                </TabsContent>
                <TabsContent value="new" className="h-full flex-shrink">
                    <CreateNewGame />
                </TabsContent>
            </Tabs>
        </SafeAreaView>
    );
};

export default SelectGameScreen;
