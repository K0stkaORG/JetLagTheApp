import { GameProvider } from "~/context/game";
import { Stack } from "expo-router";

const AppLayout = () => {
    return (
        <GameProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </GameProvider>
    );
};

export default AppLayout;
