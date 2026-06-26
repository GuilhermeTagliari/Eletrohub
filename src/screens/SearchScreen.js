import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, TextInput, FlatList, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productAPI } from '../services/api';
import { onTabBarScroll, TAB_BAR_INSET } from '../utils/tabBarAnim';
import { useAuth } from '../context/AuthContext';
import { useMyItems } from '../context/MyItemsContext';
import { useTheme } from '../context/ThemeContext';
import { useRatings } from '../context/RatingsContext';
import { useVerification } from '../context/VerificationContext';
import { CATEGORIAS } from '../config';
import SwipeableModal from '../components/SwipeableModal';

const BRAND_COLORS = {
  Apple: '#1c1c1e', Samsung: '#1428A0', Motorola: '#003087',
  Xiaomi: '#FF6900', Google: '#4285F4', OnePlus: '#F5010C',
};
const CATEGORIAS_FILTRO = ['Todos', ...CATEGORIAS];
const ORDEM_OPTS = [
  { key: 'default', label: 'Relevância' },
  { key: 'asc', label: 'Menor preço' },
  { key: 'desc', label: 'Maior preço' },
  { key: 'rating', label: 'Melhor avaliado' },
];

function localParaProduto(item) {
  const preco = Math.max(0, parseFloat(String(item.preco || 0).replace(/\./g, '').replace(',', '.')) || 0);
  return {
    id: `local-${item.id}`,
    description: item.nome,
    brand: item.categoria || 'Meu anúncio',
    categoria: item.categoria || 'Outros',
    model: item.variacao || '',
    condicao: item.condicao || null,
    cidade: item.cidade || null,
    estado: item.estado || null,
    fotos: item.fotos || [],
    vendido: item.vendido || false,
    price: preco,
    convertedPrice: preco,
    stock: 1,
    isLocal: true,
    descricao: item.descricao || '',
    cor: item.cor || '',
    frete: item.frete || '',
    freteTipo: item.freteTipo || 'proprio',
    freteCalculado: item.freteCalculado || 0,
    freteCodigo: item.freteCodigo || '',
  };
}

export default function SearchScreen({ navigation }) {
  const { token, user } = useAuth();
  const { myItems } = useMyItems();
  const { colors } = useTheme();
  const { getSellerRatings, getSellerAverage } = useRatings();
  const { getStoreProfile } = useVerification();
  const s = makeStyles(colors);

  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [historico, setHistorico] = useState([]);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [catFiltro, setCatFiltro] = useState('Todos');
  const [condicaoFiltro, setCondicaoFiltro] = useState('Todos');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [ordem, setOrdem] = useState('default');
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef(null);

  function handleQueryChange(text) {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (!text.trim()) { buscar(text); return; }
    debounceRef.current = setTimeout(() => buscar(text), 300);
  }

  useEffect(() => {
    AsyncStorage.getItem('@eletrohub:searchHistory').then(h => {
      if (h) setHistorico(JSON.parse(h));
    });
  }, []);

  async function salvarHistorico(term) {
    const stored = await AsyncStorage.getItem('@eletrohub:searchHistory');
    const prev = stored ? JSON.parse(stored) : [];
    const novo = [term, ...prev.filter(h => h !== term)].slice(0, 5);
    setHistorico(novo);
    await AsyncStorage.setItem('@eletrohub:searchHistory', JSON.stringify(novo));
  }

  async function limparHistorico() {
    setHistorico([]);
    await AsyncStorage.removeItem('@eletrohub:searchHistory');
  }

  const buscar = useCallback(async (text, saveToHistory = false) => {
    if (!text.trim()) {
      setQuery('');
      setResultados([]);
      setBuscou(false);
      setLoading(false);
      return;
    }
    setQuery(text);
    setLoading(true);
    const q = text.trim().toLowerCase();
    const storeProfile = getStoreProfile();
    const storeName = (storeProfile?.nome || '').toLowerCase();
    const userName = (user?.name || '').toLowerCase();
    const sellerMatch = (storeName && storeName.includes(q)) || (userName && userName.includes(q));

    const locais = myItems
      .filter(i =>
        !i.vendido && !i.backendId && (
          sellerMatch ||
          i.nome?.toLowerCase().includes(q) ||
          i.sellerName?.toLowerCase().includes(q) ||
          i.categoria?.toLowerCase().includes(q) ||
          i.descricao?.toLowerCase().includes(q)
        )
      )
      .map(localParaProduto);

    try {
      const remoto = await productAPI.search(q, token);
      setResultados([
        ...locais,
        ...remoto.filter(r => !locais.some(l => l.description === r.description)),
      ]);
    } catch (_) {
      setResultados(locais);
    } finally {
      setLoading(false);
      setBuscou(true);
      if (saveToHistory && text.trim()) salvarHistorico(text.trim());
    }
  }, [token, myItems]);

  // IDs locais válidos para filtrar itens deletados
  const localIds = useMemo(() => new Set(myItems.map(i => `local-${i.id}`)), [myItems]);

  // Filtros aplicados com useMemo para garantir recálculo quando estado muda
  const filtrados = useMemo(() => {
    // Exclui itens locais que foram deletados de myItems
    let r = resultados.filter(p => !p.isLocal || localIds.has(p.id));

    if (catFiltro !== 'Todos') {
      r = r.filter(p =>
        p.categoria?.toLowerCase() === catFiltro.toLowerCase() ||
        p.brand?.toLowerCase() === catFiltro.toLowerCase()
      );
    }

    if (condicaoFiltro !== 'Todos') {
      r = r.filter(p => p.condicao === condicaoFiltro);
    }

    const min = parseFloat(precoMin.replace(',', '.'));
    const max = parseFloat(precoMax.replace(',', '.'));

    if (!isNaN(min) && min > 0) {
      r = r.filter(p => (p.convertedPrice ?? p.price ?? 0) >= min);
    }
    if (!isNaN(max) && max > 0) {
      r = r.filter(p => (p.convertedPrice ?? p.price ?? 0) <= max);
    }

    if (ordem === 'asc') {
      r = [...r].sort((a, b) =>
        (a.convertedPrice ?? a.price ?? 0) - (b.convertedPrice ?? b.price ?? 0)
      );
    } else if (ordem === 'desc') {
      r = [...r].sort((a, b) =>
        (b.convertedPrice ?? b.price ?? 0) - (a.convertedPrice ?? a.price ?? 0)
      );
    } else if (ordem === 'rating') {
      // Weighted score: avg * log(1 + count) to prevent single 5-star items from dominating
      r = [...r].sort((a, b) => {
        const keyA = a.brand || a.categoria || 'vendedor';
        const keyB = b.brand || b.categoria || 'vendedor';
        const avgA = getSellerAverage(keyA);
        const cntA = getSellerRatings(keyA).length;
        const avgB = getSellerAverage(keyB);
        const cntB = getSellerRatings(keyB).length;
        const scoreA = avgA * Math.log(1 + cntA);
        const scoreB = avgB * Math.log(1 + cntB);
        return scoreB - scoreA;
      });
    }

    return r;
  }, [resultados, localIds, catFiltro, condicaoFiltro, precoMin, precoMax, ordem]);

  // Extrai vendedores únicos dos resultados filtrados
  const sellers = useMemo(() => {
    if (!buscou || filtrados.length === 0) return [];
    const map = new Map();

    // Itens locais (do usuário atual)
    const locaisResult = filtrados.filter(p => p.isLocal);
    if (locaisResult.length > 0) {
      const sp = getStoreProfile();
      const name = sp?.nome || user?.name || 'Você';
      map.set('__local__', {
        key: '__local__',
        name,
        photo: sp?.foto || user?.photo || null,
        isLocal: true,
        productCount: locaisResult.length,
      });
    }

    // Itens do backend com sellerName
    filtrados.filter(p => !p.isLocal && p.sellerName).forEach(p => {
      const key = p.sellerName;
      if (map.has(key)) map.get(key).productCount++;
      else map.set(key, { key, name: p.sellerName, photo: null, isLocal: false, productCount: 1 });
    });

    return Array.from(map.values());
  }, [filtrados, buscou]);

  const hasFilters = catFiltro !== 'Todos' || condicaoFiltro !== 'Todos' || precoMin !== '' || precoMax !== '' || ordem !== 'default';
  const filtrosAtivos = (catFiltro !== 'Todos' ? 1 : 0) + (condicaoFiltro !== 'Todos' ? 1 : 0) + (precoMin || precoMax ? 1 : 0) + (ordem !== 'default' ? 1 : 0);

  function resetFiltros() {
    setCatFiltro('Todos');
    setCondicaoFiltro('Todos');
    setPrecoMin('');
    setPrecoMax('');
    setOrdem('default');
  }

  async function buscarTodos() {
    setLoading(true);
    const locais = myItems.filter(i => !i.backendId).map(localParaProduto);
    try {
      const remoto = await productAPI.getAll(token);
      setResultados([...locais, ...remoto.filter(r => !locais.some(l => l.description === r.description))]);
    } catch (_) {
      setResultados(locais);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setBuscou(true);
    }
  }

  async function abrirProduto(product) {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:recentlyViewed');
      const prev = stored ? JSON.parse(stored) : [];
      const sem = prev.filter(p => p.id !== product.id);
      await AsyncStorage.setItem('@eletrohub:recentlyViewed', JSON.stringify([product, ...sem].slice(0, 10)));
    } catch (_) {}
    navigation.navigate('ItemDetail', { product });
  }

  function renderItem({ item }) {
    const price = item.convertedPrice ?? item.price ?? 0;
    const bgColor = BRAND_COLORS[item.brand] || (item.isLocal ? '#2c7be5' : '#1a1a1a');
    return (
      <TouchableOpacity
        style={s.item}
        onPress={() => abrirProduto(item)}
        activeOpacity={0.8}
      >
        <View style={[s.thumb, { backgroundColor: bgColor }]}>
          {item.fotos?.[0] ? (
            <Image source={{ uri: item.fotos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name={item.isLocal ? 'storefront-outline' : 'cube-outline'} size={20} color="#fff" />
          )}
        </View>
        <View style={s.itemInfo}>
          <View style={s.itemTop}>
            <Text style={s.itemBrand}>{item.brand}</Text>
            {item.isLocal && (
              <View style={s.localTag}>
                <Text style={s.localTagText}>Meu anúncio</Text>
              </View>
            )}
            {item.condicao && (
              <View style={s.condicaoTag}>
                <Text style={s.condicaoTagText}>{item.condicao}</Text>
              </View>
            )}
          </View>
          <Text style={s.itemName} numberOfLines={1}>{item.description}</Text>
          <Text style={s.itemPrice}>{price > 0 ? formatBRL(price) : '—'}</Text>
          {(item.cidade || item.estado) && (
            <View style={s.itemLocRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={s.itemLocText}>{[item.cidade, item.estado].filter(Boolean).join(' - ')}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    );
  }

  // Estados da tela
  const mostrarVazio = !loading && buscou && resultados.length === 0;
  const mostrarSemFiltro = !loading && buscou && resultados.length > 0 && filtrados.length === 0;
  const mostrarResultados = !loading && filtrados.length > 0;
  const mostrarHistorico = !loading && !buscou;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Buscar</Text>
        {buscou && (
          <Text style={s.count}>
            {filtrados.length} de {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Barra de busca + filtro */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar produtos..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => buscar(query, true)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, hasFilters && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color={hasFilters ? colors.primaryText : colors.text} />
          {filtrosAtivos > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{filtrosAtivos}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Chips de filtros ativos */}
      {hasFilters && buscou && (
        <View style={s.activeFiltersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {catFiltro !== 'Todos' && (
              <TouchableOpacity style={s.activeChip} onPress={() => setCatFiltro('Todos')}>
                <Text style={s.activeChipText}>{catFiltro}</Text>
                <Ionicons name="close" size={12} color={colors.primaryText} />
              </TouchableOpacity>
            )}
            {condicaoFiltro !== 'Todos' && (
              <TouchableOpacity style={s.activeChip} onPress={() => setCondicaoFiltro('Todos')}>
                <Text style={s.activeChipText}>{condicaoFiltro}</Text>
                <Ionicons name="close" size={12} color={colors.primaryText} />
              </TouchableOpacity>
            )}
            {(precoMin || precoMax) && (
              <TouchableOpacity style={s.activeChip} onPress={() => { setPrecoMin(''); setPrecoMax(''); }}>
                <Text style={s.activeChipText}>
                  {precoMin ? `R$${precoMin}` : ''}{precoMin && precoMax ? ' – ' : ''}{precoMax ? `R$${precoMax}` : ''}
                </Text>
                <Ionicons name="close" size={12} color={colors.primaryText} />
              </TouchableOpacity>
            )}
            {ordem !== 'default' && (
              <TouchableOpacity style={s.activeChip} onPress={() => setOrdem('default')}>
                <Text style={s.activeChipText}>{ORDEM_OPTS.find(o => o.key === ordem)?.label}</Text>
                <Ionicons name="close" size={12} color={colors.primaryText} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.clearAllChip} onPress={resetFiltros}>
              <Text style={s.clearAllText}>Limpar filtros</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {loading && (
        <View style={s.center}>
          <ActivityIndicator color={colors.text} />
          <Text style={[s.hint, { color: colors.textMuted }]}>Buscando...</Text>
        </View>
      )}

      {/* Sem resultados na busca */}
      {mostrarVazio && (
        <View style={s.center}>
          <Ionicons name="search-outline" size={48} color={colors.borderStrong} />
          <Text style={s.emptyTitle}>Nenhum resultado</Text>
          <Text style={s.emptyText}>Tente outros termos de busca.</Text>
        </View>
      )}

      {/* Resultados filtrados zerados */}
      {mostrarSemFiltro && (
        <View style={s.center}>
          <Ionicons name="filter-outline" size={48} color={colors.borderStrong} />
          <Text style={s.emptyTitle}>Nenhum produto com esses filtros</Text>
          <Text style={s.emptyText}>Tente ajustar ou remover os filtros.</Text>
          <TouchableOpacity style={s.resetBtn} onPress={resetFiltros}>
            <Text style={s.resetBtnText}>Remover filtros</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Histórico */}
      {mostrarHistorico && (
        <ScrollView contentContainerStyle={s.histContainer}>
          {historico.length > 0 ? (
            <>
              <View style={s.histHeader}>
                <Text style={s.histTitle}>Buscas recentes</Text>
                <TouchableOpacity onPress={limparHistorico}>
                  <Text style={s.histClear}>Limpar</Text>
                </TouchableOpacity>
              </View>
              {historico.slice(0, 5).map((h, idx) => (
                <TouchableOpacity key={idx} style={s.histItem} onPress={() => buscar(h, true)}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={s.histText}>{h}</Text>
                  <Ionicons name="arrow-up-outline" size={14} color={colors.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={s.center}>
              <Ionicons name="search-outline" size={56} color={colors.borderStrong} />
              <Text style={s.emptyTitle}>Buscar produtos</Text>
              <Text style={s.emptyText}>Pesquise por nome, marca ou categoria</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Resultados */}
      {mostrarResultados && (
        <FlatList
          data={filtrados}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onScroll={e => onTabBarScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); buscarTodos(); }}
            />
          }
          ListHeaderComponent={sellers.length > 0 ? (
            <View style={s.sellersSection}>
              <Text style={s.sellersSectionTitle}>Vendedores</Text>
              {sellers.map(seller => {
                const initial = (seller.name || '?')[0].toUpperCase();
                const bgColor = seller.isLocal ? colors.primary : '#2c7be5';
                return (
                  <TouchableOpacity
                    key={seller.key}
                    style={s.sellerCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('SellerProfile', {
                      sellerKey: seller.key,
                      sellerName: seller.name,
                      isLocal: seller.isLocal,
                    })}
                  >
                    <View style={[s.sellerAvatar, { backgroundColor: bgColor }]}>
                      {seller.photo
                        ? <Image source={{ uri: seller.photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        : <Text style={s.sellerInitial}>{initial}</Text>}
                    </View>
                    <View style={s.sellerInfo}>
                      <Text style={s.sellerName}>{seller.name}</Text>
                      <Text style={s.sellerCount}>{seller.productCount} produto{seller.productCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
              <View style={s.sellersDivider} />
            </View>
          ) : null}
        />
      )}

      {/* Modal filtros */}
      <SwipeableModal visible={showFilters} onClose={() => setShowFilters(false)} style={{ backgroundColor: colors.surface, padding: 20, maxHeight: '90%' }}>
        <View style={s.filterHeader}>
          <Text style={s.filterTitle}>Filtros</Text>
          <TouchableOpacity onPress={resetFiltros}>
            <Text style={s.resetText}>Limpar tudo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <Text style={s.filterLabel}>Categoria</Text>
          <View style={s.chipsRow}>
            {CATEGORIAS_FILTRO.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.chip, catFiltro === c && s.chipActive]}
                onPress={() => setCatFiltro(c)}
              >
                {catFiltro === c && <Ionicons name="checkmark" size={12} color={colors.primaryText} style={{ marginRight: 2 }} />}
                <Text style={[s.chipText, catFiltro === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.filterLabel}>Condição</Text>
          <View style={s.chipsRow}>
            {['Todos', 'Novo', 'Seminovo', 'Usado'].map(c => (
              <TouchableOpacity
                key={c}
                style={[s.chip, condicaoFiltro === c && s.chipActive]}
                onPress={() => setCondicaoFiltro(c)}
              >
                {condicaoFiltro === c && <Ionicons name="checkmark" size={12} color={colors.primaryText} style={{ marginRight: 2 }} />}
                <Text style={[s.chipText, condicaoFiltro === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.filterLabel}>Faixa de preço (R$)</Text>
          <View style={s.priceRow}>
            <View style={s.priceInputWrap}>
              <Text style={s.priceInputLabel}>Mínimo</Text>
              <TextInput style={s.priceInput} value={precoMin} onChangeText={setPrecoMin}
                placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            </View>
            <View style={s.priceDash} />
            <View style={s.priceInputWrap}>
              <Text style={s.priceInputLabel}>Máximo</Text>
              <TextInput style={s.priceInput} value={precoMax} onChangeText={setPrecoMax}
                placeholder="∞" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            </View>
          </View>

          <Text style={s.filterLabel}>Ordenar por</Text>
          {ORDEM_OPTS.map(o => (
            <TouchableOpacity key={o.key} style={s.ordemItem} onPress={() => setOrdem(o.key)}>
              <Text style={[s.ordemText, ordem === o.key && { color: colors.text, fontWeight: '700' }]}>{o.label}</Text>
              <View style={[s.radio, ordem === o.key && { borderColor: colors.primary }]}>
                {ordem === o.key && <View style={[s.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        {buscou && (
          <View style={s.previewRow}>
            <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
            <Text style={s.previewText}>
              {filtrados.length} produto{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        <TouchableOpacity style={s.applyBtn} onPress={() => { setShowFilters(false); if (!buscou) buscarTodos(); }}>
          <Text style={s.applyText}>Ver resultados</Text>
        </TouchableOpacity>
      </SwipeableModal>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    count: { fontSize: 12, color: colors.textMuted },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: colors.inputBorder },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filterBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
    filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    activeFiltersRow: { paddingVertical: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    activeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    activeChipText: { fontSize: 12, color: colors.primaryText, fontWeight: '600' },
    clearAllChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.danger },
    clearAllText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
    list: { paddingHorizontal: 16, paddingBottom: TAB_BAR_INSET + 8, paddingTop: 0 },
    sellersSection: { paddingTop: 8, paddingBottom: 4 },
    sellersSectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
    sellerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
    sellerAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    sellerInitial: { color: '#fff', fontSize: 18, fontWeight: '800' },
    sellerInfo: { flex: 1 },
    sellerName: { fontSize: 15, fontWeight: '700', color: colors.text },
    sellerCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    sellersDivider: { height: 12 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 },
    thumb: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    itemInfo: { flex: 1 },
    itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    itemBrand: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600' },
    localTag: { backgroundColor: colors.info + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    localTagText: { fontSize: 10, color: colors.info, fontWeight: '700' },
    condicaoTag: { backgroundColor: colors.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
    condicaoTagText: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
    itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
    itemPrice: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 3 },
    itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    itemLocText: { fontSize: 11, color: colors.textMuted },
    histContainer: { padding: 20, flexGrow: 1 },
    histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    histTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    histClear: { fontSize: 13, color: colors.danger, fontWeight: '600' },
    histItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
    histText: { flex: 1, fontSize: 14, color: colors.textSecondary },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textSecondary },
    emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
    hint: { fontSize: 14 },
    resetBtn: { marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 10 },
    resetBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: '700' },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    resetText: { fontSize: 14, color: colors.danger, fontWeight: '600' },
    filterLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 20 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    chipTextActive: { color: colors.primaryText },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceInputWrap: { flex: 1 },
    priceInputLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 6 },
    priceInput: { borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg },
    priceDash: { width: 12, height: 2, backgroundColor: colors.borderStrong, marginTop: 16 },
    ordemItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    ordemText: { fontSize: 15, color: colors.textSecondary },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 12 },
    previewText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    applyBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    applyText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
