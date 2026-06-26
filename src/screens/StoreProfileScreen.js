import React, { useEffect, useState } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRatings } from '../context/RatingsContext';
import { useMyItems } from '../context/MyItemsContext';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useVerification, SEAL_TYPES } from '../context/VerificationContext';
import Stars from '../components/Stars';
import { getVerifiedLabel } from '../utils/verified';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const BANNER_PALETTES = [
  '#1e3a5f', '#1a4a2e', '#4a1a2e', '#2e1a4a', '#4a3a1a', '#1a3a4a', '#3a1a1a',
];

function getBannerColor(name = '') {
  return BANNER_PALETTES[(name.charCodeAt(0) || 0) % BANNER_PALETTES.length];
}

function getSellerBadge(n) {
  if (n >= 30) return { label: 'Vendedor Elite',  icon: 'shield-checkmark', color: '#f59e0b' };
  if (n >= 10) return { label: 'Top Vendedor',    icon: 'trophy',           color: '#ef4444' };
  if (n >= 3)  return { label: 'Experiente',      icon: 'ribbon',           color: '#2c7be5' };
  if (n >= 1)  return { label: 'Vendedor Ativo',  icon: 'checkmark-circle', color: '#22c55e' };
  return null;
}

function localParaProduto(item) {
  const preco = Math.max(0, parseFloat(String(item.preco || 0).replace(/\./g, '').replace(',', '.')) || 0);
  return {
    id: `local-${item.id}`,
    description: item.nome,
    brand: item.categoria || 'Outros',
    fotos: item.fotos || [],
    vendido: item.vendido || false,
    price: preco,
    convertedPrice: preco,
    isLocal: true,
    descricao: item.descricao || '',
    condicao: item.condicao || null,
  };
}

export default function StoreProfileScreen({ route, navigation }) {
  const { sellerKey, sellerName, isLocal } = route.params;
  const { colors } = useTheme();
  const { token } = useAuth();
  const { getSellerRatings, getSellerAverage } = useRatings();
  const { myItems } = useMyItems();
  const { getMyStatus, getSellerBadgeOverride, getStoreProfile } = useVerification();
  const s = makeStyles(colors);

  const [activeItems, setActiveItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const sellerRatings = getSellerRatings(sellerKey);
  const avg = getSellerAverage(sellerKey);

  useEffect(() => {
    if (isLocal) {
      const all = myItems.map(localParaProduto);
      setActiveItems(all.filter(i => !i.vendido));
      setSoldItems(all.filter(i => i.vendido).slice(0, 10));
      setLoading(false);
    } else {
      productAPI.getAll(token).then(all => {
        const matched = all.filter(p =>
          (p.brand || '') === sellerKey ||
          (p.sellerName || '') === sellerKey
        );
        setActiveItems(matched);
        setSoldItems([]);
        setLoading(false);
      }).catch(() => { setActiveItems([]); setLoading(false); });
    }
  }, [sellerKey, isLocal]);

  // Badge do vendedor (com override admin para conta local)
  const sellerOverride = isLocal ? getSellerBadgeOverride() : null;
  const badgeCount = sellerOverride ?? (isLocal ? myItems.filter(i => i.vendido).length : sellerRatings.length);
  const sellerBadge = getSellerBadge(badgeCount);

  // Selo de verificação
  let verified = null;
  if (isLocal) {
    const myStatus = getMyStatus();
    if (myStatus.status === 'approved' && myStatus.sealType) {
      verified = SEAL_TYPES[myStatus.sealType];
    }
  } else {
    const bv = getVerifiedLabel(sellerKey);
    if (bv) verified = { ...bv, icon: 'shield-checkmark' };
  }

  const storeInfo = isLocal ? getMyStatus()?.storeInfo : null;
  const storeProfile = isLocal ? getStoreProfile() : null;
  const displayName = storeProfile?.nome || sellerName || 'Vendedor';
  const storePhoto = storeProfile?.foto || null;
  const bannerColor = storeProfile?.bannerColor || getBannerColor(sellerName || '');

  // Breakdown de estrelas
  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: sellerRatings.filter(r => Math.round(r.stars) === star).length,
  }));
  const maxCount = Math.max(...starCounts.map(sc => sc.count), 1);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* Header fixo */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {verified ? displayName : 'Perfil do vendedor'}
        </Text>
        {isLocal ? (
          <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('EditStore')}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Banner colorido */}
        <View style={[s.banner, { backgroundColor: bannerColor }]}>
          {verified && (
            <View style={s.bannerBadge}>
              <Ionicons name={verified.icon} size={11} color={verified.color} />
              <Text style={[s.bannerBadgeText, { color: verified.color }]}>{verified.label}</Text>
            </View>
          )}
        </View>

        {/* Card de identidade — sobe sobre o banner */}
        <View style={s.identWrap}>
          {/* Avatar */}
          <View style={[s.avatarRing, { borderColor: colors.bg }]}>
            {storePhoto ? (
              <Image source={{ uri: storePhoto }} style={s.avatarImg} />
            ) : (
              <View style={[s.avatar, { backgroundColor: bannerColor }]}>
                <Text style={s.avatarLetter}>{(displayName)[0].toUpperCase()}</Text>
              </View>
            )}
            {verified && (
              <View style={[s.avatarBadgeDot, { backgroundColor: verified.color }]}>
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            )}
          </View>

          {/* Nome + selos */}
          <View style={s.identInfo}>
            <View style={s.nameRow}>
              <Text style={s.storeName} numberOfLines={1}>{displayName}</Text>
              {verified && <Ionicons name="checkmark-circle" size={18} color={verified.color} />}
            </View>

            <View style={s.badgesRow}>
              {verified && (
                <View style={[s.chip, { backgroundColor: verified.color + '18', borderColor: verified.color + '55' }]}>
                  <Ionicons name={verified.icon} size={11} color={verified.color} />
                  <Text style={[s.chipText, { color: verified.color }]}>{verified.label}</Text>
                </View>
              )}
              {sellerBadge && (
                <View style={[s.chip, { backgroundColor: sellerBadge.color + '18', borderColor: sellerBadge.color + '55' }]}>
                  <Ionicons name={sellerBadge.icon} size={11} color={sellerBadge.color} />
                  <Text style={[s.chipText, { color: sellerBadge.color }]}>{sellerBadge.label}</Text>
                </View>
              )}
            </View>

            {avg > 0 ? (
              <View style={s.ratingRow}>
                <Stars rating={avg} size={13} color={colors.star} />
                <Text style={s.ratingVal}>{avg.toFixed(1)}</Text>
                <Text style={s.ratingCount}>({sellerRatings.length})</Text>
              </View>
            ) : (
              <Text style={s.noRating}>Sem avaliações ainda</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { num: activeItems.length, label: 'Produtos' },
            { num: soldItems.length,   label: 'Vendas' },
            { num: sellerRatings.length, label: 'Avaliações' },
            { num: avg > 0 ? avg.toFixed(1) : '—', label: 'Média' },
          ].map((st, i, arr) => (
            <React.Fragment key={st.label}>
              <View style={s.stat}>
                <Text style={s.statNum}>{st.num}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.statDiv} />}
            </React.Fragment>
          ))}
        </View>

        {/* Botão Enviar Mensagem (apenas para lojas de outros) */}
        {!isLocal && (
          <TouchableOpacity
            style={[s.msgBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Chat', {
              chatId: `seller-${sellerKey}`,
              sellerName: displayName,
              productName: null,
              productId: null,
            })}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryText} />
            <Text style={[s.msgBtnText, { color: colors.primaryText }]}>Enviar mensagem</Text>
          </TouchableOpacity>
        )}

        {/* Sobre */}
        {(() => {
          const aboutSrc = storeProfile?.sobre ? storeProfile : storeInfo;
          return aboutSrc?.sobre ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Sobre a loja</Text>
              <View style={s.aboutCard}>
                {aboutSrc.tipo && (
                  <View style={s.aboutTag}>
                    <Ionicons name="storefront-outline" size={12} color={colors.info} />
                    <Text style={[s.aboutTagText, { color: colors.info }]}>{aboutSrc.tipo}</Text>
                  </View>
                )}
                {aboutSrc.site ? (
                  <View style={s.aboutRow}>
                    <Ionicons name="globe-outline" size={13} color={colors.textMuted} />
                    <Text style={[s.aboutRowText, { color: colors.info }]}>{aboutSrc.site}</Text>
                  </View>
                ) : null}
                <Text style={s.aboutDesc}>{aboutSrc.sobre}</Text>
              </View>
            </View>
          ) : null;
        })()}
        {!isLocal && !(storeInfo?.sobre) ? (
          <View style={s.section}>
            <View style={s.aboutCard}>
              <View style={s.aboutRow}>
                <Ionicons name="storefront-outline" size={13} color={colors.textMuted} />
                <Text style={s.aboutRowText}>Loja oficial de {sellerName}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
        ) : (
          <>
            {/* Grid de produtos */}
            {activeItems.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Produtos à venda</Text>
                  <View style={s.countChip}>
                    <Text style={s.countChipText}>{activeItems.length}</Text>
                  </View>
                </View>
                <View style={s.grid}>
                  {activeItems.map(item => {
                    const price = item.convertedPrice ?? item.price ?? 0;
                    const foto = item.fotos?.[0] || null;
                    return (
                      <TouchableOpacity
                        key={String(item.id)}
                        style={s.gridCard}
                        onPress={() => navigation.navigate('ItemDetail', { product: item })}
                        activeOpacity={0.85}
                      >
                        <View style={[s.gridImg, { backgroundColor: bannerColor }]}>
                          {foto
                            ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                            : <Ionicons name="cube-outline" size={26} color="rgba(255,255,255,0.4)" />}
                        </View>
                        <View style={s.gridInfo}>
                          <Text style={s.gridName} numberOfLines={2}>{item.description || item.nome}</Text>
                          {item.condicao ? <Text style={s.gridCond}>{item.condicao}</Text> : null}
                          <Text style={s.gridPrice}>{price > 0 ? formatBRL(price) : 'A combinar'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Últimas vendas */}
            {soldItems.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Últimas vendas</Text>
                {soldItems.map(item => {
                  const price = item.convertedPrice ?? item.price ?? 0;
                  return (
                    <View key={String(item.id)} style={[s.soldRow, { opacity: 0.6 }]}>
                      <View style={[s.soldThumb, { backgroundColor: colors.borderStrong }]}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.soldName} numberOfLines={1}>{item.description || item.nome}</Text>
                        <Text style={[s.soldSub, { color: colors.success }]}>Vendido</Text>
                      </View>
                      <Text style={s.soldPrice}>{price > 0 ? formatBRL(price) : '—'}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {activeItems.length === 0 && soldItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="storefront-outline" size={48} color={colors.borderStrong} />
                <Text style={s.emptyText}>Nenhum anúncio encontrado</Text>
              </View>
            )}

            {/* Avaliações */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Avaliações</Text>

              {sellerRatings.length > 0 && (
                <View style={s.ratingBreakdown}>
                  <View style={s.ratingBig}>
                    <Text style={s.ratingBigNum}>{avg.toFixed(1)}</Text>
                    <Stars rating={avg} size={14} color={colors.star} />
                    <Text style={s.ratingBigSub}>{sellerRatings.length} avaliação{sellerRatings.length !== 1 ? 'ões' : ''}</Text>
                  </View>
                  <View style={s.barsWrap}>
                    {starCounts.map(({ star, count }) => (
                      <View key={star} style={s.barRow}>
                        <Text style={s.barLabel}>{star}</Text>
                        <Ionicons name="star" size={9} color={colors.star} />
                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: `${(count / maxCount) * 100}%` }]} />
                        </View>
                        <Text style={s.barCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {sellerRatings.length === 0 ? (
                <View style={s.noReviews}>
                  <Ionicons name="star-outline" size={30} color={colors.borderStrong} />
                  <Text style={s.noReviewsText}>Nenhuma avaliação ainda</Text>
                </View>
              ) : (
                sellerRatings.slice(0, 6).map(r => (
                  <View key={r.id} style={s.reviewCard}>
                    <View style={s.reviewTop}>
                      <View style={s.reviewAvatar}>
                        <Text style={s.reviewAvatarText}>{(r.userName || 'U')[0].toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.reviewUser}>{r.userName}</Text>
                        <Stars rating={r.stars} size={11} color={colors.star} />
                      </View>
                      <Text style={s.reviewDate}>{r.date}</Text>
                    </View>
                    {r.comment ? <Text style={s.reviewComment}>{r.comment}</Text> : null}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },

    banner: { height: 110, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 12 },
    bannerBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    bannerBadgeText: { fontSize: 11, fontWeight: '700' },

    identWrap: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 14,
      backgroundColor: colors.surface,
      paddingHorizontal: 16, paddingBottom: 18,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      marginTop: -1,
    },
    avatarRing: {
      width: 76, height: 76, borderRadius: 38,
      borderWidth: 3,
      marginTop: -38,
      position: 'relative',
    },
    avatar: {
      width: 70, height: 70, borderRadius: 35,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarImg: { width: 70, height: 70, borderRadius: 35 },
    avatarLetter: { fontSize: 30, fontWeight: '800', color: '#fff' },
    avatarBadgeDot: {
      position: 'absolute', bottom: 1, right: 1,
      width: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.surface,
    },

    identInfo: { flex: 1, paddingTop: 10, gap: 6 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    storeName: { fontSize: 18, fontWeight: '800', color: colors.text, flexShrink: 1 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 8, borderWidth: 1,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    chipText: { fontSize: 11, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ratingVal: { fontSize: 13, fontWeight: '800', color: colors.text },
    ratingCount: { fontSize: 12, color: colors.textMuted },
    noRating: { fontSize: 12, color: colors.textMuted },

    statsRow: {
      flexDirection: 'row', backgroundColor: colors.surface,
      marginHorizontal: 16, marginTop: 12,
      borderRadius: 14, paddingVertical: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 18, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    statDiv: { width: 1, backgroundColor: colors.border },

    msgBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 16, marginTop: 14, borderRadius: 14,
      paddingVertical: 14,
    },
    msgBtnText: { fontSize: 15, fontWeight: '700' },

    section: { marginHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
    countChip: {
      backgroundColor: colors.info + '18', borderRadius: 10,
      paddingHorizontal: 8, paddingVertical: 2,
    },
    countChipText: { fontSize: 11, fontWeight: '700', color: colors.info },

    aboutCard: {
      backgroundColor: colors.surface, borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8,
    },
    aboutTag: {
      flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
      backgroundColor: colors.info + '18', borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    aboutTagText: { fontSize: 12, fontWeight: '700' },
    aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aboutRowText: { fontSize: 13, color: colors.textSecondary },
    aboutDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridCard: {
      width: CARD_WIDTH, backgroundColor: colors.surface,
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border,
    },
    gridImg: {
      width: '100%', height: CARD_WIDTH * 0.72,
      alignItems: 'center', justifyContent: 'center',
    },
    gridInfo: { padding: 10, gap: 3 },
    gridName: { fontSize: 13, fontWeight: '600', color: colors.text },
    gridCond: { fontSize: 11, color: colors.textMuted },
    gridPrice: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },

    soldRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: 10, padding: 12,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    soldThumb: {
      width: 40, height: 40, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    soldName: { fontSize: 13, fontWeight: '600', color: colors.text },
    soldSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    soldPrice: { fontSize: 13, fontWeight: '700', color: colors.textMuted },

    empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
    emptyText: { fontSize: 14, color: colors.textMuted },

    ratingBreakdown: {
      flexDirection: 'row', gap: 16,
      backgroundColor: colors.surface, borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12,
    },
    ratingBig: { alignItems: 'center', justifyContent: 'center', gap: 4, width: 68 },
    ratingBigNum: { fontSize: 30, fontWeight: '800', color: colors.text },
    ratingBigSub: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
    barsWrap: { flex: 1, gap: 5, justifyContent: 'center' },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    barLabel: { fontSize: 11, color: colors.textMuted, width: 10, textAlign: 'right' },
    barTrack: {
      flex: 1, height: 5, backgroundColor: colors.borderStrong,
      borderRadius: 3, overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.star },
    barCount: { fontSize: 11, color: colors.textMuted, width: 14, textAlign: 'right' },

    noReviews: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 24,
      alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border,
    },
    noReviewsText: { fontSize: 14, color: colors.textMuted },
    reviewCard: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    reviewAvatar: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center',
    },
    reviewAvatarText: { fontSize: 12, fontWeight: '700', color: colors.text },
    reviewUser: { fontSize: 13, fontWeight: '700', color: colors.text },
    reviewDate: { fontSize: 11, color: colors.textMuted },
    reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 2 },
  });
}
