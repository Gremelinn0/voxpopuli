import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants/theme";

type Stats = {
  totalVotes: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  argumentsSubmitted: number;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalVotes: 0,
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    argumentsSubmitted: 0,
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [votesResult, argsResult] = await Promise.all([
        supabase.from("votes").select("value").eq("user_id", user.id),
        supabase.from("arguments").select("id").eq("author_id", user.id),
      ]);

      const votes = votesResult.data || [];
      setStats({
        totalVotes: votes.length,
        votesFor: votes.filter((v) => v.value === "for").length,
        votesAgainst: votes.filter((v) => v.value === "against").length,
        votesAbstain: votes.filter((v) => v.value === "abstain").length,
        argumentsSubmitted: argsResult.data?.length || 0,
      });
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: signOut },
    ]);
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Citoyen";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar & Nom */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Ma participation</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalVotes}</Text>
            <Text style={styles.statLabel}>Votes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.voteFor }]}>{stats.votesFor}</Text>
            <Text style={styles.statLabel}>Pour</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.voteAgainst }]}>{stats.votesAgainst}</Text>
            <Text style={styles.statLabel}>Contre</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.voteAbstain }]}>{stats.votesAbstain}</Text>
            <Text style={styles.statLabel}>Abst.</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.accent} />
          <Text style={styles.statRowText}>
            {stats.argumentsSubmitted} argument{stats.argumentsSubmitted !== 1 ? "s" : ""} soumis
          </Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          <Text style={styles.menuText}>Préférences de notification</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
          <Text style={styles.menuText}>Confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={22} color={Colors.text} />
          <Text style={styles.menuText}>À propos de VoxPopuli</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Bouton déconnexion */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.version}>VoxPopuli v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  header: { alignItems: "center", marginBottom: Spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: FontSize.title, fontWeight: "bold" },
  name: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text, marginTop: Spacing.md },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  statsGrid: { flexDirection: "row", justifyContent: "space-around", marginBottom: Spacing.md },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  statRowText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  menuCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  menuItem: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: Spacing.md },
  menuText: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: { fontSize: FontSize.md, color: Colors.error, fontWeight: "600" },
  version: { textAlign: "center", color: Colors.textLight, fontSize: FontSize.xs, marginTop: Spacing.lg },
});
