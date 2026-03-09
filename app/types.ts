export type MapMode = "uvi" | "uvi+yield" | "yield";

export interface HexProperties {
  h3_index: string;
  uvi_score: number | null;
  uvi_rank: number;
  uvi_percentile: number;
  yield_score: number | null;
  yield_label:
    | "Accelerating"
    | "Stable"
    | "Stagnating"
    | "Low Confidence"
    | "Structurally Constrained — Flood Zone"
    | "Structurally Constrained — Historic District"
    | "Structurally Constrained — Flood + Historic"
    | null;
  permit_count: number;
  active_permit_count: number;
  business_count: number;
  primary_zoning: string | null;
  vacant_count: number;
  total_declared_value: number | null;
  avg_declared_value: number | null;
  zillow_avg_price_sqft: number | null;
  gmaps_avg_rating: number | null;
  service_request_count: number;
  chronic_case_count: number;
  dominant_311_type_breakdown: Record<string, number>;
  is_flood_zone: boolean;
  is_historic_district: boolean;
  is_infrastructure_priority: boolean;
  is_infill_opportunity: boolean;
  // Census fields — may be null for edge hexagons outside tract boundaries
  census_median_income: number | null;
  census_median_home_value: number | null;
  census_median_rent: number | null;
  census_total_population: number | null;
  census_vacancy_rate: number | null;
  census_coverage: boolean;
  // Computed on the frontend before passing to MapLibre
  yield_symbol?: string;
}

export interface HexFeature {
  type: "Feature";
  geometry: { type: "Polygon"; coordinates: number[][][] };
  properties: HexProperties;
}

export interface HexGeoJSON {
  type: "FeatureCollection";
  features: HexFeature[];
}

export interface AlertItem {
  h3_index: string;
  yield_label?: string;
  service_request_count?: number;
  chronic_case_count?: number;
  dominant_311_type_breakdown?: Record<string, number>;
  uvi_score?: number;
  uvi_rank?: number;
  census_median_income?: number | null;
  primary_zoning?: string;
  vacant_count?: number;
  yield_score?: number;
  business_count?: number;
}

export interface AlertsResponse {
  infrastructure_priority: AlertItem[];
  infill_opportunities: AlertItem[];
}
