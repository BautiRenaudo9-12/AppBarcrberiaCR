import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePressScale } from "@/hooks/usePressScale";
import { useAnunciosAnimations } from "@/hooks/useAnunciosAnimations";
import { useAnnouncementsInfinite, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { AnnouncementCard } from "@/components/anuncios/AnnouncementCard";

export default function Anuncios() {
  const [annText, setAnnText] = useState("");
  const [annIcon, setAnnIcon] = useState("📣");
  const [annStart, setAnnStart] = useState("");
  const [annEnd, setAnnEnd] = useState("");
  const { ref: publishBtnRef, ...publishPress } = usePressScale(0.97);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isListLoading,
  } = useAnnouncementsInfinite();

  const pageRef = useAnunciosAnimations();

  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const announcements = data?.pages.flatMap((page) => page) || [];

  useEffect(() => {
    if (announcements.length === 0) {
      prevIdsRef.current = new Set();
      return;
    }
    const currentIds = new Set(announcements.map((a) => a.id).filter(Boolean) as string[]);
    const newIds = [...currentIds].filter((id) => !prevIdsRef.current.has(id));
    if (newIds.length > 0) {
      setNewlyCreatedId(newIds[0]);
      setTimeout(() => setNewlyCreatedId(null), 600);
    }
    prevIdsRef.current = currentIds;
  }, [announcements.length]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isListLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px", root: scrollContainerRef.current }
      );

      if (node) observer.current.observe(node);
    },
    [isListLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const handlePublishAnnouncement = async () => {
    if (!annText || !annStart || !annEnd) {
      toast.error("Complete todos los campos del anuncio");
      return;
    }

    const startDate = new Date(annStart);
    const endDate = new Date(annEnd);

    if (endDate <= startDate) {
      toast.error("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    createMutation.mutate(
      { text: annText, icon: annIcon, start: startDate, end: endDate },
      {
        onSuccess: () => {
          toast.success("Anuncio publicado correctamente");
          setAnnText("");
          setAnnStart("");
          setAnnEnd("");
        },
        onError: () => {
          toast.error("Error al publicar anuncio");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Anuncio eliminado"),
      onError: () => toast.error("Error al eliminar"),
    });
  };

  return (
    <div ref={pageRef} className="h-dvh bg-background text-foreground flex flex-col">
      <div className="bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            data-header-stagger
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 data-header-stagger className="text-xl font-bold">Gestión de Anuncios</h1>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto max-w-3xl mx-auto px-4 py-4 sm:px-6 space-y-5 w-full">
        <div data-form className="bg-card border border-white/10 rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold">Nuevo Anuncio</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Texto del Anuncio</label>
              <input
                type="text"
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                placeholder="Ej: ¡Descuento de verano!"
                className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Emoji / Icono</label>
              <input
                type="text"
                value={annIcon}
                onChange={(e) => setAnnIcon(e.target.value)}
                placeholder="📣"
                className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div className="space-y-1"/>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <input
                type="datetime-local"
                value={annStart}
                onChange={(e) => setAnnStart(e.target.value)}
                className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha Fin</label>
              <input
                type="datetime-local"
                value={annEnd}
                onChange={(e) => setAnnEnd(e.target.value)}
                className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                ref={publishBtnRef}
                onClick={handlePublishAnnouncement}
                {...publishPress}
                disabled={createMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  "Publicar Anuncio"
                )}
              </button>
            </div>
          </div>
        </div>

        <div data-grid className="pb-10">
          <h2 className="text-base font-bold mb-3 px-1">Anuncios Creados</h2>
          <div className="space-y-2">
            {announcements.length === 0 && !isListLoading ? (
              <div className="text-center py-6 text-muted-foreground bg-card/30 rounded-2xl border border-white/5 animate-in fade-in-0 zoom-in-95 duration-300">
                No hay anuncios registrados.
              </div>
            ) : (
              announcements.map((ann, index) => {
                const isLast = index === announcements.length - 1;
                return (
                  <AnnouncementCard
                    key={ann.id}
                    announcement={ann}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                    innerRef={isLast ? lastElementRef : null}
                    isNew={ann.id === newlyCreatedId}
                  />
                );
              })
            )}

            {(isListLoading || isFetchingNextPage) && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}