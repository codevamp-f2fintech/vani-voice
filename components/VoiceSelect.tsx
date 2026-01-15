import React, { useState, useRef } from 'react';
import { Button } from './UI';
import { Play, Pause, Volume2, Check } from 'lucide-react';

interface Voice {
    voiceId: string;
    name: string;
    category?: string;
    description?: string;
    gender?: string;
    accent?: string;
    provider: string;
    previewUrl?: string;
}

interface VoiceSelectProps {
    voices: Voice[];
    selectedVoiceId: string;
    onSelect: (voiceId: string) => void;
    disabled?: boolean;
}

const VoiceSelect: React.FC<VoiceSelectProps> = ({ voices, selectedVoiceId, onSelect, disabled }) => {
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [hoveredVoiceId, setHoveredVoiceId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playPreview = (voice: Voice, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!voice.previewUrl) return;

        if (playingVoiceId === voice.voiceId) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingVoiceId(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(voice.previewUrl);
        audioRef.current = audio;

        audio.onended = () => {
            setPlayingVoiceId(null);
            audioRef.current = null;
        };

        audio.onerror = () => {
            setPlayingVoiceId(null);
            audioRef.current = null;
        };

        audio.play();
        setPlayingVoiceId(voice.voiceId);
    };

    const selectedVoice = voices.find(v => v.voiceId === selectedVoiceId);

    // Group voices by provider
    const elevenLabsVoices = voices.filter(v => v.provider === '11labs' || v.provider === 'elevenlabs');
    const otherVoices = voices.filter(v => v.provider !== '11labs' && v.provider !== 'elevenlabs');

    return (
        <div className="space-y-3">
            {/* Selected Voice Display */}
            {selectedVoice && (
                <div className="flex items-center justify-between p-3 bg-vani-plum/10 border border-vani-plum/30 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-vani-plum/20 rounded-full flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-vani-plum" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{selectedVoice.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedVoice.gender && `${selectedVoice.gender}`}
                                {selectedVoice.accent && ` • ${selectedVoice.accent}`}
                                {selectedVoice.provider && ` • ${selectedVoice.provider}`}
                            </p>
                        </div>
                    </div>
                    {selectedVoice.previewUrl && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => playPreview(selectedVoice, e)}
                            className="gap-1"
                        >
                            {playingVoiceId === selectedVoice.voiceId ? (
                                <><Pause size={14} /> Stop</>
                            ) : (
                                <><Play size={14} /> Preview</>
                            )}
                        </Button>
                    )}
                </div>
            )}

            {/* Voice List */}
            <div className="max-h-[280px] overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl">
                {/* ElevenLabs Voices */}
                {elevenLabsVoices.length > 0 && (
                    <>
                        <div className="sticky top-0 px-3 py-2 bg-gray-100 dark:bg-white/10 border-b border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            ElevenLabs Voices
                        </div>
                        {elevenLabsVoices.map((voice) => (
                            <VoiceItem
                                key={voice.voiceId}
                                voice={voice}
                                isSelected={selectedVoiceId === voice.voiceId}
                                isPlaying={playingVoiceId === voice.voiceId}
                                isHovered={hoveredVoiceId === voice.voiceId}
                                onSelect={() => onSelect(voice.voiceId)}
                                onPlayPreview={(e) => playPreview(voice, e)}
                                onMouseEnter={() => setHoveredVoiceId(voice.voiceId)}
                                onMouseLeave={() => setHoveredVoiceId(null)}
                                disabled={disabled}
                            />
                        ))}
                    </>
                )}

                {/* Other Voices */}
                {otherVoices.length > 0 && (
                    <>
                        <div className="sticky top-0 px-3 py-2 bg-gray-100 dark:bg-white/10 border-b border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Other Voices
                        </div>
                        {otherVoices.map((voice) => (
                            <VoiceItem
                                key={voice.voiceId}
                                voice={voice}
                                isSelected={selectedVoiceId === voice.voiceId}
                                isPlaying={playingVoiceId === voice.voiceId}
                                isHovered={hoveredVoiceId === voice.voiceId}
                                onSelect={() => onSelect(voice.voiceId)}
                                onPlayPreview={(e) => playPreview(voice, e)}
                                onMouseEnter={() => setHoveredVoiceId(voice.voiceId)}
                                onMouseLeave={() => setHoveredVoiceId(null)}
                                disabled={disabled}
                            />
                        ))}
                    </>
                )}

                {voices.length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        No voices available
                    </div>
                )}
            </div>
        </div>
    );
};

interface VoiceItemProps {
    voice: Voice;
    isSelected: boolean;
    isPlaying: boolean;
    isHovered: boolean;
    onSelect: () => void;
    onPlayPreview: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    disabled?: boolean;
}

const VoiceItem: React.FC<VoiceItemProps> = ({
    voice,
    isSelected,
    isPlaying,
    isHovered,
    onSelect,
    onPlayPreview,
    onMouseEnter,
    onMouseLeave,
    disabled
}) => {
    return (
        <div
            className={`
        flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all
        ${isSelected
                    ? 'bg-vani-plum/10 border-l-3 border-l-vani-plum'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
            onClick={disabled ? undefined : onSelect}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex items-center gap-3">
                <div className={`
          w-8 h-8 rounded-full flex items-center justify-center transition-colors
          ${isSelected ? 'bg-vani-plum text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}
        `}>
                    {isSelected ? <Check size={14} /> : <Volume2 size={14} />}
                </div>
                <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-vani-plum' : 'text-gray-900 dark:text-white'}`}>
                        {voice.name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {voice.description || `${voice.gender || ''} ${voice.accent ? `• ${voice.accent}` : ''}`}
                    </p>
                </div>
            </div>

            {voice.previewUrl && (isHovered || isPlaying) && (
                <button
                    type="button"
                    onClick={onPlayPreview}
                    className={`
            h-7 w-7 rounded-full flex items-center justify-center transition-colors
            ${isPlaying ? 'bg-vani-plum text-white' : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20'}
          `}
                >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
            )}
        </div>
    );
};

export default VoiceSelect;
