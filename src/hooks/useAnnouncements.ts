import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllAnnouncements, createAnnouncement, deleteAnnouncement, Announcement } from "@/services/announcements";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export const useAnnouncementsInfinite = () => {
  return useInfiniteQuery({
    queryKey: ["announcements", "infinite"],
    queryFn: async ({ pageParam }) => {
      return await getAllAnnouncements(pageParam);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 10) return undefined;
      return lastPage[lastPage.length - 1]?.doc;
    },
    initialPageParam: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, icon, start, end }: { text: string; icon: string; start: Date; end: Date }) => {
      await createAnnouncement(text, icon, start, end);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAnnouncement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};
