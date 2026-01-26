import { useState } from "react";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ApiScreen() {
	const { token, addLog } = useAppContext();

	const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
	// Corrected type for Select component
	const handleMethodChange = (value: string) => {
		setMethod(value as "GET" | "POST" | "PUT" | "DELETE");
	};

	const [url, setUrl] = useState("/health");
	const [body, setBody] = useState("{}");

	const handleApiRequest = async () => {
		try {
			const config = {
				method,
				url,
				headers: {
					Authorization: token ? `Bearer ${token}` : undefined,
					"Content-Type": "application/json",
				},
				data: method !== "GET" ? JSON.parse(body) : undefined,
			};

			addLog("info", `Calling API: ${method} ${url}`);
			const res = await axios(config);
			addLog("api", res.data);
		} catch (err: any) {
			addLog("error", err.response?.data || err.message);
		}
	};

	return (
		<Card className="max-w-3xl mx-auto">
			<CardHeader>
				<CardTitle>API Request Builder</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Select
						value={method}
						onValueChange={handleMethodChange}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Method" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="GET">GET</SelectItem>
							<SelectItem value="POST">POST</SelectItem>
							<SelectItem value="PUT">PUT</SelectItem>
							<SelectItem value="DELETE">DELETE</SelectItem>
						</SelectContent>
					</Select>
					<Input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className="flex-1 font-mono"
					/>
					<Button onClick={handleApiRequest}>Send</Button>
				</div>

				{method !== "GET" && (
					<Textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						placeholder="Request Body (JSON)"
						className="font-mono min-h-[200px]"
					/>
				)}
			</CardContent>
		</Card>
	);
}
