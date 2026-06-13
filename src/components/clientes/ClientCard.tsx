import { memo, useRef, useCallback } from "react";
import { User, Mail, Phone, History } from "lucide-react";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { gsap } from "gsap";
import { useCardHover } from "@/hooks/useCardHover";

interface ClientData {
  id: string; 
  name: string;
  email: string;
  nro: string;
  doc?: QueryDocumentSnapshot<DocumentData>;
  [key: string]: any;
}

interface ClientCardProps {
  client: ClientData;
  innerRef?: React.Ref<HTMLDivElement>;
}

export const ClientCard = memo(({ client, innerRef }: ClientCardProps) => {
  const cardRef = useCardHover();
  const iconRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleBtnClick = useCallback(() => {
    if (!btnRef.current) return;
    gsap.fromTo(btnRef.current, { scale: 1 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.inOut" });
  }, []);

  const combinedRef = useCallback((node: HTMLDivElement) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof innerRef === "function") {
      innerRef(node);
    } else if (innerRef) {
      (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [cardRef, innerRef]);

  const handleCardEnter = useCallback(() => {
    if (iconRef.current) gsap.to(iconRef.current, { scale: 1.15, duration: 0.3, ease: "back.out(2)" });
  }, []);

  const handleCardLeave = useCallback(() => {
    if (iconRef.current) gsap.to(iconRef.current, { scale: 1, duration: 0.25, ease: "power2.out" });
  }, []);

  return (
    <div 
      ref={combinedRef}
      data-client-card
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      className="bg-card border border-white/10 rounded-2xl p-5 group flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{client.name || "Sin Nombre"}</h3>
          <p className="text-xs text-muted-foreground mt-1">ID: {client.id}</p>
        </div>
        <div ref={iconRef} className="w-10 h-10 bg-secondary/30 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
          <User className="w-5 h-5" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4 shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
        {client.nro ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{client.nro}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
            <Phone className="w-4 h-4 shrink-0" />
            <span>Sin teléfono</span>
          </div>
        )}
      </div>

      <div className="pt-2 mt-auto border-t border-white/5 flex justify-end">
         <button 
            ref={btnRef}
            onClick={handleBtnClick}
            className="text-xs bg-secondary/50 hover:bg-secondary text-foreground px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            title="Ver Historial"
         >
            <History className="w-3 h-3" />
            Historial
         </button>
      </div>
    </div>
  );
});

ClientCard.displayName = "ClientCard";