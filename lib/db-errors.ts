/** PostgREST / Postgres signals that a table from a not-yet-run migration is missing. */
export function isMissingRelation(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const code = error.code ?? "";
  const message = error.message ?? "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist|schema cache|could not find the table/i.test(message)
  );
}
