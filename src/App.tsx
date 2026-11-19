import { useCallback, useEffect, useState } from 'react';
import { AcousticLoadingScreen } from './components/AcousticLoadingScreen';
import { GameCanvasView } from './components/GameCanvasView';
import { ManualLoreModal } from './components/ManualLoreModal';
import { SettingsStoreModal } from './components/SettingsStoreModal';
import { SoundBestiaryModal } from './components/SoundBestiaryModal';
import { SoundDiariesModal } from './components/SoundDiariesModal';
import { SoundRecordsModal } from './components/SoundRecordsModal';
import { TitleScreen } from './components/TitleScreen';
import { LEVELS } from './game/levels';
import { soundEngine } from './game/soundEngine';
import {
  loadProgress,
  persistProgress,
  saveDiaryCollected,
  saveLevelCompletion,
  STORE_ITEMS,
} from './game/storage';
import {
  CharacterId,
  GameSettings,
  SaveProgress,
  SoundDiaryId,
  SoundRecordId,
  StoreItemId,
} from './game/types';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'loading' | 'play'>('menu');
  const [progress, setProgress] = useState<SaveProgress>(() => loadProgress());
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() => {
    const saved = loadProgress();
    return Math.min(LEVELS.length, Math.max(1, saved.unlockedLevel));
  });
  const [modalTab, setModalTab] = useState<'settings' | 'store' | null>(null);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [showDiaries, setShowDiaries] = useState(false);
  const [manualTab, setManualTab] = useState<'story' | 'manual' | null>(null);

  // Sync sound engine with persisted settings on mount & cleanup mic stream on unmount
  useEffect(() => {
    soundEngine.setMasterVolume(progress.settings.masterVolume);
    soundEngine.setMuted(progress.settings.muted);
    return () => {
      soundEngine.disableMicAmbient();
    };
  }, [progress.settings.masterVolume, progress.settings.muted]);

  const handleUpdateSettings = useCallback(async (next: GameSettings) => {
    let finalSettings = next;
    if (next.useMicAmbient) {
      const ok = await soundEngine.enableMicAmbient();
      if (!ok) {
        finalSettings = { ...next, useMicAmbient: false };
      }
    } else {
      soundEngine.disableMicAmbient();
    }

    soundEngine.setMasterVolume(finalSettings.masterVolume);
    soundEngine.setMuted(finalSettings.muted);

    setProgress((prev) => {
      const updated = { ...prev, settings: finalSettings };
      persistProgress(updated);
      return updated;
    });

    if (next.useMicAmbient && !finalSettings.useMicAmbient) {
      throw new Error('Microphone permission unavailable');
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setProgress((prev) => {
      const nextMuted = !prev.settings.muted;
      soundEngine.setMuted(nextMuted);
      const updated = {
        ...prev,
        settings: { ...prev.settings, muted: nextMuted },
      };
      persistProgress(updated);
      return updated;
    });
  }, []);

  const handleBuyWithShards = useCallback((itemId: StoreItemId) => {
    const item = STORE_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    setProgress((prev) => {
      if (prev.ownedItems.includes(itemId) || prev.echoShards < item.shardCost) {
        return prev;
      }
      const updated: SaveProgress = {
        ...prev,
        echoShards: prev.echoShards - item.shardCost,
        ownedItems: [...prev.ownedItems, itemId],
        equippedItems: [...prev.equippedItems, itemId],
      };
      persistProgress(updated);
      return updated;
    });
  }, []);

  const handleCollectDiary = useCallback((diaryId: SoundDiaryId) => {
    const updated = saveDiaryCollected(diaryId);
    setProgress(updated);
  }, []);

  const handleToggleEquip = useCallback((itemId: StoreItemId) => {
    setProgress((prev) => {
      if (!prev.ownedItems.includes(itemId)) return prev;
      const equipped = prev.equippedItems.includes(itemId)
        ? prev.equippedItems.filter((id) => id !== itemId)
        : [...prev.equippedItems, itemId];
      const updated: SaveProgress = { ...prev, equippedItems: equipped };
      persistProgress(updated);
      return updated;
    });
  }, []);

  const handleSelectCharacter = useCallback((characterId: CharacterId) => {
    setProgress((prev) => {
      if (prev.selectedCharacter === characterId) return prev;
      const updated: SaveProgress = { ...prev, selectedCharacter: characterId };
      persistProgress(updated);
      return updated;
    });
  }, []);

  const handleStartGame = useCallback((levelId: number) => {
    soundEngine.unlock();
    setSelectedLevelId(levelId);
    setScreen('loading');
  }, []);

  const handleCompleteLevel = useCallback(
    (stats: {
      timeSec: number;
      crystals: number;
      detections: number;
      harmony: number;
      earnedRecords: SoundRecordId[];
    }) => {
      const { progress: updated } = saveLevelCompletion(
        selectedLevelId,
        stats.timeSec,
        stats.crystals,
        stats.detections,
        stats.harmony,
        stats.earnedRecords
      );
      setProgress(updated);
    },
    [selectedLevelId]
  );

  const handleGoNextLevel = useCallback(() => {
    const nextId = selectedLevelId + 1;
    if (nextId <= LEVELS.length) {
      setSelectedLevelId(nextId);
      setScreen('loading');
    } else {
      setScreen('menu');
    }
  }, [selectedLevelId]);

  const activeLevel = LEVELS.find((l) => l.id === selectedLevelId) ?? LEVELS[0];
  const hasNextLevel = selectedLevelId < LEVELS.length;

  return (
    <>
      {screen === 'menu' ? (
        <TitleScreen
          progress={progress}
          selectedLevelId={selectedLevelId}
          selectedCharacter={progress.selectedCharacter}
          onSelectLevel={setSelectedLevelId}
          onSelectCharacter={handleSelectCharacter}
          onStartGame={handleStartGame}
          muted={progress.settings.muted}
          onToggleMute={handleToggleMute}
          onOpenSettings={(tab) => setModalTab(tab)}
          onOpenBestiary={() => setShowBestiary(true)}
          onOpenRecords={() => setShowRecords(true)}
          onOpenDiaries={() => setShowDiaries(true)}
          onOpenManual={(tab = 'story') => setManualTab(tab)}
        />
      ) : screen === 'loading' ? (
        <AcousticLoadingScreen
          level={activeLevel}
          characterId={progress.selectedCharacter}
          reducedEffects={progress.settings.reducedEffects}
          onComplete={() => setScreen('play')}
        />
      ) : (
        <GameCanvasView
          key={`${activeLevel.id}-${progress.selectedCharacter}`}
          level={activeLevel}
          characterId={progress.selectedCharacter}
          hasNextLevel={hasNextLevel}
          settings={progress.settings}
          equippedItems={progress.equippedItems}
          unlockedRecords={progress.unlockedRecords}
          onOpenSettings={(tab = 'settings') => setModalTab(tab)}
          onToggleMute={handleToggleMute}
          onExitToMenu={() => setScreen('menu')}
          onCollectDiary={handleCollectDiary}
          onCompleteLevel={handleCompleteLevel}
          onGoNextLevel={handleGoNextLevel}
          isExternalModalOpen={Boolean(modalTab || manualTab || showBestiary || showRecords || showDiaries)}
        />
      )}

      {modalTab && (
        <SettingsStoreModal
          initialTab={modalTab}
          settings={progress.settings}
          echoShards={progress.echoShards}
          ownedItems={progress.ownedItems}
          equippedItems={progress.equippedItems}
          onUpdateSettings={handleUpdateSettings}
          onBuyWithShards={handleBuyWithShards}
          onToggleEquip={handleToggleEquip}
          onClose={() => setModalTab(null)}
        />
      )}

      {showBestiary && <SoundBestiaryModal onClose={() => setShowBestiary(false)} />}
      {showRecords && (
        <SoundRecordsModal
          unlockedRecords={progress.unlockedRecords}
          onClose={() => setShowRecords(false)}
        />
      )}
      {showDiaries && (
        <SoundDiariesModal
          collectedDiaries={progress.collectedDiaries}
          onClose={() => setShowDiaries(false)}
        />
      )}
      {manualTab && (
        <ManualLoreModal initialTab={manualTab} onClose={() => setManualTab(null)} />
      )}
    </>
  );
}
