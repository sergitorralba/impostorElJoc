import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Animated,
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
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
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
  card: "#121212",
  primary: "#00F3FF", // Neon Cyan
  secondary: "#FF0055", // Neon Pink
  success: "#39FF14", // Neon Green
  warning: "#FFAC1C", // Neon Orange
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  paper: "#F5F5F5",
  border: "#333333",
};

const GLOW = {
  primary: {
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  secondary: {
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  success: {
    textShadowColor: COLORS.success,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
};

const FONT_FAMILY = Platform.select({
  ios: "Arial Rounded MT Bold",
  android: "sans-serif-medium",
  default: "System",
});

export default function GameScreen() {
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
    isChaosMode,
    voteAttempt,
    tryAgain,
  } = useGameStore();

  const [newName, setNewName] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const swipeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerHaptic = (
    type: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
  ) => {
    if (!IS_WEB) {
      Haptics.impactAsync(type);
    }
  };

  const handleAddPlayer = () => {
    if (newName.trim()) {
      handleAddPlayerAction();
    }
  };

  const handleAddPlayerAction = () => {
    addPlayer(newName.trim());
    setNewName("");
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemovePlayer = (index: number) => {
    removePlayer(index);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
  };

  const wordData =
    language === "en"
      ? enData
      : language === "es"
        ? esData
        : language === "ca"
          ? caData
          : nlData;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: swipeAnim } }],
    { useNativeDriver: !IS_WEB },
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }
    if (event.nativeEvent.state === State.END) {
      if (event.nativeEvent.translationY < -80) {
        revealSecret();
      } else {
        setIsRevealed(false);
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: !IS_WEB,
        }).start();
      }
    }
  };

  const revealSecret = () => {
    setIsRevealed(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.timing(swipeAnim, {
      toValue: -height * 0.75,
      duration: 350,
      useNativeDriver: !IS_WEB,
    }).start();
  };

  const closeReveal = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(swipeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: !IS_WEB,
    }).start(() => {
      setIsRevealed(false);
      nextReveal();
    });
  };

  const getTranslation = (key: string) => {
    const t: any = {
      title: {
        en: "THE IMPOSTOR",
        es: "EL IMPOSTOR",
        ca: "L'IMPOSTOR",
        nl: "DE BEDRIEGER",
      },
      start: {
        en: "START GAME",
        es: "EMPEZAR JUEGO",
        ca: "COMENÇAR JOC",
        nl: "START SPEL",
      },
      pass: {
        en: "Pass the phone to: ",
        es: "Pasa el móvil a: ",
        ca: "Passa el mòbil a: ",
        nl: "Geef de telefoon aan: ",
      },
      reveal: {
        en: "Swipe up to lift",
        es: "Desliza para levantar",
        ca: "Llisca per obrir",
        nl: "Veeg om op te lichten",
      },
      clickReveal: {
        en: "Tap to lift the veil",
        es: "Toca para levantar el velo",
        ca: "Toca per aixecar el vel",
        nl: "Tik om de sluier op te lichten",
      },
      gotIt: { en: "GOT IT", es: "¡ENTENDIDO!", ca: "ENTÈS", nl: "BEGREPEN" },
      play: {
        en: "ACTION TIME",
        es: "¡A JUGAR!",
        ca: "A JUGAR!",
        nl: "ACTIETIJD",
      },
      starts: {
        en: "Starts: ",
        es: "Empieza: ",
        ca: "Comença: ",
        nl: "Begint: ",
      },
      instructions: {
        en: "Say 2 rounds of related words.",
        es: "Dad 2 rondas diciendo una palabra relacionada.",
        ca: "Feu 2 rondes dient una paraula relacionada.",
        nl: "Zeg 2 rondes van gerelateerde woorden.",
      },
      voteChoice: {
        en: "VOTING TIME",
        es: "VOTACIÓN",
        ca: "VOTACIÓ",
        nl: "STEMTIJD",
      },
      agreement: {
        en: "PUBLIC VOTE",
        es: "ACUERDO PÚBLICO",
        ca: "ACORD PÚBLIC",
        nl: "OPENBAAR AKKOORD",
      },
      secret: {
        en: "SECRET VOTE",
        es: "VOTO SECRETO",
        ca: "VOTACIÓ SECRETA",
        nl: "GEHEIM STEMMEN",
      },
      who: {
        en: "Who is the imposter?",
        es: "¿Quién es the imposter?",
        ca: "Qui és l'impostor?",
        nl: "Who is the bedrieger?",
      },
      selectSuspect: {
        en: "Select Suspect",
        es: "Selecciona Sospechoso",
        ca: "Selecciona Sospitós",
        nl: "Selecteer verdachte",
      },
      results: {
        en: "VERDICT",
        es: "VEREDICTO",
        ca: "VERDICTE",
        nl: "VERDICT",
      },
      success: {
        en: "THE PLAYERS ACCUSED...",
        es: "LOS JUGADORES ACUSARON A...",
        ca: "ELS JUGADORS HAN ACUSAT A...",
        nl: "DE SPELERS BESCHULDIGDEN...",
      },
      fail: {
        en: "NO AGREEMENT REACHED",
        es: "SIN ACUERDO",
        ca: "SENSE ACORD",
        nl: "GEEN OVEREENSTEMMING",
      },
      discussAgain: {
        en: "DISCUSS AGAIN",
        es: "DISCUTIR DE NUEVO",
        ca: "DISCUTIR DE NOU",
        nl: "OPNIEUW BESPREKEN",
      },
      finalResult: {
        en: "FINAL VERDICT",
        es: "VEREDICTO FINAL",
        ca: "VERDICTE FINAL",
        nl: "EINDVERDICT",
      },
      impostorsWere: {
        en: "IMPOSTORS WERE:",
        es: "LOS IMPOSTORES ERAN:",
        ca: "ELS IMPOSTORS EREN:",
        nl: "DE BEDRIEGERS WAREN:",
      },
      playAgain: {
        en: "PLAY AGAIN",
        es: "JUGAR DE NUEVO",
        ca: "TORNAR A JUGAR",
        nl: "OPNIEUW SPELEN",
      },
      chaos: {
        en: "SYSTEM FAILURE: CHAOS MODE",
        es: "ERROR DEL SISTEMA: MODO CAOS",
        ca: "ERROR DEL SISTEMA: MODE CAOS",
        nl: "SYSTEEMFOUT: CHAOS MODUS",
      },
      bug: {
        en: "SYSTEM BUG: EXTRA IMPOSTOR",
        es: "ERROR: IMPOSTOR EXTRA",
        ca: "ERROR: IMPOSTOR EXTRA",
        nl: "FOUT: EXTRA BEDRIEGER",
      },
      placeholder: {
        en: "Player Name",
        es: "Nombre del jugador",
        ca: "Nom del jugador",
        nl: "Naam van de speler",
      },
      role: {
        en: "YOUR ROLE: ",
        es: "TU ROL: ",
        ca: "EL TEU ROL: ",
        nl: "JE ROL: ",
      },
      civilian: { en: "CIVILIAN", es: "CIVIL", ca: "CIVIL", nl: "BURGER" },
      impostor: {
        en: "IMPOSTOR",
        es: "IMPOSTOR",
        ca: "IMPOSTOR",
        nl: "BEDRIEGER",
      },
      modeLabel: {
        en: "GAME MODE",
        es: "MODO DE JUEGO",
        ca: "MODE DE JOC",
        nl: "SPELMODUS",
      },
      standard: {
        en: "ADULTS",
        es: "ADULTOS",
        ca: "ADULTS",
        nl: "VOLWASSENEN",
      },
      kids: { en: "KIDS", es: "NIÑOS", ca: "PETITS", nl: "KINDEREN" },
      selectLang: {
        en: "CHOOSE LANGUAGE",
        es: "ELIGE IDIOMA",
        ca: "TRIA IDIOMA",
        nl: "KIES TAAL",
      },
      selectMode: {
        en: "SELECT MODE",
        es: "SELECCIONA MODO",
        ca: "SELECCIONA MODE",
        nl: "SELECTEER MODUS",
      },
      setupPlayers: {
        en: "PLAYERS",
        es: "JUGADORES",
        ca: "JUGADORS",
        nl: "SPELERS",
      },
      back: { en: "BACK", es: "ATRÁS", ca: "ENRERE", nl: "TERUG" },
      voter: {
        en: "It is your turn: ",
        es: "Es tu turno: ",
        ca: "És el teu torn: ",
        nl: "Het is jouw beurt: ",
      },
      secretWordLabel: {
        en: "SECRET WORD",
        es: "PALABRA SECRETA",
        ca: "PARAULA SECRETA",
        nl: "GEHEIM WOORD",
      },
      menu: {
        en: "MAIN MENU",
        es: "MENÚ PRINCIPAL",
        ca: "MENÚ PRINCIPAL",
        nl: "HOOFDMENU",
      },
    };
    return t[key][language] || t[key]["en"];
  };

  if (currentPhase === "LANG_SELECT") {
    return (
      <ImageBackground
        source={splashImg}
        style={styles.splashBackground}
        resizeMode="cover"
      >
        <View style={styles.splashOverlay}>
          <StatusBar barStyle="light-content" />
          <View style={styles.topTextContainer}>
            <Text style={styles.splashTitle}>L'impostor</Text>
          </View>

          <View style={styles.bottomLangContainer}>
            <Text style={[styles.subtitle, GLOW.primary]}>
              {getTranslation("selectLang")}
            </Text>
            <View style={styles.verticalBtns}>
              {["en", "es", "ca", "nl"].map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => {
                    triggerHaptic();
                    setLanguage(l as any);
                  }}
                  style={[styles.choiceBtn, { borderColor: COLORS.primary }]}
                >
                  <Text style={styles.btnText}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  if (currentPhase === "MODE_SELECT") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation("title")}</Text>
        <Text style={[styles.subtitle, GLOW.primary]}>
          {getTranslation("selectMode")}
        </Text>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            setGameMode("STANDARD");
          }}
          style={[styles.choiceBtn, { borderColor: COLORS.secondary }]}
        >
          <Text style={styles.btnText}>{getTranslation("standard")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            setGameMode("KIDS");
          }}
          style={[styles.choiceBtn, { borderColor: COLORS.success }]}
        >
          <Text style={styles.btnText}>{getTranslation("kids")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            useGameStore.setState({ currentPhase: "LANG_SELECT" });
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>{getTranslation("back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === "PLAYER_SETUP") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation("setupPlayers")}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder={getTranslation("placeholder")}
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="done"
            onSubmitEditing={handleAddPlayer}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          style={styles.list}
          data={players}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.playerItem}>
              <Text style={styles.playerName}>{item}</Text>
              <TouchableOpacity
                onPress={() => handleRemovePlayer(index)}
                style={styles.removeBtn}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {players.length >= 3 && (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
              startGame(wordData);
            }}
          >
            <Text style={styles.btnText}>{getTranslation("start")}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            useGameStore.setState({ currentPhase: "MODE_SELECT" });
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>{getTranslation("back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === "REVEAL") {
    const currentPlayer = gamePlayers[currentPlayerIndex];
    const isImpostor = currentPlayer.role === "IMPOSTOR";
    const roleText = isImpostor
      ? getTranslation("impostor")
      : getTranslation("civilian");
    const roleColor = isImpostor ? COLORS.secondary : COLORS.success;
    const roleGlow = isImpostor ? GLOW.secondary : GLOW.success;

    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>
          {getTranslation("pass")}
          <Text
            style={[
              { color: COLORS.primary, fontWeight: "bold" },
              GLOW.primary,
            ]}
          >
            {currentPlayer.name}
          </Text>
        </Text>
        <View style={styles.revealContainer}>
          <View style={styles.secretTextContainer}>
            <Text style={styles.roleLabel}>{getTranslation("role")}</Text>
            <Text style={[styles.roleValue, { color: roleColor }, roleGlow]}>
              {roleText}
            </Text>
            <View style={[styles.divider, { backgroundColor: roleColor }]} />
            <Text
              style={[
                styles.secretWord,
                { color: COLORS.primary },
                GLOW.primary,
              ]}
            >
              {currentPlayer.secret.toUpperCase()}
            </Text>
          </View>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            activeOffsetY={[-10, 10]}
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
                  {IS_WEB
                    ? getTranslation("clickReveal")
                    : getTranslation("reveal")}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {isRevealed && (
          <TouchableOpacity style={styles.nextBtn} onPress={closeReveal}>
            <Text style={styles.btnText}>{getTranslation("gotIt")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (currentPhase === "LOBBY") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation("play")}</Text>
        <Text style={styles.instruction}>
          {getTranslation("starts")}
          <Text
            style={[
              { color: COLORS.primary, fontWeight: "bold" },
              GLOW.primary,
            ]}
          >
            {gamePlayers[startingPlayerIndex].name}
          </Text>
        </Text>
        <View style={styles.cardBox}>
          <Text style={styles.description}>
            {getTranslation("instructions")}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => {
            triggerHaptic();
            useGameStore.setState({ currentPhase: "VOTING_CHOICE" });
          }}
        >
          <Text style={styles.btnText}>{getTranslation("voteChoice")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === "VOTING_CHOICE") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation("voteChoice")}</Text>
        <TouchableOpacity
          style={[styles.choiceBtn, { borderColor: COLORS.success }]}
          onPress={() => {
            triggerHaptic();
            chooseVotingMethod("AGREEMENT");
          }}
        >
          <Text style={styles.btnText}>{getTranslation("agreement")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceBtn, { borderColor: COLORS.secondary }]}
          onPress={() => {
            triggerHaptic();
            chooseVotingMethod("SECRET");
          }}
        >
          <Text style={styles.btnText}>{getTranslation("secret")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === "VOTING_AGREEMENT") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation("voteChoice")}</Text>
        <Text style={styles.instruction}>
          {getTranslation("selectSuspect")}
        </Text>
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={{ alignItems: "center" }}
          data={gamePlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playerBtn}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                submitAgreement(item.id);
              }}
            >
              <Text style={styles.playerBtnText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (currentPhase === "VOTING_SECRET") {
    const voter = gamePlayers[currentPlayerIndex];
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>
          {getTranslation("voter")}
          <Text style={[{ color: COLORS.primary }, GLOW.primary]}>
            {voter.name}
          </Text>
        </Text>
        <Text style={styles.description}>{getTranslation("who")}</Text>
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={{ alignItems: "center" }}
          data={gamePlayers.filter((p) => p.id !== voter.id)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playerBtn}
              onPress={() => {
                triggerHaptic();
                submitVote(voter.id, item.id);
              }}
            >
              <Text style={styles.playerBtnText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (currentPhase === "RESULT") {
    const voteCounts: Record<string, number> = {};
    Object.values(votes).forEach((id) => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });

    const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const topVotes = sortedVotes[0]?.[1] || 0;
    const topVotedId = sortedVotes[0]?.[0];

    const isAgreement = votes["agreement"] !== undefined;
    const isSuccess =
      isAgreement ||
      (voteAttempt === 1
        ? topVotes >= gamePlayers.length - 1
        : topVotes > gamePlayers.length / 2);

    const suspects = gamePlayers.filter((p) => p.role === "IMPOSTOR");
    const votedPlayer = gamePlayers.find(
      (p) => p.id === (isAgreement ? votes["agreement"] : topVotedId),
    );

    const secretWord =
      gamePlayers.find((p) => p.role === "CIVILIAN")?.secret || "";

    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Text style={styles.title}>
          {voteAttempt === 2
            ? getTranslation("finalResult")
            : getTranslation("results")}
        </Text>

        <View
          style={[
            styles.statusBox,
            { borderColor: isSuccess ? COLORS.success : COLORS.secondary },
          ]}
        >
          <Text
            style={[
              styles.suspectTitle,
              {
                marginBottom: 10,
                color: isSuccess ? COLORS.success : COLORS.secondary,
              },
              isSuccess ? GLOW.success : GLOW.secondary,
            ]}
          >
            {isSuccess ? getTranslation("success") : getTranslation("fail")}
          </Text>
          {isSuccess && votedPlayer && (
            <Text
              style={[
                styles.resultText,
                { fontSize: 36, marginTop: 5 },
                isSuccess ? GLOW.success : GLOW.secondary,
              ]}
            >
              {votedPlayer.name.toUpperCase()}
            </Text>
          )}
        </View>

        {!isSuccess && voteAttempt === 1 ? (
          <TouchableOpacity
            style={styles.discussBtn}
            onPress={() => {
              triggerHaptic();
              tryAgain();
            }}
          >
            <Text style={styles.btnText}>{getTranslation("discussAgain")}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.wordRevealBox}>
              <Text style={styles.roleLabel}>
                {getTranslation("secretWordLabel")}
              </Text>
              <Text style={[styles.secretWordLarge, GLOW.primary]}>
                {secretWord.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.suspectTitle}>
              {getTranslation("impostorsWere")}
            </Text>
            {suspects.map((p) => (
              <View
                key={p.id}
                style={[styles.impostorCard, { borderColor: COLORS.secondary, justifyContent: 'center' }]}
              >
                <Text style={styles.suspectName}>{p.name}</Text>
              </View>
            ))}

            {isChaosMode ? (
              <Text style={[styles.chaosAlert, GLOW.secondary]}>
                {getTranslation("chaos")}
              </Text>
            ) : (
              suspects.length > (gamePlayers.length >= 7 ? 2 : 1) && (
                <Text style={[styles.chaosAlert, GLOW.secondary]}>
                  {getTranslation("bug")}
                </Text>
              )
            )}

            <View style={styles.endActions}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                  startGame(wordData);
                }}
              >
                <Text style={styles.btnText}>
                  {getTranslation("playAgain")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  triggerHaptic();
                  resetGame();
                }}
              >
                <Text style={styles.menuBtnText}>{getTranslation("menu")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  resultContainer: {
    paddingVertical: 50,
    paddingHorizontal: 25,
    backgroundColor: COLORS.background,
    alignItems: "center",
    minHeight: height,
  },
  title: {
    fontSize: 44,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 15,
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: FONT_FAMILY,
  },
  subtitle: {
    fontSize: 22,
    color: COLORS.textSecondary,
    marginBottom: 35,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: FONT_FAMILY,
  },
  verticalBtns: { width: "100%", gap: 15, alignItems: "center" },
  inputRow: { flexDirection: "row", marginBottom: 25, width: "100%", gap: 12 },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    padding: 22,
    borderRadius: 20,
    fontSize: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontFamily: FONT_FAMILY,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 75,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 36, fontWeight: "bold" },
  list: { width: "100%", maxHeight: 350, marginBottom: 25 },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  playerName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: FONT_FAMILY,
  },
  removeBtn: { justifyContent: "center", alignItems: "center", padding: 5 },
  removeText: { color: COLORS.secondary, fontSize: 22, fontWeight: "bold" },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 24,
    borderRadius: 25,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  choiceBtn: {
    backgroundColor: COLORS.card,
    paddingVertical: 22,
    borderRadius: 25,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  backBtn: { marginTop: 25, padding: 15 },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  discussBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 24,
    borderRadius: 25,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    marginTop: 25,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 1.5,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
  },
  instruction: {
    fontSize: 26,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 35,
    width: "100%",
    fontWeight: "800",
    fontFamily: FONT_FAMILY,
    paddingHorizontal: 10,
  },
  revealContainer: {
    width: width * 0.9,
    height: width * 0.9,
    maxWidth: 420,
    maxHeight: 420,
    backgroundColor: "#050505",
    borderRadius: 40,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  secretTextContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  secretWord: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
  },
  roleLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 4,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  roleValue: {
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 25,
    letterSpacing: 4,
    fontFamily: FONT_FAMILY,
  },
  divider: { width: 70, height: 4, marginBottom: 30, borderRadius: 2 },
  paper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.paper,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    borderBottomWidth: 10,
    borderBottomColor: "#DDD",
  },
  paperHandle: {
    width: 120,
    height: 12,
    backgroundColor: "#CCC",
    borderRadius: 6,
    position: "absolute",
    bottom: 35,
  },
  paperText: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontFamily: FONT_FAMILY,
  },
  nextBtn: {
    backgroundColor: COLORS.success,
    padding: 24,
    borderRadius: 25,
    marginTop: 40,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  description: {
    fontSize: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 15,
    width: "100%",
    lineHeight: 28,
    fontWeight: "600",
    paddingHorizontal: 20,
  },
  cardBox: {
    backgroundColor: COLORS.card,
    padding: 30,
    borderRadius: 30,
    marginVertical: 30,
    borderWidth: 2,
    borderColor: COLORS.border,
    width: "100%",
    maxWidth: 450,
  },
  playerBtn: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 25,
    marginVertical: 8,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  playerBtnText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: FONT_FAMILY,
  },
  statusBox: {
    padding: 30,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    width: "100%",
    maxWidth: 450,
    marginBottom: 40,
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  resultText: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    color: COLORS.text,
    fontFamily: FONT_FAMILY,
  },
  suspectTitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 3,
    fontWeight: "bold",
  },
  impostorCard: {
    backgroundColor: COLORS.card,
    padding: 25,
    borderRadius: 25,
    width: "100%",
    maxWidth: 450,
    marginBottom: 15,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suspectName: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: "bold",
    fontFamily: FONT_FAMILY,
  },
  suspectSecret: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    fontFamily: FONT_FAMILY,
  },
  chaosAlert: {
    fontSize: 30,
    fontWeight: "900",
    marginTop: 40,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
  },
  wordRevealBox: {
    backgroundColor: COLORS.card,
    padding: 35,
    borderRadius: 30,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  secretWordLarge: {
    fontSize: 58,
    color: COLORS.primary,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
  },
  endActions: {
    width: "100%",
    maxWidth: 450,
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  menuBtn: { padding: 20 },
  menuBtnText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
    textDecorationLine: "underline",
    fontFamily: FONT_FAMILY,
  },
  splashBackground: { flex: 1, width: "100%", height: "100%" },
  splashOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  topTextContainer: { width: "100%", alignItems: "center" },
  splashTitle: {
    fontSize: 64,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    fontFamily: FONT_FAMILY,
  },
  bottomLangContainer: { width: "100%", alignItems: "center" },
});