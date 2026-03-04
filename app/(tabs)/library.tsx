import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants/theme";

type SubjectWithCategory = {
  id: string;
  title: string;
  summary: string;
  status: string;
  closes_at: string | null;
  created_at: string;
  vote_categories: { name: string; color: string } | null;
};

export default function LibraryScreen() {
  const [subjects, setSubjects] = useState<SubjectWithCategory[]>([]);
  const [filtered, setFiltered] = useState<SubjectWithCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [search, selectedStatus, subjects]);

  const fetchAllSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, title, summary, status, closes_at, created_at, vote_categories (name, color)")
        .in("status", ["open", "closed", "archived"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubjects((data || []).map((s: any) => ({
        ...s,
        vote_categories: Array.isArray(s.vote_categories) ? s.vote_categories[0] || null : s.vote_categories,
      })) as SubjectWithCategory[]);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let result = subjects;

    if (selectedStatus !== "all") {
      result = result.filter((s) => s.status === selectedStatus);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.summary.toLowerCase().includes(query)
      );
    }

    setFiltered(result);
  };

  const statusFilters = [
    { key: "all", label: "Tous" },
    { key: "open", label: "En cours" },
    { key: "closed", label: "Terminés" },
    { key: "archived", label: "Archivés" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return "radio-button-on";
      case "closed": return "checkmark-circle";
      case "archived": return "archive";
      default: return "document";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return Colors.voteFor;
      case "closed": return Colors.textSecondary;
      case "archived": return Colors.textLight;
      default: return Colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un texte de loi..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres de statut */}
      <View style={styles.filters}>
        {statusFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, selectedStatus === f.key && styles.filterChipActive]}
            onPress={() => setSelectedStatus(f.key)}
          >
            <Text
              style={[styles.filterText, selectedStatus === f.key && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/subject/${item.id}`)}
          >
            <View style={styles.rowIcon}>
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={20}
                color={getStatusColor(item.status)}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.rowMeta}>
                {item.vote_categories && (
                  <Text style={[styles.rowCategory, { color: item.vote_categories.color || Colors.accent }]}>
                    {item.vote_categories.name}
                  </Text>
                )}
                <Text style={styles.rowDate}>
                  {new Date(item.created_at).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="search" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xxl },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  filterTextActive: { color: Colors.textOnPrimary, fontWeight: "bold" },
  list: { paddingHorizontal: Spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  rowIcon: { marginRight: Spacing.md },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  rowMeta: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
  rowCategory: { fontSize: FontSize.xs, fontWeight: "bold" },
  rowDate: { fontSize: FontSize.xs, color: Colors.textLight },
  emptyText: { marginTop: Spacing.md, color: Colors.textSecondary, fontSize: FontSize.md },
});
