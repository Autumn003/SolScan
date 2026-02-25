import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text, // 💡 Web: <p>, <h1>, <span> → RN: everything is <Text>
  TextInput, // 💡 Web: <input> → RN: <TextInput>
  TouchableOpacity, // 💡 Web: <button> → RN: <TouchableOpacity>
  FlatList, // 💡 Web: .map() → RN: <FlatList> (virtualized!)
  ScrollView, // 💡 Web: overflow scroll → RN: <ScrollView>
  ActivityIndicator,
  StyleSheet, // 💡 Web: CSS file → RN: StyleSheet.create()
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";

// ============================================
// Solana RPC — just fetch()! Same as MERN.
// No SDK needed for read-only.
// ============================================

const RPC = "https://api.devnet.solana.com";

const rpc = async (method: string, params: any[]) => {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.result;
};

const getBalance = async (address: string) => {
  const res = await rpc("getBalance", [address]);
  return res.value / 1_000_000_000; // Convert lamports to SOL
};

const getTokens = async (address: string) => {
  const res = await rpc("getTokenAccountsByOwner", [
    address,
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
    {
      encoding: "jsonParsed",
    },
  ]);

  return (res.value || []).map((item: any) => ({
    mint: item.account.data.parsed.info.mint,
    amount: item.account.data.parsed.info.tokenAmount.uiAmountString,
  }));
};

const getTransactions = async (address: string) => {
  const res = await rpc("getSignaturesForAddress", [address, { limit: 10 }]);
  return res.map((item: any) => ({
    sign: item.signature,
    time: item.blockTime,
    ok: !item.err,
  }));
};

// ============================================
// Helper
// ============================================

const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;

const timeAgo = (ts: number) => {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ============================================
// App
// ============================================

export default function WalletScreen() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const search = async () => {
    const addr = address.trim();
    if (!addr) return Alert.alert("Please enter a wallet address.");

    setLoading(true);

    try {
      const [bal, toks, txns] = await Promise.all([
        getBalance(addr),
        getTokens(addr),
        getTransactions(addr),
      ]);
      setBalance(bal);
      setTokens(toks);
      setTransactions(txns);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const demo = () => {
    const demoAddr = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
    setAddress(demoAddr);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>SolScan Clone</Text>
        <Text style={s.subtitle}>
          Enter a Solana wallet address to view its balance and recent
          transactions.
        </Text>
        <View style={s.inputContainer}>
          <TextInput
            style={s.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Wallet Address"
            placeholderTextColor="#6B7280"
          ></TextInput>
        </View>
        <View style={s.btnRow}>
          <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
            <Text style={s.btnText}>View Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnGhost}
            onPress={demo}
            disabled={loading}
          >
            <Text style={s.btnGhostText}>Demo</Text>
          </TouchableOpacity>
        </View>
        {balance && (
          <View style={s.card}>
            <Text style={s.label}>Wallet Balance</Text>
            <View style={s.balanceRow}>
              <Text style={s.balance}>{balance?.toFixed(4)}</Text>
              <Text style={s.sol}>SOL</Text>
            </View>
            <Text style={s.addr}>{short(address.trim(), 6)}</Text>
          </View>
        )}

        {tokens.length > 0 && (
          <View>
            <Text style={s.section}>Tokens</Text>
            <FlatList
              data={tokens}
              keyExtractor={(item) => item.mint}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.row}
                  onPress={() => router.push(`/token/${item.mint}`)}
                >
                  <Text style={s.mint}>{short(item.mint, 8)}</Text>
                  <Text style={s.amount}>{item.amount}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {transactions.length > 0 && (
          <View>
            <Text style={s.section}>Recent Transactions</Text>
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.sign}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.row}
                  onPress={() =>
                    Linking.openURL(`https://solscan.io/tx/${item.sign}`)
                  }
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={s.mint}>{short(item.sign, 8)}</Text>
                    <Text style={s.time}>
                      {item.time ? timeAgo(item.time) : "pending"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.statusIcon,
                      { color: item.ok ? "#14F195" : "#EF4444" },
                    ]}
                  >
                    {item.ok ? "+" : "-"}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// 💡 Web: CSS file with class names
//    RN: StyleSheet.create() with camelCase, no units
//    Every View is flexbox (direction: column) by default!
// ============================================

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0D12",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    marginBottom: 28,
    fontWeight: "400",
  },

  inputContainer: {
    backgroundColor: "#16161D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A35",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 14,
    fontWeight: "400",
  },

  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    backgroundColor: "#14F195",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#14F195",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#0D0D12",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  btnGhost: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#16161D",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  btnGhostText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#16161D",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  label: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  sol: {
    color: "#14F195",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  addr: {
    color: "#9945FF",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 16,
    backgroundColor: "#1E1E28",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },

  section: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 32,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#16161D",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  mint: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  amount: {
    color: "#14F195",
    fontSize: 15,
    fontWeight: "600",
  },
  time: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "400",
  },
  statusIcon: {
    fontSize: 18,
    fontWeight: "600",
  },
});
