import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin, ChevronDown, X, Check } from "lucide-react";
import { locations } from "@/lib/data";

interface LocationSelectorProps {
    onLocationSelect: (aimag: string, soum: string) => void;
    selectedAimag?: string;
    selectedSoum?: string;
}

export default function LocationSelector({
    onLocationSelect,
    selectedAimag,
    selectedSoum,
}: LocationSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempAimag, setTempAimag] = useState<string | undefined>(selectedAimag);
    const [tempSoum, setTempSoum] = useState<string | undefined>(selectedSoum);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Reset temp state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempAimag(selectedAimag);
            setTempSoum(selectedSoum);
        }
    }, [isOpen, selectedAimag, selectedSoum]);

    const handleAimagSelect = (aimagName: string) => {
        const aimag = getAimagByName(aimagName);
        if (aimag && aimag.soums.length === 0) {
            // If aimag has no soums (e.g. Ulaanbaatar), select it immediately
            onLocationSelect(aimagName, "");
            setIsOpen(false);
        } else {
            setTempAimag(aimagName);
            setTempSoum(undefined); // Reset soum when aimag changes
        }
    };

    const handleSoumSelect = (soumName: string) => {
        setTempSoum(soumName);
        if (tempAimag) {
            onLocationSelect(tempAimag, soumName);
            setIsOpen(false);
        }
    };

    // Helper to get aimag object by name (since we store names in state for now)
    const getAimagByName = (name?: string) => locations.find((a) => a.name === name);

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setIsOpen(false);
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-modal-title"
        >
            <div
                className="bg-[var(--card-bg)] w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300"
            >
                {/* Header */}
                <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--background)]">
                    <h2 id="location-modal-title" className="text-lg font-bold text-[var(--foreground)]">Байршил сонгох</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!tempAimag ? (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Аймаг сонгох</h3>
                            {locations.map((aimag) => (
                                <button
                                    key={aimag.id}
                                    onClick={() => handleAimagSelect(aimag.name)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-yellow-50 active:bg-yellow-100 border border-transparent hover:border-primary/20 transition-all text-left group"
                                >
                                    <span className="font-medium text-gray-900 group-hover:text-primary-dark">
                                        {aimag.name}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <button
                                onClick={() => setTempAimag(undefined)}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-4"
                            >
                                <ChevronDown className="w-4 h-4 rotate-90" />
                                Буцах
                            </button>

                            <h3 className="text-sm font-medium text-gray-500 mb-3">
                                {tempAimag} &gt; Сум сонгох
                            </h3>

                            {/* All Soums Option */}
                            <button
                                onClick={() => handleSoumSelect("")}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-yellow-50 active:bg-yellow-100 border border-transparent hover:border-primary/20 transition-all text-left"
                            >
                                <span className="font-medium text-gray-900">Бүгд</span>
                                {!tempSoum && <Check className="w-4 h-4 text-primary" />}
                            </button>

                            {getAimagByName(tempAimag)?.soums.map((soum) => (
                                <button
                                    key={soum.id}
                                    onClick={() => handleSoumSelect(soum.name)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-yellow-50 active:bg-yellow-100 border border-transparent hover:border-primary/20 transition-all text-left"
                                >
                                    <span className="font-medium text-gray-900">{soum.name}</span>
                                    {tempSoum === soum.name && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${selectedAimag
                    ? "bg-primary border-primary text-secondary hover:bg-yellow-400"
                    : "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                    }`}
            >
                <MapPin className={`w-4 h-4 ${selectedAimag ? "text-secondary" : "text-primary"}`} />
                <span className={`max-w-[150px] sm:max-w-xs truncate ${selectedAimag ? "text-secondary" : "text-foreground"}`}>
                    {selectedAimag && selectedSoum
                        ? `${selectedAimag}, ${selectedSoum}`
                        : selectedAimag
                            ? selectedAimag
                            : "Байршил сонгох"}
                </span>
                <ChevronDown className={`w-4 h-4 ${selectedAimag ? "text-secondary" : "text-gray-500"}`} />
            </button>

            {mounted && isOpen && createPortal(modalContent, document.body)}
        </>
    );
}
