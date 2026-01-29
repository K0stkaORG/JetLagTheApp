import ScreenTemplate from "@/components/ScreenTemplate";
import { useLoaderData } from "react-router";

const ManageGameScreen = () => {
	const gameId = useLoaderData<string>();

	return (
		<ScreenTemplate
			title={`Game #${gameId}`}
			backPath="/panel/games">
			<div>Manage Game Screen for game ID: {gameId}</div>
		</ScreenTemplate>
	);
};

export default ManageGameScreen;
