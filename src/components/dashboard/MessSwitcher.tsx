import { Building2, ChevronDown, Check } from "lucide-react";
import { useMess } from "@/contexts/MessContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MessSwitcher() {
  const { currentMess, allMesses, switchMess } = useMess();
  const { userRole } = useAuth();

  if (userRole !== "super_admin" || allMesses.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-sm font-medium text-foreground transition-colors border border-border/40">
          <Building2 size={14} className="text-primary" />
          <span className="max-w-[140px] truncate">{currentMess?.name || "Select Mess"}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {allMesses.map((mess) => (
          <DropdownMenuItem
            key={mess.id}
            onClick={() => switchMess(mess.id)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {mess.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{mess.name}</span>
            </div>
            {currentMess?.id === mess.id && (
              <Check size={14} className="text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
