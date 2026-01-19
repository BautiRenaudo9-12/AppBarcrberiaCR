import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, User, Phone, Mail, History, Loader2 } from "lucide-react";
import { getClientesPaginated, searchClientes } from "@/services/users";
import { useUI } from "@/context/UIContext";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

interface ClientData {
  id: string; 
  name: string;
  email: string;
  nro: string;
  doc?: QueryDocumentSnapshot<DocumentData>;
  [key: string]: any;
}

export default function Clientes() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading } = useUI();

  // Pagination State
  const [hasMore, setHasMore] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initial Load
    if (!searchTerm) {
        loadClients(true);
    }
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
        if (term.trim() === "") {
            loadClients(true); // Reset to paginated view
            return;
        }

        setPageLoading(true);
        try {
            // Server-side search (limited)
            const snap = await searchClientes(term);
            const data = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as ClientData[];
            
            setClients(data);
            setHasMore(false); // Disable infinite scroll for search results for now
        } catch (error) {
            console.error(error);
        } finally {
            setPageLoading(false);
        }
    }, 300);
  };

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (pageLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchTerm) {
        loadClients(false);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [pageLoading, hasMore, searchTerm]);

  const loadClients = async (isReset: boolean = false) => {
    setPageLoading(true);
    if (isReset) {
        setLoading(true);
        setHasMore(true);
    }
    
    try {
      const lastDoc = isReset ? undefined : clients[clients.length - 1]?.doc;
      const snap = await getClientesPaginated(lastDoc);
      
      const newClients = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        doc: doc // Save ref for pagination
      })) as ClientData[];

      if (newClients.length < 10) {
        setHasMore(false);
      }

      setClients(prev => isReset ? newClients : [...prev, ...newClients]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Clientes</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre (comienza con)..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-secondary/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-white/10 p-4 rounded-xl flex items-center gap-3">
             <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                <User className="w-5 h-5" />
             </div>
             <div>
                <p className="text-sm text-muted-foreground">Clientes Visibles</p>
                <p className="text-xl font-bold">{clients.length}</p>
             </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {clients.length === 0 && !pageLoading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border border-white/5 rounded-2xl bg-card/30">
              No se encontraron clientes.
            </div>
          ) : (
            clients.map((client, index) => {
                const isLast = index === clients.length - 1;
                return (
                  <div 
                    key={client.id}
                    ref={isLast ? lastElementRef : null} 
                    className="bg-card border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{client.name || "Sin Nombre"}</h3>
                        <p className="text-xs text-muted-foreground mt-1">ID: {client.id}</p>
                      </div>
                      <div className="w-10 h-10 bg-secondary/30 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
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
                          className="text-xs bg-secondary/50 hover:bg-secondary text-foreground px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                          title="Ver Historial"
                       >
                          <History className="w-3 h-3" />
                          Historial
                       </button>
                    </div>
                  </div>
                );
            })
          )}
          
          {pageLoading && (
             <div className="col-span-full flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
