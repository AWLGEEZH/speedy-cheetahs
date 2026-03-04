import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted" />
          </Link>
        )}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-secondary">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
