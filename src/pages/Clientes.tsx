import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, User, Phone, Mail, History } from "lucide-react";
import { getClientes } from "@/services/users";
import { useUI } from "@/context/UIContext";
import { DocumentData } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientData {
  id: string; // email is usually the ID in this app
  name: string;
  email: string;
  nro: string;
  [key: string]: any;
}

export default function Clientes() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading } = useUI();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(lowerTerm) ||
        client.email?.toLowerCase().includes(lowerTerm) ||
        client.nro?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const snap = await getClientes();
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClientData[];
      
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-white/10 p-4 rounded-xl flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500">
                <User className="w-5 h-5" />
             </div>
             <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-xl font-bold">{clients.length}</p>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-muted-foreground font-medium">Nombre</TableHead>
                <TableHead className="text-muted-foreground font-medium">Contacto</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-base">{client.name || "Sin Nombre"}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">{client.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{client.email}</span>
                        </div>
                        {client.nro && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{client.nro}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       {/* Future: Add History Button or Edit */}
                       <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <History className="w-4 h-4" />
                       </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
