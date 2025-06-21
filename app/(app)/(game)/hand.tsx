import { Button } from "~/components/ui/button";
import { Code } from "~/components/ui/typography";
import { T } from "~/components/ui/text";
import { View } from "react-native";
import { useCards } from "~/services/staticGameData";
import { useState } from "react";

export default function HandScreen() {
    const [ids, setIds] = useState([4, 1, 2, 3]);

    const { data: cards, isLoading } = useCards().getBatch(ids);

    const shuffleIds = () => {
        const shuffled = [...ids].sort(() => Math.random() - 0.5);
        setIds(shuffled);
    };

    return (
        <View className="flex-1 items-center justify-center">
            <Button onPress={shuffleIds} className="mb-4">
                <T>Shuffle IDs</T>
            </Button>
            <Code>{JSON.stringify(ids)}</Code>
            {isLoading ? (
                <T>Loading...</T>
            ) : (
                cards.map((card) => <Code key={card.id}>{JSON.stringify(card)}</Code>)
            )}
        </View>
    );
}
