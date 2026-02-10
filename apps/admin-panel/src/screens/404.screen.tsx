import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { ArrowLeft, Ban, Home } from "lucide-react";

const NotFoundScreen = () => {
	return (
		<div className="w-dvw h-dvh flex items-center-safe justify-center-safe flex-col bg-muted/20">
			<Card className="w-md max-w-[calc(100vw-4rem)] border-2 border-dashed">
				<CardHeader className="text-center pb-2">
					<div className="mx-auto bg-muted p-4 rounded-full mb-4">
						<Ban className="size-10 text-muted-foreground" />
					</div>
					<CardTitle className="text-2xl">Page Not Found</CardTitle>
				</CardHeader>
				<CardContent className="text-center text-muted-foreground">
					The page you are looking for does not exist or has been moved.
				</CardContent>
				<CardFooter className="justify-center gap-2">
					<Button
						variant="outline"
						asChild>
						<Link to="..">
							<ArrowLeft className="mr-2 size-4" />
							Go Back
						</Link>
					</Button>
					<Button asChild>
						<Link to="/">
							<Home className="mr-2 size-4" />
							Dashboard
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default NotFoundScreen;
