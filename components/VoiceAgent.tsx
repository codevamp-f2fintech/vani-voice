"use client";

import { useConversation } from "@elevenlabs/react";
import {
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    Banknote,
    Building,
    Stethoscope,
    Hotel,
    Car,
    GraduationCap,
    Heart,
} from "lucide-react";
import { useState, useEffect } from "react";

const agents = [
    {
        id: "agent_9001kbc7zs0rf1camvhwkxxxmqxp", // Replace with actual Agent ID
        name: "Loan Support",
        icon: Banknote,
        description: "Expert assistance for personal and business loans.",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        id: "agent_5101khn9k6j5enpvzx0c51dfb197", // Replace with actual Agent ID
        name: "Real Estate",
        icon: Building,
        description: "Find your dream home or investment property.",
        gradient: "from-emerald-500 to-teal-500",
    },
    {
        id: "agent_3401khn9mmrpfpv8smgyt3zcs70n", // Replace with actual Agent ID
        name: "Doctor Appt",
        icon: Stethoscope,
        description: "Schedule consultations with top specialists.",
        gradient: "from-red-500 to-pink-500",
    },
    {
        id: "agent_0801khn9nbyge6jvwky5sgqv1waw", // Replace with actual Agent ID
        name: "Hotel Reception",
        icon: Hotel,
        description: "Book rooms and manage your stay details.",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        id: "agent_6001khn9p9g6fb5tbhn9eycxz2xj", // Replace with actual Agent ID
        name: "Taxi Booking",
        icon: Car,
        description: "Reliable rides for your daily commute.",
        gradient: "from-violet-500 to-purple-500",
    },
    {
        id: "agent_3701khqr590qf6zbb1dg1vj3yqjk", // Replace with actual Agent ID
        name: "College Admission",
        icon: GraduationCap,
        description: "Guidance on courses, admissions, and campus life.",
        gradient: "from-indigo-500 to-blue-500",
    },
    {
        id: "agent_3701kmfqr6f2f84tft8te2yyh2hp", // Replace with actual Agent ID
        name: "NGO",
        icon: Heart,
        description: "Support and assistance for the NGA",
        gradient: "from-rose-500 to-pink-500",
    },
];

export default function VoiceAgent() {
    const [activeAgent, setActiveAgent] = useState(agents[0]);
    const [hasPermission, setHasPermission] = useState(false);
    const [userName, setUserName] = useState("");
    const [isMuted, setIsMuted] = useState(false);

    const conversation = useConversation({
        onConnect: () => console.log(`Connected to ${activeAgent.name}`),
        onDisconnect: () => {
            console.log(`Disconnected from ${activeAgent.name}`);
            setIsMuted(false);
        },
        onMessage: (message) => console.log("Message:", message),
        onError: (error) => console.error("Error:", error),
        onModeChange: (mode) => console.log("Mode changed:", mode),
        // @ts-ignore - micMuted might be available in newer versions
        micMuted: isMuted,
    });

    useEffect(() => {
        console.log("Conversation Object:", conversation);
    }, [conversation]);

    const startConversation = async () => {
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasPermission(true);

            // Start ElevenLabs conversation with the active agent's ID
            // Fallback to the default ID if the specific one isn't ready
            const agentId = activeAgent.id;
            const conversationOptions: any = {
                agentId: agentId,
                connectionType: "webrtc",
            };

            if (userName) {
                conversationOptions.dynamicVariables = {
                    name: userName
                };
            }

            await conversation.startSession(conversationOptions);
        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert("Please allow microphone access to use the voice agent.");
        }
    };

    const stopConversation = () => {
        conversation.endSession();
        setHasPermission(false);
        setIsMuted(false);
    };

    const toggleMute = async () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);

        // Attempt to mute using SDK
        // @ts-ignore
        if (conversation.setMicMuted) {
            // @ts-ignore
            conversation.setMicMuted(newMuted);
        } else {
            console.log("conversation.setMicMuted not available, relying on micMuted prop");
        }
    };

    const isConnected = conversation.status === "connected";
    const isConnecting = conversation.status === "connecting";

    return (
        <section id="demo" className="py-20 px-6">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Try <span className="gradient-text">Vani</span> Live
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Experience our AI-powered voice agent - choose a vertical below!
                    </p>
                </div>

                {/* Agent Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {agents.map((agent) => (
                        <button
                            key={agent.id}
                            onClick={() => !isConnected && !isConnecting && setActiveAgent(agent)}
                            disabled={isConnected || isConnecting}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${activeAgent.id === agent.id
                                ? `bg-gradient-to-r ${agent.gradient} text-white shadow-lg scale-105`
                                : "glass text-gray-400 hover:text-white hover:bg-white/10"
                                } ${isConnected || isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <agent.icon className="w-5 h-5" />
                            <span className="font-medium">{agent.name}</span>
                        </button>
                    ))}
                </div>

                <div className="glass p-8 md:p-12 rounded-2xl relative overflow-hidden transition-all duration-500">
                    {/* Dynamic Background Glow */}
                    <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${activeAgent.gradient} opacity-50`}
                    ></div>

                    <div className="text-center mb-8">
                        {/* Agent Info */}
                        <h3 className="text-3xl font-bold text-white mb-2 transition-all">
                            {activeAgent.name}
                        </h3>
                        <p className="text-gray-400 mb-6">{activeAgent.description}</p>

                        <div className="inline-flex items-center space-x-2 mb-8 bg-black/20 px-4 py-2 rounded-full">
                            {isConnected ? (
                                <>
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 font-semibold text-sm">
                                        Live
                                    </span>
                                </>
                            ) : isConnecting ? (
                                <>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-400 font-semibold text-sm">
                                        Connecting...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                    <span className="text-gray-400 font-semibold text-sm">
                                        Ready to Connect
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Agent State */}
                        {isConnected && (
                            <p className="text-lg text-white animate-fade-in">
                                Agent is{" "}
                                <span className={`font-bold bg-clip-text text-transparent bg-gradient-to-r ${activeAgent.gradient}`}>
                                    {conversation.isSpeaking ? "speaking" : "listening"}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Visualization */}
                    {isConnected && (
                        <div className="flex items-center justify-center space-x-2 h-24 mb-8">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 rounded-full ${conversation.isSpeaking ? "animate-wave" : "h-2"
                                        } bg-gradient-to-t ${activeAgent.gradient}`}
                                    style={{
                                        height: conversation.isSpeaking
                                            ? `${Math.random() * 60 + 10}px`
                                            : "8px",
                                        animationDelay: `${i * 0.05}s`,
                                        opacity: 0.8,
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-4 w-full mb-8">
                        {!isConnected && !isConnecting && (
                            <div className="w-full max-w-xs">
                                <input
                                    type="text"
                                    placeholder="Enter your name (Optional)"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vani-pink transition-all text-center"
                                />
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            {!isConnected ? (
                                <button
                                    onClick={startConversation}
                                    disabled={isConnecting}
                                    className={`px-8 py-4 rounded-full text-white font-semibold text-lg hover:scale-105 transition-transform flex items-center space-x-2 shadow-lg ${isConnecting
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : `bg-gradient-to-r ${activeAgent.gradient}`
                                        }`}
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>{isConnecting ? "Connecting..." : "Start Call"}</span>
                                </button>
                            ) : (
                                <div className="flex gap-4">
                                    <button
                                        onClick={toggleMute}
                                        className={`px-6 py-4 rounded-full font-semibold text-lg transition-colors flex items-center space-x-2 shadow-lg ${isMuted
                                            ? "bg-gray-600 text-white hover:bg-gray-700"
                                            : "bg-white text-gray-900 hover:bg-gray-100"
                                            }`}
                                    >
                                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={stopConversation}
                                        className="px-8 py-4 bg-red-600 rounded-full text-white font-semibold text-lg hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-red-900/20"
                                    >
                                        <PhoneOff className="w-5 h-5" />
                                        <span>End Call</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        <p>
                            💡 Microphone access required. Select a vertical above to switch context.
                        </p>
                    </div>
                </div>

                {/* Features Below Demo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="glass p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-400">
                            <span className="gradient-text font-semibold">WebRTC</span>
                            <br />
                            Low Latency
                        </p>
                    </div>
                    <div className="glass p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-400">
                            <span className="gradient-text font-semibold">Real-Time</span>
                            <br />
                            Voice Interaction
                        </p>
                    </div>
                </div>
            </div >
        </section >
    );
}