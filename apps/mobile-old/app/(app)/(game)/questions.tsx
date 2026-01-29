import { Code } from "~/components/ui/typography";
import { T } from "~/components/ui/text";
import { View } from "react-native";
import { useQuestions } from "~/services/staticGameData";

export default function QuestionsScreen() {
    const { data: questions, isLoading } = useQuestions().getBatch([1, 2, 3, 4, 5]);

    return (
        <View className="flex-1 items-center justify-center">
            {isLoading ? (
                <T>Loading...</T>
            ) : (
                questions.map((question) => (
                    <Code key={question.id}>{JSON.stringify(question)}</Code>
                ))
            )}
        </View>
    );
}
