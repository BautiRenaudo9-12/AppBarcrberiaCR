import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AnimatedLayout from "@/components/AnimatedLayout";
import { useAnnouncementsInfinite, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { AnnouncementCard } from "@/components/anuncios/AnnouncementCard";

export default function Anuncios() {
  // Form State
  const [annText, setAnnText] = useState("");
  const [annIcon, setAnnIcon] = useState("📣");
  const [annStart, setAnnStart] = useState("");
  const [annEnd, setAnnEnd] = useState("");

  // Queries & Mutations
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isListLoading 
  } = useAnnouncementsInfinite();

  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const announcements = data?.pages.flatMap(page => page) || [];

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isListLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: "200px" });
    
    if (node) observer.current.observe(node);
  }, [isListLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

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

      createMutation.mutate({ text: annText, icon: annIcon, start: startDate, end: endDate }, {
        onSuccess: () => {
            toast.success("Anuncio publicado correctamente");
            setAnnText("");
            setAnnStart("");
            setAnnEnd("");
        },
        onError: () => {
            toast.error("Error al publicar anuncio");
        }
      });
  };

  const handleDelete = (id: string) => {
      deleteMutation.mutate(id, {
          onSuccess: () => toast.success("Anuncio eliminado"),
          onError: () => toast.error("Error al eliminar")
      });
  };

  return (
    <AnimatedLayout className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Gestión de Anuncios</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        
        {/* Create Announcement Form */}
        <div className="bg-card border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                    <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Nuevo Anuncio</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Texto del Anuncio</label>
                    <input 
                        type="text" 
                        value={annText}
                        onChange={(e) => setAnnText(e.target.value)}
                        placeholder="Ej: ¡Descuento de verano!" 
                        className="w-full bg-secondary/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Emoji / Icono</label>
                    <input 
                        type="text" 
                        value={annIcon}
                        onChange={(e) => setAnnIcon(e.target.value)}
                        placeholder="📣" 
                        className="w-full bg-secondary/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                    />
                </div>
                <div className="space-y-2">
                     {/* Empty for layout */}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha Inicio</label>
                    <input 
                        type="datetime-local" 
                        value={annStart}
                        onChange={(e) => setAnnStart(e.target.value)}
                        className="w-full bg-secondary/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha Fin</label>
                    <input 
                        type="datetime-local" 
                        value={annEnd}
                        onChange={(e) => setAnnEnd(e.target.value)}
                        className="w-full bg-secondary/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                    />
                </div>
                <div className="sm:col-span-2 pt-2">
                    <button 
                        onClick={handlePublishAnnouncement}
                        disabled={createMutation.isPending}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

        {/* List of Announcements */}
        <div className="pb-10">
            <h2 className="text-xl font-bold mb-4 px-1">Anuncios Creados</h2>
            <div className="space-y-4">
                {announcements.length === 0 && !isListLoading ? (
                    <div className="text-center py-8 text-muted-foreground bg-card/30 rounded-3xl border border-white/5">
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
    </AnimatedLayout>
  );
}
