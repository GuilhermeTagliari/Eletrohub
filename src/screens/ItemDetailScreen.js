import React, { useState, useEffect } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
  Alert, Share, FlatList, TextInput, Image, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { showToast } from '../utils/toast';
import { hapticSuccess, hapticLight } from '../utils/haptics';
import { getVerifiedLabel } from '../utils/verified';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useRatings } from '../context/RatingsContext';
import { useOrders } from '../context/OrdersContext';
import { useAddress } from '../context/AddressContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useMyItems } from '../context/MyItemsContext';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TAB_BAR_INSET } from '../utils/tabBarAnim';
import Stars from '../components/Stars';
import SwipeableModal from '../components/SwipeableModal';
import { useCurrency } from '../context/CurrencyContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BRAND_COLORS = {
  Apple: '#1c1c1e', Samsung: '#1428A0', Motorola: '#003087',
  Xiaomi: '#FF6900', Google: '#4285F4', OnePlus: '#F5010C',
};

function getSellerBadge(count) {
  if (count >= 30) return { label: 'Vendedor Elite', icon: 'shield-checkmark', color: '#f59e0b' };
  if (count >= 10) return { label: 'Top Vendedor', icon: 'trophy', color: '#ef4444' };
  if (count >= 3) return { label: 'Experiente', icon: 'ribbon', color: '#2c7be5' };
  if (count >= 1) return { label: 'Vendedor Ativo', icon: 'checkmark-circle', color: '#22c55e' };
  return null;
}

function adicionarDiasUteis(data, dias) {
  const d = new Date(data);
  let adicionados = 0;
  while (adicionados < dias) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) adicionados++;
  }
  return d;
}

function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export default function ItemDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();
  const { toggle, isFavorite } = useFavorites();
  const { getSellerAverage, getSellerRatings } = useRatings();
  const { orders } = useOrders();
  const { sendMessage } = useChat();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const { selected: enderecoSelecionado } = useAddress();
  const { myItems } = useMyItems();
  const insets = useSafeAreaInsets();

  const [imgErrors, setImgErrors] = useState({});
  const [related, setRelated] = useState([]);
  const [showOferta, setShowOferta] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [ofertaPreco, setOfertaPreco] = useState('');
  const [fotoIdx, setFotoIdx] = useState(0);
  const { currency: moeda, setCurrency: setMoeda, RATES, formatPrice: formatPriceCurrency } = useCurrency();

  // Calcula preço base em BRL
  const USD_TO_BRL = 5.75;
  let priceBRL = product.convertedPrice;
  if ((!priceBRL || priceBRL === 0) && product.price) {
    priceBRL = (product.currency && product.currency !== 'BRL')
      ? Math.round(product.price * USD_TO_BRL * 100) / 100
      : product.price;
  }
  // Fallback: local items store price directly
  if (!priceBRL || priceBRL === 0) {
    const raw = String(product.price || product.preco || 0);
    priceBRL = parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Clamp: never show negative or NaN prices
  priceBRL = Math.max(0, priceBRL || 0);

  // Preço na moeda selecionada
  const price = moeda === 'BRL' ? priceBRL : priceBRL / RATES[moeda];

  function formatPrice(p) {
    return formatPriceCurrency(p);
  }
  const liked = isFavorite(product.id);
  const sellerKey = product.brand || product.categoria || 'vendedor';
  const sellerAvg = getSellerAverage(sellerKey);
  const sellerRatingCount = getSellerRatings(sellerKey).length;
  const badgeCount = product.isLocal
    ? myItems.filter(i => i.vendido).length
    : sellerRatingCount;
  const sellerBadge = getSellerBadge(badgeCount);
  const verifiedBadge = getVerifiedLabel(sellerKey);
  const bgColor = BRAND_COLORS[product.brand] || '#1a1a1a';
  const chatId = `chat-${product.id}`;
  const s = makeStyles(colors);
  const isSelfItem = product.isLocal === true;
  const isVendido = product.vendido === true;
  const fotos = product.fotos?.length > 0 ? product.fotos : (product.foto ? [product.foto] : []);

  // Cálculo de frete e entrega
  const freteTipo = product.freteTipo || 'proprio';
  const freteStr = String(product.frete || '');
  const freteExplicito = freteStr.trim() !== '';
  const freteRaw = parseFloat(freteStr.replace(',', '.')) || 0;
  const freteCalculadoItem = product.freteCalculado || 0;
  const freteCodigo = product.freteCodigo || '';
  const freteCusto = freteTipo === 'eletrohub'
    ? (freteCalculadoItem > 0 ? freteCalculadoItem : 19.90)
    : freteRaw;
  const freteCombinar = freteTipo === 'proprio' && !freteExplicito && product.isLocal;

  // Frete grátis para usuários com endereço no sul do Brasil (RS, SC, PR) via frota EletroHub
  const ESTADOS_SUL = ['RS', 'SC', 'PR'];
  const usuarioDoSul = ESTADOS_SUL.includes((enderecoSelecionado?.estado || '').toUpperCase());
  const freteGratisEletroHub = freteTipo === 'eletrohub' && usuarioDoSul;

  const freteGratis = !freteCombinar && (
    freteGratisEletroHub ||
    (freteTipo !== 'eletrohub' && freteExplicito && freteCusto === 0) ||
    (!product.isLocal && price >= 299 && freteTipo !== 'eletrohub')
  );
  const freteLabel = freteTipo === 'eletrohub'
    ? freteGratisEletroHub
      ? 'EletroHub · Grátis (Sul do Brasil)'
      : `Frete EletroHub · ${formatBRL(freteCusto)}`
    : freteCombinar
      ? 'A combinar'
      : freteGratis
        ? 'Grátis'
        : formatBRL(freteCusto);
  const hoje = new Date();
  const dataFrete = adicionarDiasUteis(hoje, 10);
  const dataRetirada = adicionarDiasUteis(hoje, 1);

  useEffect(() => {
    if (product.isLocal) {
      const localRelated = myItems
        .filter(i => i.categoria === product.categoria && `local-${i.id}` !== String(product.id) && !i.vendido)
        .slice(0, 4)
        .map(i => {
          const preco = parseFloat(String(i.preco || 0).replace(/\./g, '').replace(',', '.')) || 0;
          return {
            id: `local-${i.id}`,
            description: i.nome,
            brand: i.categoria,
            categoria: i.categoria,
            price: preco,
            convertedPrice: preco,
            fotos: i.fotos || [],
            isLocal: true,
          };
        });
      setRelated(localRelated);
    } else {
      productAPI.getAll(token).then(all => {
        setRelated(all.filter(p => p.brand === product.brand && p.id !== product.id).slice(0, 4));
      }).catch(() => {});
    }
  }, []);

  function handleAddToCart() {
    addToCart({ ...product, variation: product.model || product.variacao || '' });
    hapticSuccess();
    showToast(`${product.description || product.nome} adicionado ao carrinho`);
  }

  function handleBuyNow() {
    addToCart({ ...product, variation: product.model || product.variacao || '' });
    navigation.getParent()?.navigate('Cart');
  }

  function handleShare() {
    Share.share({
      message: `Veja este produto no EletroHub: ${product.description} por ${formatBRL(price)}`,
      title: product.description,
    });
  }

  function handleChat() {
    const isRealItem = product.isLocal && (() => {
      const num = parseInt(String(product.id).replace('local-', ''), 10);
      return !isNaN(num) && num > 10000;
    })();
    sendMessage(chatId, {
      text: `Olá! Tenho interesse no produto: ${product.description}`,
      fromMe: true,
      senderId: user?.id,
      productName: product.description,
      productId: product.id,
      sellerName: product.brand || 'Vendedor',
      isRealItem,
    });
    navigation.navigate('Chat', { chatId });
  }

  function handleEnviarOferta() {
    const val = parseFloat(ofertaPreco.replace(',', '.'));
    if (!val || val <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor válido para a oferta.');
      return;
    }
    if (val >= price) {
      Alert.alert('Oferta inválida', 'A oferta deve ser menor que o preço original.');
      return;
    }
    sendMessage(chatId, {
      text: `Oferta: ${formatBRL(val)}`,
      fromMe: true,
      type: 'offer',
      offerPrice: val,
      productName: product.description,
      productId: product.id,
      sellerName: product.brand || 'Vendedor',
    });
    setShowOferta(false);
    setOfertaPreco('');
    navigation.navigate('Chat', { chatId });
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{product.description || product.nome}</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={handleShare} style={s.iconBtn}>
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { toggle(product); hapticLight(); }} style={s.iconBtn}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.danger : colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galeria */}
        {fotos.length > 0 ? (
          <View>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setFotoIdx(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))}
            >
              {fotos.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.95}
                  onPress={() => { setZoomIdx(i); setShowZoom(true); }}
                >
                  <View style={[s.imageBox, { width: SCREEN_WIDTH, backgroundColor: bgColor }]}>
                    {imgErrors[i] ? (
                      <>
                        <Ionicons name="cube-outline" size={90} color="rgba(255,255,255,0.25)" />
                        {product.brand && <Text style={s.brandWatermark}>{product.brand}</Text>}
                      </>
                    ) : (
                      <Image
                        source={{ uri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        onError={() => setImgErrors(e => ({ ...e, [i]: true }))}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {fotos.length > 1 && (
              <View style={s.dotRow}>
                {fotos.map((_, i) => (
                  <View key={i} style={[s.dot, i === fotoIdx && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[s.imageBox, { backgroundColor: bgColor }]}>
            <Ionicons name="cube-outline" size={90} color="rgba(255,255,255,0.25)" />
            {product.brand && <Text style={s.brandWatermark}>{product.brand}</Text>}
          </View>
        )}

        <View style={s.content}>
          {/* Info básica */}
          <Text style={s.brandLabel}>{product.brand || product.categoria}</Text>
          <Text style={s.productName}>{product.description || product.nome}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {product.model ? <Text style={s.modelLabel}>Variação: {product.model}</Text> : null}
            {product.cor ? <Text style={s.modelLabel}>Cor: {product.cor}</Text> : null}
          </View>

          {/* Badges de condição e vendido */}
          <View style={s.badgeRow}>
            {product.condicao && (
              <View style={s.condicaoBadge}>
                <Text style={s.condicaoBadgeText}>{product.condicao}</Text>
              </View>
            )}
            {isVendido && (
              <View style={s.vendidoBadge}>
                <Ionicons name="close-circle" size={12} color="#fff" />
                <Text style={s.vendidoBadgeText}>Vendido</Text>
              </View>
            )}
            {(product.cidade || product.estado) && (
              <View style={s.locBadge}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={s.locBadgeText}>{[product.cidade, product.estado].filter(Boolean).join(' - ')}</Text>
              </View>
            )}
          </View>

          {/* Preço + seletor de moeda */}
          <View style={s.priceBlock}>
            <View style={s.priceRow}>
              <Text style={s.price}>{formatPrice(price)}</Text>
            </View>
            <View style={s.moedaRow}>
              {Object.keys(RATES).map(k => (
                <TouchableOpacity
                  key={k}
                  style={[s.moedaChip, moeda === k && s.moedaChipActive]}
                  onPress={() => setMoeda(k)}
                >
                  <Text style={[s.moedaText, moeda === k && s.moedaTextActive]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {product.stock != null && (
            <View style={s.stockRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={s.stockText}>{product.stock} em estoque</Text>
            </View>
          )}

          {/* Descrição */}
          <Text style={s.sectionLabel}>Descrição</Text>
          <Text style={s.description}>
            {product.descricao || product.description || product.nome}
          </Text>

          {/* Entrega */}
          <Text style={s.sectionLabel}>Entrega</Text>
          <View style={s.shippingBox}>
            <View style={s.shippingOption}>
              <Ionicons name="car-outline" size={20} color={colors.success} />
              <View style={s.shippingInfo}>
                <Text style={s.shippingType}>Frete</Text>
                <Text style={s.shippingDetail}>
                  {freteLabel}
                  {!freteCombinar && `  ·  Até ${formatarData(dataFrete)}`}
                </Text>
              </View>
              {freteGratis && freteTipo !== 'eletrohub' && (
                <View style={s.freeBadge}>
                  <Text style={s.freeBadgeText}>GRÁTIS</Text>
                </View>
              )}
            </View>
            {freteCodigo ? (
              <View style={s.trackingRow}>
                <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
                <Text style={s.trackingCode}>{freteCodigo}</Text>
                <Text style={s.trackingLabel}>código de postagem</Text>
              </View>
            ) : null}
            <View style={s.shippingDivider} />
            <View style={s.shippingOption}>
              <Ionicons name="location-outline" size={20} color={colors.info} />
              <View style={s.shippingInfo}>
                <Text style={s.shippingType}>Retirada local</Text>
                <Text style={s.shippingDetail}>
                  {'Grátis  ·  A partir de '}
                  {formatarData(dataRetirada)}
                </Text>
              </View>
            </View>
          </View>

          {/* EletroHub Entrega — acesso ao checkout com instalação e trade-in */}
          {!isSelfItem && !isVendido && (
            <TouchableOpacity
              style={s.eletroHubBlock}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TradeInCheckout', { produto: product })}
            >
              <View style={s.eletroHubLeft}>
                <View style={s.eletroHubBadge}>
                  <Ionicons name="flash" size={13} color={colors.primaryText} />
                  <Text style={s.eletroHubBadgeText}>EletroHub</Text>
                </View>
                <Text style={s.eletroHubTitle}>Entrega + Instalação + Trade-in</Text>
                <Text style={s.eletroHubSub}>
                  Entrega com instalação inclusa · Troque seu usado e abata no valor
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Vendedor */}
          {!isSelfItem && (
            <TouchableOpacity
              style={s.sellerSection}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SellerProfile', {
                sellerKey,
                sellerName: product.brand || 'Vendedor',
                isLocal: product.isLocal,
                product,
              })}
            >
              <View style={s.sellerInfo}>
                <View style={s.sellerAvatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.sellerName}>{product.brand || 'Vendedor'}</Text>
                    {verifiedBadge && (
                      <Ionicons name="checkmark-circle" size={16} color={verifiedBadge.color} />
                    )}
                  </View>
                  {verifiedBadge && (
                    <View style={[s.sellerBadge, { backgroundColor: verifiedBadge.color + '18' }]}>
                      <Ionicons name="shield-checkmark" size={11} color={verifiedBadge.color} />
                      <Text style={[s.sellerBadgeText, { color: verifiedBadge.color }]}>{verifiedBadge.label}</Text>
                    </View>
                  )}
                  {sellerAvg > 0 ? (
                    <View style={s.sellerRatingRow}>
                      <Stars rating={sellerAvg} size={11} color={colors.star} />
                      <Text style={s.sellerRatingText}>{sellerAvg.toFixed(1)} ({sellerRatingCount} avaliações)</Text>
                    </View>
                  ) : (
                    <Text style={s.sellerNoRating}>Sem avaliações ainda</Text>
                  )}
                  {sellerBadge && (
                    <View style={[s.sellerBadge, { backgroundColor: sellerBadge.color + '22' }]}>
                      <Ionicons name={sellerBadge.icon} size={11} color={sellerBadge.color} />
                      <Text style={[s.sellerBadgeText, { color: sellerBadge.color }]}>{sellerBadge.label}</Text>
                    </View>
                  )}
                </View>
                <View style={{ gap: 8, alignItems: 'flex-end' }}>
                  <TouchableOpacity style={s.chatBtn} onPress={handleChat}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.info} />
                    <Text style={s.chatBtnText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Produtos relacionados */}
          {related.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{product.isLocal ? `Mais em ${product.categoria}` : `Também da ${product.brand}`}</Text>
              <FlatList
                horizontal
                data={related}
                keyExtractor={i => String(i.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                renderItem={({ item }) => {
                  const rPrice = item.convertedPrice ?? item.price ?? 0;
                  return (
                    <TouchableOpacity
                      style={s.relatedCard}
                      onPress={() => navigation.replace('ItemDetail', { product: item })}
                    >
                      <View style={[s.relatedImg, { backgroundColor: bgColor }]}>
                        <Ionicons name="cube-outline" size={24} color="rgba(255,255,255,0.5)" />
                      </View>
                      <Text style={s.relatedName} numberOfLines={2}>{item.description}</Text>
                      <Text style={s.relatedPrice}>{rPrice > 0 ? formatBRL(rPrice) : '—'}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Botões de ação — fixos no rodapé */}
      {isSelfItem ? (
        <View style={s.selfItemBanner}>
          <Ionicons name="megaphone-outline" size={18} color={colors.textMuted} />
          <Text style={s.selfItemText}>Este é o seu próprio anúncio</Text>
        </View>
      ) : isVendido ? (
        <View style={s.selfItemBanner}>
          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          <Text style={[s.selfItemText, { color: colors.danger }]}>Produto indisponível</Text>
        </View>
      ) : (
        <View style={[s.actions, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={s.btnOffer} onPress={() => setShowOferta(true)}>
            <Ionicons name="pricetag-outline" size={16} color={colors.text} />
            <Text style={s.btnOfferText}>Oferta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={handleAddToCart}>
            <Ionicons name="bag-add-outline" size={16} color={colors.text} />
            <Text style={s.btnSecondaryText}>Carrinho</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnPrimary} onPress={handleBuyNow}>
            <Text style={s.btnPrimaryText}>Comprar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal fullscreen de fotos */}
      <Modal visible={showZoom} animationType="fade" statusBarTranslucent transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
            onPress={() => setShowZoom(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: zoomIdx * SCREEN_WIDTH, y: 0 }}
            style={{ flex: 1 }}
          >
            {fotos.map((uri, i) => (
              <View key={i} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
          {fotos.length > 1 && (
            <View style={{ position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {fotos.map((_, i) => (
                <View key={i} style={{ width: i === zoomIdx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === zoomIdx ? '#fff' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </View>
          )}
        </View>
      </Modal>

      {/* Modal de oferta */}
      <SwipeableModal
        visible={showOferta}
        onClose={() => { setShowOferta(false); setOfertaPreco(''); }}
        style={{ backgroundColor: colors.surface }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.offerContent}>
            <Text style={s.offerTitle}>Fazer uma oferta</Text>
            <Text style={s.offerSub}>Preço original: {priceBRL > 0 ? formatBRL(priceBRL) : '—'}</Text>
            <View style={s.offerInputWrap}>
              <Text style={s.offerCurrency}>R$</Text>
              <TextInput
                style={s.offerInput}
                value={ofertaPreco}
                onChangeText={setOfertaPreco}
                placeholder="0,00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.offerBtns}>
              <TouchableOpacity style={s.offerBtnCancel} onPress={() => { setShowOferta(false); setOfertaPreco(''); }}>
                <Text style={s.offerBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.offerBtnSend} onPress={handleEnviarOferta}>
                <Text style={s.offerBtnSendText}>Enviar oferta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SwipeableModal>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center', marginHorizontal: 4 },
    headerRight: { flexDirection: 'row' },
    imageBox: { width: '100%', height: 260, alignItems: 'center', justifyContent: 'center' },
    brandWatermark: { position: 'absolute', bottom: 16, right: 16, color: 'rgba(255,255,255,0.2)', fontSize: 28, fontWeight: '900' },
    content: { padding: 20 },
    brandLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
    productName: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 4, lineHeight: 28 },
    modelLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    ratingAvg: { fontSize: 14, fontWeight: '700', color: colors.star },
    ratingCount: { fontSize: 13, color: colors.textMuted },
    priceBlock: { marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 8 },
    price: { fontSize: 28, fontWeight: '800', color: colors.text },
    originalPrice: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through' },
    moedaRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
    moedaChip: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.borderStrong,
    },
    moedaChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    moedaText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
    moedaTextActive: { color: colors.primaryText },
    stockRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
    stockText: { fontSize: 13, color: colors.textSecondary },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 16 },
    variacoes: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
    varBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary },
    varBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    varText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    varTextActive: { color: colors.primaryText },
    description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    sellerSection: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.borderStrong, marginTop: 16,
      shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sellerAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.info, alignItems: 'center', justifyContent: 'center',
    },
    sellerName: { fontSize: 14, fontWeight: '700', color: colors.text },
    sellerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    sellerRatingText: { fontSize: 11, color: colors.textMuted },
    sellerNoRating: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    sellerBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      alignSelf: 'flex-start', marginTop: 5,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    sellerBadgeText: { fontSize: 11, fontWeight: '700' },
    chatBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.info + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
      borderWidth: 1, borderColor: colors.info + '44',
    },
    chatBtnText: { fontSize: 12, fontWeight: '700', color: colors.info },
    eletroHubBlock: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: 14, padding: 14,
      borderWidth: 1.5, borderColor: colors.primary + '55', marginTop: 16,
      shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    eletroHubLeft: { flex: 1, gap: 4 },
    eletroHubBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primary, alignSelf: 'flex-start',
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    eletroHubBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primaryText, letterSpacing: 0.5 },
    eletroHubTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    eletroHubSub: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
    relatedCard: { width: 130, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
    relatedImg: { height: 80, alignItems: 'center', justifyContent: 'center' },
    relatedName: { fontSize: 12, fontWeight: '600', color: colors.text, padding: 8, paddingBottom: 4, lineHeight: 16 },
    relatedPrice: { fontSize: 12, fontWeight: '800', color: colors.text, paddingHorizontal: 8, paddingBottom: 8 },
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 10 },
    avaliarBtn: { fontSize: 14, fontWeight: '700', color: colors.info },
    noReviews: { alignItems: 'center', gap: 8, paddingVertical: 20, backgroundColor: colors.surface, borderRadius: 12 },
    noReviewsText: { fontSize: 14, color: colors.textMuted },
    reviewCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    reviewUser: { fontSize: 13, fontWeight: '700', color: colors.text },
    reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 6 },
    reviewDate: { fontSize: 11, color: colors.textMuted },
    dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: -18, marginBottom: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { backgroundColor: '#fff', width: 18 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 },
    condicaoBadge: { backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong },
    condicaoBadgeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    vendidoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    vendidoBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    locBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    locBadgeText: { fontSize: 12, color: colors.textMuted },
    shippingBox: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    shippingOption: {
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    },
    shippingDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
    shippingInfo: { flex: 1 },
    shippingType: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
    shippingDetail: { fontSize: 12, color: colors.textMuted },
    freeBadge: {
      backgroundColor: colors.success + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    freeBadgeText: { fontSize: 10, fontWeight: '800', color: colors.success },
    trackingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: colors.surfaceSecondary,
    },
    trackingCode: { fontSize: 12, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
    trackingLabel: { fontSize: 11, color: colors.textMuted },
    selfItemBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
    },
    selfItemText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
    actions: {
      flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8,
      borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
    },
    btnOffer: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12,
      borderWidth: 1.5, borderColor: colors.borderStrong,
    },
    btnOfferText: { fontSize: 13, fontWeight: '700', color: colors.text },
    btnSecondary: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12,
      borderWidth: 1.5, borderColor: colors.borderStrong,
    },
    btnSecondaryText: { fontSize: 13, fontWeight: '700', color: colors.text },
    btnPrimary: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    btnPrimaryText: { color: colors.primaryText, fontSize: 15, fontWeight: '700' },
    offerContent: { padding: 24, paddingBottom: 16 },
    offerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
    offerSub: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
    offerInputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 2, borderColor: colors.primary, borderRadius: 14,
      paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
    },
    offerCurrency: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
    offerInput: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
    offerBtns: { flexDirection: 'row', gap: 12 },
    offerBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center' },
    offerBtnCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    offerBtnSend: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
    offerBtnSendText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
  });
}
