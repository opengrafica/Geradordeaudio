
import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { VOICES, MAX_CHARACTERS, SAMPLE_TEXT } from './constants';
import type { Voice, Speed, Pitch, AudioFormat } from './types';
import { decodeBase64ToUint8Array, createWavBlobUrl } from './utils/audioUtils';
import { PlayIcon, DownloadIcon, LoaderIcon, CheckIcon } from './components/icons';

// NOTE: Helper components are defined outside the main App component to prevent re-rendering issues.

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  isPreviewing: boolean;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isSelected, onSelect, onPreview, isPreviewing }) => {
  return (
    <div
      className={`p-4 border rounded-lg transition-all duration-300 cursor-pointer flex flex-col justify-between h-full ${
        isSelected ? 'border-indigo-500 bg-indigo-900/20 ring-2 ring-indigo-500' : 'border-gray-700 bg-gray-800 hover:border-indigo-600'
      }`}
      onClick={() => onSelect(voice.id)}
    >
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-white">{voice.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(voice.id);
            }}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Ouvir prévia da voz ${voice.name}`}
            disabled={isPreviewing}
          >
            {isPreviewing ? <LoaderIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>
        <p className="text-sm text-gray-400">{voice.description}</p>
      </div>
      {isSelected && (
        <div className="mt-4 flex items-center justify-end text-indigo-400">
          <CheckIcon className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">Selecionada</span>
        </div>
      )}
    </div>
  );
};

interface SettingsTabProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
}

const SettingsTab = <T extends string,>({ label, options, selectedValue, onSelect }: SettingsTabProps<T>) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex bg-gray-800 rounded-md p-1 space-x-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              selectedValue === option.value ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [text, setText] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(VOICES[0].id);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [pitch, setPitch] = useState<Pitch>('medium');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ai = useMemo(() => {
    if (!process.env.API_KEY) {
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);


  const handleGenerateAudio = useCallback(async (isPreview: boolean, voiceId?: string) => {
    const currentVoiceId = voiceId || selectedVoiceId;
    const textToGenerate = isPreview ? SAMPLE_TEXT : text;

    if (!ai) {
      setError("A chave da API Gemini não foi configurada. Defina a variável de ambiente API_KEY.");
      return;
    }
    
    if (!textToGenerate) {
      setError("Por favor, insira um texto para gerar o áudio.");
      return;
    }

    if (isPreview) {
      setPreviewVoiceId(currentVoiceId);
    } else {
      setIsLoading(true);
      setGeneratedAudioUrl(null);
    }
    setError(null);

    try {
      let prompt = textToGenerate;
      const speedPrefix = { slow: 'Diga lentamente: ', normal: '', fast: 'Diga rapidamente: ' }[speed];
      const pitchPrefix = { low: 'Diga em um tom de voz grave: ', medium: '', high: 'Diga em um tom de voz agudo: ' }[pitch];
      
      if(!isPreview) {
          prompt = `${pitchPrefix}${speedPrefix}${textToGenerate}`;
      }

      const selectedAPIVoice = VOICES.find(v => v.id === currentVoiceId)?.apiName || 'Kore';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedAPIVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBytes = decodeBase64ToUint8Array(base64Audio);
        const wavUrl = createWavBlobUrl(audioBytes);
        
        if (isPreview) {
            const audio = new Audio(wavUrl);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(wavUrl);
        } else {
            setGeneratedAudioUrl(wavUrl);
        }
      } else {
        throw new Error("A resposta da API não continha dados de áudio.");
      }
    } catch (e) {
      console.error(e);
      setError("Ocorreu um erro ao gerar o áudio. Por favor, tente novamente.");
    } finally {
      if (isPreview) {
        setPreviewVoiceId(null);
      } else {
        setIsLoading(false);
      }
    }
  }, [ai, text, selectedVoiceId, speed, pitch]);

  const charCount = text.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Gerador de Áudio Humanizado
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Cole seu texto abaixo, escolha a voz feminina desejada, ajuste velocidade e tom, e clique em 'Gerar Áudio'. O áudio gerado será 100% humanizado, com entonação natural e alta qualidade sonora.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna da Esquerda: Texto e Configurações */}
          <div className="flex flex-col space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Seu Texto</h2>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Comece a digitar ou cole seu texto aqui..."
                  className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  maxLength={MAX_CHARACTERS}
                />
                <div className={`absolute bottom-3 right-3 text-sm ${charCount > MAX_CHARACTERS ? 'text-red-500' : 'text-gray-400'}`}>
                  {charCount} / {MAX_CHARACTERS}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
               <h2 className="text-xl font-semibold">Configurações</h2>
                <SettingsTab
                    label="Velocidade"
                    options={[{ value: 'slow', label: 'Lenta' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Rápida' }]}
                    selectedValue={speed}
                    onSelect={setSpeed}
                />
                <SettingsTab
                    label="Tom"
                    options={[{ value: 'low', label: 'Grave' }, { value: 'medium', label: 'Médio' }, { value: 'high', label: 'Agudo' }]}
                    selectedValue={pitch}
                    onSelect={setPitch}
                />
            </div>
          </div>
          
          {/* Coluna da Direita: Vozes e Resultado */}
          <div className="flex flex-col space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Escolha uma Voz</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {VOICES.map((voice) => (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isSelected={selectedVoiceId === voice.id}
                    onSelect={setSelectedVoiceId}
                    onPreview={() => handleGenerateAudio(true, voice.id)}
                    isPreviewing={previewVoiceId === voice.id}
                  />
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 py-4 bg-gray-900">
                <button
                onClick={() => handleGenerateAudio(false)}
                disabled={isLoading || !text || charCount > MAX_CHARACTERS || !ai}
                className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                {isLoading ? (
                    <>
                    <LoaderIcon className="w-6 h-6 mr-3" />
                    Gerando Áudio...
                    </>
                ) : (
                    'Gerar Áudio'
                )}
                </button>
                 {!ai && <p className="text-center text-red-500 text-sm mt-2">API Key não configurada.</p>}
            </div>

            {(generatedAudioUrl || error) && (
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Resultado</h2>
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                {generatedAudioUrl && (
                  <div className="space-y-4">
                    <audio controls src={generatedAudioUrl} className="w-full">
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                    <a
                      href={generatedAudioUrl}
                      download="audio_gerado.wav"
                      className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      <DownloadIcon className="w-5 h-5 mr-2" />
                      Baixar Áudio (WAV)
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
