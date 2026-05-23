export function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    "https://project--a88045f3-ae5d-4e51-89b4-3879daadf2d2.lovable.app"
  );
}
