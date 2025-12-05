import { useEffect, useState } from "react";
import Constants from "expo-constants";
import { Platform } from "react-native";
import apiClient from "@/api/client";

type MinVersion = {
  android?: string;
  ios?: string;
};

const compareVersions = (a?: string, b?: string) => {
  if (!a || !b) return 0;
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
};

export function useMinimumVersion() {
  const [required, setRequired] = useState<MinVersion | null>(null);
  const [outdated, setOutdated] = useState(false);
  const [storeUrls, setStoreUrls] = useState<{ android?: string; ios?: string }>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get("/config");
        const minVersion: MinVersion = res.data?.data?.minVersion || {};
        const urls = res.data?.data?.storeUrls || {};
        if (!mounted) return;
        setRequired(minVersion);
        setStoreUrls(urls);

        const current =
          Platform.OS === "ios"
            ? Constants.nativeAppVersion
            : Constants.expoConfig?.version || Constants.nativeAppVersion;
        const requiredVersion =
          Platform.OS === "ios" ? minVersion.ios : minVersion.android;

        if (compareVersions(requiredVersion, current || "") === 1) {
          setOutdated(true);
        }
      } catch (err) {
        // ignore errors, assume OK
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { required, outdated, storeUrls };
}
