import { Download, Github, LogIn, ShieldBan, Smartphone } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/lib/auth";
import { useServer } from "@/lib/server";
import { cn } from "@/lib/utils";
import { AdminLoginRequest, type AdminLoginResponse } from "@jetlag/shared-types";

interface AdminDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const AdminDialog = ({ open, onOpenChange }: AdminDialogProps) => {
	const { updateToken } = useAuthContext();
	const [loading, setLoading] = useState(false);

	const form = useForm<AdminLoginRequest>({
		defaultValues: { username: "", password: "" },
	});

	const onSubmit = useCallback(
		async (data: AdminLoginRequest) => {
			setLoading(true);
			try {
				const response = await useServer<AdminLoginRequest, AdminLoginResponse>({
					path: "/login",
					anonymous: true,
					data,
				});
				if (response.result === "success") {
					updateToken(response.data.token);
					onOpenChange(false);
				}
			} finally {
				setLoading(false);
			}
		},
		[updateToken, onOpenChange],
	);

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent className="max-w-105 rounded-[24px] border-white/10 bg-linear-to-br from-[#1a2535] to-[#141e2b] p-8 text-white shadow-2xl backdrop-blur-md sm:rounded-[24px]">
				<DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
					<div className="flex size-11 items-center justify-center rounded-[13px] border border-white/10 bg-white/10 text-white/60">
						<ShieldBan className="size-5" />
					</div>
					<div>
						<DialogTitle className="text-lg font-extrabold text-white">Please authenticate</DialogTitle>
						<DialogDescription className="text-xs text-white/50">
							Use credentials configured during setup
						</DialogDescription>
					</div>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="mt-4 space-y-4">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[11px] font-bold tracking-wider text-white/50 uppercase">
										Username
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter username"
											autoComplete="username"
											autoFocus
											{...field}
											className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/25 focus-visible:ring-orange-400/40"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[11px] font-bold tracking-wider text-white/50 uppercase">
										Password
									</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="••••••••"
											autoComplete="current-password"
											{...field}
											className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/25 focus-visible:ring-orange-400/40"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							type="submit"
							disabled={loading}
							className="mt-2 h-11 w-full gap-2 rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-white transition-colors hover:bg-white/20 hover:text-white">
							<LogIn className="size-4" />
							{loading ? "Signing in…" : "Sign in"}
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

const DownloadButton = () => {
	return (
		<Button
			className={`inline-flex max-w-80 items-center gap-2.5 rounded-[14px] bg-linear-to-r from-[#FFBF40] via-[#F57A3C] to-[#EB3539] px-10 py-7 text-lg font-extrabold tracking-tight text-white shadow-[0_4px_28px_rgba(235,53,57,0.4),0_1px_4px_rgba(0,0,0,0.2)] transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_5px_40px_rgba(235,53,57,0.55),0_2px_8px_rgba(0,0,0,0.25)]`}>
			<Download
				className={"size-5"}
				strokeWidth={2.5}
			/>
			Download the App
		</Button>
	);
};

const CornerWave = ({ corner }: { corner: "top" | "bottom" }) => {
	return (
		<img
			src="/wave.svg"
			aria-hidden="true"
			className={cn("pointer-events-none fixed z-0 animate-[floatWave_5s_ease-in-out_infinite] opacity-45", {
				"-top-65 right-0 w-64 -scale-x-100 -rotate-30": corner === "top",
				"-bottom-90 left-0 w-100 -scale-x-100 rotate-140": !(corner === "top"),
			})}
			alt=""
		/>
	);
};

const LandingScreen = () => {
	const [adminOpen, setAdminOpen] = useState(false);

	return (
		<>
			<AdminDialog
				open={adminOpen}
				onOpenChange={setAdminOpen}
			/>

			<div className="relative min-h-dvh overflow-x-hidden bg-linear-to-br from-[#111b26] via-[#1b2c3e] to-[#0d1720] text-white">
				{/* Corner wave decorations */}
				<CornerWave corner="top" />
				<CornerWave corner="bottom" />

				{/* Subtle center glow */}
				<div className="pointer-events-none fixed top-[30%] left-1/2 z-0 h-100 w-175 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(245,122,60,0.05)_0%,transparent_70%)]" />

				{/* Main Content Area */}
				<div className="relative z-10">
					{/* Navigation */}
					<nav className="absolute top-0 right-0 left-0 flex items-center justify-between border-b border-white/10 px-5 py-4 backdrop-blur-xs">
						<div className="flex items-center gap-3">
							<img
								src="/logo.svg"
								alt="JetLag"
								className="size-9"
							/>
							<span className="hidden text-xl font-black tracking-tight md:inline">
								JetLag: <span className="opacity-60">The App</span>
							</span>
						</div>

						<Button
							variant="outline"
							onClick={() => setAdminOpen(true)}
							className="inline-flex gap-2 rounded-sm border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/50 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white">
							<LogIn className="size-3.5" />
							Admin <span className="hidden md:inline">panel</span>
						</Button>
					</nav>

					<div className="mx-auto grid min-h-dvh max-w-300 grid-cols-1 items-center px-6 py-18 sm:px-12 md:grid-cols-2 md:gap-12 md:px-20">
						<div className="flex animate-[floatPhone_5s_ease-in-out_infinite] items-center justify-center">
							<div className="relative">
								<img
									src="/mockup.png"
									alt="JetLag app on Android"
									className="relative z-10 w-[min(300px,30vw)] drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-6 md:row-start-1">
							{/* Headline */}
							<h1 className="text-[clamp(38px,6vw,72px)] leading-none font-black tracking-tighter">
								Play JetLag{" "}
								<span className="-m-4 inline-block bg-linear-to-r from-[#FFBF40] via-[#F57A3C] to-[#EB3539] bg-clip-text p-4 text-transparent">
									in your city
								</span>
							</h1>

							<p className="-mt-3 mb-4 max-w-115 text-lg leading-relaxed text-white/60">
								A fan-made app for playing JetLag-style games with your friends - Hide and Seek, Tag,
								and more. Fully open source, fully customizable. Run it your way, on your city, with
								your rules.
							</p>

							<DownloadButton />

							<div className="-mt-3 flex items-center gap-2 text-xs font-medium text-white/30">
								<Smartphone className="size-3.5" />
								Tap on the downloaded .apk file to install it
							</div>
						</div>
					</div>

					{/* Bottom CTA */}
					<div className="flex flex-col items-center gap-5 border-t border-white/10 bg-black/10 px-6 py-14 text-center">
						<h2 className="text-[clamp(26px,4vw,42px)] font-black tracking-tight">
							Want to change something?
						</h2>
						<p className="max-w-90 text-base leading-relaxed text-white/40">
							The whole thing is open source. If a rule doesn't fit, a game mode is missing, or you just
							want to run your own instance — go for it.
						</p>
						<a
							href="https://github.com/K0stkaORG/JetLagTheApp"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2.5 rounded-[14px] border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white/80 no-underline transition-colors hover:bg-white/20 hover:text-white">
							<Github className="size-4.5" />
							View on GitHub
						</a>
					</div>

					{/* Footer */}
					<footer className="border-t border-white/5 px-10 py-5 text-center text-sm text-white/50">
						<span>
							This project is not affiliated with Wendover Productions in any way. It is a fan-made
							open-source project maintained by the community.
						</span>
					</footer>
				</div>

				<style>{`
					@keyframes floatPhone {
						0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
						50%      { transform: translateY(-14px) rotate(1deg); }
					}
					@keyframes floatWave {
						0%, 100% { transform: translateY(0px) rotate(0deg); }
						50%      { transform: translateY(-14px) rotate(1deg); }
					}
				`}</style>
			</div>
		</>
	);
};

export default LandingScreen;
