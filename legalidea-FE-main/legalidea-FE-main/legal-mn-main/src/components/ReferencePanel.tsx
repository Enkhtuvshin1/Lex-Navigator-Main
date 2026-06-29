import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Reference {
  id: string;
  code: string;
  article: string;
  title: string;
  excerpt: string;
}

interface ReferencePanelProps {
  references: Reference[];
  onClose: () => void;
}

const ReferencePanel = ({ references, onClose }: ReferencePanelProps) => {
  return (
    <aside className="hidden w-80 flex-col border-l bg-card md:flex">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-foreground">Холбогдох хуулийн заалтууд</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {references.map((ref) => {
          const isCriminal = ref.code === "Эрүүгийн хууль";
          return (
            <div key={ref.id} className="rounded-md border bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${
                    isCriminal
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {ref.code}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{ref.article}</span>
              </div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">{ref.title}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{ref.excerpt}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ReferencePanel;
