import { useState, useEffect } from "react";

interface Coordinates {
  lat: number;
  lon: number;
}

interface LocationData {
  coordinates: Coordinates | null;
  city: string | null;
  error: string | null;
  isLoading: boolean;
}

export const DEFAULT_LOCATION: Coordinates = {
  lat: 36.47, // Blida
  lon: 2.8287,
};

export const DEFAULT_CITY = "Blida";
export const UNKNOWN_LOCATION = "Unknown Location";

const CACHE_KEY = "wigggle-location-data";
const CACHE_EXPIRY = 3600 * 1000;

interface CacheData {
  coordinates: Coordinates;
  city: string;
  timestamp: number;
}

export function useLocation(): LocationData {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const pickFirstNonEmpty = (...values: unknown[]): string | null => {
      for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
          return value.trim();
        }
      }
      return null;
    };

    // BigDataCloud often returns "" for `city`/`locality` outside major
    // towns, but still populates `principalSubdivision` / `countryName`.
    const cityFromReverseGeocode = (
      data: Record<string, unknown>,
    ): string | null =>
      pickFirstNonEmpty(
        data?.city,
        data?.locality,
        data?.principalSubdivision,
        data?.countryName,
      );

    const cityFromIpLookup = (data: Record<string, unknown>): string | null =>
      pickFirstNonEmpty(data?.city, data?.region, data?.country);

    const readCache = (): CacheData | null => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        const parsedCache: CacheData = JSON.parse(cached);
        const now = Date.now();
        if (now - parsedCache.timestamp >= CACHE_EXPIRY) return null;
        // Ignore stale "Unknown Location" entries cached by older versions
        // so affected production users recover without clearing storage.
        if (
          !parsedCache.coordinates ||
          pickFirstNonEmpty(parsedCache.city) === null ||
          parsedCache.city === UNKNOWN_LOCATION
        ) {
          localStorage.removeItem(CACHE_KEY);
          return null;
        }
        return parsedCache;
      } catch (e) {
        console.error("Failed to parse location cache", e);
        try {
          localStorage.removeItem(CACHE_KEY);
        } catch {
          // Storage may be unavailable (SSR / private mode); ignore.
        }
        return null;
      }
    };

    const checkCacheAndFetch = async () => {
      // 1. Check LocalStorage Cache
      const parsedCache = readCache();
      if (parsedCache) {
        setCoordinates(parsedCache.coordinates);
        setCity(parsedCache.city);
        setIsLoading(false);
        return;
      }

      // 2. Helper to save cache (never cache an unknown city)
      const saveToCache = (coords: Coordinates, cityName: string) => {
        if (pickFirstNonEmpty(cityName) === null || cityName === UNKNOWN_LOCATION) {
          return;
        }
        try {
          const cacheData: CacheData = {
            coordinates: coords,
            city: cityName,
            timestamp: Date.now(),
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
          console.error("Failed to save location cache", e);
        }
      };

      // 3. Try Browser Geolocation
      if (!navigator.geolocation) {
        fallbackToIP("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lon: longitude };

          let cityName = UNKNOWN_LOCATION;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            );
            if (!response.ok) {
              throw new Error(`Reverse geocode failed: ${response.status}`);
            }
            const data = await response.json();
            cityName = cityFromReverseGeocode(data) ?? UNKNOWN_LOCATION;
          } catch (err) {
            console.error("Failed to fetch city name:", err);
          }

          setCoordinates(coords);
          setCity(cityName);
          saveToCache(coords, cityName);
          setIsLoading(false);
        },
        (err) => {
          console.warn(
            "Geolocation failed, attempting IP fallback:",
            err.message,
          );
          fallbackToIP(err.message);
        },
        { timeout: 10000, maximumAge: 600000 },
      );

      // 4. IP Fallback Strategy
      async function fallbackToIP(initialError: string) {
        try {
          const response = await fetch("https://ipwho.is/");
          if (!response.ok) {
            throw new Error(`IP Geolocation failed: ${response.status}`);
          }
          const data = await response.json();

          if (data.success !== false) {
            const coords = { lat: data.latitude, lon: data.longitude };
            const cityName =
              cityFromIpLookup(data) ?? UNKNOWN_LOCATION;

            if (
              typeof coords.lat !== "number" ||
              typeof coords.lon !== "number" ||
              cityName === UNKNOWN_LOCATION
            ) {
              throw new Error(data.message || "IP Geolocation failed");
            }

            setCoordinates(coords);
            setCity(cityName);
            setError(null);
            saveToCache(coords, cityName);
          } else {
            throw new Error(data.message || "IP Geolocation failed");
          }
        } catch (ipErr) {
          console.error(
            "IP Geolocation failed, defaulting to Blida:",
            ipErr,
          );
          setError(initialError);
          setCoordinates(DEFAULT_LOCATION);
          setCity(DEFAULT_CITY);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkCacheAndFetch();
  }, []);

  return { coordinates, city, error, isLoading };
}
