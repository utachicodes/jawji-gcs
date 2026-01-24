import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfigSchema, type AppConfig } from "./types";
import { logger } from "../utils/logger";
import {
  CONFIG_NAME,
  SUPABASE_ACTIVE_CONFIG_TABLE,
  SUPABASE_KEY,
  SUPABASE_RETRY_ATTEMPTS,
  SUPABASE_RETRY_DELAY_MS,
  SUPABASE_URL,
} from "./env";

interface SupabaseConfigRow {
  id?: string;
  name?: string;
  config?: AppConfig;
  mqtt?: AppConfig["mqtt"];
  stream?: AppConfig["stream"];
  devices?: AppConfig["devices"];
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

let client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase is not configured. Please set SUPABASE_URL and a valid key."
    );
  }

  client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-client-info": "mqtt-streamer",
      },
    },
  });

  return client;
}

async function fetchConfigurations(): Promise<SupabaseConfigRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(SUPABASE_ACTIVE_CONFIG_TABLE)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Supabase query failed", { error });
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      `No configurations found in Supabase table "${SUPABASE_ACTIVE_CONFIG_TABLE}".`
    );
  }

  return data as SupabaseConfigRow[];
}

async function fetchWithRetry(attempt = 1): Promise<SupabaseConfigRow[]> {
  try {
    return await fetchConfigurations();
  } catch (error) {
    if (attempt >= SUPABASE_RETRY_ATTEMPTS) {
      throw error;
    }

    const delay = SUPABASE_RETRY_DELAY_MS * attempt;
    logger.warn(
      `Supabase fetch attempt ${attempt} failed: ${
        (error as Error).message
      }. Retrying in ${delay}ms`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(attempt + 1);
  }
}

function selectConfiguration(
  rows: SupabaseConfigRow[],
  configName: string
): SupabaseConfigRow {
  if (!rows.length) {
    throw new Error(
      `No Supabase configurations available in table "${SUPABASE_ACTIVE_CONFIG_TABLE}".`
    );
  }

  const byActive =
    rows.find((row) => row.is_active ?? row.isActive) ?? null;
  if (byActive) {
    return byActive;
  }

  const byName =
    rows.find((row) => row.name?.toLowerCase() === configName.toLowerCase()) ??
    rows.find((row) => row.name === configName);

  if (byName) {
    return byName;
  }

  const fallback = rows[0];

  if (!fallback) {
    throw new Error(
      `Supabase table "${SUPABASE_ACTIVE_CONFIG_TABLE}" did not return any configuration rows.`
    );
  }

  return fallback;
}

function normalizeConfig(row: SupabaseConfigRow): AppConfig {
  if (row.config) {
    return row.config;
  }

  if (row.mqtt && row.stream && row.devices) {
    return {
      mqtt: row.mqtt,
      stream: row.stream,
      devices: row.devices,
    };
  }

  throw new Error(
    `Supabase configuration "${row.name ?? "unknown"}" is missing required fields.`
  );
}

export async function loadAppConfigFromSupabase(
  configName: string = CONFIG_NAME
): Promise<AppConfig> {
  logger.info("Loading configuration from Supabase", {
    table: SUPABASE_ACTIVE_CONFIG_TABLE,
    configName,
  });

  const rows = await fetchWithRetry();
  const selectedRow = selectConfiguration(rows, configName);
  const configPayload = normalizeConfig(selectedRow);
  const appConfig = AppConfigSchema.parse(configPayload);

  logger.info("Supabase configuration loaded", {
    configName: selectedRow.name ?? configName,
    deviceCount: appConfig.devices.length,
    mqttEndpoint: appConfig.mqtt.endpoint,
  });

  return appConfig;
}

