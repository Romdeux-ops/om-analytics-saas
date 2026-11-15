import file from "../data/ligue1-params.json";
import type { ModelParams } from "./params";

/** Copie de référence des paramètres, versionnée dans le dépôt : repli quand la base est indisponible. */
export const REFERENCE_PARAMS = file as unknown as ModelParams;
