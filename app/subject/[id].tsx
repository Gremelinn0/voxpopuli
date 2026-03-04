import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants/theme";

type Subject = {
  id: string;
  title: string;
  summary: string;
  full_text: string | null;
  pdf_url: string | null;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  source_url: string | null;
  created_at: string;
};

type Argument = {
  id: string;
  subject_id: string;
  position: "for" | "against";
  title: string;
  body: string;
  upvotes: number;
  created_at: string;
};
type VoteValue = "for" | "against" | "abstain";

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [args, setArgs] = useState<Argument[]>([]);
  const [userVote, setUserVote] = useState<VoteValue | null>(null);
  const [voteStats, setVoteStats] = useState({ for: 0, against: 0, abstain: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      await Promise.all([fetchSubject(), fetchArguments(), fetchUserVote(), fetchVoteStats()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubject = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", id)
      .single();
    if (data) setSubject(data);
  };

  const fetchArguments = async () => {
    const { data } = await supabase
      .from("arguments")
      .select("*")
      .eq("subject_id", id)
      .order("upvotes", { ascending: false });
    if (data) setArgs(data);
  };

  const fetchUserVote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("votes")
      .select("value")
      .eq("subject_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setUserVote(data.value as VoteValue);
  };

  const fetchVoteStats = async () => {
    const { data } = await supabase
      .from("votes")
      .select("value")
      .eq("subject_id", id);

    if (data) {
      setVoteStats({
        for: data.filter((v) => v.value === "for").length,
        against: data.filter((v) => v.value === "against").length,
        abstain: data.filter((v) => v.value === "abstain").length,
        total: data.length,
      });
    }
  };

  const handleVote = async (value: VoteValue) => {
    if (userVote) {
      Alert.alert("Déjà voté", "Vous avez déjà voté sur ce sujet.");
      return;
    }

    if (subject?.status !== "open") {
      Alert.alert("Vote fermé", "Ce vote n'est plus ouvert.");
      return;
    }

    const voteLabel = value === "for" ? "POUR" : value === "against" ? "CONTRE" : "ABSTENTION";

    Alert.alert(
      "Confirmer votre vote",
      `Vous votez ${voteLabel}.\n\nCette action est définitive.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: `Voter ${voteLabel}`,
          onPress: async () => {
            setVoting(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Non connecté");

              const { error } = await supabase.from("votes").insert({
                subject_id: id,
                user_id: user.id,
                value,
              });

              if (error) throw error;

              setUserVote(value);
              await fetchVoteStats();

              Alert.alert(
                "Vote enregistré !",
                "Votre vote a bien été pris en compte. Merci pour votre participation civique.",
              );
            } catch (error: any) {
              Alert.alert("Erreur", error.message || "Impossible de voter.");
            } finally {
              setVoting(false);
            }
          },
        },
      ]
    );
  };

  const getPercentage = (count: number) => {
    if (voteStats.total === 0) return 0;
    return Math.round((count / voteStats.total) * 100);
  };

  const argsFor = args.filter((a) => a.position === "for");
  const argsAgainst = args.filter((a) => a.position === "against");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={styles.centered}>
        <Text>Sujet introuvable</Text>
      </View>
    );
  }

  const isOpen = subject.status === "open";

  return (
    <>
      <Stack.Screen options={{ title: "Sujet de vote", headerBackTitle: "Retour" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Titre et résumé */}
        <Text style={styles.title}>{subject.title}</Text>
        <Text style={styles.summary}>{subject.summary}</Text>

        {/* Texte complet */}
        {subject.full_text && (
          <TouchableOpacity
            style={styles.fullTextToggle}
            onPress={() => setShowFullText(!showFullText)}
          >
            <Ionicons
              name={showFullText ? "chevron-up" : "document-text-outline"}
              size={18}
              color={Colors.accent}
            />
            <Text style={styles.fullTextToggleText}>
              {showFullText ? "Masquer le texte complet" : "Lire le texte complet"}
            </Text>
          </TouchableOpacity>
        )}
        {showFullText && subject.full_text && (
          <View style={styles.fullTextBox}>
            <Text style={styles.fullText}>{subject.full_text}</Text>
          </View>
        )}

        {/* Section de vote */}
        <View style={styles.voteSection}>
          <Text style={styles.sectionTitle}>
            {userVote ? "Votre vote" : isOpen ? "Votez maintenant" : "Vote terminé"}
          </Text>

          {/* Barres de résultats */}
          {(userVote || !isOpen) && voteStats.total > 0 && (
            <View style={styles.resultsBox}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Pour</Text>
                <View style={styles.resultBarBg}>
                  <View style={[styles.resultBar, styles.barFor, { width: `${getPercentage(voteStats.for)}%` }]} />
                </View>
                <Text style={styles.resultPct}>{getPercentage(voteStats.for)}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Contre</Text>
                <View style={styles.resultBarBg}>
                  <View style={[styles.resultBar, styles.barAgainst, { width: `${getPercentage(voteStats.against)}%` }]} />
                </View>
                <Text style={styles.resultPct}>{getPercentage(voteStats.against)}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Abst.</Text>
                <View style={styles.resultBarBg}>
                  <View style={[styles.resultBar, styles.barAbstain, { width: `${getPercentage(voteStats.abstain)}%` }]} />
                </View>
                <Text style={styles.resultPct}>{getPercentage(voteStats.abstain)}%</Text>
              </View>
              <Text style={styles.totalText}>{voteStats.total} votes au total</Text>
            </View>
          )}

          {/* Boutons de vote */}
          {isOpen && !userVote && (
            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[styles.voteBtn, styles.voteBtnFor]}
                onPress={() => handleVote("for")}
                disabled={voting}
              >
                <Ionicons name="thumbs-up" size={24} color="#FFF" />
                <Text style={styles.voteBtnText}>POUR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.voteBtn, styles.voteBtnAgainst]}
                onPress={() => handleVote("against")}
                disabled={voting}
              >
                <Ionicons name="thumbs-down" size={24} color="#FFF" />
                <Text style={styles.voteBtnText}>CONTRE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.voteBtn, styles.voteBtnAbstain]}
                onPress={() => handleVote("abstain")}
                disabled={voting}
              >
                <Ionicons name="remove-circle" size={24} color="#FFF" />
                <Text style={styles.voteBtnText}>ABSTENTION</Text>
              </TouchableOpacity>
            </View>
          )}

          {userVote && (
            <View style={[
              styles.votedConfirm,
              {
                backgroundColor:
                  userVote === "for" ? Colors.voteFor :
                  userVote === "against" ? Colors.voteAgainst :
                  Colors.voteAbstain,
              },
            ]}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.votedConfirmText}>
                Vous avez voté {userVote === "for" ? "POUR" : userVote === "against" ? "CONTRE" : "ABSTENTION"}
              </Text>
            </View>
          )}
        </View>

        {/* Arguments Pour / Contre */}
        <View style={styles.argsSection}>
          <Text style={styles.sectionTitle}>Arguments</Text>

          {/* Pour */}
          <View style={styles.argColumn}>
            <View style={[styles.argHeader, { backgroundColor: Colors.voteFor }]}>
              <Ionicons name="thumbs-up" size={16} color="#FFF" />
              <Text style={styles.argHeaderText}>Pour ({argsFor.length})</Text>
            </View>
            {argsFor.map((arg) => (
              <View key={arg.id} style={styles.argCard}>
                <Text style={styles.argTitle}>{arg.title}</Text>
                <Text style={styles.argBody}>{arg.body}</Text>
                <View style={styles.argFooter}>
                  <Ionicons name="arrow-up" size={14} color={Colors.textSecondary} />
                  <Text style={styles.argUpvotes}>{arg.upvotes}</Text>
                </View>
              </View>
            ))}
            {argsFor.length === 0 && (
              <Text style={styles.noArgs}>Aucun argument pour le moment</Text>
            )}
          </View>

          {/* Contre */}
          <View style={styles.argColumn}>
            <View style={[styles.argHeader, { backgroundColor: Colors.voteAgainst }]}>
              <Ionicons name="thumbs-down" size={16} color="#FFF" />
              <Text style={styles.argHeaderText}>Contre ({argsAgainst.length})</Text>
            </View>
            {argsAgainst.map((arg) => (
              <View key={arg.id} style={styles.argCard}>
                <Text style={styles.argTitle}>{arg.title}</Text>
                <Text style={styles.argBody}>{arg.body}</Text>
                <View style={styles.argFooter}>
                  <Ionicons name="arrow-up" size={14} color={Colors.textSecondary} />
                  <Text style={styles.argUpvotes}>{arg.upvotes}</Text>
                </View>
              </View>
            ))}
            {argsAgainst.length === 0 && (
              <Text style={styles.noArgs}>Aucun argument pour le moment</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  summary: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.lg },
  fullTextToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  fullTextToggleText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "600" },
  fullTextBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  fullText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 22 },

  // Vote section
  voteSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  voteButtons: { gap: Spacing.sm },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  voteBtnFor: { backgroundColor: Colors.voteFor },
  voteBtnAgainst: { backgroundColor: Colors.voteAgainst },
  voteBtnAbstain: { backgroundColor: Colors.voteAbstain },
  voteBtnText: { color: "#FFF", fontSize: FontSize.lg, fontWeight: "bold" },
  votedConfirm: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  votedConfirmText: { color: "#FFF", fontSize: FontSize.md, fontWeight: "bold" },

  // Résultats
  resultsBox: { marginBottom: Spacing.md },
  resultRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, gap: Spacing.sm },
  resultLabel: { width: 50, fontSize: FontSize.sm, color: Colors.textSecondary },
  resultBarBg: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: "hidden" },
  resultBar: { height: "100%", borderRadius: 4 },
  barFor: { backgroundColor: Colors.voteFor },
  barAgainst: { backgroundColor: Colors.voteAgainst },
  barAbstain: { backgroundColor: Colors.voteAbstain },
  resultPct: { width: 40, fontSize: FontSize.sm, color: Colors.text, fontWeight: "bold", textAlign: "right" },
  totalText: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: "center", marginTop: Spacing.xs },

  // Arguments
  argsSection: { marginBottom: Spacing.lg },
  argColumn: { marginBottom: Spacing.md },
  argHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  argHeaderText: { color: "#FFF", fontSize: FontSize.sm, fontWeight: "bold" },
  argCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  argTitle: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.xs },
  argBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  argFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: Spacing.sm },
  argUpvotes: { fontSize: FontSize.xs, color: Colors.textSecondary },
  noArgs: { fontSize: FontSize.sm, color: Colors.textLight, fontStyle: "italic", padding: Spacing.sm },
});
