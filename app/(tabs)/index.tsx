import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, ScrollView, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { useGameStore, Player } from '../../store/useGameStore';
import enData from '../../data/en.json';
import esData from '../../data/es.json';
import caData from '../../data/ca.json';
import nlData from '../../data/nl.json';
import { PanGestureHandler, State, TouchableOpacity } from 'react-native-gesture-handler';

const { height, width } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

const COLORS = {
  background: '#121212',
  card: '#1E1E1E',
  primary: '#0A84FF',
  secondary: '#FF375F',
  success: '#32D74B',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  paper: 'rgba(240, 240, 240, 0.95)',
  border: '#333333',
};

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
    startingPlayerIndex,
    chooseVotingMethod,
    submitVote,
    submitAgreement,
    votes,
    resetGame,
    isChaosMode,
    voteAttempt,
    tryAgain
  } = useGameStore();

  const [newName, setNewName] = useState('');
  const [isPeeking, setIsPeeking] = useState(false);
  const swipeAnim = React.useRef(new Animated.Value(0)).current;

  const handleAddPlayer = () => {
    if (newName.trim()) {
      addPlayer(newName.trim());
      setNewName('');
    }
  };

  const wordData = language === 'en' ? enData : (language === 'es' ? esData : (language === 'ca' ? caData : nlData));

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: swipeAnim } }],
    { useNativeDriver: !IS_WEB }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (event.nativeEvent.translationY < -150) {
        setIsPeeking(true);
        Animated.timing(swipeAnim, {
          toValue: -height * 0.7,
          duration: 300,
          useNativeDriver: !IS_WEB,
        }).start();
      } else {
        setIsPeeking(false);
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: !IS_WEB,
        }).start();
      }
    }
  };

  const closeReveal = () => {
    Animated.timing(swipeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: !IS_WEB,
    }).start(() => {
      setIsPeeking(false);
      nextReveal();
    });
  };

  const getTranslation = (key: string) => {
    const t: any = {
      title: { en: 'THE IMPOSTOR', es: 'EL IMPOSTOR', ca: 'L\'IMPOSTOR', nl: 'DE BEDRIEGER' },
      start: { en: 'START GAME', es: 'EMPEZAR JUEGO', ca: 'COMENÇAR JOC', nl: 'START SPEL' },
      pass: { en: 'Pass the phone to: ', es: 'Pasa el móvil a: ', ca: 'Passa el mòbil a: ', nl: 'Geef de telefoon aan: ' },
      reveal: { en: 'Swipe up to lift the veil', es: 'Desliza para levantar el velo', ca: 'Glissa per aixecar el vel', nl: 'Veeg om de sluier op te lichten' },
      gotIt: { en: 'I UNDERSTAND', es: 'LO ENTIENDO', ca: 'HO ENTENC', nl: 'IK BEGRIJP HET' },
      play: { en: 'ACTION TIME', es: '¡A JUGAR!', ca: 'A JUGAR!', nl: 'ACTIETIJD' },
      starts: { en: 'Starts: ', es: 'Empieza: ', ca: 'Comença: ', nl: 'Begint: ' },
      instructions: { en: 'Say 2 rounds of related words.', es: 'Dad 2 vueltas diciendo una palabra relacionada.', ca: 'Feu 2 voltes dient una paraula relacionada.', nl: 'Zeg 2 rondes van gerelateerde woorden.' },
      voteChoice: { en: 'DECISION METHOD', es: 'MÉTODO DE DECISIÓN', ca: 'MÈTODE DE DECISIÓ', nl: 'BESLISSINGSMETHODE' },
      agreement: { en: 'PUBLIC AGREEMENT', es: 'ACUERDO PÚBLICO', ca: 'ACORD PÚBLIC', nl: 'OPENBAAR AKKOORD' },
      secret: { en: 'SECRET BALLOT', es: 'VOTACIÓN SECRETA', ca: 'VOTACIÓ SECRETA', nl: 'GEHEIM STEMMEN' },
      who: { en: ', who is the imposter?', es: ', ¿quién es el impostor?', ca: ', qui és l\'impostor?', nl: ', wie is de bedrieger?' },
      selectSuspect: { en: 'Select the Suspect', es: 'Selecciona al Sospechoso', ca: 'Selecciona el Sospitós', nl: 'Selecteer de verdachte' },
      results: { en: 'TERMINATED', es: 'RESULTADOS', ca: 'RESULTATS', nl: 'RESULTATEN' },
      success: { en: 'IMPOSTOR IDENTIFIED', es: 'IMPOSTOR IDENTIFICADO', ca: 'IMPOSTOR IDENTIFICAT', nl: 'BEDRIEGER GEIDENTIFICEERD' },
      fail: { en: 'NO CONSENSUS (-1)', es: 'SIN ACUERDO UNÁNIME (-1)', ca: 'SENSE ACORD UNÀNIME (-1)', nl: 'GEEN OVERNAME (-1)' },
      discussAgain: { en: 'DISCUSS AGAIN', es: 'DISCUTIR DE NUEVO', ca: 'DISCUTIR DE NOU', nl: 'OPNIEUW BESPREKEN' },
      finalResult: { en: 'FINAL VERDICT', es: 'VEREDICTO FINAL', ca: 'VERDICTE FINAL', nl: 'EINDVERDICT' },
      impostorsWere: { en: 'IMPOSTORS WERE:', es: 'LOS IMPOSTORES ERAN:', ca: 'ELS IMPOSTORS EREN:', nl: 'DE BEDRIEGERS WAREN:' },
      playAgain: { en: 'REBOOT SESSION', es: 'REINICIAR SESIÓN', ca: 'REINICIAR SESSIÓ', nl: 'SESSIE HERSTARTEN' },
      chaos: { en: 'SYSTEM FAILURE: CHAOS MODE', es: 'ERROR DEL SISTEMA: MODO CAOS', ca: 'ERROR DEL SISTEMA: MODE CAOS', nl: 'SYSTEEMFOUT: CHAOS MODUS' },
      role: { en: 'YOUR ROLE: ', es: 'TU ROL: ', ca: 'EL TEU ROL: ', nl: 'JE ROL: ' },
      civilian: { en: 'CIVILIAN', es: 'CIVIL', ca: 'CIVIL', nl: 'BURGER' },
      impostor: { en: 'IMPOSTOR', es: 'IMPOSTOR', ca: 'IMPOSTOR', nl: 'BEDRIEGER' },
      placeholder: { en: 'Subject Name', es: 'Nombre del sujeto', ca: 'Nom del subjecte', nl: 'Naam van het onderwerp' }
    };
    return t[key][language] || t[key]['en'];
  };

  if (currentPhase === 'SETUP') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.title}>{getTranslation('title')}</Text>
        <View style={styles.langSwitch}>
          {['en', 'es', 'ca', 'nl'].map((l) => (
            <TouchableOpacity key={l} onPress={() => setLanguage(l as any)} style={[styles.langBtn, language === l && styles.activeLang]}>
              <Text style={[styles.langText, language === l && styles.activeLangText]}>{l.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder={getTranslation('placeholder')} placeholderTextColor={COLORS.textSecondary}/>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
        </View>
        <FlatList style={styles.list} data={players} keyExtractor={(_, index) => index.toString()} renderItem={({ item, index }) => (
          <View style={styles.playerItem}>
            <Text style={styles.playerName}>{item}</Text>
            <TouchableOpacity onPress={() => removePlayer(index)}><Text style={styles.removeText}>✕</Text></TouchableOpacity>
          </View>
        )}/>
        {players.length >= 3 && (
          <TouchableOpacity style={styles.startBtn} onPress={() => startGame(wordData)}>
            <Text style={styles.btnText}>{getTranslation('start')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (currentPhase === 'REVEAL') {
    const currentPlayer = gamePlayers[currentPlayerIndex];
    const roleText = currentPlayer.role === 'IMPOSTOR' ? getTranslation('impostor') : getTranslation('civilian');
    const roleColor = currentPlayer.role === 'IMPOSTOR' ? COLORS.secondary : COLORS.success;

    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>{getTranslation('pass')}<Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{currentPlayer.name}</Text></Text>
        <View style={styles.revealContainer}>
          <View style={styles.secretTextContainer}>
            <Text style={styles.roleLabel}>{getTranslation('role')}</Text>
            <Text style={[styles.roleValue, { color: roleColor }]}>{roleText}</Text>
            <View style={styles.divider} />
            <Text style={styles.secretWord}>{currentPlayer.secret.toUpperCase()}</Text>
          </View>
          <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
            <Animated.View style={[styles.paper, { transform: [{ translateY: swipeAnim }] }]}>
              <View style={styles.paperHandle} /><Text style={styles.paperText}>{getTranslation('reveal')}</Text>
            </Animated.View>
          </PanGestureHandler>
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={closeReveal}>
          <Text style={styles.btnText}>{getTranslation('gotIt')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === 'LOBBY') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation('play')}</Text>
        <Text style={styles.instruction}>{getTranslation('starts')}<Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{gamePlayers[startingPlayerIndex].name}</Text></Text>
        <Text style={styles.description}>{getTranslation('instructions')}</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => useGameStore.setState({ currentPhase: 'VOTING_CHOICE' })}>
          <Text style={styles.btnText}>{getTranslation('voteChoice')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === 'VOTING_CHOICE') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTranslation('voteChoice')}</Text>
        <TouchableOpacity style={styles.choiceBtn} onPress={() => chooseVotingMethod('AGREEMENT')}>
          <Text style={styles.btnText}>{getTranslation('agreement')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceBtn} onPress={() => chooseVotingMethod('SECRET')}>
          <Text style={styles.btnText}>{getTranslation('secret')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentPhase === 'VOTING_AGREEMENT') {
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>{getTranslation('selectSuspect')}</Text>
        <FlatList data={gamePlayers} keyExtractor={(item) => item.id} renderItem={({ item }) => (
          <TouchableOpacity style={styles.playerBtn} onPress={() => submitAgreement(item.id)}>
            <Text style={styles.playerBtnText}>{item.name}</Text>
          </TouchableOpacity>
        )}/>
      </View>
    );
  }

  if (currentPhase === 'VOTING_SECRET') {
    const voter = gamePlayers[currentPlayerIndex];
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>{getTranslation('pass')}<Text style={{color: COLORS.primary}}>{voter.name}</Text></Text>
        <Text style={styles.description}>{getTranslation('who')}</Text>
        <FlatList data={gamePlayers.filter(p => p.id !== voter.id)} keyExtractor={(item) => item.id} renderItem={({ item }) => (
          <TouchableOpacity style={styles.playerBtn} onPress={() => submitVote(voter.id, item.id)}>
            <Text style={styles.playerBtnText}>{item.name}</Text>
          </TouchableOpacity>
        )}/>
      </View>
    );
  }

  if (currentPhase === 'RESULT') {
    const voteCounts: Record<string, number> = {};
    Object.values(votes).forEach(id => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });

    const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const topVotes = sortedVotes[0]?.[1] || 0;
    const topVotedId = sortedVotes[0]?.[0];
    
    // Logic: If agreement, votes has 1 entry 'agreement'. If secret, check U-1 or Majority.
    const isAgreement = votes['agreement'] !== undefined;
    const isSuccess = isAgreement || (voteAttempt === 1 ? topVotes >= gamePlayers.length - 1 : topVotes > gamePlayers.length / 2);

    const suspects = gamePlayers.filter(p => p.role === 'IMPOSTOR');
    const votedPlayer = gamePlayers.find(p => p.id === (isAgreement ? votes['agreement'] : topVotedId));

    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Text style={styles.title}>{voteAttempt === 2 ? getTranslation('finalResult') : getTranslation('results')}</Text>
        
        <View style={styles.statusBox}>
           <Text style={[styles.resultText, { color: isSuccess ? COLORS.success : COLORS.secondary }]}>
            {isSuccess ? getTranslation('success') : getTranslation('fail')}
          </Text>
          {votedPlayer && <Text style={{color: COLORS.text, marginTop: 10, fontSize: 18}}>{votedPlayer.name}</Text>}
        </View>

        {!isSuccess && voteAttempt === 1 ? (
          <TouchableOpacity style={styles.discussBtn} onPress={tryAgain}>
            <Text style={styles.btnText}>{getTranslation('discussAgain')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.suspectTitle}>{getTranslation('impostorsWere')}</Text>
            {suspects.map(p => (
               <View key={p.id} style={styles.impostorCard}>
                 <Text style={styles.suspectName}>{p.name}</Text>
                 <Text style={styles.suspectSecret}>{p.secret.toUpperCase()}</Text>
               </View>
            ))}
            {isChaosMode && <Text style={styles.chaosAlert}>{getTranslation('chaos')}</Text>}
            <TouchableOpacity style={[styles.startBtn, { marginTop: 40 }]} onPress={resetGame}>
              <Text style={styles.btnText}>{getTranslation('playAgain')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  resultContainer: { padding: 30, backgroundColor: COLORS.background, alignItems: 'center', minHeight: height },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 30, letterSpacing: 2, textAlign: 'center' },
  langSwitch: { flexDirection: 'row', marginBottom: 30, gap: 10 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 },
  activeLang: { borderColor: COLORS.primary, backgroundColor: 'rgba(10, 132, 255, 0.1)' },
  langText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  activeLangText: { color: COLORS.primary },
  inputRow: { flexDirection: 'row', marginBottom: 20, width: '100%' },
  input: { flex: 1, backgroundColor: COLORS.card, color: COLORS.text, padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
  addBtn: { backgroundColor: COLORS.primary, width: 50, marginLeft: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  list: { width: '100%', maxHeight: 200 },
  playerItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  playerName: { color: COLORS.text, fontSize: 16 },
  removeText: { color: COLORS.secondary, fontSize: 18 },
  startBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 15, width: '100%', maxWidth: 400, alignItems: 'center' },
  choiceBtn: { backgroundColor: COLORS.card, paddingVertical: 18, borderRadius: 15, width: '100%', maxWidth: 400, alignItems: 'center', marginVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  discussBtn: { backgroundColor: COLORS.secondary, paddingVertical: 18, borderRadius: 15, width: '100%', maxWidth: 400, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  instruction: { fontSize: 22, color: COLORS.text, textAlign: 'center', marginBottom: 20, width: '100%' },
  revealContainer: { width: width * 0.85, height: width * 0.85, maxWidth: 400, maxHeight: 400, backgroundColor: '#000', borderRadius: 30, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  secretTextContainer: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  secretWord: { color: COLORS.primary, fontSize: 44, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  roleLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  roleValue: { fontSize: 32, fontWeight: '900', marginBottom: 20, letterSpacing: 2 },
  divider: { width: 40, height: 2, backgroundColor: COLORS.border, marginBottom: 20 },
  paper: { position: 'absolute', width: '100%', height: '100%', backgroundColor: COLORS.paper, justifyContent: 'center', alignItems: 'center', padding: 20 },
  paperHandle: { width: 60, height: 6, backgroundColor: '#CCC', borderRadius: 3, position: 'absolute', bottom: 20 },
  paperText: { fontSize: 18, color: '#333', textAlign: 'center', opacity: 0.6 },
  nextBtn: { backgroundColor: COLORS.success, padding: 18, borderRadius: 15, marginTop: 40, width: '100%', maxWidth: 400, alignItems: 'center' },
  description: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, width: '100%' },
  playerBtn: { backgroundColor: COLORS.card, padding: 18, borderRadius: 12, marginVertical: 6, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  playerBtnText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  statusBox: { padding: 20, borderRadius: 15, backgroundColor: COLORS.card, width: '100%', maxWidth: 400, marginBottom: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  resultText: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  suspectTitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 15, textTransform: 'uppercase' },
  impostorCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 15, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: COLORS.secondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suspectName: { fontSize: 20, color: COLORS.text, fontWeight: 'bold' },
  suspectSecret: { fontSize: 14, color: COLORS.secondary, fontWeight: 'bold' },
  chaosAlert: { fontSize: 24, color: COLORS.secondary, fontWeight: '900', marginTop: 30, textAlign: 'center' }
});
