/** True while the local click-to-edit tool is switched on (never on the deployed site). */
export function isEditMode(): boolean {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("edit-text") === "1";
  } catch {
    return false;
  }
}

export function setEditMode(on: boolean) {
  try {
    if (on) sessionStorage.setItem("edit-text", "1");
    else sessionStorage.removeItem("edit-text");
  } catch {
    /* storage blocked: the tool simply stays off */
  }
}
