import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants/theme";

type Subject = {
  id: string;
  title: string;
  summary: string;
  status: string;
  closes_at: string | null;
  created_at: string;
  vote_categories: { name: string; color: string; icon: string } | null;
  vote_count: number;
  user_vote: string | null;
};

export default function FeedScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchSubjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("subjects")
        .select(`
          *,
          vote_categories (name, color, icon)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Récupérer les votes de l'utilisateur et les compteurs
      if (data && user) {
        const subjectIds = data.map((s) => s.id);

        const [votesResult, userVotesResult] = await Promise.all([
          supabase
            .from("votes")
            .select("subject_id")
            .in("subject_id", subjectIds),
          supabase
            .from("votes")
            .select("subject_id, value")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
        ]);

        const voteCounts: Record<string, number> = {};
        votesResult.data?.forEach((v) => {
          voteCounts[v.subject_id] = (voteCounts[v.subject_id] || 0) + 1;
        });

        const userVotes: Record<string, string> = {};
        userVotesResult.data?.forEach((v) => {
          userVotes[v.subject_id] = v.value;
        });

        setSubjects(
          data.map((s) => ({
            ...s,
            vote_count: voteCounts[s.id] || 0,
            user_vote: userVotes[s.id] || null,
          })) as Subject[]
        );
      } else {
        setSubjects((data || []).map((s) => ({ ...s, vote_count: 0, user_vote: null })) as Subject[]);
      }
    } catch (error) {
      console.error("Erreur chargement sujets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubjects();
  }, [fetchSubjects]);

  const getTimeRemaining = (closesAt: string | null) => {
    if (!closesAt) return null;
    const diff = new Date(closesAt).getTime() - Date.now();
    if (diff <= 0) return "Terminé";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h restants`;
    return `${hours}h restantes`;
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/subject/${item.id}`)}
      activeOpacity={0.7}
    >
      {/* Catégorie badge */}
      {item.vote_categories && (
        <View style={[styles.categoryBadge, { backgroundColor: item.vote_categories.color || Colors.accent }]}>
          <Text style={styles.categoryText}>{item.vote_categories.name}</Text>
        </View>
      )}

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSummary} numberOfLines={3}>
        {item.summary}
      </Text>

      {/* Footer de la carte */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerText}>{item.vote_count} votes</Text>
        </View>

        {item.closes_at && (
          <View style={styles.footerRight}>
            <Ionicons name="time-outline" size={16} color={Colors.warning} />
            <Text style={[styles.footerText, { color: Colors.warning }]}>
              {getTimeRemaining(item.closes_at)}
            </Text>
          </View>
        )}

        {/* Indicateur "déjà voté" */}
        {item.user_vote && (
          <View style={[
            styles.votedBadge,
            {
              backgroundColor:
                item.user_vote === "for" ? Colors.voteFor :
                item.user_vote === "against" ? Colors.voteAgainst :
                Colors.voteAbstain,
            },
          ]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
            <Text style={styles.votedText}>Voté</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des sujets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={subjects}
        renderItem={renderSubject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="document-text-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun sujet ouvert</Text>
            <Text style={styles.emptyText}>
              Les prochains sujets de vote apparaîtront ici.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
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
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    color: "#FFF",
    fontSize: FontSize.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  cardSummary: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  votedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  votedText: {
    color: "#FFF",
    fontSize: FontSize.xs,
    fontWeight: "bold",
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
