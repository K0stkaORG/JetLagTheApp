import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function ApiConsole() {
	const { apiRequest, addLog } = useAppContext();
	const { toast } = useToast();
	const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
	const [path, setPath] = useState("/api/debug/dump-servers");
	const [headers, setHeaders] = useState("{}");
	const [body, setBody] = useState("{}");

	const handleSend = async () => {
		try {
			const parsedHeaders = headers.trim() ? JSON.parse(headers) : {};
			const parsedBody = method === "GET" || body.trim() === "" ? undefined : JSON.parse(body);

			const response = await apiRequest({
				method,
				path,
				headers: parsedHeaders,
				body: parsedBody,
			});

			toast({
				title: "API request sent",
				description: `Response received for ${method} ${path}`,
			});

			addLog("info", "API Console response", response);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Request failed";
			toast({
				title: "API request failed",
				description: message,
				variant: "destructive",
			});
			addLog("error", message);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>REST API Console</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex gap-2">
					<Select
						value={method}
						onValueChange={(value) => setMethod(value as typeof method)}>
						<SelectTrigger className="w-[130px]">
							<SelectValue placeholder="Method" />
						</SelectTrigger>
						<SelectContent>
							{METHODS.map((item) => (
								<SelectItem
									key={item}
									value={item}>
									{item}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input
						value={path}
						onChange={(event) => setPath(event.target.value)}
						placeholder="/api/lobby/list"
					/>
				</div>
				<Textarea
					value={headers}
					onChange={(event) => setHeaders(event.target.value)}
					placeholder='{"X-Custom": "value"}'
					className="min-h-[90px] font-mono text-xs"
				/>
				<Textarea
					value={body}
					onChange={(event) => setBody(event.target.value)}
					placeholder='{"example": true}'
					className="min-h-[120px] font-mono text-xs"
				/>
				<Button
					className="w-full"
					onClick={handleSend}>
					Send Request
				</Button>
			</CardContent>
		</Card>
	);
}
