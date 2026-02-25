import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;

export default function TokenDetailScreen() {
  const { mint } = useLocalSearchParams<{ mint: string }>();
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTokenInfo = async () => {
    try {
      const res = await fetch("https://api.devnet.solana.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenSupply",
          params: [mint],
        }),
      });
      const data = await res.json();
      setTokenInfo({
        mint: mint,
        supply: data.result.value.uiAmount || 0,
        decimals: data.result.value.decimals || 0,
      });
    } catch (error) {
      console.error("Error fetching token info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenInfo();
  }, [mint]);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>Token Details</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <Text style={{ color: "#888" }}>Loading token info...</Text>
        </View>
      ) : tokenInfo ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mint Address</Text>
          <Text style={styles.mintAddress}>{tokenInfo.mint}</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Supply</Text>
            <Text style={styles.infoValue}>{tokenInfo.supply}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Decimals</Text>
            <Text style={styles.infoValue}>{tokenInfo.decimals}</Text>
          </View>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              Linking.openURL(
                `https://explorer.solana.com/address/${mint}?cluster=devnet`,
              )
            }
          >
            <Text style={styles.linkButtonText}>View on Solana Explorer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={{ color: "#888" }}>No token info available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a1a",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  mintAddress: {
    color: "#9945FF",
    fontSize: 13,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    color: "#888",
    fontSize: 14,
  },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a3e",
  },
  linkButton: {
    backgroundColor: "#9945FF20",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  linkButtonText: {
    color: "#9945FF",
    fontSize: 14,
    fontWeight: "600",
  },
});
