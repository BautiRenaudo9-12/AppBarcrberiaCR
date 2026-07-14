import { memo, useRef, useCallback, useMemo, useState } from "react";
import { User, Mail, Phone, History } from "lucide-react";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useCardHover } from "@/hooks/useCardHover";
import { whatsappLink } from "@/lib/phone";
import ClientHistoryDialog from "@/components/clientes/ClientHistoryDialog";

// lucide-react ya no trae íconos de marca, así que el glifo de WhatsApp va inline.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
  const [historyOpen, setHistoryOpen] = useState(false);

  const waLink = useMemo(() => whatsappLink(client.nro), [client.nro]);

  const handleBtnClick = useCallback(() => {
    if (btnRef.current && !prefersReducedMotion()) {
      gsap.fromTo(btnRef.current, { scale: 1 }, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.inOut" });
    }
    setHistoryOpen(true);
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
    if (prefersReducedMotion()) return;
    if (iconRef.current) gsap.to(iconRef.current, { scale: 1.15, duration: 0.3, ease: "back.out(2)" });
  }, []);

  const handleCardLeave = useCallback(() => {
    if (prefersReducedMotion()) return;
    if (iconRef.current) gsap.to(iconRef.current, { scale: 1, duration: 0.25, ease: "power2.out" });
  }, []);

  return (
    <>
    <div
      ref={combinedRef}
      data-client-card
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      className="bg-card border border-white/10 rounded-2xl p-5 group flex flex-col gap-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/30"
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

      <div className="pt-2 mt-auto border-t border-white/5 flex items-center justify-end gap-2">
         {waLink && (
            <a
               href={waLink}
               target="_blank"
               rel="noopener noreferrer"
               className="mr-auto text-xs bg-green-500/15 hover:bg-green-500/25 text-green-400 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
               title="Escribir por WhatsApp"
            >
               <WhatsAppIcon className="w-3.5 h-3.5" />
               WhatsApp
            </a>
         )}
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
    <ClientHistoryDialog
      open={historyOpen}
      onClose={() => setHistoryOpen(false)}
      clientEmail={client.id}
      clientName={client.name}
    />
    </>
  );
});

ClientCard.displayName = "ClientCard";