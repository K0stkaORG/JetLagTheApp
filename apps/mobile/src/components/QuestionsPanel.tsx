import { useSocket } from "@/context/SocketContext";
import { useTheme } from "@/hooks/use-theme";
import type { QuestionLogEntry, Team } from "@/lib/questions";
import type { Question } from "@jetlag/shared-types";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const PURPLE = "#5B4DFF";

type QuestionItem = { id: number; question: Question };

type QuestionsPanelProps = {
	team: Team;
	gamePhase: "hiding" | "seeking" | null;
	questions: QuestionItem[];
	questionLog: QuestionLogEntry[];
	onSendAnswer: (answer: string) => void;
};

function formatCost(cost: Question["costCards"]): string {
	return `${cost.draw} draw / ${cost.keep} keep`;
}

function formatTime(timestamp: number): string {
	const d = new Date(timestamp);
	return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const TYPE_LABELS: Record<Question["type"], string> = {
	radar: "Radar",
	thermometer: "Thermometer",
	matching: "Matching",
	image: "Photo",
};

export function QuestionsPanel({ team, gamePhase, questions, questionLog, onSendAnswer }: QuestionsPanelProps) {
	const { askQuestion, isConnected } = useSocket();
	const theme = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [answerDraft, setAnswerDraft] = useState("");
	const [justAskedId, setJustAskedId] = useState<number | null>(null);

	const isSeeker = team === "seekers";
	const canAsk = isSeeker && isConnected && gamePhase === "seeking";

	const handleAsk = (id: number) => {
		askQuestion(id);
		setJustAskedId(id);
		setTimeout(() => setJustAskedId((prev) => (prev === id ? null : prev)), 2000);
	};

	const handleSendAnswer = () => {
		const text = answerDraft.trim();
		if (!text) return;
		onSendAnswer(text);
		setAnswerDraft("");
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.headerRow}>
				<Text style={styles.sectionLabel}>Questions</Text>
				<View style={[styles.teamBadge, isSeeker ? styles.seekerBadge : styles.hiderBadge]}>
					<Text style={styles.teamBadgeText}>{isSeeker ? "Seeker" : "Hider"}</Text>
				</View>
			</View>

			{gamePhase && (
				<Text style={styles.phaseHint}>
					{gamePhase === "hiding" ? "Hiding phase — questions unlock once seeking begins." : "Seeking phase"}
				</Text>
			)}

			{/* Question list */}
			{isSeeker ? (
				questions.length > 0 ? (
					<View style={styles.list}>
						{questions.map(({ id, question }) => {
							const expanded = expandedId === id;
							const asked = justAskedId === id;
							return (
								<View
									key={id}
									style={styles.questionCard}>
									<Pressable
										onPress={() => setExpandedId(expanded ? null : id)}
										style={styles.questionHeader}>
										<View style={styles.typePill}>
											<Text style={styles.typePillText}>{TYPE_LABELS[question.type]}</Text>
										</View>
										<Text
											style={styles.questionName}
											numberOfLines={expanded ? undefined : 1}>
											{question.name}
										</Text>
										<Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
									</Pressable>

									{expanded && (
										<View style={styles.questionBody}>
											<Text style={styles.questionDescription}>{question.description}</Text>
											<Text style={styles.questionCost}>Cost: {formatCost(question.costCards)}</Text>
											<Pressable
												onPress={() => handleAsk(id)}
												disabled={!canAsk || asked}
												style={[styles.askButton, (!canAsk || asked) && styles.askButtonDisabled]}>
												<Text style={styles.askButtonText}>
													{asked ? "Asked ✓" : isConnected ? "Ask question" : "Offline"}
												</Text>
											</Pressable>
										</View>
									)}
								</View>
							);
						})}
					</View>
				) : (
					<Text style={styles.emptyText}>No questions available for this dataset.</Text>
				)
			) : (
				<Text style={styles.emptyText}>As a hider you answer the seekers' questions below.</Text>
			)}

			{/* Answer composer (hiders) */}
			{!isSeeker && (
				<View style={styles.answerBox}>
					<TextInput
						style={styles.answerInput}
						placeholder="Type your answer…"
						placeholderTextColor={theme.textSecondary}
						value={answerDraft}
						onChangeText={setAnswerDraft}
						onSubmitEditing={handleSendAnswer}
						returnKeyType="send"
						multiline
					/>
					<Pressable
						onPress={handleSendAnswer}
						disabled={!answerDraft.trim()}
						style={[styles.sendButton, !answerDraft.trim() && styles.sendButtonDisabled]}>
						<Text style={styles.sendButtonText}>Send</Text>
					</Pressable>
				</View>
			)}

			{/* Question / answer activity log */}
			{questionLog.length > 0 && (
				<View style={styles.log}>
					<Text style={styles.sectionLabel}>Activity</Text>
					{questionLog.map((entry) => (
						<View
							key={entry.id}
							style={styles.logRow}>
							<Text style={styles.logTime}>{formatTime(entry.timestamp)}</Text>
							<Text style={styles.logText}>{entry.text}</Text>
						</View>
					))}
				</View>
			)}
		</View>
	);
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
	StyleSheet.create({
		container: {
			gap: 10,
		},
		headerRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		sectionLabel: {
			fontSize: 12,
			color: theme.textSecondary,
			textTransform: "uppercase",
			letterSpacing: 1,
			fontWeight: "600",
		},
		teamBadge: {
			paddingHorizontal: 10,
			paddingVertical: 4,
			borderRadius: 999,
		},
		seekerBadge: {
			backgroundColor: "#3b82f6",
		},
		hiderBadge: {
			backgroundColor: "#22c55e",
		},
		teamBadgeText: {
			color: "#fff",
			fontSize: 12,
			fontWeight: "700",
		},
		phaseHint: {
			fontSize: 13,
			color: theme.textSecondary,
			fontStyle: "italic",
		},
		list: {
			gap: 8,
		},
		questionCard: {
			borderWidth: 1,
			borderColor: theme.border,
			borderRadius: 12,
			backgroundColor: theme.backgroundElement,
			overflow: "hidden",
		},
		questionHeader: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			paddingHorizontal: 12,
			paddingVertical: 10,
		},
		typePill: {
			backgroundColor: theme.backgroundSelected,
			paddingHorizontal: 8,
			paddingVertical: 3,
			borderRadius: 6,
		},
		typePillText: {
			fontSize: 11,
			fontWeight: "700",
			color: theme.textSecondary,
		},
		questionName: {
			flex: 1,
			fontSize: 15,
			fontWeight: "600",
			color: theme.text,
		},
		chevron: {
			fontSize: 11,
			color: theme.textSecondary,
		},
		questionBody: {
			paddingHorizontal: 12,
			paddingBottom: 12,
			gap: 8,
			borderTopWidth: 1,
			borderTopColor: theme.border,
			paddingTop: 10,
		},
		questionDescription: {
			fontSize: 14,
			lineHeight: 20,
			color: theme.textSecondary,
		},
		questionCost: {
			fontSize: 13,
			fontWeight: "600",
			color: theme.text,
		},
		askButton: {
			alignSelf: "flex-start",
			backgroundColor: PURPLE,
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderRadius: 10,
		},
		askButtonDisabled: {
			opacity: 0.5,
		},
		askButtonText: {
			color: "#fff",
			fontSize: 14,
			fontWeight: "700",
		},
		emptyText: {
			fontSize: 14,
			color: theme.textSecondary,
			fontStyle: "italic",
			paddingVertical: 6,
		},
		answerBox: {
			flexDirection: "row",
			alignItems: "flex-end",
			gap: 8,
		},
		answerInput: {
			flex: 1,
			minHeight: 44,
			maxHeight: 120,
			borderWidth: 1,
			borderColor: theme.border,
			borderRadius: 10,
			paddingHorizontal: 12,
			paddingVertical: 10,
			fontSize: 15,
			color: theme.text,
			backgroundColor: theme.inputBackground,
		},
		sendButton: {
			backgroundColor: PURPLE,
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderRadius: 10,
		},
		sendButtonDisabled: {
			opacity: 0.5,
		},
		sendButtonText: {
			color: "#fff",
			fontSize: 14,
			fontWeight: "700",
		},
		log: {
			gap: 6,
			marginTop: 4,
		},
		logRow: {
			flexDirection: "row",
			gap: 8,
			paddingVertical: 4,
		},
		logTime: {
			fontSize: 12,
			color: theme.textSecondary,
			fontVariant: ["tabular-nums"],
		},
		logText: {
			fontSize: 14,
			color: theme.textSecondary,
			flex: 1,
		},
	});
