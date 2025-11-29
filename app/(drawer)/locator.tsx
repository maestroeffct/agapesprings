import ScreenWrapper from "@/components/ScreenWrapper";
import TopBar from "@/components/Topbar";
import { getLocations } from "@/api/locations";
import { Location } from "@/types";
import { useTheme } from "@/store/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const STATIC_LOCATIONS: Location[] = [
  {
    name: "ALAGBAKA (HQTR)",
    address: "THE DOME, IGBATORO ROAD, NEAR SHOPRITE, AKURE",
    phone: "+234-706-7870-828",
  },
  {
    name: "OYEMEKUN",
    address: "ADE SUPER HOTEL, THE BIG HALL, OYEMEKUN ROAD, AKURE",
    phone: "+234-912-1004-863",
  },
  {
    name: "OKE-ARO",
    address:
      "GOLDEN TOSRICH EVENT CENTRE, KM7, IDANRE ROAD, AFUNBIOWO HOUSING ESTATE, OKE-ARO, AKURE",
    phone: "+234-807-3763-506",
  },
  {
    name: "ARAKALE",
    address:
      "AGAPESPRINGS AUDITORIUM, 22 ARAKALE ROAD, BESIDE NEPA MOTOR PARK, NEAR NEPA ROUNDABOUT, AKURE",
    phone: "+234-703-3888-621",
  },
  {
    name: "ODA ROAD",
    address:
      "AGAPESPRINGS AUDITORIUM, ILEKUN JUNCTION (BY CALVARY INT'L SCHOOL), ODA ROAD, AKURE",
    phone: "+234-706-2242-711",
  },
  {
    name: "ONDO",
    address: "ADE IGBO COMMUNITY HALL, ADEYEMI ROAD, SABO, ONDO CITY",
    phone: "+234-706-3541-020",
  },
  {
    name: "ILE-IFE 1",
    address: "ABENI HALL, BEHIND HILTON HOTEL OFF THE POLY, PARAKIN, ILE-IFE",
    phone: "+234-810-7668-295",
  },
  {
    name: "ILE-IFE 2",
    address:
      "MODAKEKE CARPENTERS UNION HALL, BESIDE EMBASSY ELECTRONIC SHOW ROOM, ONDO ROAD, ILE-IFE",
    phone: "+234-810-9918-695",
  },
  {
    name: "ILE-IFE 3",
    address: "SUB COMMON ROOM, OAU CAMPUS, ILE-IFE",
    phone: "+234-810-7668-295",
  },
  {
    name: "BENIN 1",
    address: "PRESTIGE HOTEL, NO 1 IHAMA ROAD, BENIN CITY",
    phone: "+234-816-5106-808",
  },
  {
    name: "BENIN 2",
    address: "EKODOSIN MINIMART, NO.8 NEWTON STREET, EKODOSIN, BENIN",
    phone: "+234-906-3999-888",
  },
  {
    name: "OWO",
    address: "CBT CENTER, ACHIEVERS UNIVERSITY, OWO",
    phone: "+234-816-5116-942",
  },
  {
    name: "OKE-IJEBU",
    address:
      "CHRIST EVENT CENTER (GLASS HOUSE), AFTER MABEST SCHOOL, OKE-IJEBU, AKURE",
    phone: "+234-816-5116-942",
  },
  {
    name: "FUTA",
    address:
      "YEMDEFI EVENTS CENTRE, NEAR DORCAS HOSTEL, OFF FUTA NORTH GATE, AKURE",
    phone: "+234-816-5116-942",
  },
];

export default function Locator() {
  const { colors } = useTheme();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>(STATIC_LOCATIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getLocations();
      if (data && data.length > 0) {
        setLocations(data);
      }
      setLoading(false);
    })();
  }, []);

  const openMap = (location: Location) => {
    const target =
      location.mapUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        location.address
      )}`;
    const url = target.trim();
    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => openMap(item)}
      activeOpacity={0.8}
    >
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.address, { color: colors.subtitle }]}>
        {item.address}
      </Text>
      <Text style={[styles.phone, { color: colors.primary }]}>
        {item.phone}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      statusBarColor={colors.background}
      barStyle={
        colors.background === "#111827" ? "light-content" : "dark-content"
      }
    >
      <TopBar
        title="Church Locator"
        leftIcons={[{ name: "arrow-back", onPress: () => router.back() }]}
      />

      <FlatList
        data={locations}
        renderItem={renderItem}
        keyExtractor={(item, idx) =>
          item.id ? String(item.id) : idx.toString()
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={[styles.empty, { color: colors.subtitle }]}>
              No locations found.
            </Text>
          )
        }
        refreshing={loading}
        onRefresh={async () => {
          setLoading(true);
          const data = await getLocations();
          setLocations(data.length ? data : STATIC_LOCATIONS);
          setLoading(false);
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    fontWeight: "600",
  },
  empty: { textAlign: "center", marginTop: 32, fontSize: 14 },
});
