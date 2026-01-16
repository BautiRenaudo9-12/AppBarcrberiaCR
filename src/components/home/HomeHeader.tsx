import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "firebase/auth";

interface HomeHeaderProps {
    user: User | null;
}

export default function HomeHeader({ user }: HomeHeaderProps) {
    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";
    const initials = user?.displayName
        ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl px-4 py-4 sm:px-6 shadow-sm">
            <div className="max-w-md mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">
                            {firstName ? `Hola, ${firstName}` : "Bienvenido"}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight">Barberia CR</h1>
                    </div>
                </div>
                <Link to="/profile">
                    <Avatar className="h-10 w-10 border-2 border-accent/20 transition-transform hover:scale-105">
                        <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Usuario"} />
                        <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </div>
    );
}
