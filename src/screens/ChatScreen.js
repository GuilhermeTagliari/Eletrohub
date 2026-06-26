import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Modal,
  Animated, PanResponder, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Bubble individual com suporte a swipe ──────────────────────────────────────
function MessageBubble({ item, sellerName, onSwipeReply, colors }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const me = item.fromMe;

  // Refs para evitar closure estática no PanResponder (criado uma única vez)
  const cbRef = useRef({ item, onSwipeReply });
  cbRef.current = { item, onSwipeReply };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Reclama o gesto se for majoritariamente horizontal para a direita
      onMoveShouldSetPanResponder: (_, g) =>
        g.dx > 10 && g.dx > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dx > 10 && g.dx > Math.abs(g.dy) * 1.2,
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) translateX.setValue(Math.min(g.dx, 72));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 38) cbRef.current.onSwipeReply(cbRef.current.item);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
      },
    })
  ).current;

  const iconOpacity = translateX.interpolate({
    inputRange: [0, 30, 72],
    outputRange: [0, 0.4, 1],
    extrapolate: 'clamp',
  });

  const bs = useMemo(() => makeBubbleStyles(colors), [colors]);

  // Citação da mensagem respondida
  const replyQuote = item.replyTo ? (
    <View style={[bs.replyQuote, me ? bs.replyQuoteMe : bs.replyQuoteThem]}>
      <Text style={[bs.replyAuthor, { color: me ? 'rgba(255,255,255,0.9)' : colors.info }]}>
        {item.replyTo.fromMe ? 'Você' : (sellerName || 'Vendedor')}
      </Text>
      <Text style={[bs.replyText, { color: me ? 'rgba(255,255,255,0.65)' : colors.textMuted }]} numberOfLines={2}>
        {item.replyTo.type === 'image' ? '📷 Foto' : (item.replyTo.text || '')}
      </Text>
    </View>
  ) : null;

  return (
    <View style={bs.row}>
      {/* Ícone de resposta aparece ao arrastar */}
      <Animated.View style={[bs.swipeIcon, { opacity: iconOpacity }]}>
        <Ionicons name="arrow-undo" size={20} color={colors.textMuted} />
      </Animated.View>

      <Animated.View {...panResponder.panHandlers} style={[bs.bubbleWrap, { transform: [{ translateX }] }]}>

        {/* ── Imagem ── */}
        {item.type === 'image' ? (
          <View style={[bs.bubble, me ? bs.bubbleMe : bs.bubbleThem]}>
            {replyQuote}
            <Image source={{ uri: item.imageUri }} style={bs.imageMsg} resizeMode="cover" />
            {!!item.text && (
              <Text style={[bs.text, me ? bs.textMe : bs.textThem, { marginTop: 6 }]}>{item.text}</Text>
            )}
            <Text style={[bs.time, me ? bs.timeMe : bs.timeThem]}>{item.time}</Text>
          </View>

        /* ── Oferta ── */
        ) : item.type === 'offer' ? (
          <View style={[bs.offerBubble, me ? bs.bubbleMe : bs.bubbleThem]}>
            {replyQuote}
            <View style={bs.offerHeader}>
              <Ionicons name="pricetag" size={13} color={me ? 'rgba(255,255,255,0.8)' : colors.warning} />
              <Text style={[bs.offerLabel, { color: me ? 'rgba(255,255,255,0.8)' : colors.warning }]}>
                Proposta de preço
              </Text>
            </View>
            <Text style={[bs.offerValue, me ? bs.textMe : bs.textThem]}>
              {formatBRL(Number(item.offerPrice))}
            </Text>
            {item.offerStatus && (
              <View style={[bs.offerStatus, item.offerStatus === 'accepted' ? bs.offerStatusOk : bs.offerStatusNo]}>
                <Ionicons
                  name={item.offerStatus === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                  size={13}
                  color={item.offerStatus === 'accepted' ? colors.success : colors.danger}
                />
                <Text style={[bs.offerStatusText, { color: item.offerStatus === 'accepted' ? colors.success : colors.danger }]}>
                  {item.offerStatus === 'accepted' ? 'Oferta aceita' : 'Oferta recusada'}
                </Text>
              </View>
            )}
            <Text style={[bs.time, me ? bs.timeMe : bs.timeThem]}>{item.time}</Text>
          </View>

        /* ── Texto ── */
        ) : (
          <View style={[
            bs.bubble, me ? bs.bubbleMe : bs.bubbleThem,
            item.offerStatus === 'accepted' && bs.bubbleAccepted,
            item.offerStatus === 'rejected' && bs.bubbleRejected,
          ]}>
            {replyQuote}
            <Text style={[bs.text, me ? bs.textMe : bs.textThem]}>{item.text}</Text>
            <Text style={[bs.time, me ? bs.timeMe : bs.timeThem]}>{item.time}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }) {
  const { chatId, sellerName: paramSellerName, productName: paramProductName, productId: paramProductId } = route.params;
  const { getChat, sendMessage } = useChat();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [offerText, setOfferText] = useState('');

  const flatRef = useRef(null);
  const chat = getChat(chatId);
  const messages = chat?.messages || [];
  const sellerName = chat?.sellerName || paramSellerName || 'Vendedor';
  const productName = chat?.productName || paramProductName || null;
  const productId = chat?.productId || paramProductId || null;
  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  function isFromMe(msg) {
    if (msg.senderId && msg.senderId !== 'bot') return msg.senderId === user?.id;
    return msg.fromMe;
  }

  function handleSend() {
    if (!text.trim()) return;
    sendMessage(chatId, {
      text: text.trim(),
      fromMe: true,
      senderId: user?.id,
      replyTo: replyingTo || null,
      productName,
      productId,
      sellerName,
      isRealItem: chat?.isRealItem,
    });
    setText('');
    setReplyingTo(null);
    setShowAttach(false);
  }

  async function handleSendImage() {
    setShowAttach(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsMultipleSelection: false,
    });
    if (!result.canceled) {
      sendMessage(chatId, {
        text: '',
        type: 'image',
        imageUri: result.assets[0].uri,
        fromMe: true,
        senderId: user?.id,
        replyTo: replyingTo || null,
        productName,
        productId,
        sellerName,
        isRealItem: chat?.isRealItem,
      });
      setReplyingTo(null);
    }
  }

  function closeOfferModal() {
    Keyboard.dismiss();
    setOfferModal(false);
    setOfferText('');
  }

  function handleSendOffer() {
    const price = parseFloat(offerText.replace(/\./g, '').replace(',', '.'));
    if (!price || price <= 0) return;
    sendMessage(chatId, {
      text: '',
      type: 'offer',
      offerPrice: price,
      fromMe: true,
      senderId: user?.id,
      productName,
      productId,
      sellerName,
      isRealItem: chat?.isRealItem,
    });
    closeOfferModal();
    setShowAttach(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <View style={s.headerNameRow}>
            <Text style={s.headerName} numberOfLines={1}>{sellerName}</Text>
            {chat?.isRealItem && (
              <View style={s.realBadge}>
                <Text style={s.realBadgeText}>Real</Text>
              </View>
            )}
          </View>
          {!!productName && <Text style={s.headerProduct} numberOfLines={1}>{productName}</Text>}
        </View>
        <View style={[s.onlineDot, { backgroundColor: chat?.isRealItem ? colors.warning : colors.success }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex} keyboardVerticalOffset={0}>

        {/* Lista de mensagens */}
        {messages.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.borderStrong} />
            <Text style={s.emptyText}>Inicie a conversa!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            renderItem={({ item }) => (
              <MessageBubble
                item={{ ...item, fromMe: isFromMe(item) }}
                sellerName={sellerName}
                onSwipeReply={setReplyingTo}
                colors={colors}
              />
            )}
            contentContainerStyle={s.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Preview de resposta */}
        {replyingTo && (
          <View style={s.replyBar}>
            <View style={s.replyBarLine} />
            <View style={s.replyBarBody}>
              <Text style={s.replyBarAuthor}>
                Respondendo a {replyingTo.fromMe ? 'você mesmo' : (chat?.sellerName || 'Vendedor')}
              </Text>
              <Text style={s.replyBarText} numberOfLines={1}>
                {replyingTo.type === 'image' ? '📷 Foto' : replyingTo.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Menu de anexos */}
        {showAttach && (
          <View style={s.attachMenu}>
            <TouchableOpacity style={s.attachItem} onPress={handleSendImage}>
              <View style={[s.attachIcon, { backgroundColor: '#7c3aed' }]}>
                <Ionicons name="image-outline" size={22} color="#fff" />
              </View>
              <Text style={s.attachLabel}>Imagem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachItem} onPress={() => { setShowAttach(false); Keyboard.dismiss(); setTimeout(() => setOfferModal(true), 80); }}>
              <View style={[s.attachIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="pricetag-outline" size={22} color="#fff" />
              </View>
              <Text style={s.attachLabel}>Oferta</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de input */}
        <View style={s.inputRow}>
          <TouchableOpacity
            style={[s.attachBtn, showAttach && { backgroundColor: colors.primary }]}
            onPress={() => setShowAttach(v => !v)}
          >
            <Ionicons name={showAttach ? 'close' : 'add'} size={22} color={showAttach ? colors.primaryText : colors.text} />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={colors.textMuted}
            multiline
            onFocus={() => setShowAttach(false)}
          />
          <TouchableOpacity
            style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de oferta */}
      <Modal visible={offerModal} transparent animationType="slide" onRequestClose={closeOfferModal}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={closeOfferModal}>
          <TouchableOpacity style={s.modalBox} activeOpacity={1}>
            <Text style={s.modalTitle}>Enviar oferta</Text>
            {!!productName && (
              <Text style={s.modalSub} numberOfLines={1}>{productName}</Text>
            )}
            <Text style={s.modalInputLabel}>Valor da oferta (R$)</Text>
            <TextInput
              style={s.offerInput}
              value={offerText}
              onChangeText={setOfferText}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={closeOfferModal}>
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSendBtn, !offerText && { opacity: 0.4 }]}
                onPress={handleSendOffer}
                disabled={!offerText}
              >
                <Text style={s.modalSendText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos das bolhas (componente separado) ───────────────────────────────────
function makeBubbleStyles(colors) {
  return StyleSheet.create({
    row: { marginBottom: 4, position: 'relative' },
    swipeIcon: {
      position: 'absolute', left: 4, top: '50%', marginTop: -10, zIndex: 0,
    },
    bubbleWrap: { zIndex: 1 },
    bubble: {
      maxWidth: '78%', borderRadius: 18,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    bubbleMe: {
      alignSelf: 'flex-end', backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleThem: {
      alignSelf: 'flex-start', backgroundColor: colors.surface,
      borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border,
    },
    bubbleAccepted: { borderWidth: 1.5, borderColor: colors.success },
    bubbleRejected: { borderWidth: 1.5, borderColor: colors.danger },
    text: { fontSize: 15, lineHeight: 21 },
    textMe: { color: colors.primaryText },
    textThem: { color: colors.text },
    time: { fontSize: 10, marginTop: 4 },
    timeMe: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
    timeThem: { color: colors.textMuted },
    // Citação de resposta
    replyQuote: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
      marginBottom: 8, borderLeftWidth: 3,
    },
    replyQuoteMe: {
      backgroundColor: 'rgba(255,255,255,0.15)', borderLeftColor: 'rgba(255,255,255,0.6)',
    },
    replyQuoteThem: {
      backgroundColor: colors.bg, borderLeftColor: colors.info,
    },
    replyAuthor: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
    replyText: { fontSize: 13, lineHeight: 17 },
    // Imagem
    imageMsg: { width: 200, height: 180, borderRadius: 12 },
    // Oferta
    offerBubble: {
      maxWidth: '78%', borderRadius: 18,
      paddingHorizontal: 14, paddingVertical: 12, minWidth: 160,
    },
    offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    offerLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    offerValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    offerStatus: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4,
    },
    offerStatusOk: { backgroundColor: colors.success + '1a' },
    offerStatusNo: { backgroundColor: colors.danger + '1a' },
    offerStatusText: { fontSize: 12, fontWeight: '700' },
  });
}

// ── Estilos da tela ────────────────────────────────────────────────────────────
function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 32 },
    headerInfo: { flex: 1 },
    headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerName: { fontSize: 16, fontWeight: '700', color: colors.text },
    realBadge: { backgroundColor: colors.warning, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    realBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
    headerProduct: { fontSize: 12, color: colors.info },
    onlineDot: { width: 10, height: 10, borderRadius: 5 },
    // Lista
    messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyText: { fontSize: 15, color: colors.textMuted },
    // Reply preview bar
    replyBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    replyBarLine: { width: 3, height: 36, borderRadius: 2, backgroundColor: colors.info },
    replyBarBody: { flex: 1 },
    replyBarAuthor: { fontSize: 12, fontWeight: '700', color: colors.info },
    replyBarText: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
    // Attach menu
    attachMenu: {
      flexDirection: 'row', gap: 24,
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    attachItem: { alignItems: 'center', gap: 6 },
    attachIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    attachLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    // Input row
    inputRow: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12,
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    attachBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    input: {
      flex: 1, backgroundColor: colors.inputBg, borderRadius: 22,
      paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
      color: colors.text, maxHeight: 100, borderWidth: 1, borderColor: colors.inputBorder,
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: colors.borderStrong },
    // Modal de oferta
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalBox: {
      backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 36,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
    modalSub: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
    modalInputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    offerInput: {
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 14,
      paddingHorizontal: 18, paddingVertical: 14, fontSize: 22, fontWeight: '700',
      color: colors.text, backgroundColor: colors.inputBg, marginBottom: 20,
    },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    modalSendBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      backgroundColor: colors.primary, alignItems: 'center',
    },
    modalSendText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
  });
}
