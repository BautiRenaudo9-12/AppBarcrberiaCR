import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, User, Loader2 } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { ClientCard } from "@/components/clientes/ClientCard";
import { useClientsInfinite, useClientsSearch, useClientsCount } from "@/hooks/useClients";

export default function Clientes() {
  // Input state (visual)
  const [inputValue, setInputValue] = useState("");
  // Query state (debounced)
  const [searchTerm, setSearchTerm] = useState("");
  
  // Queries
  const { data: totalCount = 0 } = useClientsCount();
  
  const { 
    data: infiniteData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    status: infiniteStatus 
  } = useClientsInfinite();

  const { 
    data: searchData, 
    isLoading: isSearchLoading 
  } = useClientsSearch(searchTerm);

  // Debounce logic
  const searchTimeout = useRef<NodeJS.Timeout>();
  
  const handleSearch = (term: string) => {
    setInputValue(term); // Update input immediately
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
        setSearchTerm(term); // Update query after delay
    }, 300);
  };

  // Determine which data to show
  const isSearchMode = !!searchTerm;
  const clients = isSearchMode 
    ? (searchData || []) 
    : (infiniteData?.pages.flatMap(page => page) || []);

  const isLoading = isSearchMode ? isSearchLoading : infiniteStatus === "loading";

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isSearchMode) {
        fetchNextPage();
      }
    }, { rootMargin: "200px" });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, isSearchMode, fetchNextPage]);

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
            value={inputValue}
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
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-xl font-bold">{totalCount}</p>
             </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {clients.length === 0 && !isLoading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border border-white/5 rounded-2xl bg-card/30">
              No se encontraron clientes.
            </div>
          ) : (
            clients.map((client, index) => {
                const isLast = index === clients.length - 1;
                return (
                    <ClientCard 
                        key={client.id} 
                        client={client} 
                        innerRef={isLast ? lastElementRef : null} 
                    />
                );
            })
          )}
          
          {(isLoading || isFetchingNextPage) && (
             <div className="col-span-full flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
