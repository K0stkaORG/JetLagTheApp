import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { FlatList, RefreshControl, View } from "react-native";

import AsyncButton from "../ui/AsyncButton";
import { Badge } from "../ui/badge";
import DateTime from "../ui/DateTime";
import Duration from "./Duration";
import { JoinGameInfo } from "./SelectGameScreen";
import { Skeleton } from "../ui/skeleton";
import State from "./State";
import { T } from "../ui/text";
import { useGame } from "~/context/game";

type Props = {
    isLoading: boolean;
    refetch: () => Promise<void>;
    games: JoinGameInfo[];
};

const SelectExistingGame = ({ isLoading, refetch, games }: Props) => {
    const { joinGame } = useGame();

    return (
        <View className="flex gap-5">
            {isLoading && [1, 2, 3].map((id) => <Skeleton key={id} className="h-48" />)}

            {!isLoading && (
                <FlatList
                    className="h-full"
                    refreshing={isLoading}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                    data={games}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item: game }) => (
                        <Card key={game.id}>
                            <CardHeader>
                                <View className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex-shrink">{game.name}</CardTitle>
                                </View>
                                <CardDescription>{game.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <View className="flex flex-row items-center justify-start gap-2">
                                    {game.state === "planned" ? (
                                        <Badge>
                                            <T>
                                                Naplánovaná na:{" "}
                                                <DateTime timestamp={game.startsAt} />
                                            </T>
                                        </Badge>
                                    ) : (
                                        <>
                                            <Badge>
                                                <State state={game.state} />
                                            </Badge>
                                            <Badge variant="secondary">
                                                <T>
                                                    Aktuální čas:{" "}
                                                    <Duration
                                                        duration={game.duration}
                                                        durationSync={game.durationSync}
                                                        increasing={game.state !== "paused"}
                                                    />
                                                </T>
                                            </Badge>
                                        </>
                                    )}
                                </View>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <AsyncButton onPress={() => joinGame(game.id)}>
                                    <T>Připojit se</T>
                                </AsyncButton>
                            </CardFooter>
                        </Card>
                    )}
                    ItemSeparatorComponent={() => <View className="h-5" />}
                    ListEmptyComponent={() => (
                        <View className="flex items-center justify-center p-4">
                            <T className="text-gray-500">Žádné dostupné hry</T>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default SelectExistingGame;
