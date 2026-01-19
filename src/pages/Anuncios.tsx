import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Megaphone, Plus, Calendar, Loader2 } from "lucide-react";
import { createAnnouncement, getAllAnnouncements, deleteAnnouncement, Announcement } from "@/services/announcements";
import { toast } from "sonner";
import { useUI } from "@/context/UIContext";
import moment from "moment";
import AnimatedLayout from "@/components/AnimatedLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Anuncios() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { setLoading } = useUI();
  
  // Pagination State
  const [hasMore, setHasMore] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Form State
  const [annText, setAnnText] = useState("");
  const [annIcon, setAnnIcon] = useState("📣");
  const [annStart, setAnnStart] = useState("");
  const [annEnd, setAnnEnd] = useState("");

  useEffect(() => {
    // Initial load
    loadAnnouncements(true);
  }, []);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (pageLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadAnnouncements(false);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [pageLoading, hasMore]);

  const loadAnnouncements = async (isReset: boolean = false) => {
    setPageLoading(true);
    if (isReset) setLoading(true); 
    
    try {
      const lastDoc = isReset ? undefined : announcements[announcements.length - 1]?.doc;
      const list = await getAllAnnouncements(lastDoc);
      
      if (list.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setAnnouncements(prev => isReset ? list : [...prev, ...list]);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar anuncios");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };



  const handlePublishAnnouncement = async () => {
      if (!annText || !annStart || !annEnd) {
          toast.error("Complete todos los campos del anuncio");
          return;
      }
      
      setLoading(true);
      try {
          const startDate = new Date(annStart);
          const endDate = new Date(annEnd);
          
          if (endDate <= startDate) {
              toast.error("La fecha de fin debe ser posterior a la de inicio");
              return;
          }
          
          await createAnnouncement(annText, annIcon, startDate, endDate);
          toast.success("Anuncio publicado correctamente");
          setAnnText("");
          setAnnStart("");
          setAnnEnd("");
          loadAnnouncements(true); // Reset list
      } catch (e) {
          toast.error("Error al publicar anuncio");
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = async (id: string) => {
      setLoading(true);
      try {
          await deleteAnnouncement(id);
          toast.success("Anuncio eliminado");
          setAnnouncements(prev => prev.filter(a => a.id !== id));
      } catch (e) {
          toast.error("Error al eliminar");
      } finally {
          setLoading(false);
      }
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
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 rounded-xl transition-colors"
                    >
                        Publicar Anuncio
                    </button>
                </div>
            </div>
        </div>

        {/* List of Announcements */}
        <div className="pb-10">
            <h2 className="text-xl font-bold mb-4 px-1">Anuncios Creados</h2>
            <div className="space-y-4">
                {announcements.length === 0 && !pageLoading ? (
                    <div className="text-center py-8 text-muted-foreground bg-card/30 rounded-3xl border border-white/5">
                        No hay anuncios registrados.
                    </div>
                ) : (
                    announcements.map((ann, index) => {
                        const start = ann.fechaInicio.toDate();
                        const end = ann.fechaFin.toDate();
                        const isActive = new Date() >= start && new Date() <= end;
                        
                        // Attach ref to the last element
                        const isLast = index === announcements.length - 1;

                        return (
                            <div 
                                key={ann.id} 
                                ref={isLast ? lastElementRef : null}
                                className="bg-card border border-white/10 rounded-3xl p-5 flex items-start gap-4 group hover:border-white/20 transition-all relative overflow-hidden"
                            >
                                {isActive && (
                                    <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                                        ACTIVO
                                    </div>
                                )}
                                <div className="text-3xl shrink-0 bg-secondary/30 w-14 h-14 rounded-2xl flex items-center justify-center">
                                    {ann.icono}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg leading-tight mb-1">{ann.texto}</h3>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Desde: {moment(start).format("DD/MM/YYYY HH:mm")}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Hasta: {moment(end).format("DD/MM/YYYY HH:mm")}
                                        </span>
                                    </div>
                                </div>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button 
                                        className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                        title="Eliminar anuncio"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-card border-white/10 text-foreground">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground">
                                        Esta acción no se puede deshacer. El anuncio dejará de ser visible para los usuarios.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-secondary hover:bg-secondary/80 border-0">Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDelete(ann.id!)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        );
                    })
                )}
                
                {pageLoading && (
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
