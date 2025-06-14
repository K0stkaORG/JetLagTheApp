import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { RefreshControl, ScrollView, View } from "react-native";
import { useCallback, useState } from "react";

import AsyncButton from "../ui/AsyncButton";
import { Skeleton } from "../ui/skeleton";
import { T } from "../ui/text";
import { useGame } from "~/context/game";

const SelectExistingGame = () => {
    const { joinGame } = useGame();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    return (
        <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View className="flex gap-5">
                {refreshing
                    ? [1, 2, 3].map((id) => <Skeleton key={id} className="h-48" />)
                    : [1, 2, 3, 4, 5].map((gameId) => (
                          <Card key={gameId}>
                              <CardHeader>
                                  <CardTitle>Dataset.name</CardTitle>
                                  <CardDescription>Dataset.description</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <T>Game.dynamicData</T>
                              </CardContent>
                              <CardFooter className="flex justify-end">
                                  <AsyncButton onPress={() => joinGame(gameId)}>
                                      <T>Připojit se</T>
                                  </AsyncButton>
                              </CardFooter>
                          </Card>
                      ))}
            </View>
        </ScrollView>
    );
};

export default SelectExistingGame;
