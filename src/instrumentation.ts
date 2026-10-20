export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  process.env.TZ = process.env.APP_TIME_ZONE || "Australia/Melbourne";
}
