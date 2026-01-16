interface CancelReservationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function CancelReservationDialog({ open, onClose, onConfirm }: CancelReservationDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
            <div className="bg-card border border-white/10 rounded-3xl p-6 w-full sm:w-auto sm:max-w-sm space-y-4 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-300">
                <h3 className="text-lg font-semibold">¿Cancelar este turno?</h3>
                <p className="text-sm text-muted-foreground">
                    Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-3 font-medium transition-colors"
                    >
                        Volver
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl py-3 font-medium transition-colors"
                    >
                        Cancelar turno
                    </button>
                </div>
            </div>
        </div>
    );
}
