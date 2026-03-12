import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Pressable,
  Animated,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import caData from "../../data/ca.json";
import enData from "../../data/en.json";
import esData from "../../data/es.json";
import nlData from "../../data/nl.json";
import { useGameStore } from "../../store/useGameStore";

const splashImg = require("../../assets/images/splash.png");
const { height, width } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

const COLORS = {
  background: "#000000",
  card: "transparent",
  primary: "#00F3FF", // Neon Cyan
  secondary: "#FF0055", // Neon Pink
  success: "#39FF14", // Neon Green
  warning: "#FFAC1C", // Neon Orange
  purple: "#B026FF", // Neon Purple
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  paper: "#F5F5F5",
  border: "rgba(255,255,255,0.1)",
};

const NEON_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  "#FFFF33", // Yellow
];

const FONT_FAMILY = Platform.select({
  ios: "Arial Rounded MT Bold",
  android: "sans-serif-medium",
  default: "System",
});

// --- UTILS ---

const playSound = async (type: 'click' | 'success' | 'fail' | 'whoosh') => {
  if (!IS_WEB) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// --- COMPONENTS ---

const NeonPulsingView = ({ children, color, style }: any) => {
  const opacity = useSharedValue(0.6);
  
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.6, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: opacity.value,
    shadowColor: color,
    borderColor: color,
    shadowRadius: opacity.value * 15,
  }));

  return (
    <ReAnimated.View style={[styles.pulsingBox, animatedStyle, style]}>
      {children}
    </ReAnimated.View>
  );
};

const PhaseIndicator = ({ phase }: { phase: string }) => {
  const phases = ["PLAYER_SETUP", "REVEAL", "LOBBY", "VOTING"];
  const currentIndex = phases.findIndex(p => phase.includes(p));
  if (currentIndex === -1) return null;

  return (
    <View style={styles.progressContainer}>
      {phases.map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.progressDot, 
            i <= currentIndex && { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowRadius: 10, shadowOpacity: 1 }
          ]} 
        />
      ))}
    </View>
  );
};

const NeonButton = ({ title, onPress, color = COLORS.primary, style, textStyle }: any) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        playSound('click');
        onPress();
      }}
      style={[styles.neonBtn, { borderColor: color, shadowColor: color }, style]}
    >
      <Text style={[styles.btnText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---

export default function GameScreen() {
  useEffect(() => {
    let isMounted = true;
    const enableKeepAwake = async () => {
      try {
        await activateKeepAwakeAsync();
      } catch (e) {
        if (isMounted) console.warn("Keep awake failed to activate", e);
      }
    };
    enableKeepAwake();
    
    return () => {
      isMounted = false;
      try {
        deactivateKeepAwake();
      } catch (e) {
        // Silently fail on cleanup
      }
    };
  }, []);
  
  const insets = useSafeAreaInsets();
  const {
    currentPhase,
    players,
    addPlayer,
    removePlayer,
    startGame,
    gamePlayers,
    currentPlayerIndex,
    nextReveal,
    language,
    setLanguage,
    gameMode,
    setGameMode,
    startingPlayerIndex,
    chooseVotingMethod,
    submitVote,
    submitAgreement,
    votes,
    resetGame,
    voteAttempt,
    tryAgain,
    impostorsCount
  } = useGameStore();

  const [newName, setNewName] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedSuspects, setSelectedSuspects] = useState<string[]>([]);
  const swipeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerHaptic = (
    type: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
  ) => {
    if (!IS_WEB) {
      Haptics.impactAsync(type);
    }
  };

  const toggleSuspect = (id: string) => {
    playSound('click');
    setSelectedSuspects((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: swipeAnim } }],
    { useNativeDriver: !IS_WEB },
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      if (event.nativeEvent.translationY < -80) {
        setIsRevealed(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      }
      Animated.spring(swipeAnim, {
        toValue: 0,
        tension: 100,
        friction: 7,
        useNativeDriver: !IS_WEB,
      }).start();
    }
  };

  const revealSecret = () => {
    setIsRevealed(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    playSound('whoosh');
    Animated.sequence([
      Animated.timing(swipeAnim, {
        toValue: -height * 0.75,
        duration: 350,
        useNativeDriver: !IS_WEB,
      }),
      Animated.delay(2000),
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: !IS_WEB,
      })
    ]).start();
  };

  const closeReveal = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsRevealed(false);
    nextReveal();
  };

  const getTranslation = useCallback((key: string) => {
    const t: any = {
      title: { en: "THE IMPOSTOR", es: "EL IMPOSTOR", ca: "L'IMPOSTOR", nl: "DE BEDRIEGER" },
      start: { en: "START GAME", es: "EMPEZAR JUEGO", ca: "COMENÇAR JOC", nl: "START SPEL" },
      pass: { en: "Pass to: ", es: "Pasa a: ", ca: "Passa a: ", nl: "Geef aan: " },
      reveal: { en: "Swipe up to lift", es: "Desliza para levantar", ca: "Llisca per obrir", nl: "Veeg om op te lichten" },
      clickReveal: { en: "Tap to lift the veil", es: "Toca para levantar el velo", ca: "Toca per aixecar el vel", nl: "Tik om de sluier op te lichten" },
      gotIt: { en: "GOT IT", es: "¡ENTENDIDO!", ca: "ENTÈS", nl: "BEGREPEN" },
      play: { en: "ACTION TIME", es: "¡A JUGAR!", ca: "A JUGAR!", nl: "ACTIETIJD" },
      starts: { en: "Starts: ", es: "Empieza: ", ca: "Comença: ", nl: "Begint: " },
      instructions: { en: "Say 2 rounds of related words.", es: "Dad 2 rondas diciendo una palabra relacionada.", ca: "Feu 2 rondes dient una paraula relacionada.", nl: "Zeg 2 rondes van gerelateerde woorden." },
      voteChoice: { en: "VOTING TIME", es: "VOTACIÓN", ca: "VOTACIÓ", nl: "STEMTIJD" },
      agreement: { en: "PUBLIC VOTE", es: "ACUERDO PÚBLICO", ca: "ACORD PÚBLIC", nl: "OPENBAAR AKKOORD" },
      secret: { en: "SECRET VOTE", es: "VOTO SECRETO", ca: "VOTACIÓ SECRETA", nl: "GEHEIM STEMMEN" },
      who: { en: "Who is the imposter?", es: "¿Quién es el impostor?", ca: "Qui és l'impostor?", nl: "Wie is de bedrieger?" },
      selectSuspect: { en: "SELECT SUSPECTS", es: "SELECCIONA SOSPECHOSOS", ca: "SELECCIONA SOSPITOSOS", nl: "SELECTEER VERDACHTEN" },
      atLeast: { en: "Select 0 or more", es: "Selecciona 0 o más", ca: "Selecciona 0 o més", nl: "Selecteer 0 of meer" },
      results: { en: "VERDICT", es: "VEREDICTO", ca: "VERDICTE", nl: "VERDICT" },
      finalResult: { en: "FINAL VERDICT", es: "VEREDICTO FINAL", ca: "VERDICTE FINAL", nl: "EINDVERDICT" },
      success: { en: "CIVILIANS WIN!", es: "¡CIVILES GANAN!", ca: "CIVILS GUANYEN!", nl: "BURGERS WINNEN!" },
      fail: { en: "IMPOSTORS WIN!", es: "¡IMPOSTORES GANAN!", ca: "IMPOSTORS GUANYEN!", nl: "BEDRIEGERS WINNEN!" },
      discussAgain: { en: "DISCUSS AGAIN", es: "DISCUTIR DE NUEVO", ca: "DISCUTIR DE NOU", nl: "OPNIEUW BESPREKEN" },
      impostorsWere: { en: "IMPOSTORS WERE:", es: "LOS IMPOSTORES ERAN:", ca: "ELS IMPOSTORS EREN:", nl: "DE BEDRIEGERS WAREN:" },
      playAgain: { en: "PLAY AGAIN", es: "JUGAR DE NUEVO", ca: "TORNAR A JUGAR", nl: "OPNIEUW SPELEN" },
      placeholder: { en: "Player Name", es: "Nombre", ca: "Nom", nl: "Naam" },
      role: { en: "ROLE: ", es: "ROL: ", ca: "ROL: ", nl: "ROL: " },
      civilian: { en: "CIVILIAN", es: "CIVIL", ca: "CIVIL", nl: "BURGER" },
      impostor: { en: "IMPOSTOR", es: "IMPOSTOR", ca: "IMPOSTOR", nl: "BEDRIEGER" },
      standard: { en: "ADULTS", es: "ADULTOS", ca: "ADULTS", nl: "VOLWASSENEN" },
      kids: { en: "KIDS", es: "NIÑOS", ca: "PETITS", nl: "KINDEREN" },
      selectLang: { en: "CHOOSE LANGUAGE", es: "ELIGE IDIOMA", ca: "TRIA IDIOMA", nl: "KIES TAAL" },
      selectMode: { en: "SELECT MODE", es: "SELECCIONA MODO", ca: "SELECCIONA MODE", nl: "SELECTEER MODUS" },
      setupPlayers: { en: "PLAYERS", es: "JUGADORES", ca: "JUGADORS", nl: "SPELERS" },
      back: { en: "BACK", es: "ATRÁS", ca: "ENRERE", nl: "TERUG" },
      voter: { en: "Turn: ", es: "Turno: ", ca: "Torn: ", nl: "Beurt: " },
      secretWordLabel: { en: "SECRET WORD", es: "PALABRA SECRETA", ca: "PARAULA SECRETA", nl: "GEHEIM WOORD" },
      menu: { en: "MENU", es: "MENÚ", ca: "MENÚ", nl: "MENU" },
      confirm: { en: "CONFIRM", es: "CONFIRMAR", ca: "CONFIRMAR", nl: "BEVESTIG" },
      caught: { en: "CAUGHT!", es: "¡ATRAPADO!", ca: "ATRAPAT!", nl: "GEVANGEN!" },
    };
    if (!t[key]) return key;
    return t[key][language] || t[key]["en"];
  }, [language]);

  const wordData = useMemo(() => {
    return language === "en" ? enData : language === "es" ? esData : language === "ca" ? caData : nlData;
  }, [language]);

  // --- RENDERS ---

  const renderLangSelect = () => (
    <ImageBackground source={splashImg} style={styles.splashBackground} resizeMode="cover">
      <ReAnimated.View entering={FadeIn} style={styles.splashOverlay}>
        <View style={styles.topTextContainer}>
          <Text style={styles.splashTitle}>L'impostor</Text>
        </View>
        <View style={styles.bottomLangContainer}>
          <Text style={styles.subtitle}>{getTranslation("selectLang")}</Text>
          <View style={styles.verticalBtns}>
            {["en", "es", "ca", "nl"].map((l) => (
              <NeonButton 
                key={l} 
                title={l.toUpperCase()} 
                onPress={() => setLanguage(l as any)} 
              />
            ))}
          </View>
        </View>
      </ReAnimated.View>
    </ImageBackground>
  );

  const renderModeSelect = () => (
    <ReAnimated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
      <Text style={styles.title}>{getTranslation("title")}</Text>
      <Text style={styles.subtitle}>{getTranslation("selectMode")}</Text>
      <NeonButton title={getTranslation("standard")} onPress={() => setGameMode("STANDARD")} color={COLORS.secondary} />
      <NeonButton title={getTranslation("kids")} onPress={() => setGameMode("KIDS")} color={COLORS.success} />
      <TouchableOpacity onPress={() => useGameStore.setState({ currentPhase: "LANG_SELECT" })} style={styles.backBtn}>
        <Text style={styles.backText}>{getTranslation("back")}</Text>
      </TouchableOpacity>
    </ReAnimated.View>
  );

  const renderPlayerSetup = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ReAnimated.View entering={FadeIn} style={{ width: '100%', alignItems: 'center', flex: 1 }}>
        <PhaseIndicator phase="PLAYER_SETUP" />
        <Text style={styles.title}>{getTranslation("setupPlayers")}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder={getTranslation("placeholder")}
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (newName.trim()) {
                addPlayer(newName.trim());
                setNewName("");
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          />
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => {
              if (newName.trim()) {
                addPlayer(newName.trim());
                setNewName("");
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          style={styles.list}
          data={players}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <ReAnimated.View layout={Layout.springify()} style={styles.playerItem}>
              <View style={[styles.colorIndicator, { backgroundColor: NEON_COLORS[index % NEON_COLORS.length] }]} />
              <Text style={styles.playerName}>{item}</Text>
              <TouchableOpacity onPress={() => removePlayer(index)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </ReAnimated.View>
          )}
        />
        <NeonButton 
          title={getTranslation("start")} 
          onPress={() => startGame(wordData)} 
          color={COLORS.primary} 
          style={{ marginBottom: 10, opacity: players.length >= 3 ? 1 : 0 }} 
          disabled={players.length < 3}
        />
        <TouchableOpacity onPress={() => useGameStore.setState({ currentPhase: "MODE_SELECT" })} style={styles.backBtn}>
          <Text style={styles.backText}>{getTranslation("back")}</Text>
        </TouchableOpacity>
      </ReAnimated.View>
    </KeyboardAvoidingView>
  );

  const renderReveal = () => {
    const currentPlayer = gamePlayers[currentPlayerIndex];
    const isImpostor = currentPlayer.role === "IMPOSTOR";
    const roleColor = isImpostor ? COLORS.secondary : COLORS.success;

    return (
      <ReAnimated.View entering={FadeIn} style={styles.container}>
        <PhaseIndicator phase="REVEAL" />
        <Text style={styles.instruction}>
          {getTranslation("pass")}
          <Text style={{ color: COLORS.primary }}>{currentPlayer.name}</Text>
        </Text>
        
        <View style={styles.revealWrapper}>
          <View style={styles.secretTextContainer}>
            <Text style={styles.roleLabel}>{getTranslation("role")}</Text>
            <Text style={[styles.roleValue, { color: roleColor }]}>{isImpostor ? getTranslation("impostor") : getTranslation("civilian")}</Text>
            <View style={[styles.divider, { backgroundColor: roleColor }]} />
            <Text 
              style={styles.secretWord} 
              adjustsFontSizeToFit 
              numberOfLines={1}
              minimumFontScale={0.4}
            >
              {currentPlayer.secret.toUpperCase()}
            </Text>
          </View>

          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[styles.paper, { transform: [{ translateY: swipeAnim }] }]}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => {
                  if (IS_WEB) {
                    revealSecret();
                  }
                }}
              >
                <View style={styles.paperHandle} />
                <Text style={styles.paperText}>
                  {IS_WEB ? getTranslation("clickReveal") : getTranslation("reveal")}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>

        <NeonButton 
          title={getTranslation("gotIt")} 
          onPress={closeReveal} 
          color={COLORS.success} 
          style={{ marginTop: 40, opacity: isRevealed ? 1 : 0 }} 
          disabled={!isRevealed}
        />
      </ReAnimated.View>
    );
  };

  const renderLobby = () => (
    <ReAnimated.View entering={FadeIn} style={styles.container}>
      <PhaseIndicator phase="LOBBY" />
      <Text style={styles.title}>{getTranslation("play")}</Text>
      <Text style={styles.instruction}>
        {getTranslation("starts")}
        <Text style={{ color: COLORS.primary }}>{gamePlayers[startingPlayerIndex].name}</Text>
      </Text>
      <View style={styles.cardBox}>
        <Text style={styles.description}>{getTranslation("instructions")}</Text>
      </View>
      <NeonButton title={getTranslation("voteChoice")} onPress={() => useGameStore.setState({ currentPhase: "VOTING_CHOICE" })} />
    </ReAnimated.View>
  );

  const renderVotingPhase = () => {
    const isAgreement = currentPhase === "VOTING_AGREEMENT";
    const voter = !isAgreement ? gamePlayers[currentPlayerIndex] : null;
    const data = !isAgreement ? gamePlayers.filter(p => p.id !== voter?.id) : gamePlayers;

    return (
      <ReAnimated.View entering={FadeIn} style={styles.container}>
        <PhaseIndicator phase="VOTING" />
        <Text style={styles.title}>{getTranslation("voteChoice")}</Text>
        {voter && (
          <Text style={styles.instruction}>
            {getTranslation("voter")}<Text style={{ color: COLORS.primary }}>{voter.name}</Text>
          </Text>
        )}
        <Text style={styles.description}>{getTranslation("selectSuspect")} ({selectedSuspects.length})</Text>
        <Text style={[styles.description, { marginTop: -15, marginBottom: 15, fontSize: 14 }]}>
          {getTranslation("atLeast")}
        </Text>
        
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={styles.listContainer}
          data={data}
          numColumns={IS_WEB ? (width > 800 ? 3 : 2) : 1}
          key={IS_WEB ? (width > 800 ? 'web-3' : 'web-2') : 'mobile'}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isSelected = selectedSuspects.includes(item.id);
            const playerColor = NEON_COLORS[parseInt(item.id) % NEON_COLORS.length];
            return (
              <TouchableOpacity
                style={[styles.playerBtn, isSelected && { borderColor: COLORS.primary, borderWidth: 3 }]}
                onPress={() => toggleSuspect(item.id)}
              >
                <View style={[styles.colorIndicatorSmall, { backgroundColor: playerColor }]} />
                <Text style={styles.playerBtnText}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <NeonButton 
          title={getTranslation("confirm")} 
          onPress={() => {
            if (isAgreement) {
              submitAgreement(selectedSuspects);
            } else {
              submitVote(voter!.id, selectedSuspects);
            }
            setSelectedSuspects([]);
          }} 
          style={{ marginTop: 20 }}
        />
      </ReAnimated.View>
    );
  };

  const renderResult = () => {
    const voteCounts: Record<string, number> = {};
    Object.values(votes).forEach((ids) => ids.forEach(id => { voteCounts[id] = (voteCounts[id] || 0) + 1; }));

    const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const impostorsCount = useGameStore.getState().impostorsCount;
    
    const topVotedIds = sortedVotes.slice(0, impostorsCount).map(entry => entry[0]);
    const threshold = gamePlayers.length - impostorsCount;

    const isAgreement = votes["agreement"] !== undefined;
    let isSuccess = false;
    if (isAgreement) {
      const agreedIds = votes["agreement"];
      isSuccess = agreedIds.length === impostorsCount && agreedIds.every(id => gamePlayers.find(p => p.id === id)?.role === 'IMPOSTOR');
    } else {
      const allTopAreImpostors = topVotedIds.length === impostorsCount && topVotedIds.every(id => gamePlayers.find(p => p.id === id)?.role === 'IMPOSTOR');
      const allMeetThreshold = topVotedIds.length === impostorsCount && topVotedIds.every(id => (voteCounts[id] || 0) >= threshold);
      isSuccess = allTopAreImpostors && allMeetThreshold;
    }

    const suspects = gamePlayers.filter(p => p.role === "IMPOSTOR");
    const votedPlayers = gamePlayers.filter(p => (isAgreement ? votes["agreement"] : topVotedIds).includes(p.id));
    const secretWord = gamePlayers.find(p => p.role === "CIVILIAN")?.secret || "";

    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <ReAnimated.View entering={FadeIn} style={{ width: '100%', alignItems: 'center' }}>
          <Text style={styles.title}>{voteAttempt === 2 ? getTranslation("finalResult") : getTranslation("results")}</Text>
          <NeonPulsingView color={isSuccess ? COLORS.success : COLORS.secondary} style={styles.statusBox}>
            <Text style={[styles.suspectTitle, { color: isSuccess ? COLORS.success : COLORS.secondary }]}>
              {isSuccess ? getTranslation("success") : getTranslation("fail")}
            </Text>
            {isSuccess && votedPlayers.map(vp => (
              <View key={vp.id} style={styles.resultItem}>
                <Text style={[styles.resultText, { color: COLORS.success }]}>
                  {vp.name.toUpperCase()}
                </Text>
                <Text style={styles.caughtText}>{getTranslation('caught')}</Text>
              </View>
            ))}
          </NeonPulsingView>

          {!isSuccess && voteAttempt === 1 && !isAgreement ? (
            <NeonButton title={getTranslation("discussAgain")} onPress={tryAgain} color={COLORS.secondary} />
          ) : (
            <>
              <View style={styles.wordRevealBox}>
                <Text style={styles.roleLabel}>{getTranslation("secretWordLabel")}</Text>
                <Text 
                  style={styles.secretWordLarge}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.4}
                >
                  {secretWord.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.suspectTitle}>{getTranslation("impostorsWere")}</Text>
              {suspects.map(p => (
                <View key={p.id} style={styles.impostorCard}>
                  <Text style={styles.suspectName}>{p.name}</Text>
                </View>
              ))}
              <View style={styles.endActions}>
                <NeonButton title={getTranslation("playAgain")} onPress={() => startGame(wordData)} />
                <TouchableOpacity onPress={resetGame} style={styles.menuBtn}>
                  <Text style={styles.menuBtnText}>{getTranslation("menu")}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ReAnimated.View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (currentPhase) {
      case "LANG_SELECT": return renderLangSelect();
      case "MODE_SELECT": return renderModeSelect();
      case "PLAYER_SETUP": return renderPlayerSetup();
      case "REVEAL": return renderReveal();
      case "LOBBY": return renderLobby();
      case "VOTING_CHOICE": 
        return (
          <ReAnimated.View entering={FadeIn} style={styles.container}>
            <Text style={styles.title}>{getTranslation("voteChoice")}</Text>
            <NeonButton title={getTranslation("agreement")} onPress={() => chooseVotingMethod("AGREEMENT")} color={COLORS.success} />
            <NeonButton title={getTranslation("secret")} onPress={() => chooseVotingMethod("SECRET")} color={COLORS.secondary} />
          </ReAnimated.View>
        );
      case "VOTING_AGREEMENT":
      case "VOTING_SECRET": return renderVotingPhase();
      case "RESULT": return renderResult();
      default: return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={splashImg} style={styles.splashBackground} resizeMode="cover">
        <View style={[styles.mainOverlay, { paddingTop: insets.top }]}>
          {renderContent()}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  mainOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  resultContainer: { paddingVertical: 40, paddingHorizontal: 25, alignItems: "center" },
  
  pulsingBox: {
    borderWidth: 1.5,
    borderRadius: 25,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  neonBtn: {
    paddingVertical: 18,
    borderRadius: 20,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  
  title: { fontSize: 40, fontWeight: "900", color: COLORS.primary, marginBottom: 10, textAlign: "center", fontFamily: FONT_FAMILY, textShadowColor: COLORS.primary, textShadowRadius: 15 },
  subtitle: { fontSize: 18, color: COLORS.textSecondary, marginBottom: 30, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" },
  btnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 20, letterSpacing: 1.5, textAlign: "center" },
  instruction: { fontSize: 22, color: COLORS.text, textAlign: "center", marginBottom: 30, fontWeight: "800" },
  description: { fontSize: 18, color: COLORS.textSecondary, textAlign: "center", lineHeight: 26, marginBottom: 20 },

  progressContainer: { flexDirection: 'row', gap: 12, marginBottom: 40, marginTop: 20 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)' },

  inputRow: { flexDirection: "row", marginBottom: 25, width: "100%", gap: 12 },
  input: { flex: 1, backgroundColor: 'transparent', color: COLORS.text, padding: 18, borderRadius: 15, fontSize: 18, borderWidth: 1, borderColor: COLORS.border },
  addBtn: { backgroundColor: COLORS.primary, width: 60, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: "#000", fontSize: 32, fontWeight: "bold" },
  list: { width: "100%", flex: 1 },
  listContainer: { alignItems: 'center', paddingBottom: 20 },
  playerItem: { flexDirection: "row", alignItems: "center", backgroundColor: 'transparent', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  colorIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
  playerName: { flex: 1, color: COLORS.text, fontSize: 18, fontWeight: "bold" },
  removeBtn: { padding: 5 },
  removeText: { color: COLORS.secondary, fontSize: 20, fontWeight: "bold" },

  revealWrapper: { width: width * 0.85, height: width * 0.85, maxWidth: 400, maxHeight: 400, backgroundColor: 'transparent', borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  secretTextContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  paper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.paper,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    borderBottomWidth: 8,
    borderBottomColor: "#DDD",
  },
  paperHandle: {
    width: 80,
    height: 8,
    backgroundColor: "#CCC",
    borderRadius: 4,
    position: "absolute",
    bottom: 25,
  },
  paperText: { fontSize: 24, color: "#333", fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  secretWord: { fontSize: 44, fontWeight: "900", color: COLORS.primary, textAlign: "center", width: '100%', textShadowColor: COLORS.primary, textShadowRadius: 10 },
  roleLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "bold", letterSpacing: 3, marginBottom: 10 },
  roleValue: { fontSize: 32, fontWeight: "900", marginBottom: 20 },
  divider: { width: 50, height: 3, marginBottom: 25 },

  playerBtn: { backgroundColor: 'transparent', padding: 20, borderRadius: 15, marginVertical: 6, width: "100%", maxWidth: 420, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  playerBtnWeb: { width: 250, marginHorizontal: 10 },
  colorIndicatorSmall: { width: 10, height: 10, borderRadius: 5, marginRight: 15 },
  playerBtnText: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },

  statusBox: { marginBottom: 30 },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  resultText: { fontSize: 28, fontWeight: "900" },
  caughtText: { color: COLORS.success, fontWeight: 'bold', fontSize: 12 },
  suspectTitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 3 },
  impostorCard: { backgroundColor: 'transparent', padding: 20, borderRadius: 20, width: "100%", maxWidth: 450, marginBottom: 10, borderWidth: 1, borderColor: COLORS.secondary, alignItems: 'center' },
  suspectName: { fontSize: 20, color: COLORS.text, fontWeight: "bold" },
  wordRevealBox: { backgroundColor: 'transparent', padding: 30, borderRadius: 25, width: "100%", maxWidth: 450, alignItems: "center", marginBottom: 30, borderWidth: 1.5, borderColor: COLORS.primary },
  secretWordLarge: { fontSize: 48, color: COLORS.primary, fontWeight: "900", textAlign: "center", textShadowColor: COLORS.primary, textShadowRadius: 15 },
  endActions: { width: "100%", maxWidth: 450, alignItems: "center", marginTop: 20 },
  menuBtn: { padding: 15 },
  menuBtnText: { color: COLORS.textSecondary, fontSize: 16, textDecorationLine: "underline" },

  splashBackground: { flex: 1 },
  splashOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "space-between", paddingVertical: 60 },
  topTextContainer: { width: "100%", alignItems: "center" },
  splashTitle: { fontSize: 64, fontWeight: "900", color: COLORS.primary, textShadowColor: COLORS.primary, textShadowRadius: 20 },
  bottomLangContainer: { width: "100%", alignItems: "center" },
  verticalBtns: { width: "100%", gap: 10, alignItems: "center" },
  backBtn: { marginTop: 15, padding: 10 },
  backText: { color: COLORS.textSecondary, fontSize: 16, textDecorationLine: "underline" },
  cardBox: { backgroundColor: 'transparent', padding: 25, borderRadius: 25, marginBottom: 30, borderWidth: 1, borderColor: COLORS.border, width: "100%", maxWidth: 450 },
});