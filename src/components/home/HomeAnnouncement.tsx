import { Announcement } from "@/services/announcements";

interface HomeAnnouncementProps {
    announcement: Announcement;
}

export default function HomeAnnouncement({ announcement }: HomeAnnouncementProps) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-100 text-slate-900 rounded-3xl p-6 shadow-xl border border-white/20 flex items-start gap-5 animate-in slide-in-from-left-full fade-in duration-700 ease-out delay-200 fill-mode-backwards group hover:scale-[1.02] transition-transform">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="relative text-4xl shrink-0 bg-white shadow-sm w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100">
                {announcement.icono}
            </div>

            <div className="relative flex-1 py-1">
                <h3 className="font-bold text-lg leading-tight mb-2 flex items-center gap-2">
                    Atención
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {announcement.texto}
                </p>
            </div>
        </div>
    );
}
