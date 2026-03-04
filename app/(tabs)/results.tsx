import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants/theme";

type SubjectResult = {
  id: string;
  title: string;
  status: string;
  closes_at: string | null;
  vote_categories: { name: string; color: string } | null;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_votes: number;
};

export default function ResultsScreen() {
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      // Récupérer les sujets fermés avec les résultats
      const { data: subjects, error } = await supabase
        .from("subjects")
        .select("id, title, status, closes_at, vote_categories (name, color)")
        .in("status", ["closed", "open"])
        .order("closes_at", { ascending: false });

      if (error) throw error;

      if (subjects) {
        // Récupérer les résultats agrégés
        const { data: voteData } = await supabase
          .from("subject_results")
          .select("*");

        const voteMap: Record<string, any> = {};
        voteData?.forEach((v) => {
          voteMap[v.subject_id] = v;
        });

        setResults(
          subjects.map((s: any) => ({
            id: s.id,
            title: s.title,
            status: s.status,
            closes_at: s.closes_at,
            vote_categories: Array.isArray(s.vote_categories) ? s.vote_categories[0] || null : s.vote_categories,
            votes_for: voteMap[s.id]?.votes_for || 0,
            votes_against: voteMap[s.id]?.votes_against || 0,
            votes_abstain: voteMap[s.id]?.votes_abstain || 0,
            total_votes: voteMap[s.id]?.total_votes || 0,
          }))
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const renderResult = ({ item }: { item: SubjectResult }) => {
    const forPct = getPercentage(item.votes_for, item.total_votes);
    const againstPct = getPercentage(item.votes_against, item.total_votes);
    const abstainPct = getPercentage(item.votes_abstain, item.total_votes);
    const winner = item.votes_for > item.votes_against ? "for" : item.votes_against > item.votes_for ? "against" : "tie";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/subject/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          {item.vote_categories && (
            <View style={[styles.badge, { backgroundColor: item.vote_categories.color || Colors.accent }]}>
              <Text style={styles.badgeText}>{item.vote_categories.name}</Text>
            </View>
          )}
          {item.status === "closed" && (
            <View style={styles.closedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.textSecondary} />
              <Text style={styles.closedText}>Terminé</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        {/* Barre de résultat */}
        <View style={styles.barContainer}>
          <View style={[styles.bar, styles.barFor, { flex: forPct || 1 }]} />
          <View style={[styles.bar, styles.barAgainst, { flex: againstPct || 1 }]} />
          {abstainPct > 0 && (
            <View style={[styles.bar, styles.barAbstain, { flex: abstainPct }]} />
          )}
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.voteFor }]} />
            <Text style={styles.legendText}>Pour {forPct}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.voteAgainst }]} />
            <Text style={styles.legendText}>Contre {againstPct}%</Text>
          </View>
          {abstainPct > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.voteAbstain }]} />
              <Text style={styles.legendText}>Abst. {abstainPct}%</Text>
            </View>
          )}
        </View>

        <Text style={styles.totalVotes}>
          {item.total_votes} vote{item.total_votes !== 1 ? "s" : ""}
        </Text>
      </TouchableOpacity>
    );
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
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="bar-chart-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>Les résultats apparaîtront ici après les votes.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xxl },
  list: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: { color: "#FFF", fontSize: FontSize.xs, fontWeight: "bold" },
  closedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  closedText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  barContainer: {
    flexDirection: "row",
    height: 12,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    gap: 2,
  },
  bar: { borderRadius: BorderRadius.full },
  barFor: { backgroundColor: Colors.voteFor },
  barAgainst: { backgroundColor: Colors.voteAgainst },
  barAbstain: { backgroundColor: Colors.voteAbstain },
  legend: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  totalVotes: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: Spacing.sm, textAlign: "right" },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm },
});
