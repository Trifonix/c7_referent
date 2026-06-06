import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type ErrorCode, getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ErrorAlertProps = {
  code: ErrorCode;
  className?: string;
};

export function ErrorAlert({ code, className }: ErrorAlertProps) {
  const { title, description } = getErrorMessage(code);

  return (
    <Alert variant="destructive" className={cn("animate-fade-in", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
