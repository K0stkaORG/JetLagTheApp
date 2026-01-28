import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { LogIn } from "lucide-react";

const NotFoundScreen = () => {
	return (
		<div className="w-dvw h-dvh flex items-center-safe justify-center-safe flex-col">
			<Card className="w-md max-w-[calc(100vw-4rem)]">
				<CardHeader>
					<CardTitle>404: Not Found</CardTitle>
					<CardDescription>The page you are looking for does not exist.</CardDescription>
				</CardHeader>
				<CardFooter>
					<Link
						to="/"
						className="ml-auto">
						<Button className="flex items-center gap-2 ">
							<LogIn />
							Go back
						</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
};

export default NotFoundScreen;
