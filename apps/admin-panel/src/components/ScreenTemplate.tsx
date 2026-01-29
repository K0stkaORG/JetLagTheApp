import { ArrowBigLeftDash } from "lucide-react";
import { Link } from "react-router";

interface ScreenTemplateProps {
	title: string;
	backPath: string;
	children: React.ReactNode;
}

const ScreenTemplate = ({ title, backPath, children }: ScreenTemplateProps) => {
	return (
		<div className="w-dvw max-w-5xl mx-auto h-dvh overflow-auto px-5 py-10">
			<Link
				to={backPath}
				className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors underline  ">
				<ArrowBigLeftDash className="size-5" /> Back
			</Link>
			<h1 className="font-bold text-4xl">{title}</h1>

			<div className="mt-6">{children}</div>
		</div>
	);
};

export default ScreenTemplate;
