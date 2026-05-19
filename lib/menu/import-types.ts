export type ImportItemConfidence = "high" | "medium" | "low";

export type MenuImportItem = {
  name_bg: string;
  category: string; // never null — "Некласифицирано" fallback
  price: number | null;
  description_bg: string | null;
  confidence: ImportItemConfidence;
  source_file_name?: string;
  duplicate_of_item_id?: string;
  warn?: string;
};

export type MenuImportResult = {
  items: MenuImportItem[];
  warnings: string[];
  stats: {
    total_files: number;
    items_extracted: number;
    items_flagged: number;
    duplicates: number;
  };
};
