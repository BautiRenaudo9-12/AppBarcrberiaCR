import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getClientesPaginated, searchClientes, getClientsCount, getClientHistory } from "@/services/users";
import { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

// Helper to serialize Firestore docs because React Query needs serializable keys/data sometimes, 
// though passing the snapshot object works if we don't persist it.
// We'll keep the doc ref in the data structure for pagination.

interface ClientData {
  id: string; 
  name: string;
  email: string;
  nro: string;
  doc?: QueryDocumentSnapshot<DocumentData>;
  [key: string]: any;
}

export const useClientsInfinite = () => {
  return useInfiniteQuery({
    queryKey: ["clients", "infinite"],
    queryFn: async ({ pageParam }) => {
      const snap = await getClientesPaginated(pageParam);
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        doc: doc 
      })) as ClientData[];
    },
    getNextPageParam: (lastPage) => {
      // If we got fewer than 10 items, we are done
      if (lastPage.length < 10) return undefined;
      // Return the last document as the cursor
      return lastPage[lastPage.length - 1]?.doc;
    },
    initialPageParam: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useClientsSearch = (term: string) => {
  return useQuery({
    queryKey: ["clients", "search", term],
    queryFn: async () => {
      if (!term) return [];
      const snap = await searchClientes(term);
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        doc: doc 
      })) as ClientData[];
    },
    enabled: !!term, // Only run if term exists
    staleTime: 1000 * 60 * 5, // Cache search results for 5 minutes
  });
};

export const useClientsCount = () => {
  return useQuery({
    queryKey: ["clients", "count"],
    queryFn: getClientsCount,
    staleTime: 1000 * 60 * 60, // Cache count for 1 hour (it's expensive-ish and doesn't change fast)
  });
};

export interface ClientHistoryEntry {
  id: string;
  time: Timestamp | null;
}

// Historial de un cliente (admin). enabled evita fetchear hasta abrir el diálogo.
export const useClientHistory = (email: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["clients", "history", email],
    queryFn: async () => {
      const snap = await getClientHistory(email);
      return snap.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          time: (data.time as Timestamp) ?? null,
        };
      }) as ClientHistoryEntry[];
    },
    enabled: enabled && !!email,
    staleTime: 1000 * 60 * 5,
  });
};
